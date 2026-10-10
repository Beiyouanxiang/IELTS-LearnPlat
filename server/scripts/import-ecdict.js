import 'dotenv/config';
import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import { initDb, getDb, rebuildFtsForWord, refreshWordListCounts } from '../src/db.js';

// 从 ECDICT（https://github.com/skywind3000/ECDICT, MIT 许可）导入词库
//
// 用法：
//   node scripts/import-ecdict.js [--file=data/ecdict.csv] [--tag=ielts] [--limit=0] [--audio-base=]
// ECDICT 的 CSV 列：word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio
// 注意：字段内的换行以字面量 \n 存储，所以每行就是一条完整记录，可逐行解析。

function parseArgs() {
  const args = { file: 'data/ecdict.csv', tag: 'ielts', limit: 0, audioBase: '' };
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === 'file') args.file = v;
    else if (k === 'tag') args.tag = v;
    else if (k === 'limit') args.limit = Number(v) || 0;
    else if (k === 'audio-base') args.audioBase = v;
  }
  return args;
}

// 逐行 CSV 解析：支持双引号包裹与 "" 转义
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const unescapeNl = (s) => (s ? s.replace(/\\n/g, '\n').trim() : '');

// 由 tag 推导难度：越"高阶"的词越难
function difficultyFromTags(tags) {
  if (tags.includes('gre')) return 5;
  if (tags.includes('ielts') || tags.includes('toefl')) return 4;
  if (tags.includes('cet6') || tags.includes('ky')) return 3;
  if (tags.includes('cet4')) return 2;
  return 3;
}

// ECDICT 的 frq 越大越常见；转成"越小越高频"的 rank 便于排序
function freqRank(frq) {
  const n = Number(frq);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(1, 1_000_000 - Math.min(n, 1_000_000));
}

async function main() {
  const args = parseArgs();
  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) {
    console.error(`找不到词典文件：${filePath}`);
    console.error('请先下载 ECDICT 的 ecdict.csv，例如：');
    console.error('  curl -L -o data/ecdict.csv https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv');
    process.exit(1);
  }

  const db = initDb();
  const insert = db.prepare(
    `INSERT INTO words (word, lemma, phonetic_uk, pos, meaning_cn, definition_en,
                        tags, freq_rank, difficulty, audio_uk, audio_us, source)
     VALUES (@word, @lemma, @phon, @pos, @cn, @en, @tags, @rank, @diff, @auk, @aus, 'ecdict')
     ON CONFLICT(lemma) DO UPDATE SET
       phonetic_uk = COALESCE(words.phonetic_uk, excluded.phonetic_uk),
       pos         = COALESCE(words.pos, excluded.pos),
       meaning_cn  = COALESCE(words.meaning_cn, excluded.meaning_cn),
       definition_en = COALESCE(words.definition_en, excluded.definition_en),
       tags        = COALESCE(words.tags, excluded.tags),
       freq_rank   = COALESCE(words.freq_rank, excluded.freq_rank),
       difficulty  = COALESCE(words.difficulty, excluded.difficulty),
       updated_at  = datetime('now')`
  );

  const rl = readline.createInterface({ input: fs.createReadStream(filePath, 'utf8'), crlfDelay: Infinity });

  let lineNo = 0;
  let matched = 0;
  let inserted = 0;
  let headerSkipped = false;
  const newIds = [];
  let batch = [];

  const flush = db.transaction((rows) => {
    for (const r of rows) {
      insert.run(r);
      const row = db.prepare('SELECT id, source FROM words WHERE lemma = ?').get(r.lemma);
      if (row) {
        newIds.push(row.id);
        inserted++;
      }
    }
  });

  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    if (!headerSkipped) {
      headerSkipped = true;
      if (/^word,/i.test(line)) continue; // 跳过表头
    }

    const cols = parseCsvLine(line);
    if (cols.length < 9) continue;
    const [word, phonetic, definition, translation, pos, , , tag, , frq, , , audio] = cols;

    const tags = String(tag || '').trim().split(/\s+/).filter(Boolean);
    if (args.tag && !tags.includes(args.tag)) continue;

    const lemma = String(word || '').trim().toLowerCase();
    if (!lemma) continue;

    matched++;
    const audioName = String(audio || '').trim();
    batch.push({
      word: String(word).trim(),
      lemma,
      phon: phonetic ? `/${String(phonetic).trim().replace(/^\/|\/$/g, '')}/` : null,
      pos: pos || null,
      cn: unescapeNl(translation) || null,
      en: unescapeNl(definition) || null,
      tags: JSON.stringify(tags),
      rank: freqRank(frq),
      diff: difficultyFromTags(tags),
      auk: audioName && args.audioBase ? `${args.audioBase}/uk/${audioName}_uk.mp3` : null,
      aus: audioName && args.audioBase ? `${args.audioBase}/us/${audioName}_us.mp3` : null,
    });

    if (batch.length >= 500) {
      flush(batch);
      batch = [];
      process.stdout.write(`\r已扫描 ${lineNo} 行，命中 ${matched} 词，入库 ${inserted} 词…`);
    }
    if (args.limit && matched >= args.limit) break;
  }

  if (batch.length) flush(batch);
  console.log(`\n[import] 扫描 ${lineNo} 行，命中 ${matched} 词`);

  // 建词书
  const listName = `雅思词库（ECDICT ${args.tag}）`;
  const slug = `ecdict-${args.tag}`;
  let list = db.prepare('SELECT id FROM word_lists WHERE slug = ?').get(slug);
  if (!list) {
    const info = db
      .prepare(`INSERT INTO word_lists (name, slug, description, is_public, position) VALUES (?, ?, ?, 1, 10)`)
      .run(listName, slug, `从 ECDICT 导入的 ${args.tag} 词表，共 ${inserted} 词。`);
    list = { id: info.lastInsertRowid };
  }
  const insItem = db.prepare(`INSERT OR IGNORE INTO word_list_items (list_id, word_id, position) VALUES (?, ?, ?)`);
  const tx2 = db.transaction(() => {
    newIds.forEach((wid, i) => insItem.run(list.id, wid, i + 1));
  });
  tx2();

  // 重建 FTS（只在结束时做一次，避免逐词事务拖慢导入）
  console.log('[import] 重建全文索引…');
  db.exec('DELETE FROM words_fts');
  const all = db.prepare('SELECT id FROM words ORDER BY id').all();
  for (const r of all) rebuildFtsForWord(r.id);
  refreshWordListCounts();

  const total = db.prepare('SELECT COUNT(*) AS n FROM words').get().n;
  console.log(`[import] 完成：词库总计 ${total} 词，词书「${listName}」id=${list.id}`);
}

main().catch((e) => {
  console.error('[import] 失败：', e);
  process.exit(1);
});
