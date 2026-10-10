import express from 'express';
import { getDb } from '../db.js';
import { authRequired } from '../auth.js';
import { logStudy } from '../services/studyLog.js';

const router = express.Router();
router.use(authRequired);

function parseJson(s, fallback = null) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

const QTYPE_LABEL = {
  tfng: '判断题（True/False/Not Given）',
  yng: '判断题（Yes/No/Not Given）',
  choice: '单项选择题',
  match_heading: '段落标题匹配',
  completion: '摘要填空',
};

// 规范化答案：去空格、小写、去标点，便于填空/匹配判定
function normalizeAnswer(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, ' ')
    .replace(/[.,;:!?"'’“”]/g, '')
    .replace(/^(the|a|an)\s+/, '');
}

function isCorrectAnswer(q, given) {
  const accept = [q.answer, ...(parseJson(q.answer_alt, []) || [])];
  const g = normalizeAnswer(given);
  if (!g) return false;
  if (q.qtype === 'completion') {
    return accept.some((a) => normalizeAnswer(a) === g);
  }
  return accept.some((a) => normalizeAnswer(a) === g);
}

function rowToPassage(r) {
  return {
    id: r.id,
    owner_id: r.owner_id,
    title: r.title,
    topic: r.topic,
    difficulty: r.difficulty,
    source: r.source,
    word_count: r.word_count,
    is_public: !!r.is_public,
    created_at: r.created_at,
  };
}

// ---------- 文章列表 ----------
router.get('/passages', (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM reading_questions q WHERE q.passage_id = p.id) AS question_count,
        (SELECT COUNT(*) FROM reading_attempts a WHERE a.user_id = @uid AND a.passage_id = p.id) AS attempt_count,
        (SELECT MAX(a.band_score) FROM reading_attempts a WHERE a.user_id = @uid AND a.passage_id = p.id) AS best_band
      FROM reading_passages p
      WHERE p.is_public = 1 OR p.owner_id = @uid
      ORDER BY (p.owner_id IS NULL) DESC, p.difficulty, p.id`
    )
    .all({ uid: req.user.id });

  const topics = [...new Set(rows.map((r) => r.topic).filter(Boolean))];
  res.json({
    total: rows.length,
    topics,
    passages: rows.map((r) => ({
      ...rowToPassage(r),
      question_count: r.question_count,
      attempt_count: r.attempt_count,
      best_band: r.best_band,
    })),
  });
});

// ---------- 文章详情（含题目，剔除答案） ----------
router.get('/passages/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const p = db.prepare('SELECT * FROM reading_passages WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: '文章不存在' });
  if (!p.is_public && p.owner_id !== req.user.id && req.user.role === 'member') {
    return res.status(403).json({ error: '无权访问该文章' });
  }
  const qs = db
    .prepare('SELECT id, idx, qtype, prompt, options FROM reading_questions WHERE passage_id = ? ORDER BY idx')
    .all(id)
    .map((q) => ({ id: q.id, idx: q.idx, qtype: q.qtype, qtype_label: QTYPE_LABEL[q.qtype] || q.qtype, prompt: q.prompt, options: parseJson(q.options, []) }));

  res.json({ passage: { ...rowToPassage(p), content: p.content, translation: p.translation }, questions: qs });
});

// ---------- 提交作答 ----------
router.post('/passages/:id/submit', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const p = db.prepare('SELECT * FROM reading_passages WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: '文章不存在' });

  const answers = req.body?.answers;
  const durationSec = Number(req.body?.duration_sec) || 0;
  if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'answers 必须是对象' });

  const qs = db.prepare('SELECT * FROM reading_questions WHERE passage_id = ? ORDER BY idx').all(id);
  if (!qs.length) return res.status(400).json({ error: '该文章暂无题目' });

  const detail = [];
  let correct = 0;
  for (const q of qs) {
    const given = answers[q.id];
    const ok = isCorrectAnswer(q, given);
    if (ok) correct += 1;
    detail.push({
      id: q.id,
      idx: q.idx,
      qtype: q.qtype,
      prompt: q.prompt,
      given: given ?? null,
      answer: q.answer,
      correct: ok,
      explanation: q.explanation,
      para_ref: q.para_ref,
    });
  }

  const total = qs.length;
  // 阅读正确率 → 分数换算（40 题制 → 9 分制，近似官方换算表）
  const accuracy = correct / total;
  const bandScore = accuracyToBand(accuracy, total);

  db.prepare(
    `INSERT INTO reading_attempts (user_id, passage_id, answers, correct, total, band_score, duration_sec)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.id, id, JSON.stringify(answers), correct, total, bandScore, durationSec);

  logStudy(db, req.user.id, {
    module: 'reading',
    action: 'practice',
    refType: 'passage',
    refId: id,
    isCorrect: accuracy >= 0.6,
    score: bandScore,
    durationMs: durationSec * 1000,
    detail: { correct, total },
  });

  res.json({ ok: true, correct, total, accuracy: Number(accuracy.toFixed(4)), band_score: bandScore, detail });
});

function accuracyToBand(accuracy, total) {
  // 题量少时用线性映射更稳；题量足够时贴近官方换算
  const raw = accuracy * 9;
  const scaled = total >= 20 ? Math.max(3, Math.min(9, raw)) : Math.max(3, Math.min(9, 3 + accuracy * 6));
  return Math.round(scaled * 2) / 2;
}

