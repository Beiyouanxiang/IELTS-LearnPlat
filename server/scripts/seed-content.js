// 导入雅思内容库：写作题库 / 范文 / 阅读文章与题目 / 听力样题
// 幂等：按标题判定，已存在则更新，不产生重复数据
// 用法：npm run seed:content
import 'dotenv/config';
import { initDb } from '../src/db.js';
import { WRITING_PROMPTS, MODEL_ESSAYS } from './data/writing-content.js';
import { READING_PASSAGES } from './data/reading-content.js';

const db = initDb();

// ---------- 写作题库 ----------
let wpInserted = 0;
let wpUpdated = 0;
const upsertPrompt = db.prepare('SELECT id FROM writing_prompts WHERE title = ?');
const insPrompt = db.prepare(
  `INSERT INTO writing_prompts (task_type, category, chart_type, title, prompt_en, prompt_cn, min_words, minutes, difficulty, tags)
   VALUES (@task_type, @category, @chart_type, @title, @prompt_en, @prompt_cn, @min_words, @minutes, @difficulty, @tags)`
);
const updPrompt = db.prepare(
  `UPDATE writing_prompts SET task_type=@task_type, category=@category, chart_type=@chart_type,
     prompt_en=@prompt_en, prompt_cn=@prompt_cn, min_words=@min_words, minutes=@minutes,
     difficulty=@difficulty, tags=@tags
   WHERE id=@id`
);

const promptIdByTitle = new Map();
for (const p of WRITING_PROMPTS) {
  const row = { ...p, chart_type: p.chart_type || null, tags: JSON.stringify(p.tags || []) };
  const exist = upsertPrompt.get(p.title);
  if (exist) {
    updPrompt.run({ ...row, id: exist.id });
    promptIdByTitle.set(p.title, exist.id);
    wpUpdated += 1;
  } else {
    const info = insPrompt.run(row);
    promptIdByTitle.set(p.title, info.lastInsertRowid);
    wpInserted += 1;
  }
}

// ---------- 范文 ----------
let meInserted = 0;
let meUpdated = 0;
const findEssay = db.prepare('SELECT id FROM model_essays WHERE prompt_id = ? AND title = ?');
const insEssay = db.prepare(
  `INSERT INTO model_essays (prompt_id, band, title, content, highlights) VALUES (?, ?, ?, ?, ?)`
);
const updEssay = db.prepare('UPDATE model_essays SET band = ?, content = ?, highlights = ? WHERE id = ?');
for (const e of MODEL_ESSAYS) {
  const pid = promptIdByTitle.get(e.prompt_title);
  if (!pid) {
    console.warn(`[seed:content] 跳过范文（找不到对应题目）：${e.prompt_title}`);
    continue;
  }
  const highlights = JSON.stringify(e.highlights || []);
  const exist = findEssay.get(pid, e.title);
  if (exist) {
    updEssay.run(e.band, e.content, highlights, exist.id);
    meUpdated += 1;
  } else {
    insEssay.run(pid, e.band, e.title, e.content, highlights);
    meInserted += 1;
  }
}

