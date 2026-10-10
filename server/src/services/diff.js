// 听写比对：把用户输入与原文做词级对齐，输出差异与得分
//
// 归一化策略：转小写、去掉标点、把数字与缩写等统一空格。
// 对齐算法：LCS（最长公共子序列）→ 标记 equal / missing / extra，
// 得分 = 2*LCS / (len(ref) + len(hyp))，即 F1 式的词级准确率。

const PUNCT = /[^\p{L}\p{N}'\s-]/gu;

export function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(PUNCT, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitWords(s) {
  const n = normalizeText(s);
  return n ? n.split(' ') : [];
}

function lcsMatrix(a, b) {
  const m = a.length;
  const n = b.length;
  // 只需保留上一行做回溯时需要完整表，这里用扁平数组
  const dp = new Uint16Array((m + 1) * (n + 1));
  const at = (i, j) => i * (n + 1) + j;
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[at(i, j)] =
        a[i] === b[j] ? dp[at(i + 1, j + 1)] + 1 : Math.max(dp[at(i + 1, j)], dp[at(i, j + 1)]);
    }
  }
  return { dp, at, m, n };
}

export function diffWords(reference, hypothesis) {
  const a = splitWords(reference);
  const b = splitWords(hypothesis);
  const { dp, at, m, n } = lcsMatrix(a, b);

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', ref: a[i] });
      i++;
      j++;
    } else if (dp[at(i + 1, j)] >= dp[at(i, j + 1)]) {
      ops.push({ type: 'missing', ref: a[i] });
      i++;
    } else {
      ops.push({ type: 'extra', hyp: b[j] });
      j++;
    }
  }
  while (i < m) ops.push({ type: 'missing', ref: a[i++] });
  while (j < n) ops.push({ type: 'extra', hyp: b[j++] });

  const lcs = dp[at(0, 0)];
  const score = a.length + b.length > 0 ? (2 * lcs) / (a.length + b.length) : 0;

  return {
    ops,
    ref_word_count: a.length,
    hyp_word_count: b.length,
    lcs,
    missing: ops.filter((o) => o.type === 'missing').length,
    extra: ops.filter((o) => o.type === 'extra').length,
    score: Number(score.toFixed(4)),
  };
}

// 按句子切分听力文本：优先句末标点，其次将过长句按从句标点断开
export function splitSentences(text) {
  const raw = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];
  const out = [];
  for (const para of raw.split(/\n{1,}/)) {
    const p = para.trim();
    if (!p) continue;
    const parts = p.match(/[^.!?。！？]+[.!?。！？]*/g) || [p];
    for (const s of parts) {
      const t = s.trim();
      if (!t) continue;
      // 过长的句子（>220 字符）尝试在逗号处再切
      if (t.length > 220) {
        const sub = t.split(/(?<=[,;:])\s+/);
        let buf = '';
        for (const piece of sub) {
          if ((buf + ' ' + piece).trim().length > 220 && buf) {
            out.push(buf.trim());
            buf = piece;
          } else {
            buf = (buf ? buf + ' ' : '') + piece;
          }
        }
        if (buf.trim()) out.push(buf.trim());
      } else {
        out.push(t);
      }
    }
  }
  return out;
}
