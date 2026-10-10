// 统一词库构建脚本
//
//   npm run build:wordlists
//
// 数据源（均为可自由使用的许可）：
//   1. ECDICT        —— https://github.com/skywind3000/ECDICT  (MIT)
//                        提供中文释义 / 音标 / 词性 / BNC 词频 / Collins 星级
//                        文件：data/ecdict.csv（需自行下载，约 63 MB）
//   2. 标准词表 JSON —— https://github.com/lpmi-13/machine_readable_wordlists (CC0 1.0)
//                        AWL / NAWL / AKL / GSL / NGSL / BNC-COCA
//                        文件：scripts/data/wordlists/*.json
//
// 商业词书（《雅思词汇真经》等）有版权，本项目一律不使用。
//
// 脚本是幂等的：重复执行只会补齐缺失的词与词库，不会重复插入。

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { initDb, rebuildFtsForWord, refreshWordListCounts } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WL_DIR = path.join(__dirname, 'data', 'wordlists');
const ECDICT_FILE = path.resolve(process.env.ECDICT_FILE || 'data/ecdict.csv');

// ECDICT 里我们认识的考试标签（用于生成词条 badge 与检索筛选）
const KNOWN_EXAM_TAGS = ['zk', 'gk', 'cet4', 'cet6', 'ky', 'toefl', 'ielts', 'gre'];

// ============================ CSV 解析 ============================

// 逐行解析：支持双引号包裹与 "" 转义（ECDICT 的换行以字面量 \n 存储，故一行即一条记录）
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

const unescapeNl = (s) => (s ? String(s).replace(/\\n/g, '\n').trim() : '');

