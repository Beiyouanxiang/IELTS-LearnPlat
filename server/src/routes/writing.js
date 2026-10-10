import express from 'express';
import { getDb } from '../db.js';
import { authRequired } from '../auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { analyzeEssay, bandLabel } from '../services/essayAnalyzer.js';
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

function countWords(text) {
  return (String(text || '').match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
}

function rowToPrompt(r) {
  if (!r) return null;
  return {
    id: r.id,
    task_type: r.task_type,
    category: r.category,
    chart_type: r.chart_type,
    title: r.title,
    prompt_en: r.prompt_en,
    prompt_cn: r.prompt_cn,
    min_words: r.min_words,
    minutes: r.minutes,
    difficulty: r.difficulty,
    tags: parseJson(r.tags, []),
  };
}

function rowToEssay(r, { withAnalysis = true } = {}) {
  if (!r) return null;
  return {
    id: r.id,
    prompt_id: r.prompt_id,
    prompt_title: r.prompt_title || null,
    task_type: r.task_type || null,
    content: r.content,
    word_count: r.word_count,
    duration_sec: r.duration_sec,
    status: r.status,
    bands: {
      overall: r.band_overall,
      tr: r.band_tr,
      cc: r.band_cc,
      lr: r.band_lr,
      gra: r.band_gra,
    },
    analysis: withAnalysis ? parseJson(r.analysis) : null,
    ai_feedback: withAnalysis ? parseJson(r.ai_feedback) : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ---------- 题库 ----------
router.get('/prompts', (req, res) => {
  const db = getDb();
  const taskType = String(req.query.task_type || '').trim();
  const category = String(req.query.category || '').trim();

  const where = [];
  const params = {};
  if (taskType) {
    where.push('p.task_type = @tt');
    params.tt = taskType;
  }
  if (category) {
    where.push('p.category = @cat');
    params.cat = category;
  }
  const sql = `SELECT p.*,
      (SELECT COUNT(*) FROM model_essays m WHERE m.prompt_id = p.id) AS model_count,
      (SELECT COUNT(*) FROM writing_essays e WHERE e.user_id = @uid AND e.prompt_id = p.id) AS my_count
    FROM writing_prompts p
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.task_type, p.id`;
  const rows = db.prepare(sql).all({ ...params, uid: req.user.id });

  const categories = db
    .prepare(`SELECT DISTINCT category FROM writing_prompts WHERE category IS NOT NULL ORDER BY category`)
    .all()
    .map((r) => r.category);

  res.json({ total: rows.length, categories, prompts: rows.map((r) => ({ ...rowToPrompt(r), model_count: r.model_count, my_count: r.my_count })) });
});

router.get('/prompts/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const p = db.prepare('SELECT * FROM writing_prompts WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: '题目不存在' });
  const models = db
    .prepare('SELECT id, prompt_id, band, title, content, highlights FROM model_essays WHERE prompt_id = ? ORDER BY band DESC')
    .all(id)
    .map((m) => ({ ...m, highlights: parseJson(m.highlights, []) }));
  res.json({ prompt: rowToPrompt(p), model_essays: models });
});

// ---------- 我的作文 ----------
router.get('/essays', (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT e.*, p.title AS prompt_title, p.task_type
         FROM writing_essays e LEFT JOIN writing_prompts p ON p.id = e.prompt_id
        WHERE e.user_id = ?
        ORDER BY e.updated_at DESC LIMIT 100`
    )
    .all(req.user.id);
  res.json({ total: rows.length, essays: rows.map((r) => rowToEssay(r, { withAnalysis: false })) });
});

router.get('/essays/:id', (req, res) => {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT e.*, p.title AS prompt_title, p.task_type, p.prompt_en, p.prompt_cn, p.min_words, p.minutes
         FROM writing_essays e LEFT JOIN writing_prompts p ON p.id = e.prompt_id
        WHERE e.id = ? AND e.user_id = ?`
    )
    .get(Number(req.params.id), req.user.id);
  if (!row) return res.status(404).json({ error: '作文不存在' });
  res.json({
    essay: {
      ...rowToEssay(row),
      prompt: row.prompt_en
        ? {
            id: row.prompt_id,
            title: row.prompt_title,
            task_type: row.task_type,
            prompt_en: row.prompt_en,
            prompt_cn: row.prompt_cn,
            min_words: row.min_words,
            minutes: row.minutes,
          }
        : null,
    },
  });
});

