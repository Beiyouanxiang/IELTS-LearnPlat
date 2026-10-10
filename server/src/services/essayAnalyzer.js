// 写作批改引擎（本地启发式，零依赖、零成本、不联网）
//
// 设计取舍：
//   参考项目里的 AI 批改都要联网调 LLM，但 LLM 只能给一个"感觉分"，无法稳定复现，
//   也没有可解释性。这里先用可解释的统计特征按雅思官方四个维度打分：
//     TR 任务回应 / CC 连贯衔接 / LR 词汇资源 / GRA 语法范围与准确性
//   每条扣分都能定位到具体句子，用户看得懂、可复现；有 API Key 时再叠加 LLM 做语义层增强。
//
// 注意：启发式只能覆盖"文本表层特征"，无法判断论点是否切题/是否有深度，
// 因此各维度上限压到 8.0，并在结果里明确标注这是"结构分"。

const MAX_BAND = 8.0;
const MIN_BAND = 3.0;

// 功能词（不参与内容词统计与高频重复判定）
const STOPWORDS = new Set(
  `a an the and or but nor so yet for of in on at to from by with without about into over after before
   between during through under above below up down out off again further then once here there when where
   why how all any both each few more most other some such no not only own same than too very can will
   just should now is are was were be been being am do does did doing have has had having i me my mine we
   us our ours you your yours he him his she her hers it its they them their theirs this that these those
   what which who whom whose if because as until while although though whereas since unless whether
   also however therefore thus moreover furthermore nevertheless nonetheless meanwhile besides
   would could may might must shall
   one two three first second third also many much every each both several`
    .split(/\s+/)
    .filter(Boolean)
);

// 衔接词（多词短语优先，避免 "in" 被当成 "in addition"）
const LINKERS = [
  'on the other hand', 'in addition', 'in contrast', 'as a result', 'for instance', 'for example',
  'in conclusion', 'to conclude', 'to sum up', 'in summary', 'in other words', 'that is to say',
  'due to', 'because of', 'in spite of', 'with regard to', 'in terms of', 'as well as', 'apart from',
  'rather than', 'in fact', 'by contrast', 'on balance', 'to some extent', 'in particular',
  'first of all', 'last but not least', 'in the long run', 'as far as', 'so that', 'even though',
  'however', 'moreover', 'furthermore', 'therefore', 'thus', 'consequently', 'nevertheless',
  'nonetheless', 'meanwhile', 'besides', 'additionally', 'similarly', 'likewise', 'overall',
  'firstly', 'secondly', 'thirdly', 'finally', 'hence', 'accordingly', 'admittedly', 'notably',
  'particularly', 'especially', 'regarding', 'conversely', 'alternatively', 'whereas', 'although',
  'though', 'while', 'despite',
];

// 从句 / 复杂句引导词
const SUBORDINATORS = [
  'that', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'although', 'though', 'even though', 'whereas', 'while', 'because', 'since', 'as',
  'if', 'unless', 'until', 'before', 'after', 'once', 'provided', 'so that', 'in order that',
  'whether', 'whoever', 'whatever', 'whenever', 'wherever', 'despite', 'in spite of',
];

const REFERENCING = ['this', 'these', 'those', 'such', 'it', 'they', 'their', 'its', 'the former', 'the latter'];

