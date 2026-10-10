import express from 'express';
import { getDb } from '../db.js';
import { authRequired } from '../auth.js';
import { buildFtsQuery } from '../services/fts.js';
import { schedule, normalizeQuality } from '../services/srs.js';
import { logStudy } from '../services/studyLog.js';

const router = express.Router();
router.use(authRequired);

// ---------- 工具 ----------
function parseJsonArray(s) {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function rowToWord(r) {
  if (!r) return null;
  return {
    id: r.id,
    word: r.word,
    phonetic_uk: r.phonetic_uk,
    phonetic_us: r.phonetic_us,
    pos: r.pos,
    meaning_cn: r.meaning_cn,
    definition_en: r.definition_en,
    example_en: r.example_en,
    example_cn: r.example_cn,
    collocations: parseJsonArray(r.collocations),
    synonyms: parseJsonArray(r.synonyms),
    roots: r.roots,
    word_forms: parseJsonArray(r.word_forms),
    tags: parseJsonArray(r.tags),
    topic: r.topic,
    freq_rank: r.freq_rank,
    difficulty: r.difficulty,
    audio_uk: r.audio_uk,
    audio_us: r.audio_us,
  };
}

// ---------- 词书 ----------
router.get('/lists', (req, res) => {
  const db = getDb();
  const lists = db
    .prepare(
      `SELECT l.*,
              (SELECT COUNT(*) FROM user_word_progress p
                JOIN word_list_items i ON i.word_id = p.word_id
               WHERE i.list_id = l.id AND p.user_id = @uid AND p.state = 'mastered') AS mastered_count
         FROM word_lists l
        WHERE l.is_public = 1 OR l.owner_id = @uid
        ORDER BY l.position, l.id`
    )
    .all({ uid: req.user.id });
  res.json({ lists });
});

router.get('/lists/:id', (req, res) => {
  const db = getDb();
  const list = db.prepare('SELECT * FROM word_lists WHERE id = ?').get(Number(req.params.id));
  if (!list) return res.status(404).json({ error: '词书不存在' });
  if (!list.is_public && list.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权访问该词书' });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(100, Math.max(5, Number(req.query.size) || 30));
  const offset = (page - 1) * size;

  const rows = db
    .prepare(
      `SELECT w.*, p.state, p.is_starred, p.correct_count, p.wrong_count, p.due_at
         FROM word_list_items i
         JOIN words w ON w.id = i.word_id
         LEFT JOIN user_word_progress p ON p.word_id = w.id AND p.user_id = @uid
        WHERE i.list_id = @lid
        ORDER BY i.position, w.freq_rank IS NULL, w.freq_rank, w.id
        LIMIT @size OFFSET @offset`
    )
    .all({ uid: req.user.id, lid: list.id, size, offset });

  res.json({
    list,
    page,
    size,
    total: list.word_count,
    words: rows.map((r) => ({
      ...rowToWord(r),
      progress: r.state
        ? { state: r.state, is_starred: !!r.is_starred, correct: r.correct_count, wrong: r.wrong_count, due_at: r.due_at }
        : null,
    })),
  });
});

// ---------- 单词查询 ----------
router.get('/words', (req, res) => {
  const db = getDb();
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(100, Math.max(5, Number(req.query.size) || 30));
  const offset = (page - 1) * size;
  const q = String(req.query.q || '').trim();
  const topic = String(req.query.topic || '').trim();
  const tag = String(req.query.tag || '').trim();
  const state = String(req.query.state || '').trim();
  const listId = Number(req.query.list_id) || null;

  const where = [];
  const params = { uid: req.user.id, size, offset };
  let from = 'FROM words w LEFT JOIN user_word_progress p ON p.word_id = w.id AND p.user_id = @uid';
  if (listId) {
    from = `FROM words w
            JOIN word_list_items li ON li.word_id = w.id AND li.list_id = @lid
            LEFT JOIN user_word_progress p ON p.word_id = w.id AND p.user_id = @uid`;
    params.lid = listId;
  }

  if (q) {
    const fts = buildFtsQuery(q);
    if (fts) {
      // 注意：FTS5 的 MATCH 左操作数必须是 FTS 表名本身；
      // 给 words_fts 起别名再写 `f MATCH` 会直接报 "no such column: f"。
      from = `FROM words_fts
              JOIN words w ON w.id = words_fts.rowid
              LEFT JOIN user_word_progress p ON p.word_id = w.id AND p.user_id = @uid`;
      where.push('words_fts MATCH @fts');
      params.fts = fts;
    } else {
      where.push('(w.word LIKE @like OR w.meaning_cn LIKE @like)');
      params.like = `%${q}%`;
    }
  }
  if (topic) {
    where.push('w.topic = @topic');
    params.topic = topic;
  }
  if (tag) {
    where.push("w.tags LIKE @tagLike");
    params.tagLike = `%"${tag}"%`;
  }
  // 学习状态筛选（front 端的状态 chips）
  if (state === 'starred') {
    where.push('p.is_starred = 1');
  } else if (state === 'new') {
    where.push("(p.state IS NULL OR p.state = 'new')");
  } else if (['learning', 'review', 'mastered'].includes(state)) {
    where.push('p.state = @state');
    params.state = state;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT w.*, p.state, p.is_starred ${from} ${whereSql}
        ORDER BY ${params.fts ? 'rank' : 'w.freq_rank IS NULL, w.freq_rank, w.word'}
        LIMIT @size OFFSET @offset`
    )
    .all(params);

  const total = db.prepare(`SELECT COUNT(*) AS n ${from} ${whereSql}`).get(params).n;
  res.json({ page, size, total, words: rows.map((r) => ({ ...rowToWord(r), state: r.state || 'new', is_starred: !!r.is_starred })) });
});

router.get('/words/:id', (req, res) => {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT w.*, p.state, p.ease, p.interval_days, p.reps, p.lapses, p.due_at,
              p.correct_count, p.wrong_count, p.is_starred
         FROM words w
         LEFT JOIN user_word_progress p ON p.word_id = w.id AND p.user_id = ?
        WHERE w.id = ?`
    )
    .get(req.user.id, Number(req.params.id));
  if (!row) return res.status(404).json({ error: '单词不存在' });
  const word = rowToWord(row);
  res.json({
    word,
    progress: row.state
      ? {
          state: row.state,
          ease: row.ease,
          interval_days: row.interval_days,
          reps: row.reps,
          lapses: row.lapses,
          due_at: row.due_at,
          correct: row.correct_count,
          wrong: row.wrong_count,
          is_starred: !!row.is_starred,
        }
      : null,
  });
});

router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ words: [] });
  const db = getDb();
  const fts = buildFtsQuery(q);
  const rows = fts
    ? db
        .prepare(
          `SELECT w.* FROM words_fts JOIN words w ON w.id = words_fts.rowid
            WHERE words_fts MATCH ? ORDER BY rank LIMIT 20`
        )
        .all(fts)
    : db.prepare(`SELECT * FROM words WHERE word LIKE ? OR meaning_cn LIKE ? LIMIT 20`).all(`%${q}%`, `%${q}%`);
  res.json({ words: rows.map(rowToWord) });
});

