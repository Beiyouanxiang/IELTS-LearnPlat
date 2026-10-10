import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDb, rebuildFtsForWord } from '../db.js';
import { authRequired } from '../auth.js';
import { diffWords, splitSentences } from '../services/diff.js';
import { logStudy as logStudyShared } from '../services/studyLog.js';

const router = express.Router();
router.use(authRequired);

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 只允许音频扩展名——避免上传 .html/.svg 之类的存储型 XSS 载体
const ALLOWED_AUDIO = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.oga', '.flac', '.aac', '.webm']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_AUDIO.has(ext)) return cb(new Error('仅支持音频文件（mp3/m4a/wav/ogg/flac/aac/webm）'));
    cb(null, true);
  },
});

// 统一写入 study_logs，module 固定为 listening
function logStudy(db, userId, payload) {
  logStudyShared(db, userId, { module: 'listening', ...payload });
}

// 依据文本长度按比例估算每句时间（没有 ASR 时间轴时的近似方案，可后续手动校正）
function buildSegments(db, materialId, transcript, durationSec) {
  const sentences = splitSentences(transcript);
  db.prepare('DELETE FROM listening_segments WHERE material_id = ?').run(materialId);
  if (!sentences.length) {
    db.prepare('UPDATE listening_materials SET segment_count = 0 WHERE id = ?').run(materialId);
    return 0;
  }
  const totalChars = sentences.reduce((s, t) => s + t.length, 0) || 1;
  const dur = Number(durationSec) > 0 ? Number(durationSec) : sentences.length * 5;
  const ins = db.prepare(
    `INSERT INTO listening_segments (material_id, idx, start_sec, end_sec, text)
     VALUES (?, ?, ?, ?, ?)`
  );
  let t = 0;
  sentences.forEach((text, idx) => {
    const span = (text.length / totalChars) * dur;
    const start = Number(t.toFixed(2));
    const end = Number((t + span).toFixed(2));
    ins.run(materialId, idx, start, end, text);
    t += span;
  });
  db.prepare('UPDATE listening_materials SET segment_count = ? WHERE id = ?').run(sentences.length, materialId);
  return sentences.length;
}

function materialVisible(m, userId) {
  return m && (m.is_public === 1 || m.owner_id === userId);
}

