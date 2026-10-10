// 必须在其它模块之前加载 .env：
// auth.js / llm.js 在模块顶层读取 process.env，晚加载会拿到 undefined。
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb } from './db.js';
import { getDb } from './db.js';
import { authRequired } from './auth.js';
import { globalLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import infoRoutes from './routes/info.js';
import vocabRoutes from './routes/vocab.js';
import listeningRoutes from './routes/listening.js';
import writingRoutes from './routes/writing.js';
import readingRoutes from './routes/reading.js';
import planRoutes from './routes/plan.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3007;
const NODE_ENV = process.env.NODE_ENV || 'development';

global.__BOOT_AT__ = new Date().toISOString();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ---- CORS：白名单，不含 * ----
const allowed = (process.env.CORS_ORIGINS || 'http://localhost:5180')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // 同源 / curl
      if (allowed.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use('/api', globalLimiter);

// ---- 安全响应头 ----
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ---- 上传的音频：只读静态托管，强制 nosniff，禁止按 HTML 执行 ----
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use(
  '/uploads',
  authRequired,
  (req, res, next) => {
    const filename = req.path.slice(1);
    if (!filename || filename !== path.basename(filename)) return res.sendStatus(404);
    const material = getDb().prepare('SELECT owner_id, is_public FROM listening_materials WHERE audio_path = ?').get(`uploads/${filename}`);
    if (!material || (material.owner_id !== req.user.id && material.is_public !== 1)) return res.sendStatus(404);
    next();
  },
  express.static(UPLOAD_DIR, {
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
    },
    fallthrough: false,
  })
);

// ---- 路由 ----
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/info', infoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/listening', listeningRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/plan', planRoutes);

// ---- 生产环境托管前端构建产物 ----
const webDist = path.resolve(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api|\/uploads|\/health).*/, (req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

// ---- 兜底 404 与错误处理 ----
app.use((req, res) => res.status(404).json({ error: '接口不存在' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  res.status(status).json({ error: err.message || '服务器内部错误' });
});

initDb();

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[ielts-workbench] listening on http://127.0.0.1:${PORT} (${NODE_ENV})`);
});

function shutdown(sig) {
  console.log(`[ielts-workbench] ${sig} received, closing...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