// ---------- 学习会话（SRS）----------
// 返回：到期复习词 + 新词（受每日目标限制）
router.get('/session', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT daily_goal_words FROM users WHERE id = ?').get(req.user.id);
  const goal = user?.daily_goal_words || 30;
  const listId = Number(req.query.list_id) || null;

  const reviewedToday = db
    .prepare(
      `SELECT COUNT(DISTINCT ref_id) AS n FROM study_logs
        WHERE user_id = ? AND module='vocab' AND action='review'
          AND date(created_at) = date('now')`
    )
    .get(req.user.id).n;

  const remaining = Math.max(0, goal - reviewedToday);

  const listJoin = listId ? 'JOIN word_list_items i ON i.word_id = w.id AND i.list_id = @lid' : '';
  const due = db
    .prepare(
      `SELECT w.*, p.state, p.ease, p.interval_days, p.reps, p.lapses, p.due_at
         FROM user_word_progress p
         JOIN words w ON w.id = p.word_id
         ${listId ? 'JOIN word_list_items i ON i.word_id = w.id AND i.list_id = @lid' : ''}
        WHERE p.user_id = @uid AND p.due_at IS NOT NULL AND p.due_at <= datetime('now')
          AND p.state != 'mastered'
        ORDER BY p.due_at
        LIMIT @limit`
    )
    .all({ uid: req.user.id, lid: listId, limit: Math.max(remaining, 10) });

  const newWords = db
    .prepare(
      `SELECT w.*
         FROM words w
         ${listJoin}
         LEFT JOIN user_word_progress p ON p.word_id = w.id AND p.user_id = @uid
        WHERE p.word_id IS NULL
        ORDER BY w.freq_rank IS NULL, w.freq_rank, w.id
        LIMIT @limit`
    )
    .all({ uid: req.user.id, lid: listId, limit: remaining });

  res.json({
    goal,
    reviewed_today: reviewedToday,
    remaining_today: remaining,
    due: due.map((r) => ({ ...rowToWord(r), mode: 'review' })),
    new: newWords.map((r) => ({ ...rowToWord(r), mode: 'new' })),
  });
});

