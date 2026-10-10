// 导入雅思高频词表（按话题分册）
// 用法：npm run seed:books
import 'dotenv/config';
import { getDb, rebuildFtsForWord, refreshWordListCounts } from '../src/db.js';
import { BOOKS } from './data/wordbooks.js';

const db = getDb();

function parseRows(text) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('#'))
    .map((line) => {
      const [word, pos, meaning, syn = ''] = line.split('|').map((s) => (s || '').trim());
      return {
        word,
        pos: pos || null,
        meaning,
        synonyms: syn ? syn.split(',').map((x) => x.trim()).filter(Boolean) : [],
      };
    })
    .filter((r) => r.word && r.meaning);
}

const qFindWord = db.prepare('SELECT id FROM words WHERE lemma = ?');
const qInsWord = db.prepare(
  `INSERT INTO words (word, lemma, pos, meaning_cn, synonyms, topic, difficulty, source)
   VALUES (@word, @lemma, @pos, @meaning, @syn, @topic, @difficulty, 'wordbook')`
);
const qUpdWord = db.prepare(
  `UPDATE words SET
      pos         = COALESCE(NULLIF(pos, ''), @pos),
      meaning_cn  = COALESCE(NULLIF(meaning_cn, ''), @meaning),
      synonyms    = CASE WHEN synonyms IS NULL OR synonyms = '' THEN @syn ELSE synonyms END,
      topic       = COALESCE(topic, @topic),
      difficulty  = COALESCE(difficulty, @difficulty),
      updated_at  = datetime('now')
    WHERE id = @id`
);
const qFindList = db.prepare('SELECT * FROM word_lists WHERE slug = ?');
const qInsList = db.prepare(
  `INSERT INTO word_lists (name, slug, description, category, is_public, position)
   VALUES (@name, @slug, @desc, @category, 1, @pos)`
);
const qUpdList = db.prepare(
  `UPDATE word_lists SET name = @name, description = @desc,
          category = @category, position = @pos
    WHERE id = @id`
);
const qInsItem = db.prepare(
  'INSERT OR IGNORE INTO word_list_items (list_id, word_id, position) VALUES (?, ?, ?)'
);

let added = 0;
let updated = 0;
let linked = 0;
const bookStats = [];

const run = db.transaction(() => {
  BOOKS.forEach((book, bi) => {
    const rows = parseRows(book.rows);
    const pos = book.position ?? bi;
    const category = book.category ?? null;
    let list = qFindList.get(book.slug);
    if (!list) {
      qInsList.run({ name: book.name, slug: book.slug, desc: book.desc, category, pos });
      list = qFindList.get(book.slug);
    } else {
      qUpdList.run({ id: list.id, name: book.name, desc: book.desc, category, pos });
    }

    let n = 0;
    rows.forEach((r, i) => {
      const lemma = r.word.toLowerCase();
      const existing = qFindWord.get(lemma);
      let wordId;
      if (!existing) {
        const info = qInsWord.run({
          word: r.word,
          lemma,
          pos: r.pos,
          meaning: r.meaning,
          syn: JSON.stringify(r.synonyms),
          topic: book.topic,
          difficulty: book.difficulty,
        });
        wordId = info.lastInsertRowid;
        rebuildFtsForWord(wordId);
        added += 1;
      } else {
        wordId = existing.id;
        qUpdWord.run({
          id: wordId,
          pos: r.pos,
          meaning: r.meaning,
          syn: JSON.stringify(r.synonyms),
          topic: book.topic,
          difficulty: book.difficulty,
        });
        updated += 1;
      }
      const res = qInsItem.run(list.id, wordId, i);
      if (res.changes) linked += 1;
      n += 1;
    });
    bookStats.push({ name: book.name, count: n });
  });
});

run();
refreshWordListCounts();

// 整理早期内置示例词书，避免与正式词书重名
const demo = db.prepare("SELECT id FROM word_lists WHERE slug = 'ielts-core-demo'").get();
if (demo) {
  db.prepare('UPDATE word_lists SET name = ?, description = ?, position = 99 WHERE id = ?').run(
    '雅思基础词（含例句）',
    '内置的 67 个精选词，每个都带英文例句与中文翻译，适合先跑通学习流程',
    demo.id
  );
}

console.log('--- 词表导入完成 ---');
for (const b of bookStats) console.log(`  ${b.name}: ${b.count} 词`);
console.log(`新增 ${added} · 复用/更新 ${updated} · 词书关联 ${linked}`);
const total = db.prepare('SELECT COUNT(*) AS n FROM words').get().n;
const lists = db.prepare('SELECT name, word_count FROM word_lists ORDER BY position, id').all();
console.log(`词库总量：${total} 词`);
for (const l of lists) console.log(`  · ${l.name}（${l.word_count}）`);
