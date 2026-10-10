import 'dotenv/config';
import { initDb, getDb, rebuildFtsForWord, refreshWordListCounts } from '../src/db.js';

// 示例种子词：雅思高频学术词（仅用于跑通功能，正式词表请用 scripts/import-ecdict.js 导入 ECDICT）
// 字段说明：cn=中文释义 ex=英文例句 exc=例句中译 syn=同义替换（雅思阅读/写作高频考点）
const SEED_WORDS = [
  { word: 'abundant', uk: '/əˈbʌndənt/', pos: 'adj.', cn: '大量的；丰富的', ex: 'The region has abundant natural resources.', exc: '该地区自然资源丰富。', syn: ['plentiful', 'ample', 'copious'], topic: 'environment', diff: 3 },
  { word: 'accelerate', uk: '/əkˈseləreɪt/', pos: 'v.', cn: '加速；促进', ex: 'Technology has accelerated the pace of change.', exc: '技术加快了变革的步伐。', syn: ['speed up', 'hasten', 'expedite'], topic: 'technology', diff: 3 },
  { word: 'accommodate', uk: '/əˈkɒmədeɪt/', pos: 'v.', cn: '容纳；适应；提供住宿', ex: 'The city must accommodate a growing population.', exc: '这座城市必须容纳不断增长的人口。', syn: ['house', 'adapt', 'cater for'], topic: 'society', diff: 4 },
  { word: 'acknowledge', uk: '/əkˈnɒlɪdʒ/', pos: 'v.', cn: '承认；认可', ex: 'We should acknowledge the limits of the study.', exc: '我们应当承认这项研究的局限。', syn: ['admit', 'recognise', 'concede'], topic: 'academic', diff: 3 },
  { word: 'adequate', uk: '/ˈædɪkwət/', pos: 'adj.', cn: '足够的；适当的', ex: 'Many schools lack adequate funding.', exc: '许多学校缺乏足够的资金。', syn: ['sufficient', 'enough', 'satisfactory'], topic: 'education', diff: 3 },
  { word: 'advocate', uk: '/ˈædvəkeɪt/', pos: 'v./n.', cn: '提倡；拥护者', ex: 'Some experts advocate stricter environmental laws.', exc: '一些专家提倡更严格的环保法律。', syn: ['recommend', 'support', 'champion'], topic: 'society', diff: 4 },
  { word: 'alleviate', uk: '/əˈliːvieɪt/', pos: 'v.', cn: '减轻；缓和', ex: 'Public transport can alleviate traffic congestion.', exc: '公共交通可以缓解交通拥堵。', syn: ['ease', 'relieve', 'mitigate'], topic: 'society', diff: 5 },
  { word: 'ambiguous', uk: '/æmˈbɪɡjuəs/', pos: 'adj.', cn: '模棱两可的；含糊的', ex: 'The wording of the question is ambiguous.', exc: '这个问题的措辞含糊不清。', syn: ['vague', 'unclear', 'equivocal'], topic: 'academic', diff: 5 },
  { word: 'assess', uk: '/əˈses/', pos: 'v.', cn: '评估；估价', ex: 'Teachers assess students through both exams and projects.', exc: '教师通过考试和项目来评估学生。', syn: ['evaluate', 'appraise', 'gauge'], topic: 'education', diff: 3 },
  { word: 'attain', uk: '/əˈteɪn/', pos: 'v.', cn: '达到；获得', ex: 'Few students attain a band score of 8.', exc: '很少有学生能达到 8 分。', syn: ['achieve', 'reach', 'accomplish'], topic: 'education', diff: 4 },
  { word: 'beneficial', uk: '/ˌbenɪˈfɪʃl/', pos: 'adj.', cn: '有益的', ex: 'Regular exercise is beneficial to mental health.', exc: '规律运动有益于心理健康。', syn: ['advantageous', 'favourable', 'helpful'], topic: 'health', diff: 3 },
  { word: 'coherent', uk: '/kəʊˈhɪərənt/', pos: 'adj.', cn: '连贯的；条理清晰的', ex: 'A good essay presents a coherent argument.', exc: '一篇好文章要呈现连贯的论证。', syn: ['logical', 'consistent', 'well-organised'], topic: 'academic', diff: 4 },
  { word: 'compelling', uk: '/kəmˈpelɪŋ/', pos: 'adj.', cn: '令人信服的；引人入胜的', ex: 'The report offers compelling evidence.', exc: '这份报告提供了令人信服的证据。', syn: ['convincing', 'persuasive', 'gripping'], topic: 'academic', diff: 4 },
  { word: 'comprehensive', uk: '/ˌkɒmprɪˈhensɪv/', pos: 'adj.', cn: '全面的；综合的', ex: 'The government needs a comprehensive strategy.', exc: '政府需要一套全面的战略。', syn: ['thorough', 'all-round', 'extensive'], topic: 'society', diff: 4 },
  { word: 'conceive', uk: '/kənˈsiːv/', pos: 'v.', cn: '构想；设想', ex: 'It is hard to conceive of a world without the internet.', exc: '很难想象一个没有互联网的世界。', syn: ['imagine', 'envisage', 'formulate'], topic: 'academic', diff: 5 },
  { word: 'concise', uk: '/kənˈsaɪs/', pos: 'adj.', cn: '简明的；简洁的', ex: 'Keep your answers concise and relevant.', exc: '回答要简洁切题。', syn: ['succinct', 'brief', 'compact'], topic: 'academic', diff: 4 },
  { word: 'consensus', uk: '/kənˈsensəs/', pos: 'n.', cn: '共识；一致意见', ex: 'There is a growing consensus among scientists.', exc: '科学家之间正在形成越来越多的共识。', syn: ['agreement', 'accord', 'common ground'], topic: 'academic', diff: 5 },
  { word: 'constitute', uk: '/ˈkɒnstɪtjuːt/', pos: 'v.', cn: '构成；组成', ex: 'Women constitute half of the workforce.', exc: '女性占劳动力的一半。', syn: ['compose', 'form', 'make up'], topic: 'society', diff: 5 },
  { word: 'constraint', uk: '/kənˈstreɪnt/', pos: 'n.', cn: '限制；约束', ex: 'Time constraints often affect exam performance.', exc: '时间限制常常影响考试表现。', syn: ['restriction', 'limitation', 'curb'], topic: 'academic', diff: 5 },
  { word: 'contemporary', uk: '/kənˈtemprəri/', pos: 'adj.', cn: '当代的；同时代的', ex: 'Contemporary art often challenges tradition.', exc: '当代艺术常常挑战传统。', syn: ['modern', 'current', 'present-day'], topic: 'society', diff: 4 },
  { word: 'contradict', uk: '/ˌkɒntrəˈdɪkt/', pos: 'v.', cn: '反驳；与……矛盾', ex: 'These findings contradict earlier research.', exc: '这些发现与早前的研究相矛盾。', syn: ['conflict with', 'refute', 'gainsay'], topic: 'academic', diff: 4 },
  { word: 'controversial', uk: '/ˌkɒntrəˈvɜːʃl/', pos: 'adj.', cn: '有争议的', ex: 'The issue of online privacy remains controversial.', exc: '网络隐私问题仍然颇具争议。', syn: ['debatable', 'contentious', 'divisive'], topic: 'society', diff: 4 },
  { word: 'conventional', uk: '/kənˈvenʃənl/', pos: 'adj.', cn: '传统的；常规的', ex: 'Solar power is replacing conventional energy sources.', exc: '太阳能正在取代传统能源。', syn: ['traditional', 'standard', 'orthodox'], topic: 'technology', diff: 4 },
  { word: 'correlate', uk: '/ˈkɒrəleɪt/', pos: 'v.', cn: '相关联；有关联', ex: 'Income correlates strongly with educational level.', exc: '收入与受教育程度高度相关。', syn: ['correspond', 'link', 'connect'], topic: 'academic', diff: 5 },
  { word: 'crucial', uk: '/ˈkruːʃl/', pos: 'adj.', cn: '至关重要的', ex: 'Early intervention is crucial for language learners.', exc: '早期干预对语言学习者至关重要。', syn: ['vital', 'essential', 'critical'], topic: 'education', diff: 3 },
  { word: 'cultivate', uk: '/ˈkʌltɪveɪt/', pos: 'v.', cn: '培养；培育', ex: 'Schools should cultivate curiosity in children.', exc: '学校应当培养孩子的好奇心。', syn: ['nurture', 'foster', 'develop'], topic: 'education', diff: 4 },
  { word: 'deteriorate', uk: '/dɪˈtɪəriəreɪt/', pos: 'v.', cn: '恶化；退化', ex: 'Air quality has deteriorated sharply.', exc: '空气质量急剧恶化。', syn: ['worsen', 'decline', 'degrade'], topic: 'environment', diff: 5 },
  { word: 'diminish', uk: '/dɪˈmɪnɪʃ/', pos: 'v.', cn: '减少；削弱', ex: 'Fossil fuel reserves are steadily diminishing.', exc: '化石燃料储量正在稳步减少。', syn: ['decrease', 'reduce', 'shrink'], topic: 'environment', diff: 4 },
  { word: 'disparity', uk: '/dɪˈspærəti/', pos: 'n.', cn: '差异；不平等', ex: 'There is a wide disparity in incomes.', exc: '收入差距很大。', syn: ['gap', 'imbalance', 'inequality'], topic: 'society', diff: 5 },
  { word: 'diverse', uk: '/daɪˈvɜːs/', pos: 'adj.', cn: '多样的；不同的', ex: 'The city is home to diverse cultures.', exc: '这座城市拥有多元的文化。', syn: ['varied', 'assorted', 'heterogeneous'], topic: 'society', diff: 3 },
  { word: 'domestic', uk: '/dəˈmestɪk/', pos: 'adj.', cn: '国内的；家庭的', ex: 'Domestic tourism has grown rapidly.', exc: '国内旅游增长迅速。', syn: ['internal', 'home', 'household'], topic: 'economy', diff: 3 },
  { word: 'dominate', uk: '/ˈdɒmɪneɪt/', pos: 'v.', cn: '支配；占主导', ex: 'A few firms dominate the market.', exc: '少数几家公司主导着市场。', syn: ['prevail', 'control', 'predominate'], topic: 'economy', diff: 4 },
  { word: 'drastic', uk: '/ˈdræstɪk/', pos: 'adj.', cn: '激烈的；极端的', ex: 'Drastic measures are needed to cut emissions.', exc: '需要采取激烈措施来减少排放。', syn: ['extreme', 'radical', 'severe'], topic: 'environment', diff: 4 },
  { word: 'eliminate', uk: '/ɪˈlɪmɪneɪt/', pos: 'v.', cn: '消除；淘汰', ex: 'The policy aims to eliminate absolute poverty.', exc: '该政策旨在消除绝对贫困。', syn: ['eradicate', 'remove', 'wipe out'], topic: 'society', diff: 4 },
  { word: 'emerge', uk: '/ɪˈmɜːdʒ/', pos: 'v.', cn: '出现；显露', ex: 'New patterns of work are emerging.', exc: '新的工作模式正在出现。', syn: ['appear', 'arise', 'surface'], topic: 'economy', diff: 3 },
  { word: 'empirical', uk: '/ɪmˈpɪrɪkl/', pos: 'adj.', cn: '经验的；实证的', ex: 'The claim lacks empirical support.', exc: '这一主张缺乏实证支持。', syn: ['observed', 'experimental', 'evidence-based'], topic: 'academic', diff: 5 },
  { word: 'enhance', uk: '/ɪnˈhɑːns/', pos: 'v.', cn: '提高；增强', ex: 'Reading widely enhances vocabulary.', exc: '广泛阅读能提升词汇量。', syn: ['improve', 'boost', 'augment'], topic: 'education', diff: 3 },
  { word: 'entail', uk: '/ɪnˈteɪl/', pos: 'v.', cn: '牵涉；需要', ex: 'The job entails frequent travel.', exc: '这份工作需要频繁出差。', syn: ['involve', 'require', 'necessitate'], topic: 'work', diff: 5 },
  { word: 'equivalent', uk: '/ɪˈkwɪvələnt/', pos: 'adj./n.', cn: '等同的；等价物', ex: 'One hour of video equals the equivalent of ten pages of text.', exc: '一小时视频相当于十页文字。', syn: ['equal', 'comparable', 'tantamount'], topic: 'academic', diff: 4 },
  { word: 'exacerbate', uk: '/ɪɡˈzæsəbeɪt/', pos: 'v.', cn: '使恶化；加剧', ex: 'Deforestation exacerbates climate change.', exc: '森林砍伐加剧了气候变化。', syn: ['aggravate', 'worsen', 'intensify'], topic: 'environment', diff: 5 },
  { word: 'explicit', uk: '/ɪkˈsplɪsɪt/', pos: 'adj.', cn: '明确的；清晰的', ex: 'The instructions should be explicit.', exc: '说明应当明确。', syn: ['clear', 'definite', 'unambiguous'], topic: 'academic', diff: 4 },
  { word: 'facilitate', uk: '/fəˈsɪlɪteɪt/', pos: 'v.', cn: '促进；使便利', ex: 'The internet facilitates global communication.', exc: '互联网促进了全球交流。', syn: ['enable', 'assist', 'ease'], topic: 'technology', diff: 4 },
  { word: 'fluctuate', uk: '/ˈflʌktʃueɪt/', pos: 'v.', cn: '波动；起伏', ex: 'Prices fluctuated throughout the year.', exc: '全年价格上下波动。', syn: ['vary', 'oscillate', 'swing'], topic: 'economy', diff: 4 },
  { word: 'fundamental', uk: '/ˌfʌndəˈmentl/', pos: 'adj.', cn: '根本的；基本的', ex: 'Education is a fundamental right.', exc: '受教育是一项基本权利。', syn: ['basic', 'essential', 'underlying'], topic: 'education', diff: 3 },
  { word: 'implement', uk: '/ˈɪmplɪment/', pos: 'v.', cn: '实施；执行', ex: 'The government implemented new regulations.', exc: '政府实施了新的法规。', syn: ['carry out', 'execute', 'enforce'], topic: 'society', diff: 3 },
  { word: 'implication', uk: '/ˌɪmplɪˈkeɪʃn/', pos: 'n.', cn: '影响；含义', ex: 'The findings have serious implications for policy.', exc: '这些发现对政策有重大影响。', syn: ['consequence', 'ramification', 'significance'], topic: 'academic', diff: 4 },
  { word: 'incentive', uk: '/ɪnˈsentɪv/', pos: 'n.', cn: '激励；动机', ex: 'Tax breaks provide an incentive to invest.', exc: '税收减免为投资提供了激励。', syn: ['motivation', 'stimulus', 'inducement'], topic: 'economy', diff: 4 },
  { word: 'inevitable', uk: '/ɪnˈevɪtəbl/', pos: 'adj.', cn: '不可避免的', ex: 'Some level of risk is inevitable.', exc: '一定程度的风险不可避免。', syn: ['unavoidable', 'certain', 'inescapable'], topic: 'academic', diff: 4 },
  { word: 'infrastructure', uk: '/ˈɪnfrəstrʌktʃə/', pos: 'n.', cn: '基础设施', ex: 'Investment in infrastructure boosts growth.', exc: '基础设施投资能推动增长。', syn: ['facilities', 'amenities', 'framework'], topic: 'economy', diff: 4 },
  { word: 'integrate', uk: '/ˈɪntɪɡreɪt/', pos: 'v.', cn: '整合；融入', ex: 'Immigrants should be helped to integrate.', exc: '应当帮助移民融入社会。', syn: ['incorporate', 'merge', 'assimilate'], topic: 'society', diff: 4 },
  { word: 'intervene', uk: '/ˌɪntəˈviːn/', pos: 'v.', cn: '干预；介入', ex: 'Governments rarely intervene in this market.', exc: '政府很少干预这个市场。', syn: ['interfere', 'step in', 'mediate'], topic: 'society', diff: 4 },
  { word: 'justify', uk: '/ˈdʒʌstɪfaɪ/', pos: 'v.', cn: '证明……正当', ex: 'It is hard to justify such high fees.', exc: '很难证明如此高的费用是合理的。', syn: ['defend', 'warrant', 'rationalise'], topic: 'academic', diff: 4 },
  { word: 'legislation', uk: '/ˌledʒɪsˈleɪʃn/', pos: 'n.', cn: '立法；法规', ex: 'New legislation bans single-use plastics.', exc: '新法规禁止一次性塑料。', syn: ['law', 'statute', 'regulation'], topic: 'society', diff: 4 },
  { word: 'mitigate', uk: '/ˈmɪtɪɡeɪt/', pos: 'v.', cn: '减轻；缓和', ex: 'Trees help mitigate air pollution.', exc: '树木有助于减轻空气污染。', syn: ['alleviate', 'reduce', 'lessen'], topic: 'environment', diff: 5 },
  { word: 'notion', uk: '/ˈnəʊʃn/', pos: 'n.', cn: '观念；想法', ex: 'The notion that money buys happiness is questionable.', exc: '金钱能买到幸福的观念值得商榷。', syn: ['idea', 'concept', 'belief'], topic: 'academic', diff: 4 },
  { word: 'obsolete', uk: '/ˈɒbsəliːt/', pos: 'adj.', cn: '过时的；废弃的', ex: 'Many manual jobs are becoming obsolete.', exc: '许多体力工作正变得过时。', syn: ['outdated', 'outmoded', 'antiquated'], topic: 'technology', diff: 5 },
  { word: 'paramount', uk: '/ˈpærəmaʊnt/', pos: 'adj.', cn: '至高无上的；最重要的', ex: 'Safety is paramount in aviation.', exc: '在航空领域安全至上。', syn: ['supreme', 'foremost', 'overriding'], topic: 'work', diff: 5 },
  { word: 'phenomenon', uk: '/fəˈnɒmɪnən/', pos: 'n.', cn: '现象', ex: 'Urban migration is a global phenomenon.', exc: '向城市迁移是一个全球现象。', syn: ['occurrence', 'event', 'trend'], topic: 'society', diff: 4 },
  { word: 'prevalent', uk: '/ˈprevələnt/', pos: 'adj.', cn: '普遍的；流行的', ex: 'Smartphone use is prevalent among teenagers.', exc: '青少年中智能手机使用十分普遍。', syn: ['widespread', 'common', 'pervasive'], topic: 'society', diff: 5 },
  { word: 'prohibit', uk: '/prəˈhɪbɪt/', pos: 'v.', cn: '禁止', ex: 'The law prohibits smoking in public places.', exc: '法律禁止在公共场所吸烟。', syn: ['ban', 'forbid', 'outlaw'], topic: 'society', diff: 4 },
  { word: 'reluctant', uk: '/rɪˈlʌktənt/', pos: 'adj.', cn: '不情愿的；勉强的', ex: 'Many firms are reluctant to hire graduates.', exc: '许多公司不愿意聘用应届生。', syn: ['unwilling', 'hesitant', 'averse'], topic: 'work', diff: 4 },
  { word: 'sustainable', uk: '/səˈsteɪnəbl/', pos: 'adj.', cn: '可持续的', ex: 'We need sustainable patterns of consumption.', exc: '我们需要可持续的消费模式。', syn: ['viable', 'enduring', 'eco-friendly'], topic: 'environment', diff: 3 },
  { word: 'tangible', uk: '/ˈtændʒəbl/', pos: 'adj.', cn: '有形的；确实的', ex: 'The project produced tangible benefits.', exc: '该项目带来了实实在在的益处。', syn: ['concrete', 'palpable', 'real'], topic: 'economy', diff: 5 },
  { word: 'underlying', uk: '/ˌʌndəˈlaɪɪŋ/', pos: 'adj.', cn: '潜在的；根本的', ex: 'We must tackle the underlying causes of poverty.', exc: '我们必须解决贫困的根本原因。', syn: ['fundamental', 'root', 'implicit'], topic: 'academic', diff: 5 },
  { word: 'undermine', uk: '/ˌʌndəˈmaɪn/', pos: 'v.', cn: '削弱；损害', ex: 'Excessive testing can undermine creativity.', exc: '过度考试会削弱创造力。', syn: ['weaken', 'erode', 'compromise'], topic: 'education', diff: 5 },
  { word: 'viable', uk: '/ˈvaɪəbl/', pos: 'adj.', cn: '可行的；能存活的', ex: 'Wind power is now a viable alternative.', exc: '风能如今是一种可行的替代能源。', syn: ['feasible', 'practicable', 'workable'], topic: 'environment', diff: 4 },
  { word: 'widespread', uk: '/ˈwaɪdspred/', pos: 'adj.', cn: '广泛的；普遍的', ex: 'There is widespread concern about data privacy.', exc: '人们对数据隐私普遍感到担忧。', syn: ['prevalent', 'extensive', 'pervasive'], topic: 'society', diff: 3 },
];

