import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
const root = mkdtempSync(join(tmpdir(), 'ielts-isolated-review-'));
writeFileSync(join(root, 'bootstrap'), 'isolated-review-bootstrap-code');
const env = { ...process.env, PORT: '49307', DB_PATH: join(root, 'test.db'), UPLOAD_DIR: join(root, 'uploads'), NODE_ENV: 'production', JWT_SECRET: 'isolated-review-secret-not-production-123456789', OWNER_BOOTSTRAP_FILE: join(root, 'bootstrap'), BASE: 'http://127.0.0.1:49307', SMOKE_USER: 'reviewowner', SMOKE_PASS: 'testpass123' };
for (const script of ['scripts/seed-vocab.js', 'scripts/seed-wordbooks.js', 'scripts/seed-content.js', 'scripts/import-lexical-resources.mjs']) {
  const result = spawnSync(process.execPath, [script], { env, stdio: 'inherit' });
  if (result.status) process.exit(result.status);
}
const server = spawn(process.execPath, ['src/index.js'], { env, stdio: 'inherit' });
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { ready = (await fetch(env.BASE + '/health')).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('test server did not start');
  for (const script of ['scripts/review-security.mjs', 'scripts/smoke-test.mjs', 'scripts/review-vocab.mjs']) {
    const result = spawnSync(process.execPath, [script], { env, stdio: 'inherit' });
    if (result.status) throw new Error(script + ' failed');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { server.kill('SIGTERM'); }
