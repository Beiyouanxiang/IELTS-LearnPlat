// 清空「用户产生的数据」，保留全部内容库（词库 / 题库 / 阅读文章 / 听力素材 / 范文）。
//
// 用途：把一台开发机上跑过的数据库搬到生产时，去掉测试账号与演示数据，
//       让线上第一个注册的人重新成为 owner。
//
// 用法：
//   node scripts/reset-user-data.js          # 只预览会删什么，不动数据
//   node scripts/reset-user-data.js --yes    # 真正执行
//
// 注意：这是不可逆操作，执行前请先备份 data/ielts.db{,-wal,-shm}。
import 'dotenv/config';
import { initDb } from '../src/db.js';

const db = initDb();
const confirmed = process.argv.includes('--yes');

// 顺序：先删子表，再删 users（虽然外键都是 ON DELETE CASCADE，
// 显式按依赖顺序删除，即使 foreign_keys 被关掉也不会留下孤儿行）
const USER_TABLES = [
  ['user_word_progress', '单词进度（含星标 / 对错计数）'],
  ['study_logs', '学习事件流'],
  ['listening_attempts', '听力作答记录'],
  ['writing_essays', '我的作文'],
  ['reading_attempts', '阅读作答记录'],
  ['user_goals', '学习目标'],
];

// 内容库里 owner_id 指向用户的（种子数据 owner_id 为 NULL，不会被动到）
const OWNED_CONTENT = [
  ['word_lists', '用户自建词库'],
  ['listening_materials', '用户上传素材'],
  ['reading_passages', '用户自建文章'],
];

const CONTENT_TABLES = [
  'words',
  'word_lists',
  'word_list_items',
  'writing_prompts',
  'model_essays',
  'reading_passages',
  'reading_questions',
  'listening_materials',
  'listening_segments',
  'listening_questions',
];

const count = (t, where = '') =>
  db.prepare(`SELECT COUNT(*) AS c FROM ${t}${where ? ` WHERE ${where}` : ''}`).get().c;

const fkOn = db.pragma('foreign_keys', { simple: true });

console.log('=========== 当前数据 ===========');
console.log('-- 将被删除（用户数据）--');
let totalUser = 0;
for (const [t, label] of USER_TABLES) {
  const n = count(t);
  totalUser += n;
  console.log(`  ${String(n).padStart(7)}  ${t.padEnd(22)} ${label}`);
}
for (const [t, label] of OWNED_CONTENT) {
  const n = count(t, 'owner_id IS NOT NULL');
  totalUser += n;
  console.log(`  ${String(n).padStart(7)}  ${t.padEnd(22)} ${label}（owner_id 非空部分）`);
}
{
  const n = count('invite_codes');
  totalUser += n;
  console.log(`  ${String(n).padStart(7)}  ${'invite_codes'.padEnd(22)} 邀请码`);
}
{
  const n = count('users');
  totalUser += n;
  console.log(`  ${String(n).padStart(7)}  ${'users'.padEnd(22)} 账号`);
}

console.log('-- 将保留（内容库）--');
for (const t of CONTENT_TABLES) {
  console.log(`  ${String(count(t)).padStart(7)}  ${t}`);
}

if (!confirmed) {
  console.log('\n以上为预览。确认无误后加 --yes 实际执行：');
  console.log('  node scripts/reset-user-data.js --yes');
  process.exit(0);
}

if (totalUser === 0) {
  console.log('\n没有需要清理的用户数据，未做任何改动。');
  process.exit(0);
}

console.log(`\n开始清理（foreign_keys=${fkOn ? 'ON' : 'OFF'}）…`);
const wipe = db.transaction(() => {
  const done = [];
  for (const [t] of USER_TABLES) {
    const info = db.prepare(`DELETE FROM ${t}`).run();
    done.push([t, info.changes]);
  }
  for (const [t] of OWNED_CONTENT) {
    const info = db.prepare(`DELETE FROM ${t} WHERE owner_id IS NOT NULL`).run();
    done.push([`${t} (owner_id NOT NULL)`, info.changes]);
  }
  const ic = db.prepare('DELETE FROM invite_codes').run();
  done.push(['invite_codes', ic.changes]);
  const u = db.prepare('DELETE FROM users').run();
  done.push(['users', u.changes]);
  return done;
});

for (const [t, n] of wipe()) console.log(`  删除 ${String(n).padStart(6)} 行  ${t}`);

// 自增 id 一起复位，否则线上第一个注册的人会拿到 id=4 这种"看起来很脏"的编号。
// 必须在所有引用这些行的数据都删干净之后做（上面已删除，且都带 FK 级联）。
const seqTables = [
  ...USER_TABLES.map(([t]) => t),
  ...OWNED_CONTENT.map(([t]) => t),
  'invite_codes',
  'users',
];
const hasSeqTable = db
  .prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'`)
  .get();
let seqReset = 0;
if (hasSeqTable) {
  seqReset = db.transaction(() => {
    const stmt = db.prepare('DELETE FROM sqlite_sequence WHERE name = ?');
    let n = 0;
    for (const t of seqTables) n += stmt.run(t).changes;
    return n;
  })();
}
if (seqReset) console.log(`  复位 ${seqReset} 张表的自增计数（sqlite_sequence）`);

console.log('\n=========== 清理后 ===========');
for (const t of CONTENT_TABLES) {
  console.log(`  ${String(count(t)).padStart(7)}  ${t}`);
}
console.log(`  ${String(count('users')).padStart(7)}  users  ← 应为 0，线上首个注册者将自动成为 owner`);

db.close();
console.log('\n完成。');
