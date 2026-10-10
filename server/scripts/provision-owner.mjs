// 只在生产服务器运行；不输出初始化邀请码。
import fs from 'node:fs';
import crypto from 'node:crypto';
const codeFile = new URL('../owner-bootstrap-code', import.meta.url);
const envFile = new URL('../.env', import.meta.url);
if (!fs.existsSync(codeFile)) fs.writeFileSync(codeFile, crypto.randomBytes(24).toString('hex') + '\n', { mode: 0o600, flag: 'wx' });
fs.chmodSync(codeFile, 0o600);
let env = fs.readFileSync(envFile, 'utf8');
if (!/^OWNER_BOOTSTRAP_FILE=/m.test(env)) env += '\nOWNER_BOOTSTRAP_FILE=./owner-bootstrap-code\n';
fs.writeFileSync(envFile, env, { mode: 0o600 });
fs.chmodSync(envFile, 0o600);
console.log('管理员初始化邀请码已配置，未输出内容。');
