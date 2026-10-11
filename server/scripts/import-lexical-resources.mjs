import 'dotenv/config';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { getDb } from '../src/db.js';
const db = getDb();
const find = db.prepare('SELECT id FROM words WHERE lemma=?');
const save = db.prepare(`INSERT INTO word_resources (word_id,data) VALUES (?,?)
  ON CONFLICT(word_id) DO UPDATE SET data=excluded.data, updated_at=datetime('now')`);
const input = fileURLToPath(new URL('./data/lexical-resources.jsonl', import.meta.url));
let count = 0;
for await (const line of createInterface({ input: createReadStream(input), crlfDelay: Infinity })) {
  const resource = JSON.parse(line);
  const word = find.get(resource.lemma);
  if (!word) continue;
  save.run(word.id, JSON.stringify(resource));
  count++;
}
console.log(`已补充 ${count} 个词的开放词典及例句，用户学习进度未修改。`);
