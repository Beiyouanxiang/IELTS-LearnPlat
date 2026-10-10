// JWT 认证（沿用 Bookmark-Page 已过安全审查的实现）
//
// 安全要求：
//   - JWT_SECRET 必须存在且 >=32 字节随机
//   - 已知默认值 'dev-secret-change-me' 任何攻击者都能伪造 token
//   - 生产环境缺/默认/短 → fail-fast（process.exit(1)）
//   - 开发环境只 warn
//
// 生成强 secret：openssl rand -hex 32
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { getDb } from './db.js';

const PROVIDED = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';
export const DEFAULT_DEV_SECRET = 'dev-secret-change-me';
const MIN_LENGTH = 32;

function failFast(msg) {
  console.error(`[auth] FATAL: ${msg}`);
  console.error('[auth] 解决方法：设置 JWT_SECRET 环境变量为至少 32 字节的随机串');
  console.error('[auth] 生成命令：openssl rand -hex 32');
  if (NODE_ENV === 'production') process.exit(1);
}

let SECRET;
let secretSource = 'unknown';

if (!PROVIDED) {
  if (NODE_ENV === 'production') {
    failFast('JWT_SECRET 环境变量未设置');
    SECRET = crypto.randomBytes(32).toString('hex');
  } else {
    console.warn('[auth] WARN: JWT_SECRET 未设置；本次进程使用临时随机密钥（重启后所有 token 失效）');
    SECRET = crypto.randomBytes(32).toString('hex');
    secretSource = 'ephemeral_random';
  }
} else if (PROVIDED === DEFAULT_DEV_SECRET) {
  if (NODE_ENV === 'production') {
    failFast('JWT_SECRET 使用了源码默认字符串，攻击者可伪造 token');
    SECRET = crypto.randomBytes(32).toString('hex');
  } else {
    console.warn('[auth] WARN: JWT_SECRET 是源码中的默认值——dev-only，绝不能用于生产');
    SECRET = PROVIDED;
    secretSource = 'default_dev';
  }
} else if (PROVIDED.length < MIN_LENGTH) {
  if (NODE_ENV === 'production') {
    failFast(`JWT_SECRET 长度 ${PROVIDED.length} < 推荐 ${MIN_LENGTH} 字节`);
    SECRET = crypto.randomBytes(32).toString('hex');
  } else {
    console.warn(`[auth] WARN: JWT_SECRET 仅 ${PROVIDED.length} 字符，推荐 >= ${MIN_LENGTH}；生产环境会拒绝启动`);
    SECRET = PROVIDED;
    secretSource = 'short_user';
  }
} else {
  SECRET = PROVIDED;
  secretSource = 'user';
}

console.log(`[auth] JWT secret 已加载 (source=${secretSource}, length=${SECRET.length}, env=${NODE_ENV})`);

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: '未登录或登录已过期' });
  const user = getDb().prepare('SELECT id, username, role FROM users WHERE id = ?').get(payload.id);
  if (!user) return res.status(401).json({ error: '用户不存在或登录已失效' });
  req.user = user;
  next();
}

// 角色门槛：role 层级 owner > admin > member
const ROLE_LEVEL = { member: 1, admin: 2, owner: 3 };

export function roleRequired(minRole) {
  return (req, res, next) => {
    const lvl = ROLE_LEVEL[req.user?.role] || 0;
    if (lvl < (ROLE_LEVEL[minRole] || 99)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

export function getSecretStrength() {
  return {
    source: secretSource,
    length: SECRET.length,
    is_default: SECRET === DEFAULT_DEV_SECRET,
    is_strong: SECRET.length >= MIN_LENGTH && SECRET !== DEFAULT_DEV_SECRET,
  };
}