const DEFAULT_TAGS = ['academic', 'reading', 'writing'];

function main() {
  const db = initDb();
  const insert = db.prepare(
    `INSERT INTO words (word, lemma, phonetic_uk, pos, meaning_cn, example_en, example_cn,
                        synonyms, tags, topic, freq_rank, difficulty, source)
     VALUES (@word, @lemma, @uk, @pos, @cn, @ex, @exc, @syn, @tags, @topic, @rank, @diff, 'seed')
     ON CONFLICT(lemma) DO UPDATE SET
       phonetic_uk = excluded.phonetic_uk,
       pos = excluded.pos,
       meaning_cn = excluded.meaning_cn,
       example_en = excluded.example_en,
       example_cn = excluded.example_cn,
       synonyms = excluded.synonyms,
       tags = excluded.tags,
       topic = excluded.topic,
       freq_rank = excluded.freq_rank,
       difficulty = excluded.difficulty,
       updated_at = datetime('now')`
  );

  let rank = 0;
  const ids = [];
  const tx = db.transaction(() => {
    for (const w of SEED_WORDS) {
      rank += 1;
      insert.run({
        word: w.word,
        lemma: w.word.toLowerCase(),
        uk: w.uk || null,
        pos: w.pos || null,
        cn: w.cn || null,
        ex: w.ex || null,
        exc: w.exc || null,
        syn: JSON.stringify(w.syn || []),
        tags: JSON.stringify(DEFAULT_TAGS),
        topic: w.topic || null,
        rank,
        diff: w.diff || 3,
      });
      const row = db.prepare('SELECT id FROM words WHERE lemma = ?').get(w.word.toLowerCase());
      ids.push(row.id);
    }
  });
  tx();

  // 建一个示例词书
  let list = db.prepare(`SELECT id FROM word_lists WHERE slug = ?`).get('ielts-core-demo');
  if (!list) {
    const info = db
      .prepare(
        `INSERT INTO word_lists (name, slug, description, category, owner_id, is_public, position)
         VALUES (?, ?, ?, ?, NULL, 1, 16)`
      )
      .run(
        '雅思基础词（含例句）',
        'ielts-core-demo',
        '内置的 ' + SEED_WORDS.length + ' 个精选词，每个都带英文例句与中文翻译，适合先跑通学习流程。',
        '基础高频'
      );
    list = { id: info.lastInsertRowid };
  } else {
    db.prepare("UPDATE word_lists SET category = '基础高频', position = 16 WHERE id = ?").run(list.id);
  }

  const insItem = db.prepare(
    `INSERT OR IGNORE INTO word_list_items (list_id, word_id, position) VALUES (?, ?, ?)`
  );
  ids.forEach((wid, i) => insItem.run(list.id, wid, i + 1));

  // 重建 FTS + 词书计数
  for (const wid of ids) rebuildFtsForWord(wid);
  refreshWordListCounts();

  const total = db.prepare('SELECT COUNT(*) AS n FROM words').get().n;
  console.log(`[seed] 已写入 ${SEED_WORDS.length} 个示例词，词库总计 ${total} 词，词书 id=${list.id}`);
}

main();