// 提交一次复习结果
router.post('/review', (req, res) => {
  const { word_id, quality, source, duration_ms, quality_label } = req.body || {};
  const wid = Number(word_id);
  if (!wid) return res.status(400).json({ error: '缺少 word_id' });

  const db = getDb();
  const word = db.prepare('SELECT id, word FROM words WHERE id = ?').get(wid);
  if (!word) return res.status(404).json({ error: '单词不存在' });

  const q = normalizeQuality(quality);
  const prev = db
    .prepare('SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?')
    .get(req.user.id, wid);

  const next = schedule(prev, q);
  const correct = q >= 3 ? 1 : 0;

  const tx = db.transaction(() => {
    if (prev) {
      db.prepare(
        `UPDATE user_word_progress
            SET state = @state, ease = @ease, interval_days = @interval,
                reps = @reps, lapses = @lapses,
                due_at = datetime('now', @due),
                last_reviewed_at = datetime('now'),
                correct_count = correct_count + @correct,
                wrong_count = wrong_count + @wrong,
                updated_at = datetime('now')
          WHERE user_id = @uid AND word_id = @wid`
      ).run({
        uid: req.user.id,
        wid,
        state: next.state,
        ease: next.ease,
        interval: next.interval_days,
        reps: next.reps,
        lapses: next.lapses,
        due: `+${next.dueMinutes} minutes`,
        correct,
        wrong: correct ? 0 : 1,
      });
    } else {
      db.prepare(
        `INSERT INTO user_word_progress
           (user_id, word_id, state, ease, interval_days, reps, lapses, due_at,
            last_reviewed_at, correct_count, wrong_count)
         VALUES (@uid, @wid, @state, @ease, @interval, @reps, @lapses,
                 datetime('now', @due), datetime('now'), @correct, @wrong)`
      ).run({
        uid: req.user.id,
        wid,
        state: next.state,
        ease: next.ease,
        interval: next.interval_days,
        reps: next.reps,
        lapses: next.lapses,
        due: `+${next.dueMinutes} minutes`,
        correct,
        wrong: correct ? 0 : 1,
      });
    }
    logStudy(db, req.user.id, {
      module: 'vocab',
      action: 'review',
      refType: 'word',
      refId: wid,
      isCorrect: correct,
      durationMs: duration_ms,
      detail: { quality: q, label: quality_label || null, source: source || 'srs', next_state: next.state },
    });
  });
  tx();

  res.json({
    ok: true,
    next: {
      state: next.state,
      interval_days: next.interval_days,
      due_in_minutes: next.dueMinutes,
      ease: next.ease,
    },
  });
});

