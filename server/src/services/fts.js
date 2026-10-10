// 全文检索文本处理
//
// CJK 坑：FTS5 的 unicode61 tokenizer 把连续中文当作一个整 token，
// 于是搜「环境」匹配不到「环境保护」。
// 解法（沿用 Bookmark-Page 的成熟做法）：应用层预处理——
//   英文/数字按词保留，中文逐字拆开，全部用空格分隔后写进 FTS 索引。
// 索引侧与查询侧必须用同一套规则，否则匹配不上。

const HAN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

export function tokenizeForFts(...parts) {
  const raw = parts.filter(Boolean).join(' ');
  const segs = raw.split(/[^\p{Script=Han}\p{L}\p{N}+#]+/u).filter(Boolean);
  const out = [];
  for (const seg of segs) {
    let buf = '';
    for (const ch of seg) {
      if (HAN.test(ch)) {
        if (buf) {
          out.push(buf);
          buf = '';
        }
        out.push(ch);
      } else {
        buf += ch;
      }
    }
    if (buf) out.push(buf);
  }
  return out.join(' ');
}

// 把用户输入转成 FTS5 查询串：每个 token 加双引号 + 前缀通配
export function buildFtsQuery(input) {
  const tokens = tokenizeForFts(input).split(' ').filter(Boolean);
  if (!tokens.length) return null;
  return tokens.map((t) => `"${t.replace(/"/g, '""')}"*`).join(' AND ');
}
