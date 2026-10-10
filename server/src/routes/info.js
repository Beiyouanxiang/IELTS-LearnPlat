import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from '../db.js';
import { getSecretStrength } from '../auth.js';
import { listProviders } from '../services/llm.js';
import { authRequired, roleRequired } from '../auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')
);

// 不暴露密钥 / 主机名 / 文件路径
router.get('/', (req, res) => {
  const db = getDb();
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    name: 'IELTS Workbench',
    version: pkg.version,
    status: 'ok',
    boot_at: global.__BOOT_AT__ || null,
    features: [
      '词汇闪卡 SRS',
      '三题型测验',
      '错题本',
      '听力精听与题型练习',
      '写作四维批改',
      '阅读题型训练',
      '学习计划与能力报告',
      'AI 增强（可选）',
    ],
    stats: {
      words: count('SELECT COUNT(*) AS n FROM words'),
      users: count('SELECT COUNT(*) AS n FROM users'),
      lists: count('SELECT COUNT(*) AS n FROM word_lists'),
      writing_prompts: count('SELECT COUNT(*) AS n FROM writing_prompts'),
      model_essays: count('SELECT COUNT(*) AS n FROM model_essays'),
      reading_passages: count('SELECT COUNT(*) AS n FROM reading_passages'),
      reading_questions: count('SELECT COUNT(*) AS n FROM reading_questions'),
      listening_materials: count('SELECT COUNT(*) AS n FROM listening_materials'),
    },
    schema_version: db.prepare('SELECT version FROM schema_version ORDER BY id DESC LIMIT 1').get()?.version || 0,
    llm: listProviders(),
  });
});

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// 仅管理员可见的安全自检
router.get('/security', authRequired, roleRequired('admin'), (req, res) => {
  res.json({
    jwt: getSecretStrength(),
    invite_only: String(process.env.INVITE_ONLY ?? 'true') !== 'false',
    node_env: process.env.NODE_ENV || 'development',
  });
});

export default router;