// ECDICT 的释义会把专业领域义项另起一行，用 [计] [化] [医] 这类标记标出。
// 对雅思考生来说这些多半是噪音（例如 a 会带出「[计] 累加器, 地址, 振幅…」）。
// 策略：若存在不带领域标记的常规义项，就丢掉带标记的行；整词都是专业术语时全部保留。
const DOMAIN_MARK = /\[[^\]]{1,8}\]/;
function cleanTranslation(raw) {
  const lines = String(raw || '')
    .replace(/\\r/g, '') // 字面量 \r（ECDICT 里以两字符形式存在，不是真的回车）
    .replace(/\\n/g, '\n') // 字面量 \n → 真换行
    .split('\n')
    .map((s) => s.replace(/\r/g, '').trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const general = lines.filter((l) => !DOMAIN_MARK.test(l));
  return (general.length ? general : lines).join('\n');
}

// 词表源里有各种"看起来像但并不是"普通连字符的字符（如 U+2011 非断行连字符
// 出现在 AWL 的 so‑called 里），以及 (for) 这类记号而非词条，统一规范化/过滤，
// 否则会因匹配不上 ECDICT 而整条丢掉。
function normalizeWord(w) {
  return String(w)
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
// 必须含有拉丁字母，且不能以括号/方括号开头（那是词典记号不是单词）
function isRealWord(w) {
  return /[a-z]/i.test(w) && !/^[([{]/.test(w);
}

// ============================ 词表定义 ============================

function loadList(name) {
  return JSON.parse(fs.readFileSync(path.join(WL_DIR, name), 'utf8'));
}

// 把各词表摊平成「词库规格」：{ slug, name, category, position, description, entries[{word, forms[]}] }
function buildSpecs() {
  const awl = loadList('awl.json');
  const nawl = loadList('nawl.json');
  const akl = loadList('akl.json');
  const gsl = loadList('gsl.json');
  const ngsl = loadList('ngsl.json');
  const bnc = loadList('bnc_coca.json');

  // AWL：sublist_N -> { headword: { subwords: [] } }，按 sublist 顺序摊平
  const awlSublists = Object.keys(awl)
    .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
    .map((k) => ({ n: Number(k.split('_')[1]), items: awl[k] }));
  const awlAll = [];
  for (const s of awlSublists) {
    for (const [hw, v] of Object.entries(s.items)) {
      awlAll.push({ word: hw, forms: v?.subwords || [], sublist: s.n });
    }
  }
  const awl1to3 = awlAll.filter((w) => w.sublist <= 3);

  const toEntries = (obj) =>
    Object.entries(obj).map(([word, forms]) => ({
      word,
      forms: Array.isArray(forms) ? forms : [],
    }));

  const bncTop2k = [...(bnc['1000'] || []), ...(bnc['2000'] || [])];

  return [
    // ---------- 基础高频 ----------
    {
      slug: 'ngsl-1k',
      name: 'NGSL 最高频 1000 词',
      category: '基础高频',
      position: 10,
      description:
        'New General Service List 第 1 个千词段（基于 2.73 亿词现代语料）。覆盖日常英语最常用的词，是雅思读写的地基。',
      entries: toEntries(ngsl['1000'] || {}),
    },
    {
      slug: 'ngsl-2k',
      name: 'NGSL 次高频 1000 词',
      category: '基础高频',
      position: 11,
      description: 'New General Service List 第 2 个千词段，补齐日常表达与基础书面语。',
      entries: toEntries(ngsl['2000'] || {}),
    },
    {
      slug: 'ngsl-3k',
      name: 'NGSL 常用补充 801 词',
      category: '基础高频',
      position: 12,
      description: 'New General Service List 第 3 段。学完这三段，一般文本的覆盖率可达 92% 以上。',
      entries: toEntries(ngsl['3000'] || {}),
    },
    {
      slug: 'gsl',
      name: 'GSL 通用服务词表',
      category: '基础高频',
      position: 13,
      description:
        'Michael West 的 General Service List，词汇学上最经典的英语高频词表，覆盖书面英语约 80%。与 NGSL 互为补充。',
      entries: Object.entries(gsl)
        .filter(([k]) => /^\d+$/.test(k))
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, word]) => ({ word, forms: [] })),
    },
    {
      slug: 'bnc-2k',
      name: 'BNC/COCA 最高频 2000 词',
      category: '基础高频',
      position: 14,
      description: 'BNC + COCA 语料库综合频段的前两个千词段，按实际使用频率排序，适合快速过一遍最该先会的词。',
      entries: bncTop2k.map((w) => ({ word: w, forms: [] })),
    },

    // ---------- 雅思核心 ----------
    {
      slug: 'ielts-core',
      name: '雅思核心词汇',
      category: '雅思核心',
      position: 20,
      description:
        'ECDICT 词库中带 ielts 考纲标签的词，是雅思考试的实际命题范围。每条含中文释义、音标、BNC 词频与 Collins 星级。',
      entries: null, // 由 ECDICT 扫描时填充
    },

    // ---------- 学术词表 ----------
    {
      slug: 'awl-1-3',
      name: 'AWL 高频学术词 1–3 子表',
      category: '学术词表',
      position: 30,
      description:
        'Coxhead 学术词表最高频的 180 个词族。时间有限就先啃这一册——阅读里出现最多、写作提分最快的部分。',
      entries: awl1to3.map((w) => ({ word: w.word, forms: w.forms, sublist: w.sublist })),
    },
    {
      slug: 'awl',
      name: 'AWL 学术词表全表',
      category: '学术词表',
      position: 31,
      description:
        'Averil Coxhead (2000) 基于 350 万词学术语料统计的 570 个词族，覆盖学术文本约 10% 的用词，是雅思阅读与写作 Band 7+ 的核心。每个词根带多个派生形式。',
      entries: awlAll.map((w) => ({ word: w.word, forms: w.forms, sublist: w.sublist })),
    },
    {
      slug: 'nawl',
      name: 'NAWL 新学术词表',
      category: '学术词表',
      position: 32,
      description: '基于 2.88 亿词当代语料（含学术口语语料）重新统计的新学术词表，比 AWL 更贴近现代学术英语。',
      entries: toEntries(nawl),
    },
    {
      slug: 'akl',
      name: 'AKL 学术关键词表',
      category: '学术词表',
      position: 33,
      description:
        'Academic Keyword List。源表按词性分列共 969 条，去重后 871 个词。收录学术写作中承担论述组织功能的词（如 argue、compare、namely），与 AWL 互补，对写作 Task 2 尤其有用。',
      entries: (() => {
        const seen = new Set();
        const out = [];
        for (const arr of Object.values(akl)) {
          for (const w of arr) {
            const k = String(w).toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            out.push({ word: w, forms: [] });
          }
        }
        return out;
      })(),
    },
  ];
}

// ============================ ECDICT ============================

// 由 Collins 星级推难度（5 星最常见 → 难度 1）
function difficultyFromCollons(collins, tags) {
  if (collins >= 5) return 1;
  if (collins === 4) return 2;
  if (collins === 3) return 3;
  if (collins === 2) return 4;
  if (collins === 1) return 5;
  if (tags.includes('zk') || tags.includes('gk')) return 1;
  if (tags.includes('cet4')) return 2;
  if (tags.includes('cet6') || tags.includes('ky')) return 3;
  if (tags.includes('toefl') || tags.includes('ielts')) return 4;
  if (tags.includes('gre')) return 5;
  return 3;
}

// bnc 是 BNC 语料库排名（越小越常见），frq 是现代语料频次
function toFreqRank(bnc, frq) {
  const b = Number(bnc);
  if (Number.isFinite(b) && b > 0) return b;
  const f = Number(frq);
  if (Number.isFinite(f) && f > 0) return Math.max(1, 100_000 - Math.min(f, 100_000));
  return null;
}

// ECDICT 的 pos 列多数为空——词性其实写在中文释义的前缀里（"n. 分析\nvt. 分析"）。
// 这里把它抽出来，让「本地化」后的词条信息更完整。
const POS_ABBR = [
  'aux', 'abbr', 'prep', 'conj', 'pron', 'adj', 'adv', 'art', 'int', 'num',
  'vt', 'vi', 'n', 'v', 'a', 'ad', 'pl', 'interj',
];
const POS_RE = new RegExp(`^(${POS_ABBR.join('|')})\\.\\s`, 'i');
function derivePos(translation, fallback) {
  if (fallback) return fallback;
  if (!translation) return null;
  const found = [];
  for (const line of translation.split('\n')) {
    const m = POS_RE.exec(line.trim());
    if (m) {
      const p = `${m[1].toLowerCase()}.`;
      if (!found.includes(p)) found.push(p);
    }
    if (found.length >= 4) break;
  }
  return found.length ? found.join('/') : null;
}

// ============================ 主流程 ============================

async function main() {
  if (!fs.existsSync(ECDICT_FILE)) {
    console.error(`找不到 ECDICT 文件：${ECDICT_FILE}`);
    console.error('请先下载（约 63 MB）：');
    console.error('  curl -L -o data/ecdict.csv \\');
    console.error('    https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv');
    process.exit(1);
  }

  const specs = buildSpecs();

  // 词形规范化 + 过滤记号（见 normalizeWord / isRealWord 的说明）
  for (const s of specs) {
    if (!s.entries) continue;
    const seen = new Set();
    s.entries = s.entries
      .map((e) => ({ ...e, word: normalizeWord(e.word) }))
      .filter((e) => {
        if (!isRealWord(e.word)) return false;
        const k = e.word.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
  }

  // 需要从 ECDICT 取词的范围：所有词表里的词（小写化）
  const needed = new Set();
  for (const s of specs) {
    if (!s.entries) continue;
    for (const e of s.entries) needed.add(String(e.word).trim().toLowerCase());
  }
  console.log(`[build] 词表 ${specs.length} 个，待取词 ${needed.size} 个（另加 ECDICT ielts 标签词）`);

  // ---- 扫描 ECDICT ----
  const rl = readline.createInterface({ input: fs.createReadStream(ECDICT_FILE, 'utf8'), crlfDelay: Infinity });
  const found = new Map(); // lemma -> record
  const ieltsWords = [];
  let lineNo = 0;
  let headerSkipped = false;

  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    if (!headerSkipped) {
      headerSkipped = true;
      if (/^word,/i.test(line)) continue;
    }
    const cols = parseCsvLine(line);
    if (cols.length < 9) continue;

    const [word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange] = cols;
    const w = String(word || '').trim();
    if (!w) continue;
    const lemma = w.toLowerCase();
    const tags = String(tag || '').trim().split(/\s+/).filter(Boolean);

    const isNeeded = needed.has(lemma);
    const isIelts = tags.includes('ielts');
    if (!isNeeded && !isIelts) continue;

    const rec = {
      word: w,
      lemma,
      phon: phonetic ? `/${String(phonetic).trim().replace(/^\/|\/$/g, '')}/` : null,
      pos: derivePos(cleanTranslation(translation), String(pos || '').trim() || null),
      cn: cleanTranslation(translation),
      en: unescapeNl(definition) || null,
      examTags: tags.filter((t) => KNOWN_EXAM_TAGS.includes(t)),
      collins: Number(collins) || 0,
      oxford: Number(oxford) || 0,
      rank: toFreqRank(bnc, frq),
      exchange: String(exchange || '').trim(),
    };
    found.set(lemma, rec);
    if (isIelts) ieltsWords.push(lemma);

    if (lineNo % 50000 === 0) {
      process.stdout.write(`\r[build] 已扫描 ${lineNo} 行，命中 ${found.size} 词…`);
    }
  }
  process.stdout.write(`\r[build] 扫描完成：${lineNo} 行，命中 ${found.size} 词（其中 ielts 标签 ${ieltsWords.length} 词）\n`);

  const db = initDb();

  // ---- 写入 words ----
  const upsert = db.prepare(
    `INSERT INTO words (word, lemma, phonetic_uk, pos, meaning_cn, definition_en,
                        word_forms, tags, freq_rank, difficulty, source)
     VALUES (@word, @lemma, @phon, @pos, @cn, @en, @forms, @tags, @rank, @diff, 'ecdict')
     ON CONFLICT(lemma) DO UPDATE SET
       -- 已有内容一律保留（如人工精选的例句），只补空缺
       phonetic_uk   = COALESCE(NULLIF(words.phonetic_uk, ''), excluded.phonetic_uk),
       pos           = COALESCE(NULLIF(words.pos, ''), excluded.pos),
       -- 人工整理过的释义（seed-vocab / 话题词书）优先保留，其余以 ECDICT 为准。
       -- 不能只写 COALESCE：那样重复执行时 ECDICT 侧的清洗更新永远落不下去。
       -- 注意 'seed' 也要保护——最初那 67 个精选词就是 source='seed'。
       meaning_cn    = CASE
                         WHEN words.source IN ('manual', 'wordbook', 'seed')
                              AND COALESCE(words.meaning_cn, '') <> ''
                           THEN words.meaning_cn
                         ELSE COALESCE(excluded.meaning_cn, words.meaning_cn)
                       END,
       definition_en = COALESCE(NULLIF(words.definition_en, ''), excluded.definition_en),
       word_forms    = COALESCE(NULLIF(words.word_forms, ''), excluded.word_forms),
       -- tags 必须整体覆盖：合并逻辑在 JS 侧完成（见 writeAll）。
       -- 若这里写成"已有则保留"，重复执行时就永远补不上新标签。
       tags          = excluded.tags,
       freq_rank     = COALESCE(words.freq_rank, excluded.freq_rank),
       difficulty    = COALESCE(words.difficulty, excluded.difficulty),
       updated_at    = datetime('now')`
  );
  const findId = db.prepare('SELECT id FROM words WHERE lemma = ?');

  // 结合词表来源补充 tags（例如 AWL 的 sublist 归属）
  const tagExtra = new Map(); // lemma -> Set(tag)
  const addTag = (lemma, t) => {
    if (!tagExtra.has(lemma)) tagExtra.set(lemma, new Set());
    tagExtra.get(lemma).add(t);
  };
  for (const s of specs) {
    if (!s.entries) continue;
    for (const e of s.entries) {
      const lemma = String(e.word).trim().toLowerCase();
      if (e.sublist) addTag(lemma, `AWL-${e.sublist}`);
    }
  }

  let written = 0;

  // 预载已有标签，便于把新标签并进去而不是覆盖掉（例如人工给词打的标记）
  const existingTags = new Map();
  for (const row of db.prepare('SELECT lemma, tags FROM words').all()) {
    let arr = [];
    if (row.tags) {
      try {
        const parsed = JSON.parse(row.tags);
        if (Array.isArray(parsed)) arr = parsed;
      } catch {
        // 老数据可能不是 JSON，忽略即可
      }
    }
    existingTags.set(row.lemma, arr);
  }

  const writeAll = db.transaction((records) => {
    for (const r of records) {
      const extra = tagExtra.get(r.lemma);
      const tags = [
        ...new Set([...(existingTags.get(r.lemma) || []), ...r.examTags, ...(extra ? [...extra] : [])]),
      ];
      upsert.run({
        word: r.word,
        lemma: r.lemma,
        phon: r.phon,
        pos: r.pos,
        cn: r.cn,
        en: r.en,
        forms: r.forms ? JSON.stringify(r.forms) : null,
        tags: tags.length ? JSON.stringify(tags) : null,
        rank: r.rank,
        diff: difficultyFromCollons(r.collins, r.examTags),
      });
      // 词族形态：AWL 的派生形式（若该词在 AWL 中）
      written++;
    }
  });

  // AWL 词族形态单独补一次（ECDICT 的 exchange 只是屈折变化，AWL 的 subwords 才是完整词族）
  const formsByLemma = new Map();
  for (const s of specs) {
    if (!s.entries) continue;
    for (const e of s.entries) {
      if (e.forms?.length) {
        const lemma = String(e.word).trim().toLowerCase();
        const prev = formsByLemma.get(lemma) || new Set();
        e.forms.forEach((f) => prev.add(f));
        formsByLemma.set(lemma, prev);
      }
    }
  }

  const records = [];
  for (const [lemma, r] of found) {
    const fb = formsByLemma.get(lemma);
    records.push({ ...r, forms: fb ? [...fb] : null });
  }
  writeAll(records);
  console.log(`[build] words 写入 ${written} 条`);

  // 兜底：极少数词表词条在 ECDICT 里查不到（拼写变体等），仍插入占位行，
  // 保证词库成员数与标准词表严格一致（详情页会显示「暂无释义」）。
  const missing = [...needed].filter((l) => !found.has(l));
  if (missing.length) {
    const insBare = db.prepare(
      `INSERT INTO words (word, lemma, source) VALUES (?, ?, 'wordlist')
       ON CONFLICT(lemma) DO NOTHING`
    );
    db.transaction(() => {
      for (const l of missing) insBare.run(l, l);
    })();
    console.log(`[build] 兜底插入 ${missing.length} 条 ECDICT 未收录的词表词条`);
  }

  // ---- 建词库 ----
  const getList = db.prepare('SELECT id FROM word_lists WHERE slug = ?');
  const insList = db.prepare(
    `INSERT INTO word_lists (name, slug, description, category, is_public, position)
     VALUES (@name, @slug, @desc, @category, 1, @position)`
  );
  const updList = db.prepare(
    'UPDATE word_lists SET name = @name, description = @desc, category = @category, position = @position WHERE id = @id'
  );
  const insItem = db.prepare('INSERT OR IGNORE INTO word_list_items (list_id, word_id, position) VALUES (?, ?, ?)');

  const summary = [];
  for (const s of specs) {
    if (!s.entries && s.slug !== 'ielts-core') continue;

    let list = getList.get(s.slug);
    const meta = { name: s.name, slug: s.slug, desc: s.description, category: s.category, position: s.position };
    if (!list) {
      const info = insList.run(meta);
      list = { id: Number(info.lastInsertRowid) };
    } else {
      updList.run({ ...meta, id: list.id });
    }

    // ielts-core 的词来自扫描结果；其余来自词表定义
    const wordList =
      s.slug === 'ielts-core' ? ieltsWords : s.entries.map((e) => String(e.word).trim().toLowerCase());

    let linked = 0;
    const linkTx = db.transaction((lemmas) => {
      let pos = 1;
      for (const lemma of lemmas) {
        const row = findId.get(lemma);
        if (!row) continue;
        const r = insItem.run(list.id, row.id, pos++);
        if (r.changes) linked++;
      }
    });
    linkTx([...new Set(wordList)]);

    const total = db.prepare('SELECT COUNT(*) AS n FROM word_list_items WHERE list_id = ?').get(list.id).n;
    summary.push({ name: s.name, count: total, added: linked });
  }

  // ---- 重建 FTS 与计数 ----
  console.log('[build] 重建全文索引…');
  db.exec('DELETE FROM words_fts');
  for (const r of db.prepare('SELECT id FROM words ORDER BY id').all()) rebuildFtsForWord(r.id);
  refreshWordListCounts();

  const totalWords = db.prepare('SELECT COUNT(*) AS n FROM words').get().n;
  console.log('\n================ 词库构建完成 ================');
  for (const s of summary) console.log(`  ${String(s.count).padStart(5)} 词   ${s.name}`);
  console.log('---------------------------------------------');
  console.log(`  词条总数 ${totalWords}`);
  const withCn = db.prepare("SELECT COUNT(*) AS n FROM words WHERE meaning_cn IS NOT NULL AND meaning_cn <> ''").get().n;
  const withPh = db.prepare("SELECT COUNT(*) AS n FROM words WHERE phonetic_uk IS NOT NULL AND phonetic_uk <> ''").get().n;
  console.log(`  含中文释义 ${withCn}（${((withCn / totalWords) * 100).toFixed(1)}%）`);
  console.log(`  含音标     ${withPh}（${((withPh / totalWords) * 100).toFixed(1)}%）`);
}

main().catch((e) => {
  console.error('[build] 失败：', e);
  process.exit(1);
});
