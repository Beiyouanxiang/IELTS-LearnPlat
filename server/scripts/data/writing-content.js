// 写作题库与范文（原创内容，避免版权问题）
// task_type: task1 图表/流程/地图 | task2 议论文
// category: opinion / discussion / problem-solution / two-part / advantage

export const WRITING_PROMPTS = [
  // ---------------- Task 2 ----------------
  {
    task_type: 'task2',
    category: 'opinion',
    title: '公共交通 vs 新建道路',
    prompt_en:
      'Some people believe that governments should spend more money on public transport rather than on building new roads. To what extent do you agree or disagree with this view?',
    prompt_cn:
      '有人认为政府应把更多资金投入到公共交通，而不是修建新道路。你在多大程度上同意或不同意这一观点？',
    min_words: 250,
    minutes: 40,
    difficulty: 2,
    tags: ['政府', '交通', '城市'],
  },
  {
    task_type: 'task2',
    category: 'discussion',
    title: '线上教育能否取代线下课堂',
    prompt_en:
      'Some people think that online learning will eventually replace traditional classroom teaching. Others believe face-to-face education is irreplaceable. Discuss both views and give your own opinion.',
    prompt_cn: '有人认为在线学习终将取代传统课堂，也有人认为面对面教育不可替代。讨论双方观点并给出自己的看法。',
    min_words: 250,
    minutes: 40,
    difficulty: 2,
    tags: ['教育', '科技'],
  },
  {
    task_type: 'task2',
    category: 'problem-solution',
    title: '城市垃圾处理',
    prompt_en:
      'In many cities, the amount of household waste is increasing rapidly. What are the causes of this problem and what measures could be taken to solve it?',
    prompt_cn: '许多城市的生活垃圾快速增长。造成这一问题的原因是什么？可以采取哪些措施解决？',
    min_words: 250,
    minutes: 40,
    difficulty: 2,
    tags: ['环境', '城市'],
  },
  {
    task_type: 'task2',
    category: 'opinion',
    title: '大学是否应免费',
    prompt_en:
      'Some people argue that university education should be free for all students, while others believe students should pay for their own tuition. Discuss both sides and give your opinion.',
    prompt_cn: '有人主张大学教育应对所有学生免费，也有人认为学生应自付学费。讨论双方观点并给出你的看法。',
    min_words: 250,
    minutes: 40,
    difficulty: 2,
    tags: ['教育', '经济'],
  },
  {
    task_type: 'task2',
    category: 'two-part',
    title: '远程办公的利弊',
    prompt_en:
      'More and more employees are allowed to work from home. What are the advantages and disadvantages of this trend? Do the advantages outweigh the disadvantages?',
    prompt_cn: '越来越多员工获准居家办公。这一趋势的利弊分别是什么？利是否大于弊？',
    min_words: 250,
    minutes: 40,
    difficulty: 2,
    tags: ['工作', '科技'],
  },
  {
    task_type: 'task2',
    category: 'discussion',
    title: '广告是否应被限制',
    prompt_en:
      'Some people say advertising has a negative influence on society and should be strictly limited. To what extent do you agree or disagree?',
    prompt_cn: '有人说广告对社会有负面影响，应被严格限制。你在多大程度上同意或不同意？',
    min_words: 250,
    minutes: 40,
    difficulty: 3,
    tags: ['媒体', '社会'],
  },
  {
    task_type: 'task2',
    category: 'opinion',
    title: '政府是否应资助艺术',
    prompt_en:
      'Some people believe that governments should spend money on the arts, such as music and painting. Others think this money would be better spent on public services. Discuss both views and give your opinion.',
    prompt_cn: '有人主张政府应资助音乐、绘画等艺术，也有人认为这些钱用于公共服务更合适。讨论双方观点并给出你的看法。',
    min_words: 250,
    minutes: 40,
    difficulty: 3,
    tags: ['文化', '政府'],
  },
  {
    task_type: 'task2',
    category: 'problem-solution',
    title: '青少年缺乏运动',
    prompt_en:
      'In many countries, young people are doing less physical exercise than in the past. What are the reasons for this, and what can be done to encourage them to take more exercise?',
    prompt_cn: '许多国家青少年的运动量比过去明显减少。原因是什么？可以怎样鼓励他们多运动？',
    min_words: 250,
    minutes: 40,
    difficulty: 2,
    tags: ['健康', '教育'],
  },
  {
    task_type: 'task2',
    category: 'discussion',
    title: '单一货币与全球化',
    prompt_en:
      'Some people think that a single global currency would benefit the world economy. Others believe it would cause serious problems. Discuss both views and give your own opinion.',
    prompt_cn: '有人认为全球统一货币有利于世界经济，也有人认为会带来严重问题。讨论双方观点并给出自己的看法。',
    min_words: 250,
    minutes: 40,
    difficulty: 3,
    tags: ['经济', '全球化'],
  },
  {
    task_type: 'task2',
    category: 'opinion',
    title: '科技是否让人更孤独',
    prompt_en:
      'Some people believe that modern communication technology has made people less socially connected. To what extent do you agree or disagree?',
    prompt_cn: '有人认为现代通讯技术让人与人之间的联系变少了。你在多大程度上同意或不同意？',
    min_words: 250,
    minutes: 40,
    difficulty: 2,
    tags: ['科技', '社会'],
  },
  {
    task_type: 'task2',
    category: 'problem-solution',
    title: '老龄化社会',
    prompt_en:
      'In many countries the proportion of elderly people is increasing. What problems does this cause for society, and what solutions can you suggest?',
    prompt_cn: '许多国家老年人口比例上升。这会给社会带来哪些问题？你能提出什么解决方案？',
    min_words: 250,
    minutes: 40,
    difficulty: 2,
    tags: ['社会', '健康'],
  },
  {
    task_type: 'task2',
    category: 'advantage',
    title: '国际旅游的影响',
    prompt_en:
      'International tourism has become a huge industry. Do the benefits of this trend outweigh the drawbacks?',
    prompt_cn: '国际旅游业已成为庞大产业。这一趋势的利是否大于弊？',
    min_words: 250,
    minutes: 40,
    difficulty: 1,
    tags: ['旅游', '文化'],
  },

  // ---------------- Task 1 ----------------
  {
    task_type: 'task1',
    category: 'chart',
    chart_type: 'line',
    title: 'Task 1 折线图：四种交通方式通勤占比（1990-2020）',
    prompt_en:
      'The line graph below shows the percentage of commuters using four different means of transport (car, bus, bicycle and train) in a city between 1990 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    prompt_cn:
      '折线图显示了 1990—2020 年某城市通勤者使用四种交通方式（小汽车、公交、自行车、火车）的百分比。总结主要特征并作相关比较。',
    min_words: 150,
    minutes: 20,
    difficulty: 2,
    tags: ['图表', '趋势'],
  },
  {
    task_type: 'task1',
    category: 'chart',
    chart_type: 'bar',
    title: 'Task 1 柱状图：五国可再生能源发电占比',
    prompt_en:
      'The bar chart below compares the share of electricity generated from renewable sources in five countries in 2015 and 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    prompt_cn: '柱状图比较了五个国家 2015 年与 2022 年可再生能源发电占比。总结主要特征并作相关比较。',
    min_words: 150,
    minutes: 20,
    difficulty: 2,
    tags: ['图表', '环境'],
  },
  {
    task_type: 'task1',
    category: 'chart',
    chart_type: 'pie',
    title: 'Task 1 饼图：家庭支出结构',
    prompt_en:
      'The pie charts below show the average household expenditure on six categories in two different years.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    prompt_cn: '饼图显示了两个年份家庭在六个类别上的平均支出。总结主要特征并作相关比较。',
    min_words: 150,
    minutes: 20,
    difficulty: 2,
    tags: ['图表', '经济'],
  },
  {
    task_type: 'task1',
    category: 'chart',
    chart_type: 'table',
    title: 'Task 1 表格：三个城市生活质量指标',
    prompt_en:
      'The table below gives information about three cities in terms of population, average income, living cost and public transport satisfaction.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    prompt_cn: '表格提供了三个城市在人口、平均收入、生活成本与公共交通满意度方面的信息。总结主要特征并作相关比较。',
    min_words: 150,
    minutes: 20,
    difficulty: 3,
    tags: ['表格', '城市'],
  },
  {
    task_type: 'task1',
    category: 'process',
    chart_type: 'process',
    title: 'Task 1 流程图：玻璃回收流程',
    prompt_en:
      'The diagram below shows the process by which used glass bottles are collected and recycled into new glass products.\n\nSummarise the information by selecting and reporting the main features.',
    prompt_cn: '流程图显示废弃玻璃瓶被收集并回收制成新玻璃制品的过程。总结主要特征。',
    min_words: 150,
    minutes: 20,
    difficulty: 2,
    tags: ['流程', '环境'],
  },
  {
    task_type: 'task1',
    category: 'process',
    chart_type: 'process',
    title: 'Task 1 流程/生命周期：蜜蜂的生命周期',
    prompt_en:
      'The diagram below illustrates the life cycle of the honey bee.\n\nSummarise the information by selecting and reporting the main features.',
    prompt_cn: '图示说明了蜜蜂的生命周期。总结主要特征。',
    min_words: 150,
    minutes: 20,
    difficulty: 2,
    tags: ['流程', '自然'],
  },
  {
    task_type: 'task1',
    category: 'map',
    chart_type: 'map',
    title: 'Task 1 地图：某城镇 1980 与 2020 的变化',
    prompt_en:
      'The two maps below show the changes that took place in a small town between 1980 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    prompt_cn: '两幅地图显示了 1980 至 2020 年间某小镇发生的变化。总结主要特征并作相关比较。',
    min_words: 150,
    minutes: 20,
    difficulty: 3,
    tags: ['地图', '城市'],
  },
  {
    task_type: 'task1',
    category: 'mixed',
    chart_type: 'bar',
    title: 'Task 1 组合图：旅游人数与旅游收入',
    prompt_en:
      'The chart and table below show the number of international tourists arriving in a country and the average spending per tourist over the same period.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    prompt_cn: '图表与表格显示了同一时期某国入境游客数量及人均消费。总结主要特征并作相关比较。',
    min_words: 150,
    minutes: 20,
    difficulty: 3,
    tags: ['组合图', '旅游'],
  },
];

