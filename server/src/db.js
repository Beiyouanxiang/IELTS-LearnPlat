import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { tokenizeForFts } from './services/fts.js';

let db;

// 当前 schema 版本：结构性变更时 +1，并在 runMigrations 里补一条迁移
const CURRENT_SCHEMA_VERSION = 4;

function getSchemaVersion() {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'`)
    .get();
  if (!row) return 0;
  const r = db.prepare(`SELECT version FROM schema_version ORDER BY id DESC LIMIT 1`).get();
  return r?.version || 0;
}

function setSchemaVersion(v) {
  db.prepare(`INSERT INTO schema_version (version, applied_at) VALUES (?, datetime('now'))`).run(v);
}

export function initDb() {
  if (db) return db;
  const dbPath = process.env.DB_PATH || './data/ielts.db';
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );

    -- ============ 账号体系 ============
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      llm_provider TEXT DEFAULT 'deepseek',
      daily_goal_words INTEGER NOT NULL DEFAULT 30,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      note TEXT,
      created_by INTEGER,
      used_by INTEGER,
      used_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT NOT NULL,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (key, window_start)
    );

    -- ============ 词汇 ============
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      lemma TEXT NOT NULL,
      phonetic_uk TEXT,
      phonetic_us TEXT,
      pos TEXT,
      meaning_cn TEXT,
      definition_en TEXT,
      example_en TEXT,
      example_cn TEXT,
      collocations TEXT,
      synonyms TEXT,
      roots TEXT,
      word_forms TEXT,
      tags TEXT,
      topic TEXT,
      freq_rank INTEGER,
      difficulty INTEGER,
      audio_uk TEXT,
      audio_us TEXT,
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_words_lemma ON words(lemma);
    CREATE INDEX IF NOT EXISTS idx_words_freq ON words(freq_rank);

    CREATE TABLE IF NOT EXISTS word_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      owner_id INTEGER,
      is_public INTEGER NOT NULL DEFAULT 1,
      word_count INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS word_list_items (
      list_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (list_id, word_id),
      FOREIGN KEY (list_id) REFERENCES word_lists(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_wli_list ON word_list_items(list_id, position);

    -- 每个用户对每个词的 SRS 进度（SM-2）
    CREATE TABLE IF NOT EXISTS user_word_progress (
      user_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      state TEXT NOT NULL DEFAULT 'new',
      ease REAL NOT NULL DEFAULT 2.5,
      interval_days REAL NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      due_at TEXT,
      last_reviewed_at TEXT,
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      is_starred INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, word_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_uwp_due ON user_word_progress(user_id, due_at);
    CREATE INDEX IF NOT EXISTS idx_uwp_state ON user_word_progress(user_id, state);
    CREATE INDEX IF NOT EXISTS idx_uwp_star ON user_word_progress(user_id, is_starred);

    -- ============ 统一学习事件流（streak / 统计 / 弱点分析 都从这里算）============
    CREATE TABLE IF NOT EXISTS study_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      ref_type TEXT,
      ref_id INTEGER,
      is_correct INTEGER,
      score REAL,
      duration_ms INTEGER,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_study_logs_user_time ON study_logs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_study_logs_module ON study_logs(user_id, module, action);

    -- ============ 听力 ============
    CREATE TABLE IF NOT EXISTS listening_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,                              -- NULL = 内置公共素材（与 reading_passages 一致）
      title TEXT NOT NULL,
      source_url TEXT,
      audio_path TEXT,
      accent TEXT,
      level TEXT,
      topic TEXT,
      transcript TEXT,
      translation TEXT,
      duration_sec REAL,
      segment_count INTEGER NOT NULL DEFAULT 0,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_lmat_owner ON listening_materials(owner_id);

    CREATE TABLE IF NOT EXISTS listening_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      idx INTEGER NOT NULL,
      start_sec REAL NOT NULL DEFAULT 0,
      end_sec REAL NOT NULL DEFAULT 0,
      text TEXT NOT NULL,
      translation TEXT,
      FOREIGN KEY (material_id) REFERENCES listening_materials(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_lseg_material ON listening_segments(material_id, idx);

    CREATE TABLE IF NOT EXISTS listening_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      segment_id INTEGER,
      mode TEXT NOT NULL,
      user_input TEXT,
      score REAL,
      diff TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_latt_user ON listening_attempts(user_id, created_at);

    -- 听力题型化练习（填空 / 选择 / 判断）
    CREATE TABLE IF NOT EXISTS listening_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      idx INTEGER NOT NULL DEFAULT 0,
      qtype TEXT NOT NULL DEFAULT 'blank',
      prompt TEXT NOT NULL,
      options TEXT,
      answer TEXT NOT NULL,
      answer_alt TEXT,
      segment_idx INTEGER,
      explanation TEXT,
      FOREIGN KEY (material_id) REFERENCES listening_materials(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_lq_material ON listening_questions(material_id, idx);

    -- ============ 写作 ============
    CREATE TABLE IF NOT EXISTS writing_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_type TEXT NOT NULL DEFAULT 'task2',      -- task1 | task2
      category TEXT,                                 -- opinion / discussion / problem-solution / advantage ...
      chart_type TEXT,                               -- task1 专用：line/bar/pie/table/process/map
      title TEXT NOT NULL,
      prompt_en TEXT NOT NULL,
      prompt_cn TEXT,
      min_words INTEGER NOT NULL DEFAULT 250,
      minutes INTEGER NOT NULL DEFAULT 40,
      difficulty INTEGER NOT NULL DEFAULT 2,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_wp_type ON writing_prompts(task_type, category);

    CREATE TABLE IF NOT EXISTS model_essays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id INTEGER NOT NULL,
      band REAL NOT NULL DEFAULT 8,
      title TEXT,
      content TEXT NOT NULL,
      highlights TEXT,                               -- JSON: [{quote, comment}]
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_me_prompt ON model_essays(prompt_id);

    CREATE TABLE IF NOT EXISTS writing_essays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      prompt_id INTEGER,
      content TEXT NOT NULL DEFAULT '',
      word_count INTEGER NOT NULL DEFAULT 0,
      duration_sec INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',          -- draft | done
      band_overall REAL,
      band_tr REAL,
      band_cc REAL,
      band_lr REAL,
      band_gra REAL,
      analysis TEXT,                                 -- JSON: 本地启发式批改结果
      ai_feedback TEXT,                              -- JSON: LLM 增强反馈（可选）
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_we_user ON writing_essays(user_id, updated_at);

    -- ============ 阅读 ============
    CREATE TABLE IF NOT EXISTS reading_passages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,                              -- NULL = 内置公共文章
      title TEXT NOT NULL,
      topic TEXT,
      difficulty INTEGER NOT NULL DEFAULT 2,         -- 1 easy 2 medium 3 hard
      source TEXT,
      content TEXT NOT NULL,
      translation TEXT,
      word_count INTEGER NOT NULL DEFAULT 0,
      is_public INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_rp_owner ON reading_passages(owner_id);

    CREATE TABLE IF NOT EXISTS reading_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      passage_id INTEGER NOT NULL,
      idx INTEGER NOT NULL DEFAULT 0,
      qtype TEXT NOT NULL DEFAULT 'choice',          -- tfng | yng | choice | match_heading | completion
      prompt TEXT NOT NULL,
      options TEXT,                                  -- JSON 数组（choice / match_heading）
      answer TEXT NOT NULL,
      answer_alt TEXT,                               -- JSON 数组：可接受的等价答案
      explanation TEXT,
      para_ref TEXT,
      FOREIGN KEY (passage_id) REFERENCES reading_passages(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_rq_passage ON reading_questions(passage_id, idx);

    CREATE TABLE IF NOT EXISTS reading_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      passage_id INTEGER NOT NULL,
      answers TEXT,
      correct INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      band_score REAL,
      duration_sec INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (passage_id) REFERENCES reading_passages(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ra_user ON reading_attempts(user_id, created_at);

    -- ============ 学习目标 ============
    CREATE TABLE IF NOT EXISTS user_goals (
      user_id INTEGER PRIMARY KEY,
      exam_date TEXT,
      target_band REAL NOT NULL DEFAULT 7,
      daily_words INTEGER NOT NULL DEFAULT 30,
      daily_listening INTEGER NOT NULL DEFAULT 1,
      daily_reading INTEGER NOT NULL DEFAULT 1,
      daily_writing INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const currentVer = getSchemaVersion();
  runMigrations(currentVer);

  // FTS 索引（词汇搜索）
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS words_fts USING fts5(
      fts_text,
      tokenize='unicode61'
    );
  `);
  backfillWordsFtsIfNeeded();

  return db;
}

function runMigrations(currentVer) {
  if (currentVer < 1) {
    // v1：初始结构（上面 db.exec 已建表，这里只打版本号）
    setSchemaVersion(1);
  }
  if (currentVer < 2) {
    // v2：写作 / 阅读 / 听力题型 / 学习目标（表已由 db.exec 的 CREATE TABLE IF NOT EXISTS 建好）
    // 兼容：早期 v2 建出的 reading_questions 可能缺 answer_alt 列
    ensureColumn('reading_questions', 'answer_alt', 'TEXT');
    setSchemaVersion(2);
  }
  if (currentVer < 3) {
    // v3：词族形态（AWL 等词表以「词族」为单位，一个词根带多个派生形式）
    //     + 词库分组（词库变多后需要按 基础/雅思/学术/话题 分组展示）
    ensureColumn('words', 'word_forms', 'TEXT');
    ensureColumn('word_lists', 'category', 'TEXT');
    setSchemaVersion(3);
  }
  if (currentVer < 4) {
    // v4：listening_materials.owner_id 由 NOT NULL 放宽为可空。
    //     内置公共听力素材不该挂在某个账号下（与 reading_passages / word_lists 对齐），
    //     否则全新空库还没有任何用户时根本 seed 不出来，
    //     而且清理用户数据时会把它当作"用户素材"级联删掉。
    makeListeningOwnerNullable();
    setSchemaVersion(4);
  }
}

// SQLite 无法直接去掉 NOT NULL，只能按官方 12 步法重建表。
// 注意：改 PRAGMA foreign_keys 必须在事务之外，且重建期间要关掉外键，
// 否则 DROP TABLE 会被子表的引用拦住。
function makeListeningOwnerNullable() {
  const cols = db.prepare('PRAGMA table_info(listening_materials)').all();
  if (!cols.length) return; // 表还没建，CREATE TABLE 里已经是可空定义
  const owner = cols.find((c) => c.name === 'owner_id');
  if (!owner || owner.notnull === 0) return; // 已经可空，幂等跳过

  const fkWasOn = db.pragma('foreign_keys', { simple: true });
  db.pragma('foreign_keys = OFF');
  try {
    db.exec(`
      BEGIN;
      CREATE TABLE listening_materials_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,                          -- NULL = 内置公共素材
        title TEXT NOT NULL,
        source_url TEXT,
        audio_path TEXT,
        accent TEXT,
        level TEXT,
        topic TEXT,
        transcript TEXT,
        translation TEXT,
        duration_sec REAL,
        segment_count INTEGER NOT NULL DEFAULT 0,
        is_public INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      );
      INSERT INTO listening_materials_new
        SELECT id, owner_id, title, source_url, audio_path, accent, level, topic,
               transcript, translation, duration_sec, segment_count, is_public,
               created_at, updated_at
          FROM listening_materials;
      DROP TABLE listening_materials;
      ALTER TABLE listening_materials_new RENAME TO listening_materials;
      CREATE INDEX IF NOT EXISTS idx_lmat_owner ON listening_materials(owner_id);
      COMMIT;
    `);
    const violations = db.pragma('foreign_key_check');
    if (violations.length) {
      console.warn(`[db] migrate: 重建 listening_materials 后外键检查有 ${violations.length} 处异常`);
    }
    console.log('[db] migrate: listening_materials.owner_id 已放宽为可空');
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* 事务可能已结束 */
    }
    throw e;
  } finally {
    if (fkWasOn) db.pragma('foreign_keys = ON');
  }
}

// 幂等加列：先查 pragma，缺了才 ALTER（SQLite 不支持 ADD COLUMN IF NOT EXISTS）
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.length) return; // 表还不存在，CREATE TABLE 会带上
  if (cols.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  console.log(`[db] migrate: ${table}.${column} added`);
}

export function getDb() {
  if (!db) initDb();
  return db;
}

// ============ 工具 ============

export function generateInviteCode() {
  return crypto.randomBytes(9).toString('base64url');
}

// 应用层调用：重算某个词的 fts_text
export function rebuildFtsForWord(id) {
  const row = db
    .prepare(
      `SELECT word, meaning_cn, definition_en, example_en, synonyms, topic, tags, word_forms
         FROM words WHERE id = ?`
    )
    .get(id);
  const tx = db.transaction((rid, text) => {
    db.prepare('DELETE FROM words_fts WHERE rowid = ?').run(rid);
    if (text) db.prepare('INSERT INTO words_fts(rowid, fts_text) VALUES (?, ?)').run(rid, text);
  });
  if (!row) {
    tx(id, null);
    return;
  }
  const text = tokenizeForFts(
    row.word,
    row.meaning_cn,
    row.definition_en,
    row.example_en,
    row.synonyms,
    row.topic,
    row.tags,
    row.word_forms
  );
  tx(id, text.slice(0, 8000));
}

function backfillWordsFtsIfNeeded() {
  try {
    const exists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='words_fts'`)
      .get();
    if (!exists) return;
    const ftsRows = db.prepare(`SELECT COUNT(*) AS n FROM words_fts`).get().n;
    const wordRows = db.prepare(`SELECT COUNT(*) AS n FROM words`).get().n;
    if (ftsRows === wordRows) return;
    db.exec(`DELETE FROM words_fts`);
    const all = db.prepare(`SELECT id FROM words`).all();
    for (const r of all) rebuildFtsForWord(r.id);
    if (all.length) console.log(`[db] words_fts backfill: ${all.length} words indexed`);
  } catch (e) {
    console.warn('[db] words_fts backfill skipped:', e.message);
  }
}

// 维护 word_lists.word_count（导入/增删后调用）
export function refreshWordListCounts() {
  db.prepare(
    `UPDATE word_lists SET word_count = (
       SELECT COUNT(*) FROM word_list_items WHERE list_id = word_lists.id
     )`
  ).run();
}