// 生词本：收藏 / 取消
router.post('/star', (req, res) => {
  const wid = Number(req.body?.word_id);
  const starred = req.body?.starred !== false;
  if (!wid) return res.status(400).json({ error: '缺少 word_id' });
  const db = getDb();
  const prev = db
    .prepare('SELECT 1 AS x FROM user_word_progress WHERE user_id = ? AND word_id = ?')
    .get(req.user.id, wid);
  if (prev) {
    db.prepare(
      `UPDATE user_word_progress SET is_starred = ?, updated_at = datetime('now')
        WHERE user_id = ? AND word_id = ?`
    ).run(starred ? 1 : 0, req.user.id, wid);
  } else {
    db.prepare(
      `INSERT INTO user_word_progress (user_id, word_id, is_starred, state)
       VALUES (?, ?, ?, 'new')`
    ).run(req.user.id, wid, starred ? 1 : 0);
  }
  res.json({ ok: true, starred });
});

router.get('/starred', (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT w.*, p.state FROM user_word_progress p
         JOIN words w ON w.id = p.word_id
        WHERE p.user_id = ? AND p.is_starred = 1
        ORDER BY p.updated_at DESC LIMIT 500`
    )
    .all(req.user.id);
  res.json({ words: rows.map((r) => ({ ...rowToWord(r), state: r.state })) });
});

// ---------- 错题本（按答错次数排名的顽固词）----------
router.get('/wrong', (req, res) => {
  const db = getDb();
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const rows = db
    .prepare(
      `SELECT w.*, p.state, p.is_starred, p.correct_count, p.wrong_count, p.last_reviewed_at, p.due_at
         FROM user_word_progress p
         JOIN words w ON w.id = p.word_id
        WHERE p.user_id = ? AND p.wrong_count > 0
        ORDER BY p.wrong_count DESC, p.updated_at DESC
        LIMIT ?`
    )
    .all(req.user.id, limit);

  const agg = db
    .prepare(
      `SELECT COALESCE(SUM(wrong_count), 0) AS total_wrong, COUNT(*) AS n
         FROM user_word_progress WHERE user_id = ? AND wrong_count > 0`
    )
    .get(req.user.id);

  res.json({
    words: rows.map((r) => ({
      ...rowToWord(r),
      state: r.state,
      is_starred: !!r.is_starred,
      correct_count: r.correct_count,
      wrong_count: r.wrong_count,
      last_reviewed_at: r.last_reviewed_at,
      due_at: r.due_at,
    })),
    total_wrong: agg.total_wrong,
    count: agg.n,
  });
});

// ---------- 测验（三种题型：选择 / 拼写 / 听音辨词）----------
const QUIZ_MODES = new Set(['choice', 'spell', 'listening']);

router.get('/quiz', (req, res) => {
  const db = getDb();
  const mode = QUIZ_MODES.has(String(req.query.mode)) ? String(req.query.mode) : 'choice';
  const count = Math.min(50, Math.max(5, Number(req.query.count) || 10));
  const listId = Number(req.query.list_id) || null;

  // 池子取大一些，便于生成干扰项
  const poolLimit = Math.max(count * 4, 40);
  const pool = db
    .prepare(
      `SELECT w.id, w.word, w.meaning_cn, w.pos, w.phonetic_uk
         FROM words w
         ${listId ? 'JOIN word_list_items i ON i.word_id = w.id AND i.list_id = @lid' : ''}
        WHERE w.meaning_cn IS NOT NULL AND w.meaning_cn != ''
        ORDER BY RANDOM()
        LIMIT @limit`
    )
    .all({ lid: listId, limit: poolLimit });

  const minPool = mode === 'spell' ? 1 : 4;
  if (pool.length < minPool) {
    return res.status(400).json({ error: `题库单词不足，至少需要 ${minPool} 个含中文释义的单词` });
  }

  const picked = pool.slice(0, Math.min(count, pool.length));

  const pickDistractors = (item, n) => {
    const used = new Set([item.id]);
    const out = [];
    let guard = 0;
    while (out.length < n && guard < 400) {
      guard += 1;
      const cand = pool[Math.floor(Math.random() * pool.length)];
      if (!cand || used.has(cand.id)) continue;
      used.add(cand.id);
      out.push(cand);
    }
    return out;
  };

  const questions = picked.map((item) => {
    if (mode === 'spell') {
      return {
        word_id: item.id,
        mode,
        prompt: item.meaning_cn,
        answer_text: item.word,
        answer_id: item.id,
        phonetic: item.phonetic_uk,
      };
    }
    if (mode === 'listening') {
      const distractors = pickDistractors(item, 3);
      const options = [item, ...distractors]
        .map((c) => ({ id: c.id, text: c.word }))
        .sort(() => Math.random() - 0.5);
      return {
        word_id: item.id,
        mode,
        audio_text: item.word,
        phonetic: item.phonetic_uk,
        options,
        answer_id: item.id,
      };
    }
    // choice：60% 看词选义，40% 看义选词
    const askMeaning = Math.random() < 0.6;
    const distractors = pickDistractors(item, 3);
    const options = [item, ...distractors]
      .map((c) => (askMeaning ? { id: c.id, text: c.meaning_cn } : { id: c.id, text: c.word }))
      .sort(() => Math.random() - 0.5);
    return {
      word_id: item.id,
      mode,
      direction: askMeaning ? 'word2meaning' : 'meaning2word',
      prompt: askMeaning ? item.word : item.meaning_cn,
      phonetic: item.phonetic_uk,
      options,
      answer_id: item.id,
    };
  });

  res.json({ mode, count: questions.length, questions });
});

// 提交整轮测验
router.post('/quiz/submit', (req, res) => {
  const { results, duration_ms } = req.body || {};
  if (!Array.isArray(results)) return res.status(400).json({ error: 'results 必须是数组' });
  if (!results.length || results.length > 50) return res.status(400).json({ error: '请提交 1-50 道题' });
  const db = getDb();
  const graded = [];
  for (const r of results) {
    const word = r && db.prepare('SELECT id, word FROM words WHERE id = ?').get(Number(r.word_id));
    if (!word) return res.status(400).json({ error: '单词不存在' });
    const isCorrect = r.mode === 'spell'
      ? String(r.user_input || '').trim().toLowerCase() === word.word.toLowerCase()
      : Number(r.answer_id) === word.id;
    graded.push({ ...r, isCorrect });
  }
  let correct = 0;
  const tx = db.transaction(() => {
    for (const r of graded) {
      const wid = Number(r.word_id);
      const isCorrect = r.isCorrect;
      if (!wid) continue;
      if (isCorrect) correct += 1;

      const prev = db
        .prepare('SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?')
        .get(req.user.id, wid);
      const next = schedule(prev, isCorrect ? 4 : 0);
      if (prev) {
        db.prepare(
          `UPDATE user_word_progress SET state=@state, ease=@ease, interval_days=@interval,
             reps=@reps, lapses=@lapses, due_at=datetime('now', @due), last_reviewed_at=datetime('now'),
             correct_count=correct_count+@c, wrong_count=wrong_count+@w, updated_at=datetime('now')
           WHERE user_id=@uid AND word_id=@wid`
        ).run({
          uid: req.user.id, wid, state: next.state, ease: next.ease, interval: next.interval_days,
          reps: next.reps, lapses: next.lapses, due: `+${next.dueMinutes} minutes`,
          c: isCorrect ? 1 : 0, w: isCorrect ? 0 : 1,
        });
      } else {
        db.prepare(
          `INSERT INTO user_word_progress (user_id, word_id, state, ease, interval_days, reps, lapses,
             due_at, last_reviewed_at, correct_count, wrong_count)
           VALUES (@uid, @wid, @state, @ease, @interval, @reps, @lapses, datetime('now', @due),
                   datetime('now'), @c, @w)`
        ).run({
          uid: req.user.id, wid, state: next.state, ease: next.ease, interval: next.interval_days,
          reps: next.reps, lapses: next.lapses, due: `+${next.dueMinutes} minutes`,
          c: isCorrect ? 1 : 0, w: isCorrect ? 0 : 1,
        });
      }
      logStudy(db, req.user.id, {
        module: 'vocab', action: 'quiz', refType: 'word', refId: wid,
        isCorrect, detail: { direction: r.direction || null },
      });
    }
  });
  tx();
  const total = results.length || 1;
  res.json({ ok: true, correct, total, accuracy: Number((correct / total).toFixed(4)) });
});

// ---------- 统计 ----------
router.get('/stats', (req, res) => {
  const db = getDb();
  const uid = req.user.id;

  const byState = db
    .prepare(
      `SELECT state, COUNT(*) AS n FROM user_word_progress
        WHERE user_id = ? GROUP BY state`
    )
    .all(uid);
  const stateMap = { new: 0, learning: 0, review: 0, mastered: 0 };
  for (const r of byState) stateMap[r.state] = r.n;

  const totalWords = db.prepare('SELECT COUNT(*) AS n FROM words').get().n;
  const touched = db.prepare('SELECT COUNT(*) AS n FROM user_word_progress WHERE user_id = ?').get(uid).n;
  const starred = db
    .prepare('SELECT COUNT(*) AS n FROM user_word_progress WHERE user_id = ? AND is_starred = 1')
    .get(uid).n;
  const dueNow = db
    .prepare(
      `SELECT COUNT(*) AS n FROM user_word_progress
        WHERE user_id = ? AND due_at IS NOT NULL AND due_at <= datetime('now') AND state != 'mastered'`
    )
    .get(uid).n;

  const today = db
    .prepare(
      `SELECT COUNT(*) AS reviews,
              SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct
         FROM study_logs
        WHERE user_id = ? AND module='vocab' AND action IN ('review','quiz')
          AND date(created_at) = date('now')`
    )
    .get(uid);

  // 最近 30 天每日活跃（用于热力图 / streak）
  const daily = db
    .prepare(
      `SELECT date(created_at) AS day, COUNT(*) AS n
         FROM study_logs
        WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
        GROUP BY day ORDER BY day`
    )
    .all(uid);

  // 连续打卡天数
  const days = new Set(daily.map((d) => d.day));
  let streak = 0;
  const cursor = new Date();
  // 若今天还没学，从昨天开始算连续
  const fmt = (d) => d.toISOString().slice(0, 10);
  if (!days.has(fmt(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (days.has(fmt(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // 累计数据（成就 / 成长曲线用）
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS reviews,
              COALESCE(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct,
              COUNT(DISTINCT date(created_at)) AS active_days
         FROM study_logs WHERE user_id = ?`
    )
    .get(uid);

  res.json({
    words: {
      total: totalWords,
      touched,
      untouched: Math.max(0, totalWords - touched),
      ...stateMap,
      starred,
      due_now: dueNow,
    },
    today: { reviews: today.reviews || 0, correct: today.correct || 0 },
    totals: {
      reviews: totals.reviews || 0,
      correct: totals.correct || 0,
      active_days: totals.active_days || 0,
    },
    streak,
    daily,
  });
});

