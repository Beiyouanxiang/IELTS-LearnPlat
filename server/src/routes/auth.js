import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb, generateInviteCode } from '../db.js';
import { signToken, authRequired, roleRequired } from '../auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

const USERNAME_RE = /^[A-Za-z0-9_]{3,32}$/;
const MIN_PASSWORD = 8;
const INVITE_ONLY = String(process.env.INVITE_ONLY ?? 'true') !== 'false';

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    role: u.role,
    llm_provider: u.llm_provider,
    daily_goal_words: u.daily_goal_words,
    created_at: u.created_at,
  };
}

// 首个注册的用户自动成为 owner（并自动得到一个可用于邀请朋友的邀请码）
router.post('/register', authLimiter, (req, res) => {
  const { username, password, invite_code, display_name } = req.body || {};
  if (!USERNAME_RE.test(String(username || ''))) {
    return res.status(400).json({ error: '用户名需为 3-32 位字母、数字或下划线' });
  }
  if (String(password || '').length < MIN_PASSWORD) {
    return res.status(400).json({ error: `密码至少 ${MIN_PASSWORD} 位` });
  }

  const db = getDb();
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: '该用户名已被占用' });

  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const isFirstUser = userCount === 0;

  // 非首个用户：按开关校验邀请码
  let invite = null;
  if (!isFirstUser && INVITE_ONLY) {
    if (!invite_code) return res.status(400).json({ error: '需要邀请码才能注册' });
    invite = db.prepare('SELECT * FROM invite_codes WHERE code = ?').get(invite_code);
    if (!invite) return res.status(400).json({ error: '邀请码无效' });
    if (invite.used_by) return res.status(400).json({ error: '该邀请码已被使用' });
  }

  const hash = bcrypt.hashSync(String(password), 10);
  const role = isFirstUser ? 'owner' : 'member';

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO users (username, password_hash, display_name, role)
         VALUES (?, ?, ?, ?)`
      )
      .run(username, hash, display_name || username, role);
    const userId = info.lastInsertRowid;

    if (invite) {
      db.prepare(`UPDATE invite_codes SET used_by = ?, used_at = datetime('now') WHERE id = ?`).run(
        userId,
        invite.id
      );
    }
    // 首个用户顺手发一个邀请码
    let myInvite = null;
    if (isFirstUser) {
      myInvite = generateInviteCode();
      db.prepare(`INSERT INTO invite_codes (code, note, created_by) VALUES (?, ?, ?)`).run(
        myInvite,
        '初始邀请码',
        userId
      );
    }
    return { userId, myInvite };
  });

  const { userId, myInvite } = tx();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.status(201).json({ token, user: publicUser(user), first_invite: myInvite });
});

router.post('/login', authLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username || ''));
  // 统一错误信息，避免用户名枚举
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token, user: publicUser(user) });
});

router.get('/me', authRequired, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: '用户不存在' });
  res.json({ user: publicUser(user) });
});

// 更新个人偏好（当前用于切换 LLM provider 与每日目标）
router.patch('/me', authRequired, (req, res) => {
  const db = getDb();
  const { display_name, llm_provider, daily_goal_words } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: '用户不存在' });

  db.prepare(
    `UPDATE users SET display_name = ?, llm_provider = ?, daily_goal_words = ? WHERE id = ?`
  ).run(
    display_name ?? user.display_name,
    llm_provider ?? user.llm_provider,
    Number.isFinite(Number(daily_goal_words)) ? Number(daily_goal_words) : user.daily_goal_words,
    user.id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({ user: publicUser(updated) });
});

// ---- 邀请码管理（owner / admin）----
router.get('/invites', authRequired, roleRequired('admin'), (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ic.*, u.username AS used_by_name
         FROM invite_codes ic
         LEFT JOIN users u ON u.id = ic.used_by
        ORDER BY ic.created_at DESC
        LIMIT 200`
    )
    .all();
  res.json({ invites: rows });
});

router.post('/invites', authRequired, roleRequired('admin'), (req, res) => {
  const db = getDb();
  const note = String(req.body?.note || '').slice(0, 100);
  const code = generateInviteCode();
  db.prepare(`INSERT INTO invite_codes (code, note, created_by) VALUES (?, ?, ?)`).run(
    code,
    note,
    req.user.id
  );
  res.status(201).json({ code, note });
});

export default router;