router.post('/essays', (req, res) => {
  const db = getDb();
  const { prompt_id = null, content = '', duration_sec = 0, submit = false } = req.body || {};
  const wc = countWords(content);
  const info = db
    .prepare(
      `INSERT INTO writing_essays (user_id, prompt_id, content, word_count, duration_sec, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, prompt_id ? Number(prompt_id) : null, String(content), wc, Number(duration_sec) || 0, submit ? 'done' : 'draft');
  res.json({ ok: true, id: info.lastInsertRowid, word_count: wc });
});

router.put('/essays/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const own = db.prepare('SELECT id FROM writing_essays WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!own) return res.status(404).json({ error: '作文不存在' });

  const { content, duration_sec, submit } = req.body || {};
  const fields = [];
  const params = { id };
  if (content !== undefined) {
    fields.push('content = @content', 'word_count = @wc');
    params.content = String(content);
    params.wc = countWords(content);
  }
  if (duration_sec !== undefined) {
    fields.push('duration_sec = @dur');
    params.dur = Number(duration_sec) || 0;
  }
  if (submit !== undefined) {
    fields.push('status = @status');
    params.status = submit ? 'done' : 'draft';
  }
  fields.push("updated_at = datetime('now')");
  db.prepare(`UPDATE writing_essays SET ${fields.join(', ')} WHERE id = @id`).run(params);
  res.json({ ok: true });
});

router.delete('/essays/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM writing_essays WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
  if (!r.changes) return res.status(404).json({ error: '作文不存在' });
  res.json({ ok: true });
});

// ---------- 批改 ----------
router.post('/essays/:id/analyze', async (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const row = db
    .prepare(
      `SELECT e.*, p.task_type, p.category, p.chart_type, p.prompt_en, p.min_words, p.minutes
         FROM writing_essays e LEFT JOIN writing_prompts p ON p.id = e.prompt_id
        WHERE e.id = ? AND e.user_id = ?`
    )
    .get(id, req.user.id);
  if (!row) return res.status(404).json({ error: '作文不存在' });
  if (!String(row.content || '').trim()) return res.status(400).json({ error: '作文内容为空，无法批改' });

  const knownLemmas = new Set(db.prepare('SELECT lemma FROM words').all().map((r) => r.lemma));
  const result = analyzeEssay({
    content: row.content,
    prompt: {
      task_type: row.task_type || 'task2',
      category: row.category,
      chart_type: row.chart_type,
      prompt_en: row.prompt_en || '',
      min_words: row.min_words || 250,
      minutes: row.minutes || 40,
    },
    knownLemmas,
  });

  const b = result.bands;
  db.prepare(
    `UPDATE writing_essays SET status='done', band_overall=@o, band_tr=@tr, band_cc=@cc,
       band_lr=@lr, band_gra=@gra, analysis=@a, updated_at=datetime('now')
     WHERE id=@id`
  ).run({ id, o: b.overall, tr: b.tr, cc: b.cc, lr: b.lr, gra: b.gra, a: JSON.stringify(result) });

  logStudy(db, req.user.id, {
    module: 'writing',
    action: 'submit',
    refType: 'prompt',
    refId: row.prompt_id,
    score: b.overall,
    durationMs: (row.duration_sec || 0) * 1000,
    detail: { word_count: result.word_count },
  });

  const label = bandLabel(b.overall);
  res.json({ ok: true, analysis: result, bands: { ...b, label } });
});

// LLM 增强反馈（可选，需要配置 API Key）
router.post('/essays/:id/ai-feedback', aiLimiter, async (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const row = db
    .prepare(
      `SELECT e.*, p.prompt_en, p.task_type, p.min_words
         FROM writing_essays e LEFT JOIN writing_prompts p ON p.id = e.prompt_id
        WHERE e.id = ? AND e.user_id = ?`
    )
    .get(id, req.user.id);
  if (!row) return res.status(404).json({ error: '作文不存在' });

  const { chatJson } = await import('../services/llm.js');
  const user = db.prepare('SELECT llm_provider FROM users WHERE id = ?').get(req.user.id);

  const local = parseJson(row.analysis, null);
  try {
    const data = await chatJson({
      provider: user?.llm_provider || 'deepseek',
      messages: [
        {
          role: 'system',
          content: `你是资深雅思写作考官。请按官方四个维度（Task Response / Coherence and Cohesion / Lexical Resource / Grammatical Range and Accuracy）点评这篇作文。
严格返回 JSON，不要 Markdown 代码块。评语用中文，必须具体到句子，禁止空泛套话。`,
        },
        {
          role: 'user',
          content: `【题目】${row.prompt_en || '(未关联题目)'}
【要求字数】${row.min_words || 250}
【作文】
${String(row.content).slice(0, 6000)}

【本地统计参考】${local ? JSON.stringify({ bands: local.bands, word_count: local.word_count, stats: { linker_per100: local.stats.linker_per100, advanced_word_ratio: local.stats.advanced_word_ratio } }) : '无'}

返回：
{
  "overall_comment": "总体评价，3-4 句",
  "dimensions": [
    { "key": "tr", "band": 6.5, "comment": "具体点评" },
    { "key": "cc", "band": 6.5, "comment": "具体点评" },
    { "key": "lr", "band": 6.5, "comment": "具体点评" },
    { "key": "gra", "band": 6.5, "comment": "具体点评" }
  ],
  "rewrites": [
    { "original": "原文中一句真实存在的句子", "improved": "改写后的高分版本", "reason": "为什么这样改" }
  ],
  "upgrade_plan": ["下一步最该做的 3 件事，每件要具体可执行"]
}`,
        },
      ],
    });
    db.prepare("UPDATE writing_essays SET ai_feedback = ?, updated_at = datetime('now') WHERE id = ?").run(
      JSON.stringify(data),
      id
    );
    res.json({ ok: true, ai_feedback: data });
  } catch (e) {
    res.status(502).json({ error: `AI 点评失败：${e.message}` });
  }
});

// ---------- 写作统计 ----------
router.get('/stats', (req, res) => {
  const db = getDb();
  const uid = req.user.id;
  const summary = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done,
              COUNT(DISTINCT prompt_id) AS prompts_touched,
              ROUND(AVG(CASE WHEN status='done' THEN band_overall END), 1) AS avg_band,
              MAX(band_overall) AS best_band,
              COALESCE(SUM(word_count), 0) AS total_words
         FROM writing_essays WHERE user_id = ?`
    )
    .get(uid);

  const trend = db
    .prepare(
      `SELECT date(created_at) AS day, ROUND(AVG(band_overall),1) AS band, COUNT(*) AS n
         FROM writing_essays
        WHERE user_id = ? AND status='done' AND band_overall IS NOT NULL
          AND created_at >= datetime('now', '-60 days')
        GROUP BY day ORDER BY day`
    )
    .all(uid);

  const dims = db
    .prepare(
      `SELECT ROUND(AVG(band_tr),1) AS tr, ROUND(AVG(band_cc),1) AS cc,
              ROUND(AVG(band_lr),1) AS lr, ROUND(AVG(band_gra),1) AS gra
         FROM writing_essays WHERE user_id = ? AND status='done'`
    )
    .get(uid);

  const byTask = db
    .prepare(
      `SELECT p.task_type, COUNT(*) AS n, ROUND(AVG(e.band_overall),1) AS band
         FROM writing_essays e JOIN writing_prompts p ON p.id = e.prompt_id
        WHERE e.user_id = ? AND e.status='done'
        GROUP BY p.task_type`
    )
    .all(uid);

  res.json({
    // 无已批改作文时返回 null，前端显示「—」而不是假的 0 分
    summary: { ...summary, avg_band: summary.avg_band ?? null, best_band: summary.best_band ?? null },
    dimension_avg: dims,
    by_task: byTask,
    trend,
  });
});

export default router;