// Task 2 各话题的常见论证动词 / 话题词，用于粗略判断"是否回应题目"
function keywordsOf(text) {
  const toks = String(text || '')
    .toLowerCase()
    .match(/[a-z][a-z'-]{3,}/g) || [];
  const out = [];
  const seen = new Set();
  for (const t of toks) {
    const w = t.replace(/[-']/g, '');
    if (STOPWORDS.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z"“(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function words(text) {
  return String(text || '').toLowerCase().match(/[a-z][a-z'’-]*/g) || [];
}

function countOccurrences(haystackLower, needle) {
  if (!needle) return 0;
  const re = new RegExp(`(^|[^a-z])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'g');
  return (haystackLower.match(re) || []).length;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
function round05(n) {
  return Math.round(n * 2) / 2;
}
// 固定 3 位小数：避免 round1(x*100)/100 产生 0.6829999999999999 这类浮点尾巴
function round3(n) {
  return Math.round(n * 1000) / 1000;
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

export function bandLabel(band) {
  if (band >= 8) return '接近母语者水平';
  if (band >= 7) return '良好（多数院校要求线）';
  if (band >= 6) return '合格但有明显提升空间';
  if (band >= 5) return '基础薄弱，需要系统训练';
  return '需要从基础重建';
}

/**
 * 主入口
 * @param {object} opts
 * @param {string} opts.content 作文正文
 * @param {object} opts.prompt  { task_type, category, chart_type, prompt_en, min_words, minutes }
 * @param {Set<string>} [opts.knownLemmas] 词库 lemma 集合（用于统计雅思核心词命中）
 */
export function analyzeEssay({ content = '', prompt = {}, knownLemmas = null } = {}) {
  const raw = String(content || '');
  const paragraphs = raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const allWords = words(raw);
  const wc = allWords.length;
  const sentences = splitSentences(raw);
  const sentLens = sentences.map((s) => words(s).length).filter((n) => n > 0);

  const lower = ' ' + raw.toLowerCase().replace(/\s+/g, ' ') + ' ';
  const isTask1 = prompt.task_type === 'task1';
  const minWords = Number(prompt.min_words) || (isTask1 ? 150 : 250);

  // ---------- 通用统计 ----------
  const uniq = new Set(allWords);
  const contentWords = allWords.filter((w) => !STOPWORDS.has(w) && w.length > 2);
  const uniqContent = [...new Set(contentWords)];

  const linkersFound = [];
  for (const l of LINKERS) {
    const n = countOccurrences(lower, l);
    for (let i = 0; i < n; i++) linkersFound.push(l);
  }
  const uniqueLinkers = new Set(linkersFound);

  const subFound = [];
  for (const s of SUBORDINATORS) {
    const n = countOccurrences(lower, s);
    for (let i = 0; i < n; i++) subFound.push(s);
  }
  const sentencesWithSub = sentences.filter((s) => {
    const sl = ' ' + s.toLowerCase() + ' ';
    return SUBORDINATORS.some((k) => countOccurrences(sl, k) > 0);
  }).length;

  let refCount = 0;
  for (const r of REFERENCING) refCount += countOccurrences(lower, r);

  // 词频（内容词），用于查机械重复
  const freq = new Map();
  for (const w of contentWords) freq.set(w, (freq.get(w) || 0) + 1);
  const repeated = [...freq.entries()]
    .filter(([, n]) => n >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  // 长词比例（>=7 字母）作为"低频/学术词"的粗略代理
  const longUniq = uniqContent.filter((w) => w.length >= 7).length;
  const sophistication = uniqContent.length ? longUniq / uniqContent.length : 0;

  // 命中自有词库的雅思核心词
  let hits = [];
  if (knownLemmas && knownLemmas.size) {
    hits = uniqContent.filter((w) => knownLemmas.has(w)).slice(0, 40);
  }

  // 引用题目关键词程度（判断是否跑题）
  const promptKw = keywordsOf(prompt.prompt_en || '').filter((w) => w.length >= 4);
  const uniquePromptKw = [...new Set(promptKw)].slice(0, 12);
  const matchedKw = uniquePromptKw.filter((k) => {
    const stem = k.slice(0, Math.max(4, k.length - 2));
    return uniqContent.some((w) => w.startsWith(stem));
  });

  // ---------- 各类错误探测 ----------
  const issues = [];

  // a / an 误用
  const aBeforeVowel = (lower.match(/\ba\s+[aeiou]/g) || []).filter((s) => !/^a\s+(uni|use|user|one|eu)/.test(s));
  const anBeforeCons = (lower.match(/\ban\s+[bcdfghjklmnpqrstvwxyz]/g) || []).filter(
    (s) => !/^an\s+(hour|honest|honou?r|heir)/.test(s)
  );
  if (aBeforeVowel.length) {
    issues.push({ dim: 'gra', level: 'mid', text: `冠词 a/an 误用 ${aBeforeVowel.length} 处`, quote: aBeforeVowel[0].trim() });
  }
  if (anBeforeCons.length) {
    issues.push({ dim: 'gra', level: 'mid', text: `an 后接了辅音开头的词 ${anBeforeCons.length} 处`, quote: anBeforeCons[0].trim() });
  }

  // 小写 i 作主语
  const lowerI = (raw.match(/(^|[\s(,;])i([\s,.;:!?)]|$)/g) || []).length;
  if (lowerI > 0) {
    issues.push({ dim: 'gra', level: 'high', text: `主语 I 未大写 ${lowerI} 处`, quote: 'i' });
  }

  // 句号后未大写
  const noCapAfterPeriod = (raw.match(/[.!?]\s+[a-z]/g) || []).filter((s) => !/^[.!?]\s+(i|e\.g|i\.e)/.test(s));
  if (noCapAfterPeriod.length) {
    issues.push({
      dim: 'gra',
      level: 'low',
      text: `句号后首字母未大写 ${noCapAfterPeriod.length} 处`,
      quote: noCapAfterPeriod[0].trim(),
    });
  }

  // 重复词（the the）
  const dupWord = (lower.match(/\b([a-z]{2,})\s+\1\b/g) || []).filter((s) => !/^(that that|had had|very very)/.test(s));
  if (dupWord.length) {
    issues.push({ dim: 'gra', level: 'mid', text: `连续重复词 ${dupWord.length} 处`, quote: dupWord[0] });
  }

  // 逗号粘连（两个完整句被逗号连接）
  // 注意：句首连接副词（However, / Therefore, ...）是正确用法，不能算粘连
  const LINKER_ADVERBS = new Set([
    'however', 'therefore', 'consequently', 'moreover', 'furthermore', 'nevertheless', 'nonetheless',
    'similarly', 'additionally', 'thus', 'hence', 'meanwhile', 'overall', 'finally', 'instead',
    'admittedly', 'likewise', 'conversely', 'alternatively', 'besides', 'notably', 'particularly',
  ]);
  const commaSpliceHits = [...lower.matchAll(/([a-z]{3,}),\s+(this|these|it|they|there)\s+([a-z]+)/g)]
    .filter((mm) => !LINKER_ADVERBS.has(mm[1]))
    .map((mm) => mm[0].trim());
  if (commaSpliceHits.length >= 2) {
    issues.push({
      dim: 'gra',
      level: 'mid',
      text: `疑似逗号粘连（逗号连接两个完整句）${commaSpliceHits.length} 处`,
      quote: commaSpliceHits[0],
      hint: '改用分号、句号，或补一个连接词',
    });
  }

  // 空格 / 标点格式
  const doubleSpace = (raw.match(/ {2,}/g) || []).length;
  const spaceBeforePunct = (raw.match(/\s+[,.;:!?]/g) || []).length;
  if (doubleSpace + spaceBeforePunct > 3) {
    issues.push({
      dim: 'gra',
      level: 'low',
      text: `空格/标点格式问题 ${doubleSpace + spaceBeforePunct} 处`,
      quote: '注意标点前不留空格',
    });
  }

  // 段落过少
  if (wc > 80) {
    if (paragraphs.length < 3) {
      issues.push({ dim: 'cc', level: 'high', text: `只有 ${paragraphs.length} 段，建议 4-5 段`, quote: '结构' });
    } else if (paragraphs.length > 6) {
      issues.push({ dim: 'cc', level: 'low', text: `${paragraphs.length} 段偏多，论点可能被切碎`, quote: '结构' });
    }
  }

  // Task 1 缺 overview
  if (isTask1 && wc > 60) {
    const hasOverview = /overall|in general|generally speaking|it is clear that|in summary/i.test(raw);
    if (!hasOverview) {
      issues.push({
        dim: 'tr',
        level: 'high',
        text: 'Task 1 缺少总述句（overview）',
        quote: '建议在开头或第二段用 "Overall, ..." 概括主要趋势',
      });
    }
  }

  // 机械重复
  for (const r of repeated.slice(0, 3)) {
    if (r.count >= 6) {
      issues.push({
        dim: 'lr',
        level: 'mid',
        text: `「${r.word}」重复 ${r.count} 次`,
        quote: r.word,
        hint: '尝试用同义替换（名词/动词/形容词各备 2-3 个）',
      });
    }
  }

  // 连接词过密
  const per100 = wc ? (linkersFound.length / wc) * 100 : 0;
  if (per100 > 6) {
    issues.push({
      dim: 'cc',
      level: 'mid',
      text: `衔接词密度偏高（每 100 词 ${round1(per100)} 个）`,
      quote: '衔接词堆砌会显得机械，可改用代词、同义替换等隐性衔接',
    });
  }

  // 关键词覆盖不足（可能跑题）
  const kwCoverage = uniquePromptKw.length ? matchedKw.length / uniquePromptKw.length : 1;
  if (wc > 120 && uniquePromptKw.length >= 4 && kwCoverage < 0.25) {
    issues.push({
      dim: 'tr',
      level: 'high',
      text: '与题目的关键词重合度偏低，有偏题风险',
      quote: `题目核心词：${uniquePromptKw.slice(0, 6).join(', ')}`,
    });
  }

  // ---------- 四维打分 ----------
  const tr = scoreTR({ wc, minWords, paragraphs, kwCoverage, isTask1, raw });
  const cc = scoreCC({ wc, paragraphs, linkers: linkersFound, uniqueLinkers, refCount, per100 });
  const lr = scoreLR({ wc, uniq, allWords, uniqContent, sophistication, repeated, hits });
  const gra = scoreGRA({ sentences, sentLens, subFound, sentencesWithSub, issues, wc });

  const dimensionResults = [
    { key: 'tr', label: '任务回应', en: 'Task Response', ...tr },
    { key: 'cc', label: '连贯与衔接', en: 'Coherence & Cohesion', ...cc },
    { key: 'lr', label: '词汇资源', en: 'Lexical Resource', ...lr },
    { key: 'gra', label: '语法范围与准确性', en: 'Grammatical Range & Accuracy', ...gra },
  ];

  const overall = round05(clamp(mean([tr.band, cc.band, lr.band, gra.band]), MIN_BAND, MAX_BAND));

  // ---------- 建议（按影响排序） ----------
  const suggestions = buildSuggestions({
    dimensionResults,
    wc,
    minWords,
    paragraphs,
    per100,
    sophistication,
    issues,
    repeated,
    kwCoverage,
    isTask1,
  });

  return {
    engine: 'heuristic-v1',
    word_count: wc,
    paragraph_count: paragraphs.length,
    sentence_count: sentences.length,
    avg_sentence_length: sentLens.length ? round1(mean(sentLens)) : 0,
    sentence_length_std: round1(stdev(sentLens)),
    bands: {
      overall,
      tr: tr.band,
      cc: cc.band,
      lr: lr.band,
      gra: gra.band,
      label: bandLabel(overall),
    },
    dimensions: dimensionResults,
    stats: {
      unique_words: uniq.size,
      lexical_diversity: wc ? round3(uniq.size / wc) : 0,
      advanced_word_ratio: round1(sophistication * 100),
      linker_count: linkersFound.length,
      linker_per100: round1(per100),
      unique_linkers: [...uniqueLinkers],
      subordinator_count: subFound.length,
      complex_sentence_ratio: sentences.length ? round1((sentencesWithSub / sentences.length) * 100) : 0,
      referencing_count: refCount,
      keyword_coverage: round1(kwCoverage * 100),
      repeated_words: repeated,
      ielts_core_hits: hits.length,
      ielts_core_words: hits.slice(0, 20),
    },
    issues,
    suggestions,
  };
}

function scoreTR({ wc, minWords, paragraphs, kwCoverage, isTask1, raw }) {
  const notes = [];
  const ratio = minWords ? wc / minWords : 0;
  let band;
  if (ratio < 0.5) {
    band = 3.5;
    notes.push(`字数仅 ${wc}，不到要求的 ${Math.round(ratio * 100)}%，属于严重不足（未达基本要求）`);
  } else if (ratio < 0.7) {
    band = 4.5;
    notes.push(`字数 ${wc} / ${minWords}，明显偏少，论证难以展开`);
  } else if (ratio < 0.85) {
    band = 5.5;
    notes.push(`字数 ${wc} / ${minWords}，略少，建议写到 ${Math.round(minWords * 1.1)} 词以上`);
  } else if (ratio <= 1.6) {
    band = 6.5;
    notes.push(`字数 ${wc} / ${minWords}，符合长度要求`);
  } else {
    band = 6.0;
    notes.push(`字数 ${wc}，明显超长（>${Math.round(minWords * 1.6)}），考场上会挤占检查时间`);
  }

  if (paragraphs.length >= 4 && paragraphs.length <= 5) {
    band += 0.5;
    notes.push(`${paragraphs.length} 段结构：引言 + 主体 + 结论齐全`);
  } else if (paragraphs.length < 3 && wc > 80) {
    band -= 0.5;
    notes.push('段落数不足，建议拆成 4 段以体现论证层次');
  }

  if (kwCoverage >= 0.5) {
    band += 0.5;
    notes.push('题目关键词在文中得到充分回应');
  } else if (kwCoverage < 0.2) {
    band -= 0.5;
    notes.push('题目关键词回应不足，注意不要偏题');
  }

  if (isTask1) {
    const hasOverview = /overall|in general|generally speaking|it is clear that/i.test(raw);
    if (hasOverview) {
      band += 0.3;
      notes.push('包含总述句（overview），符合 Task 1 评分要求');
    } else {
      band -= 0.5;
      notes.push('缺少 overview，Task 1 会明显失分');
    }
  }

  return { band: round05(clamp(band, MIN_BAND, MAX_BAND)), notes };
}

function scoreCC({ wc, paragraphs, linkers, uniqueLinkers, refCount, per100 }) {
  const notes = [];
  let band;
  if (!wc) return { band: MIN_BAND, notes: ['正文为空'] };

  if (per100 < 0.5) {
    band = 4.5;
    notes.push('几乎看不到衔接词，句与句之间关系不清晰');
  } else if (per100 < 1.2) {
    band = 5.5;
    notes.push(`衔接词偏少（每 100 词 ${round1(per100)} 个）`);
  } else if (per100 <= 5) {
    band = 6.5;
    notes.push(`衔接词密度合适（每 100 词 ${round1(per100)} 个）`);
  } else {
    band = 6.0;
    notes.push(`衔接词偏多（每 100 词 ${round1(per100)} 个），有堆砌感`);
  }

  const variety = linkers.length ? uniqueLinkers.size / linkers.length : 0;
  if (linkers.length >= 3 && variety >= 0.65) {
    band += 0.5;
    notes.push(`衔接手段多样（${uniqueLinkers.size} 种不同表达），不是反复用同一个词`);
  } else if (linkers.length >= 4 && variety < 0.4) {
    band -= 0.5;
    notes.push('衔接词种类单一，基本在重复同一两个词');
  }

  const refPer100 = wc ? (refCount / wc) * 100 : 0;
  if (refPer100 >= 0.8) {
    band += 0.5;
    notes.push('使用了代词/指示词做指代衔接，句子之间更连贯');
  } else if (refPer100 < 0.3) {
    notes.push('指代衔接较少，可多用 this / these / such 回指前文');
  }

  // 段落长度均衡度
  if (paragraphs.length >= 3) {
    const lens = paragraphs.map((p) => words(p).length);
    const mx = Math.max(...lens);
    const mn = Math.min(...lens.filter((n) => n > 0));
    if (mx / Math.max(1, mn) > 5) {
      band -= 0.5;
      notes.push('段落长度严重不均，建议主体段篇幅大致相当');
    } else {
      notes.push('段落长度较均衡');
    }
  }

  return { band: round05(clamp(band, MIN_BAND, MAX_BAND)), notes };
}

function scoreLR({ wc, uniq, allWords, uniqContent, sophistication, repeated, hits }) {
  const notes = [];
  if (!wc) return { band: MIN_BAND, notes: ['正文为空'] };

  const rttr = uniq.size / Math.sqrt(wc); // Guiraud 指数，对长度不敏感
  let band = 5.5;

  if (rttr >= 7) {
    band = 7.0;
    notes.push(`词汇多样性高（Guiraud 指数 ${round1(rttr)}），用词不重复`);
  } else if (rttr >= 5.5) {
    band = 6.5;
    notes.push(`词汇多样性良好（Guiraud 指数 ${round1(rttr)}）`);
  } else if (rttr < 4.2) {
    band = 4.5;
    notes.push(`词汇重复率高（Guiraud 指数 ${round1(rttr)}），表达单一`);
  } else {
    band = 5.5;
    notes.push(`词汇多样性一般（Guiraud 指数 ${round1(rttr)}）`);
  }

  if (sophistication >= 0.42) {
    band += 0.5;
    notes.push(`低频/学术长词占比 ${round1(sophistication * 100)}%，词汇层次好`);
  } else if (sophistication >= 0.3) {
    notes.push(`低频/学术长词占比 ${round1(sophistication * 100)}%，处于合理区间`);
  } else {
    band -= 0.5;
    notes.push(`低频/学术长词仅占 ${round1(sophistication * 100)}%，用词偏基础（口语化）`);
  }

  if (hits && hits.length >= 12) {
    band += 0.3;
    notes.push(`命中雅思核心词 ${hits.length} 个，词汇储备契合考试范围`);
  } else if (hits && hits.length > 0) {
    notes.push(`命中雅思核心词 ${hits.length} 个，可再多用一些高频学术词`);
  }

  const worst = repeated?.[0];
  if (worst && worst.count >= 8) {
    band -= 0.5;
    notes.push(`「${worst.word}」出现 ${worst.count} 次，同义替换空间很大`);
  }

  return { band: round05(clamp(band, MIN_BAND, MAX_BAND)), notes };
}

function scoreGRA({ sentences, sentLens, subFound, sentencesWithSub, issues, wc }) {
  const notes = [];
  if (!wc) return { band: MIN_BAND, notes: ['正文为空'] };

  const avgLen = sentLens.length ? mean(sentLens) : 0;
  const sd = stdev(sentLens);
  let band = 5.5;

  if (avgLen >= 12 && avgLen <= 26) {
    band = 6.5;
    notes.push(`平均句长 ${round1(avgLen)} 词，句子长度适中`);
  } else if (avgLen < 10) {
    band = 5.0;
    notes.push(`平均句长仅 ${round1(avgLen)} 词，多为简单句，句式单一`);
  } else {
    band = 6.0;
    notes.push(`平均句长 ${round1(avgLen)} 词，长句偏多，注意可读性`);
  }

  if (sd >= 9) {
    band += 0.5;
    notes.push(`句长变化幅度大（标准差 ${round1(sd)}），长短句搭配得当`);
  } else if (sd >= 5) {
    band += 0.3;
    notes.push(`句长有一定变化（标准差 ${round1(sd)}）`);
  } else {
    band -= 0.3;
    notes.push('句长高度一致，读起来单调，建议穿插短句');
  }

  const complexRatio = sentences.length ? sentencesWithSub / sentences.length : 0;
  if (complexRatio >= 0.55) {
    band += 0.5;
    notes.push(`复合句占比 ${round1(complexRatio * 100)}%，从句使用充分`);
  } else if (complexRatio >= 0.3) {
    notes.push(`复合句占比 ${round1(complexRatio * 100)}%，有一定从句使用`);
  } else {
    band -= 0.5;
    notes.push(`复合句仅占 ${round1(complexRatio * 100)}%，几乎全是简单句，句式范围不足`);
  }

  const graIssues = issues.filter((i) => i.dim === 'gra');
  const penalty = graIssues.reduce((sum, i) => {
    const w = i.level === 'high' ? 0.4 : i.level === 'mid' ? 0.25 : 0.12;
    return sum + w;
  }, 0);
  if (penalty > 0) {
    band -= Math.min(1.5, penalty);
    notes.push(`检测到 ${graIssues.length} 类基础语法/格式问题，累计扣分 ${round1(Math.min(1.5, penalty))}`);
  } else {
    notes.push('未检测到冠词、大小写、重复词等表层语法错误');
  }

  return { band: round05(clamp(band, MIN_BAND, MAX_BAND)), notes };
}

function buildSuggestions({ dimensionResults, wc, minWords, paragraphs, per100, sophistication, issues, repeated, kwCoverage, isTask1 }) {
  const list = [];
  const sorted = [...dimensionResults].sort((a, b) => a.band - b.band);
  const weakest = sorted[0];

  list.push({
    priority: 'high',
    title: `优先提升「${weakest.label}」（当前 ${weakest.band}）`,
    detail: weakest.notes[0] || '这是四个维度中得分最低的一项，投入产出比最高。',
  });

  if (wc < minWords) {
    list.push({
      priority: 'high',
      title: `补足字数到 ${Math.round(minWords * 1.1)} 词以上`,
      detail: `当前 ${wc} 词。字数不足会直接压 TR 分；建议每个主体段按「论点 → 解释 → 例子 → 小结」四步展开。`,
    });
  }
  if (paragraphs.length < 4 && wc > 80) {
    list.push({
      priority: 'mid',
      title: '调整为 4 段式结构',
      detail: '引言（改写题目 + 亮明立场）→ 主体段 A → 主体段 B → 结论（重申立场，不复述原句）。',
    });
  }
  if (per100 < 1.2) {
    list.push({
      priority: 'mid',
      title: '补充逻辑衔接',
      detail: '每个主体段至少 2 个衔接表达，但不要每句都加。推荐：让步（Admittedly / While...）、因果（Consequently）、对比（By contrast）。',
    });
  }
  if (sophistication < 0.3) {
    list.push({
      priority: 'mid',
      title: '替换基础词',
      detail: '把 good / bad / important / many / get 这类词换成显著更学术的表达，例如 crucial / detrimental / substantial / obtain。',
    });
  }
  if (repeated?.[0]?.count >= 6) {
    list.push({
      priority: 'mid',
      title: `为「${repeated[0].word}」准备同义替换`,
      detail: `该词重复 ${repeated[0].count} 次。写前先列 3 个同义表达，行文时轮换使用。`,
    });
  }
  if (kwCoverage < 0.35 && !isTask1) {
    list.push({
      priority: 'high',
      title: '逐句回扣题目关键词',
      detail: '在引言和结论里各复现一次题目核心词，主体段每段至少出现一次，避免被判定偏题。',
    });
  }
  const graHigh = issues.filter((i) => i.dim === 'gra' && i.level !== 'low');
  if (graHigh.length) {
    list.push({
      priority: 'mid',
      title: '提交前留 3 分钟通读检查',
      detail: `重点检查：${graHigh.map((g) => g.text).join('；')}。这类错误扣分最亏，但最容易自查发现。`,
    });
  }
  list.push({
    priority: 'low',
    title: '下一步：对照范文找差距',
    detail: '读一遍同题范文，把它的衔接词、替换词、句式圈出来，抄写 2-3 句内化为自己的表达。',
  });

  return list.slice(0, 6);
}