// ---------- 素材 ----------
router.get('/materials', (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.*, u.username AS owner_name,
              (SELECT COUNT(*) FROM listening_attempts a WHERE a.material_id = m.id AND a.user_id = @uid) AS my_attempts
         FROM listening_materials m
         LEFT JOIN users u ON u.id = m.owner_id
        WHERE m.is_public = 1 OR m.owner_id = @uid
        ORDER BY m.updated_at DESC`
    )
    .all({ uid: req.user.id });
  res.json({ materials: rows });
});

router.get('/materials/:id', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(Number(req.params.id));
  if (!m) return res.status(404).json({ error: '素材不存在' });
  if (!materialVisible(m, req.user.id)) return res.status(403).json({ error: '无权访问' });
  const segments = db
    .prepare('SELECT * FROM listening_segments WHERE material_id = ? ORDER BY idx')
    .all(m.id);
  res.json({ material: m, segments });
});

router.post('/materials', upload.single('audio'), (req, res) => {
  const { title, source_url, transcript, translation, accent, level, topic, duration_sec } = req.body || {};
  if (!title || !String(title).trim()) {
    if (req.file) fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: '请填写标题' });
  }
  const db = getDb();
  const relPath = req.file ? path.posix.join('uploads', req.file.filename) : null;

  const info = db
    .prepare(
      `INSERT INTO listening_materials
         (owner_id, title, source_url, audio_path, accent, level, topic, transcript, translation, duration_sec)
       VALUES (@owner, @title, @src, @audio, @accent, @level, @topic, @transcript, @translation, @dur)`
    )
    .run({
      owner: req.user.id,
      title: String(title).trim().slice(0, 200),
      src: source_url || null,
      audio: relPath,
      accent: accent || null,
      level: level || null,
      topic: topic || null,
      transcript: transcript || null,
      translation: translation || null,
      dur: Number(duration_sec) || null,
    });
  const id = info.lastInsertRowid;
  const count = transcript ? buildSegments(db, id, transcript, duration_sec) : 0;
  const m = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(id);
  res.status(201).json({ material: m, segment_count: count });
});

router.patch('/materials/:id', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(Number(req.params.id));
  if (!m) return res.status(404).json({ error: '素材不存在' });
  if (m.owner_id !== req.user.id) return res.status(403).json({ error: '只有创建者可以修改' });

  const allowed = ['title', 'source_url', 'transcript', 'translation', 'accent', 'level', 'topic', 'duration_sec', 'is_public'];
  const sets = [];
  const params = { id: m.id };
  for (const k of allowed) {
    if (k in (req.body || {})) {
      sets.push(`${k} = @${k}`);
      params[k] = k === 'is_public' ? (req.body[k] ? 1 : 0) : req.body[k];
    }
  }
  if (!sets.length) return res.json({ material: m });
  sets.push(`updated_at = datetime('now')`);
  db.prepare(`UPDATE listening_materials SET ${sets.join(', ')} WHERE id = @id`).run(params);

  // 文本变了就重新切片
  if ('transcript' in (req.body || {}) || 'duration_sec' in (req.body || {})) {
    const fresh = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(m.id);
    buildSegments(db, m.id, fresh.transcript || '', fresh.duration_sec);
  }
  res.json({ material: db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(m.id) });
});

router.delete('/materials/:id', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(Number(req.params.id));
  if (!m) return res.status(404).json({ error: '素材不存在' });
  if (m.owner_id !== req.user.id) return res.status(403).json({ error: '只有创建者可以删除' });
  db.prepare('DELETE FROM listening_materials WHERE id = ?').run(m.id);
  // 删掉磁盘上的音频（路径必须限制在 UPLOAD_DIR 内，防目录穿越）
  if (m.audio_path) {
    const filename = path.basename(m.audio_path);
    if (m.audio_path === `uploads/${filename}`) fs.promises.unlink(path.join(UPLOAD_DIR, filename)).catch(() => {});
  }
  res.json({ ok: true });
});

// ---------- 练习 ----------
// blind=1 时不返回原文，用于听写
router.get('/materials/:id/practice', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(Number(req.params.id));
  if (!m) return res.status(404).json({ error: '素材不存在' });
  if (!materialVisible(m, req.user.id)) return res.status(403).json({ error: '无权访问' });

  const blind = String(req.query.blind || '') === '1';
  const segments = db
    .prepare('SELECT * FROM listening_segments WHERE material_id = ? ORDER BY idx')
    .all(m.id)
    .map((s) => (blind ? { id: s.id, idx: s.idx, start_sec: s.start_sec, end_sec: s.end_sec } : s));

  res.json({
    material: { id: m.id, title: m.title, audio_path: m.audio_path, accent: m.accent, level: m.level, duration_sec: m.duration_sec },
    blind,
    segments,
  });
});

router.post('/attempt', (req, res) => {
  const { segment_id, user_input, mode, duration_ms } = req.body || {};
  const sid = Number(segment_id);
  if (!sid) return res.status(400).json({ error: '缺少 segment_id' });
  const db = getDb();
  const seg = db
    .prepare(
      `SELECT s.*, m.owner_id, m.is_public, m.id AS material_id
         FROM listening_segments s JOIN listening_materials m ON m.id = s.material_id
        WHERE s.id = ?`
    )
    .get(sid);
  if (!seg) return res.status(404).json({ error: '句子不存在' });
  if (!materialVisible(seg, req.user.id)) return res.status(403).json({ error: '无权访问' });

  const result = diffWords(seg.text, user_input || '');
  const pass = result.score >= 0.9;

  db.prepare(
    `INSERT INTO listening_attempts (user_id, material_id, segment_id, mode, user_input, score, diff)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.user.id,
    seg.material_id,
    sid,
    mode || 'dictation',
    String(user_input || '').slice(0, 5000),
    result.score,
    JSON.stringify({ missing: result.missing, extra: result.extra, ref_word_count: result.ref_word_count })
  );
  logStudy(db, req.user.id, {
    action: mode || 'dictation',
    refType: 'segment',
    refId: sid,
    isCorrect: pass,
    score: result.score,
    durationMs: duration_ms,
    detail: { missing: result.missing, extra: result.extra },
  });

  res.json({
    ok: true,
    score: result.score,
    pass,
    reference: seg.text,
    diff: result,
  });
});

// ---------- 听力生词一键加入词库 ----------
router.post('/vocab-add', (req, res) => {
  const word = String(req.body?.word || '').trim();
  if (!word) return res.status(400).json({ error: '缺少 word' });
  const db = getDb();
  const lemma = word.toLowerCase();
  let row = db.prepare('SELECT * FROM words WHERE lemma = ?').get(lemma);
  let created = false;
  if (!row) {
    const info = db
      .prepare(
        `INSERT INTO words (word, lemma, tags, source) VALUES (?, ?, ?, 'listening')`
      )
      .run(word, lemma, JSON.stringify(['listening']));
    rebuildFtsForWord(info.lastInsertRowid);
    row = db.prepare('SELECT * FROM words WHERE id = ?').get(info.lastInsertRowid);
    created = true;
  }
  // 自动加入生词本
  const prev = db
    .prepare('SELECT 1 AS x FROM user_word_progress WHERE user_id = ? AND word_id = ?')
    .get(req.user.id, row.id);
  if (prev) {
    db.prepare(
      `UPDATE user_word_progress SET is_starred = 1, updated_at = datetime('now')
        WHERE user_id = ? AND word_id = ?`
    ).run(req.user.id, row.id);
  } else {
    db.prepare(
      `INSERT INTO user_word_progress (user_id, word_id, is_starred, state) VALUES (?, ?, 1, 'new')`
    ).run(req.user.id, row.id);
  }
  res.status(created ? 201 : 200).json({ ok: true, created, word_id: row.id, word: row.word });
});