// ---------- 历史记录 ----------
router.get('/attempts', (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.*, p.title, p.topic, p.difficulty
         FROM reading_attempts a JOIN reading_passages p ON p.id = a.passage_id
        WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 60`
    )
    .all(req.user.id);
  res.json({
    total: rows.length,
    attempts: rows.map((r) => ({
      id: r.id,
      passage_id: r.passage_id,
      title: r.title,
      topic: r.topic,
      difficulty: r.difficulty,
      correct: r.correct,
      total: r.total,
      band_score: r.band_score,
      duration_sec: r.duration_sec,
      created_at: r.created_at,
    })),
  });
});

// 单次练习的逐题回看
router.get('/attempts/:id', (req, res) => {
  const db = getDb();
  const a = db
    .prepare(
      `SELECT a.*, p.title FROM reading_attempts a JOIN reading_passages p ON p.id = a.passage_id
        WHERE a.id = ? AND a.user_id = ?`
    )
    .get(Number(req.params.id), req.user.id);
  if (!a) return res.status(404).json({ error: '记录不存在' });
  const answers = parseJson(a.answers, {});
  const qs = db.prepare('SELECT * FROM reading_questions WHERE passage_id = ? ORDER BY idx').all(a.passage_id);
  const detail = qs.map((q) => ({
    id: q.id,
    idx: q.idx,
    qtype: q.qtype,
    prompt: q.prompt,
    given: answers[q.id] ?? null,
    answer: q.answer,
    correct: isCorrectAnswer(q, answers[q.id]),
    explanation: q.explanation,
    para_ref: q.para_ref,
  }));
  res.json({
    attempt: { id: a.id, title: a.title, passage_id: a.passage_id, correct: a.correct, total: a.total, band_score: a.band_score, created_at: a.created_at },
    detail,
  });
});

// ---------- 统计 ----------
router.get('/stats', (req, res) => {
  const db = getDb();
  const uid = req.user.id;
  const summary = db
    .prepare(
      `SELECT COUNT(*) AS attempts,
              SUM(correct) AS correct, SUM(total) AS total,
              ROUND(AVG(band_score), 1) AS avg_band, MAX(band_score) AS best_band,
              COUNT(DISTINCT passage_id) AS passages_read
         FROM reading_attempts WHERE user_id = ?`
    )
    .get(uid);

  const byType = db
    .prepare(
      `SELECT q.qtype,
              SUM(CASE WHEN a.id IS NULL THEN 0 ELSE 1 END) AS n
         FROM reading_questions q
         LEFT JOIN reading_attempts a ON a.passage_id = q.passage_id AND a.user_id = ?
        GROUP BY q.qtype`
    )
    .all(uid);

  // 各题型正确率（需要分析 detail，这里按记录聚合）
  const wrongTop = db
    .prepare(
      `SELECT p.topic, COUNT(*) AS n
         FROM reading_attempts a JOIN reading_passages p ON p.id = a.passage_id
        WHERE a.user_id = ? AND a.total > 0 AND (a.correct * 1.0 / a.total) < 0.6 AND p.topic IS NOT NULL
        GROUP BY p.topic ORDER BY n DESC LIMIT 5`
    )
    .all(uid);

  const trend = db
    .prepare(
      `SELECT date(created_at) AS day, ROUND(AVG(band_score),1) AS band, COUNT(*) AS n
         FROM reading_attempts WHERE user_id = ? AND created_at >= datetime('now','-60 days')
        GROUP BY day ORDER BY day`
    )
    .all(uid);

  res.json({
    summary: {
      attempts: summary.attempts || 0,
      correct: summary.correct || 0,
      total: summary.total || 0,
      // 无练习记录时返回 null，前端显示「—」而不是假的 0 分
      accuracy: summary.total ? Number((summary.correct / summary.total).toFixed(4)) : null,
      avg_band: summary.avg_band ?? null,
      best_band: summary.best_band ?? null,
      passages_read: summary.passages_read || 0,
    },
    by_type: byType,
    weak_topics: wrongTop,
    trend,
  });
});

// ---------- 自建文章 ----------
router.post('/passages', (req, res) => {
  const db = getDb();
  const { title, topic = null, difficulty = 2, content = '', translation = null, source = null, questions = [] } = req.body || {};
  if (!String(title || '').trim()) return res.status(400).json({ error: '标题不能为空' });
  if (!String(content || '').trim()) return res.status(400).json({ error: '正文不能为空' });
  if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ error: '至少需要 1 道题目' });

  const wc = (String(content).match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO reading_passages (owner_id, title, topic, difficulty, source, content, translation, word_count, is_public)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`
      )
      .run(req.user.id, String(title).trim(), topic, Number(difficulty) || 2, source, String(content), translation, wc);
    const pid = info.lastInsertRowid;
    const ins = db.prepare(
      `INSERT INTO reading_questions (passage_id, idx, qtype, prompt, options, answer, explanation, para_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    questions.forEach((q, i) => {
      ins.run(
        pid,
        i + 1,
        q.qtype || 'choice',
        String(q.prompt || ''),
        q.options ? JSON.stringify(q.options) : null,
        String(q.answer ?? ''),
        q.explanation || null,
        q.para_ref || null
      );
    });
    return pid;
  });

  const pid = tx();
  res.json({ ok: true, id: pid, word_count: wc, question_count: questions.length });
});

router.delete('/passages/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM reading_passages WHERE id = ? AND owner_id = ?').run(Number(req.params.id), req.user.id);
  if (!r.changes) return res.status(404).json({ error: '文章不存在或无权删除' });
  res.json({ ok: true });
});

export default router;