// 单词详情页的「AI 记忆法」（按需调用，不预生成，省 token）
router.post('/words/:id/explain', async (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM words WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: '单词不存在' });
  const word = rowToWord(row);

  const { chatJson } = await import('../services/llm.js');
  const user = db.prepare('SELECT llm_provider FROM users WHERE id = ?').get(req.user.id);
  try {
    const data = await chatJson({
      provider: user?.llm_provider || 'deepseek',
      messages: [
        {
          role: 'system',
          content:
            '你是雅思词汇教练。针对给定单词，输出助记内容。严格返回 JSON，不要 Markdown 代码块。',
        },
        {
          role: 'user',
          content: `单词：${word.word}
中文释义：${word.meaning_cn || '(空)'}
请返回：
{
  "roots": "词根词缀拆解，一句话",
  "mnemonic": "中文联想记忆法，一到两句话，要具体好记",
  "synonyms": ["雅思写作/阅读中可替换的同义词，3-5 个"],
  "collocations": ["高频搭配，3-5 个，英文短语"],
  "example_en": "一个符合雅思语境的英文例句",
  "example_cn": "例句中文翻译"
}`,
        },
      ],
    });
    res.json({ word_id: word.id, ...data });
  } catch (e) {
    res.status(502).json({ error: `AI 生成失败：${e.message}` });
  }
});

export default router;