// ============ 题型化练习（填空 / 选择 / 判断）============

const STOP = new Set(
  `a an the and or but if of to in on at for with from by as is are was were be been being am do does did
   have has had will would can could may might must shall should not no nor so than that this these those
   it its he she they them their we us our you your i me my there here what which who whom whose when where
   why how all any both each few more most other some such very just also only own same too`
    .split(/\s+/)
    .filter(Boolean)
);

function candidateWords(text) {
  return (String(text).match(/[A-Za-z][A-Za-z'’-]{3,}/g) || []).filter((w) => !STOP.has(w.toLowerCase()));
}

// 从 transcript 自动生成题目：优先挖空实词；不足时补充选择题
function buildQuestions(db, materialId, segments, count = 8) {
  db.prepare('DELETE FROM listening_questions WHERE material_id = ?').run(materialId);
  const usable = segments.filter((s) => candidateWords(s.text).length >= 3);
  if (!usable.length) return 0;

  const step = Math.max(1, Math.floor(usable.length / count));
  const picked = [];
  for (let i = 0; i < usable.length && picked.length < count; i += step) picked.push(usable[i]);

  // 干扰词池（来自其他句子）
  const pool = [...new Set(usable.flatMap((s) => candidateWords(s.text).map((w) => w.toLowerCase())))];
  const ins = db.prepare(
    `INSERT INTO listening_questions (material_id, idx, qtype, prompt, options, answer, answer_alt, segment_idx, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let idx = 0;
  picked.slice(0, count).forEach((seg) => {
    const cands = candidateWords(seg.text).filter((w) => w.length >= 5);
    const target = (cands.length ? cands : candidateWords(seg.text))[0];
    if (!target) return;
    idx += 1;

    const useChoice = idx % 3 === 0; // 每 3 题出一个选择题，其余为听写填空
    if (useChoice) {
      const lower = target.toLowerCase();
      const distractors = [];
      for (const cand of pool) {
        if (cand === lower) continue;
        if (Math.abs(cand.length - lower.length) > 3) continue;
        distractors.push(cand);
        if (distractors.length >= 3) break;
      }
      if (distractors.length < 3) {
        // 干扰项不足则退化为填空题
        const blanked = seg.text.replace(new RegExp(`\\b${target}\\b`), '______');
        ins.run(materialId, idx, 'blank', blanked, null, target, null, seg.idx, seg.text);
        return;
      }
      const options = [target, ...distractors].sort(() => Math.random() - 0.5);
      ins.run(
        materialId,
        idx,
        'choice',
        `听录音，选出你听到的单词（第 ${seg.idx + 1} 句）`,
        JSON.stringify(options),
        target,
        null,
        seg.idx,
        seg.text
      );
    } else {
      const blanked = seg.text.replace(new RegExp(`\\b${target}\\b`), '______');
      ins.run(materialId, idx, 'blank', blanked, null, target, null, seg.idx, seg.text);
    }
  });

  db.prepare('UPDATE listening_materials SET updated_at = datetime(\'now\') WHERE id = ?').run(materialId);
  return idx;
}

function ensureQuestions(db, material) {
  const n = db.prepare('SELECT COUNT(*) AS n FROM listening_questions WHERE material_id = ?').get(material.id).n;
  if (n > 0) return n;
  const segments = db.prepare('SELECT * FROM listening_segments WHERE material_id = ? ORDER BY idx').all(material.id);
  if (!segments.length) return 0;
  return buildQuestions(db, material.id, segments, 8);
}

// 生成（重建）题目
router.post('/materials/:id/questions/generate', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(Number(req.params.id));
  if (!m) return res.status(404).json({ error: '素材不存在' });
  if (!materialVisible(m, req.user.id)) return res.status(403).json({ error: '无权访问' });
  const segments = db.prepare('SELECT * FROM listening_segments WHERE material_id = ? ORDER BY idx').all(m.id);
  if (!segments.length) return res.status(400).json({ error: '该素材还没有文本切片，无法出题' });
  const count = Math.min(20, Math.max(3, Number(req.body?.count) || 8));
  const n = buildQuestions(db, m.id, segments, count);
  res.json({ ok: true, question_count: n });
});

// 取题（不返回答案）
router.get('/materials/:id/questions', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(Number(req.params.id));
  if (!m) return res.status(404).json({ error: '素材不存在' });
  if (!materialVisible(m, req.user.id)) return res.status(403).json({ error: '无权访问' });

  const total = ensureQuestions(db, m);
  const rows = db
    .prepare(
      `SELECT q.id, q.idx, q.qtype, q.prompt, q.options, q.segment_idx, s.start_sec, s.end_sec
         FROM listening_questions q
         LEFT JOIN listening_segments s ON s.material_id = q.material_id AND s.idx = q.segment_idx
        WHERE q.material_id = ? ORDER BY q.idx`
    )
    .all(m.id);

  res.json({
    total,
    questions: rows.map((r) => ({
      id: r.id,
      idx: r.idx,
      qtype: r.qtype,
      qtype_label: r.qtype === 'choice' ? '听音选词' : '听写填空',
      prompt: r.prompt,
      options: r.options ? JSON.parse(r.options) : null,
      segment_idx: r.segment_idx,
      start_sec: r.start_sec,
      end_sec: r.end_sec,
    })),
  });
});

function normAnswer(v) {
  return String(v ?? '').trim().toLowerCase().replace(/[.,;:!?"'’]/g, '');
}

// 提交整套作答
router.post('/materials/:id/questions/submit', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(Number(req.params.id));
  if (!m) return res.status(404).json({ error: '素材不存在' });
  if (!materialVisible(m, req.user.id)) return res.status(403).json({ error: '无权访问' });
  const answers = req.body?.answers || {};
  const durationSec = Number(req.body?.duration_sec) || 0;

  const qs = db.prepare('SELECT * FROM listening_questions WHERE material_id = ? ORDER BY idx').all(m.id);
  if (!qs.length) return res.status(400).json({ error: '该素材暂无题目' });

  let correct = 0;
  const detail = qs.map((q) => {
    const given = answers[q.id];
    const ok = normAnswer(given) === normAnswer(q.answer);
    if (ok) correct += 1;
    return {
      id: q.id,
      idx: q.idx,
      qtype: q.qtype,
      prompt: q.prompt,
      given: given ?? null,
      answer: q.answer,
      correct: ok,
      segment_idx: q.segment_idx,
      explanation: q.explanation,
    };
  });

  const total = qs.length;
  const accuracy = correct / total;
  db.prepare(
    `INSERT INTO listening_attempts (user_id, material_id, mode, user_input, score, diff)
     VALUES (?, ?, 'question-set', ?, ?, ?)`
  ).run(req.user.id, m.id, JSON.stringify(answers), accuracy, JSON.stringify({ correct, total }));

  logStudy(db, req.user.id, {
    action: 'questions',
    refType: 'material',
    refId: m.id,
    isCorrect: accuracy >= 0.6,
    score: Number(accuracy.toFixed(4)),
    durationMs: durationSec * 1000,
    detail: { correct, total },
  });

  res.json({ ok: true, correct, total, accuracy: Number(accuracy.toFixed(4)), detail });
});

// 听力统计（含题型练习趋势）
router.get('/stats', (req, res) => {
  const db = getDb();
  const uid = req.user.id;
  const summary = db
    .prepare(
      `SELECT COUNT(*) AS attempts,
              SUM(CASE WHEN score >= 0.9 THEN 1 ELSE 0 END) AS passed,
              ROUND(AVG(score), 3) AS avg_score
         FROM listening_attempts WHERE user_id = ?`
    )
    .get(uid);
  const byMode = db
    .prepare(
      `SELECT mode, COUNT(*) AS n, ROUND(AVG(score), 3) AS avg_score
         FROM listening_attempts WHERE user_id = ? GROUP BY mode ORDER BY n DESC`
    )
    .all(uid);
  const trend = db
    .prepare(
      `SELECT date(created_at) AS day, ROUND(AVG(score), 3) AS score, COUNT(*) AS n
         FROM listening_attempts WHERE user_id = ? AND created_at >= datetime('now','-60 days')
        GROUP BY day ORDER BY day`
    )
    .all(uid);
  const materials = db
    .prepare('SELECT COUNT(*) AS n FROM listening_materials WHERE owner_id = ?')
    .get(uid).n;
  res.json({
    summary: {
      attempts: summary.attempts || 0,
      accuracy: summary.avg_score || 0,
      materials,
    },
    by_mode: byMode,
    trend,
  });
});

export default router;