// 范文：band 8+，用于「对照范文找差距」
// prompt_title 与上面的 title 对应
export const MODEL_ESSAYS = [
  {
    prompt_title: '公共交通 vs 新建道路',
    band: 8,
    title: '参考范文：公共交通优先（Band 8）',
    content: `It is often argued that public money would be better channelled into public transport than into new roads. I largely agree with this position, although I would stop short of dismissing road building entirely.

The strongest argument for prioritising public transport is its far greater carrying capacity. A single underground train can move several hundred passengers using a fraction of the road space that the same number of private cars would require. Consequently, investment in rail and bus networks does more to relieve congestion per unit of spending than the construction of extra lanes, which, as experience in many cities has shown, tends merely to attract additional traffic.

Environmental considerations point in the same direction. Transport is a major source of urban air pollution and carbon emissions, and buses and trains emit considerably less per passenger kilometre than private vehicles. Shifting commuters onto these services is therefore one of the most practical ways in which a city can reduce its environmental footprint. Copenhagen, for instance, has cut emissions substantially by making cycling and public transport the default options rather than the fallback.

Admittedly, new roads are not without value. In rural regions with no realistic alternative, and for freight, they remain indispensable. In dense urban areas, however, they are at best a short-term fix that soon recreates the problem it was intended to solve.

On balance, therefore, public transport ought to be the priority for the bulk of transport spending, with road construction confined to cases where it is genuinely the only viable option.`,
    highlights: [
      { quote: 'I largely agree with this position, although I would stop short of dismissing road building entirely.', comment: '引言直接亮明立场并给出限定范围，比简单说 "I agree" 得分更高。' },
      { quote: 'does more to relieve congestion per unit of spending than the construction of extra lanes', comment: '用 "per unit of spending" 做量化对比，体现论证精度。' },
      { quote: 'Copenhagen, for instance, has cut emissions substantially by making cycling and public transport the default options rather than the fallback.', comment: '具体的城市案例 + 对比结构，避免空泛举例。' },
      { quote: 'Admittedly, new roads are not without value.', comment: '让步段是 TR 拿 7+ 的关键：先承认对方合理之处，再限定适用范围。' },
      { quote: 'with road construction confined to cases where it is genuinely the only viable option', comment: '结论用分词结构收束，句式有变化且呼应开头。' },
    ],
  },
  {
    prompt_title: '线上教育能否取代线下课堂',
    band: 8,
    title: '参考范文：线上教育不会完全取代课堂（Band 8）',
    content: `Whether digital platforms will eventually render the traditional classroom obsolete is a much-debated question. While online learning has clear advantages, I believe that face-to-face teaching will remain indispensable, particularly in the earlier stages of education.

Those who champion online learning point to its flexibility and reach. Students in remote areas can access lectures from leading institutions without relocating, and recorded material can be paused and revisited as often as necessary. This is a genuine benefit, and for mature learners studying part-time it is arguably the only practical option.

Nevertheless, the classroom offers something that screens struggle to replicate. Learning is a social activity as much as an intellectual one, and the immediate feedback of a teacher, the pressure of working alongside peers, and the informal discussion that follows a lesson all contribute to understanding in ways that a video call cannot fully reproduce. For younger children, moreover, the structure and supervision of a physical school are essential to both academic progress and social development.

It is also worth noting that online provision depends on reliable technology and self-discipline, neither of which can be assumed. Pupils who lack a quiet space to study or who are easily distracted are precisely those most likely to fall behind in a fully remote system.

In conclusion, although digital tools will continue to enrich education and may replace the classroom in some contexts, they are unlikely to supplant it altogether. The most sensible outcome is a blend in which technology extends what happens in the classroom rather than substituting for it.`,
    highlights: [
      { quote: 'While online learning has clear advantages, I believe that face-to-face teaching will remain indispensable', comment: '让步式开头，先承认再转折，CC 与 TR 双得分点。' },
      { quote: 'Learning is a social activity as much as an intellectual one', comment: '简短有力的主题句，直接点出论证核心。' },
      { quote: 'Pupils who lack a quiet space to study or who are easily distracted are precisely those most likely to fall behind', comment: '用定语从句做限定，论证有针对性而不是泛泛而谈。' },
      { quote: 'they are unlikely to supplant it altogether', comment: '高级动词 supplant 替换 replace，属 LR 加分项。' },
    ],
  },
  {
    prompt_title: '大学是否应免费',
    band: 8,
    title: '参考范文：大学学费（Band 8）',
    content: `Whether higher education should be funded entirely by the state or by the students who benefit from it is a question that divides opinion. In my view, tuition should be heavily subsidised rather than either wholly free or wholly charged to students.

The case for free university education rests on the principle of equal opportunity. When fees are prohibitively high, talented young people from low-income families are discouraged from applying, and society loses the skills it has invested in producing. Countries such as Germany, which abolished tuition fees, have maintained strong enrolment among disadvantaged groups without any collapse in academic standards.

However, making university entirely free is expensive and, arguably, regressive. Graduates typically earn considerably more than non-graduates over a lifetime, so a system in which taxpayers as a whole subsidise this private advantage transfers money from the general population to a relatively privileged group. A more defensible model therefore combines modest fees with generous, means-tested grants and income-contingent loans, so that no student is deterred by cost while those who profit most contribute in proportion.

It is also important to recognise that not everyone should attend university. Expanding free places indiscriminately may simply push young people into academic courses for which they are unsuited, while vocational training suffers from neglect and underfunding.

In conclusion, while the goal of equal access is entirely legitimate, it is better served by targeted financial support than by universal free tuition.`,
    highlights: [
      { quote: 'a question that divides opinion', comment: '自然的引言句式，避免机械套用 "Nowadays, ..." 模板。' },
      { quote: 'a system in which taxpayers as a whole subsidise this private advantage transfers money from the general population to a relatively privileged group', comment: '长定语句承载复杂论证，展示 GRA 的句式范围。' },
      { quote: 'A more defensible model therefore combines modest fees with generous, means-tested grants', comment: '不停留在"反对"，而是提出可操作方案，TR 更完整。' },
      { quote: 'Expanding free places indiscriminately may simply push young people into academic courses for which they are unsuited', comment: '第二个主体段给出新的论证角度，避免两个主体段重复。' },
    ],
  },
  {
    prompt_title: '城市垃圾处理',
    band: 8,
    title: '参考范文：垃圾问题的成因与对策（Band 8）',
    content: `The volume of household waste generated in urban areas has risen sharply in recent decades. This essay will examine the principal causes of the trend before suggesting two measures that could reverse it.

The most obvious driver is the rise of mass consumption combined with a culture of disposability. Products are now designed to be replaced rather than repaired, and single-use packaging has become standard in the food and retail industries. A further cause is rapid urbanisation: as more households are established, the quantity of refuse they produce inevitably expands, and municipal collection systems frequently struggle to keep pace.

Two remedies seem particularly promising. The first is to make producers financially responsible for the waste their packaging generates. Under such extended producer responsibility schemes, manufacturers have a direct incentive to reduce unnecessary packaging and to design products that can be easily recycled, shifting the burden away from the taxpayer. Several European countries have adopted this approach with measurable success.

The second is to make recycling genuinely convenient and financially attractive for households. Where separate collection is infrequent, confusing or costly, recycling rates remain stubbornly low no matter how much people are exhorted to do their duty. Deposits on bottles, alongside clear and consistent local rules, have been shown to raise participation dramatically.

In conclusion, the growth in urban waste stems largely from disposable consumption and urban expansion, but it is not inevitable. Producer responsibility and convenient recycling infrastructure together offer a realistic route to reducing it.`,
    highlights: [
      { quote: 'This essay will examine the principal causes of the trend before suggesting two measures', comment: '问题解决型题目清晰交代文章路线图，TR 得分点。' },
      { quote: 'A further cause is rapid urbanisation', comment: '用 "A further cause" 引出第二个成因，衔接自然不重复。' },
      { quote: 'Under such extended producer responsibility schemes, manufacturers have a direct incentive', comment: '引入专有概念（EPR），体现话题词汇储备。' },
      { quote: 'no matter how much people are exhorted to do their duty', comment: '结构地道的让步从句，替换了简单的 "even if people try hard"。' },
    ],
  },
];