// ---------- 阅读文章 + 题目 ----------
let rpInserted = 0;
let rpUpdated = 0;
let rqCount = 0;
const findPassage = db.prepare('SELECT id FROM reading_passages WHERE title = ? AND owner_id IS NULL');
const insPassage = db.prepare(
  `INSERT INTO reading_passages (owner_id, title, topic, difficulty, source, content, translation, word_count, is_public)
   VALUES (NULL, ?, ?, ?, ?, ?, NULL, ?, 1)`
);
const updPassage = db.prepare(
  `UPDATE reading_passages SET topic=?, difficulty=?, source=?, content=?, word_count=?, is_public=1 WHERE id=?`
);
const delQuestions = db.prepare('DELETE FROM reading_questions WHERE passage_id = ?');
const insQuestion = db.prepare(
  `INSERT INTO reading_questions (passage_id, idx, qtype, prompt, options, answer, answer_alt, explanation, para_ref)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

for (const p of READING_PASSAGES) {
  const wc = (p.content.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
  const exist = findPassage.get(p.title);
  let pid;
  if (exist) {
    updPassage.run(p.topic || null, p.difficulty || 2, p.source || null, p.content, wc, exist.id);
    pid = exist.id;
    delQuestions.run(pid);
    rpUpdated += 1;
  } else {
    const info = insPassage.run(p.title, p.topic || null, p.difficulty || 2, p.source || null, p.content, wc);
    pid = info.lastInsertRowid;
    rpInserted += 1;
  }
  p.questions.forEach((q, i) => {
    insQuestion.run(
      pid,
      i + 1,
      q.qtype,
      q.prompt,
      q.options ? JSON.stringify(q.options) : null,
      String(q.answer),
      q.answer_alt ? JSON.stringify(q.answer_alt) : null,
      q.explanation || null,
      q.para_ref || null
    );
    rqCount += 1;
  });
}

// ---------- 听力样题（内置公共素材，无音频，可用浏览器朗读） ----------
const SAMPLE_TRANSCRIPT = `Good morning, everyone, and welcome to the city library's short introduction to our new opening hours. From the first of next month, the main reading room will open at eight thirty in the morning and close at nine in the evening on weekdays. On Saturdays we will close three hours earlier, at six o'clock, and on Sundays the library will remain closed. Please note that the children's section closes thirty minutes before the rest of the building. Borrowing limits are also changing. Adults may now take out up to twelve items at a time, an increase from the previous limit of eight, and the standard loan period will be extended from two weeks to three. Items may be renewed twice online, provided that nobody else has reserved them. Finally, I would like to mention our new study pods on the second floor. These can be booked free of charge for up to two hours a day, and bookings open seven days in advance. Thank you for listening, and please ask at the front desk if you have any questions.`;

let listeningMaterialId = null;
const SAMPLE_TITLE = '图书馆开放时间与借阅规则（内置示例，可朗读）';
// 内置公共素材：owner_id 为 NULL（不属于任何账号），is_public = 1 对所有人生效。
// 与阅读文章的做法保持一致——内置内容挂在某个账号下会出两个问题：
//   1) 全新空库（还没有任何用户）时根本 seed 不出来；
//   2) 清理用户数据时会被当作"用户素材"级联删掉，连 segments / questions 一起没了。
const findMaterial = db.prepare('SELECT id FROM listening_materials WHERE title = ? AND owner_id IS NULL');
const insMaterial = db.prepare(
  `INSERT INTO listening_materials (owner_id, title, source_url, audio_path, accent, level, topic, transcript, translation, duration_sec, is_public)
   VALUES (NULL, ?, NULL, NULL, 'British', 'medium', '日常场景', ?, NULL, ?, 1)`
);
// 兼容老库：早期版本把内置素材写成了 owner_id = 1，这里归正为 NULL（幂等）
const legacyMaterial = db
  .prepare('SELECT id FROM listening_materials WHERE title = ? AND owner_id IS NOT NULL')
  .get(SAMPLE_TITLE);
if (legacyMaterial) {
  db.prepare('UPDATE listening_materials SET owner_id = NULL, is_public = 1 WHERE id = ?').run(legacyMaterial.id);
  console.log(`听力样题：已把老库中的内置素材（id=${legacyMaterial.id}）归属归正为公共素材`);
}
{
  const existing = findMaterial.get(SAMPLE_TITLE);
  if (existing) {
    listeningMaterialId = existing.id;
  } else {
    const info = insMaterial.run(SAMPLE_TITLE, SAMPLE_TRANSCRIPT, 120);
    listeningMaterialId = info.lastInsertRowid;
  }
}

// 为示例素材切句
if (listeningMaterialId) {
  const { splitSentences } = await import('../src/services/diff.js');
  const sentences = splitSentences(SAMPLE_TRANSCRIPT);
  db.prepare('DELETE FROM listening_segments WHERE material_id = ?').run(listeningMaterialId);
  const totalChars = sentences.reduce((s, t) => s + t.length, 0) || 1;
  const dur = 120;
  const ins = db.prepare(
    'INSERT INTO listening_segments (material_id, idx, start_sec, end_sec, text) VALUES (?, ?, ?, ?, ?)'
  );
  let t = 0;
  sentences.forEach((text, idx) => {
    const span = (text.length / totalChars) * dur;
    ins.run(listeningMaterialId, idx, Number(t.toFixed(2)), Number((t + span).toFixed(2)), text);
    t += span;
  });
  db.prepare('UPDATE listening_materials SET segment_count = ? WHERE id = ?').run(sentences.length, listeningMaterialId);
}

console.log('===== 内容库导入完成 =====');
console.log(`写作题库：新增 ${wpInserted} / 更新 ${wpUpdated}，共 ${WRITING_PROMPTS.length}`);
console.log(`范文：新增 ${meInserted} / 更新 ${meUpdated}，共 ${MODEL_ESSAYS.length}`);
console.log(`阅读文章：新增 ${rpInserted} / 更新 ${rpUpdated}，题目 ${rqCount} 道`);
console.log(`听力样题：${listeningMaterialId ? 'ID ' + listeningMaterialId + '（公共素材，含 ' + (db.prepare('SELECT segment_count n FROM listening_materials WHERE id=?').get(listeningMaterialId).n) + ' 句）' : '未创建'}`);
console.log(`题库统计：写作 ${db.prepare('SELECT COUNT(*) n FROM writing_prompts').get().n} 题 / 阅读 ${db.prepare('SELECT COUNT(*) n FROM reading_passages').get().n} 篇 / 听力 ${db.prepare('SELECT COUNT(*) n FROM listening_materials').get().n} 个素材`);
