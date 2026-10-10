// 基于 SQLite 的滑动窗口限流（多进程安全，不需要额外内存存储）
// 用法：rateLimit({ windowMs: 60_000, max: 30, key: (req) => req.ip })
import { getDb } from '../db.js';

export function rateLimit({ windowMs = 60_000, max = 60, key, message } = {}) {
  return (req, res, next) => {
    try {
      const db = getDb();
      const k = String((key ? key(req) : req.ip) || 'anon');
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;

      const tx = db.transaction(() => {
        db.prepare(
          `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
           ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1`
        ).run(k, windowStart);
        return db
          .prepare(`SELECT count FROM rate_limits WHERE key = ? AND window_start = ?`)
          .get(k, windowStart).count;
      });
      const count = tx();

      // 顺手清理过期的窗口（低概率触发，避免无限增长）
      if (Math.random() < 0.02) {
        db.prepare(`DELETE FROM rate_limits WHERE window_start < ?`).run(now - windowMs * 5);
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      if (count > max) {
        res.setHeader('Retry-After', Math.ceil((windowStart + windowMs - now) / 1000));
        return res.status(429).json({ error: message || '请求过于频繁，请稍后再试' });
      }
      next();
    } catch (e) {
      // 限流器故障不应阻断业务
      console.warn('[rateLimit] skipped:', e.message);
      next();
    }
  };
}

export const globalLimiter = rateLimit({
  key: (req) => `global:${req.ip}`,
  windowMs: 60_000,
  max: 300,
  message: '请求过于频繁，请稍后再试',
});

export const authLimiter = rateLimit({
  key: (req) => `auth:${req.ip}`,
  windowMs: 15 * 60_000,
  max: 20,
  message: '登录/注册尝试过于频繁，请 15 分钟后再试',
});

export const aiLimiter = rateLimit({
  key: (req) => `ai:${req.user?.id || req.ip}`,
  windowMs: 60_000,
  max: 20,
  message: 'AI 调用过于频繁，请稍后再试',
});
