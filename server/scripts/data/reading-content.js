// 阅读文章与题目（全部原创，避免版权问题）
// qtype: tfng | yng | choice | match_heading | completion
// answer 采用与选项完全一致的文本；answer_alt 为可接受的等价写法

export const READING_PASSAGES = [
  {
    title: 'The Return of the Urban Bee',
    topic: '环境与城市生态',
    difficulty: 2,
    source: '原创模拟题（Academic Reading Passage 1）',
    content: `A
For much of the twentieth century, cities were regarded as hostile territory for bees. Concrete, traffic and a shortage of greenery were assumed to make urban areas far less suitable than open countryside. Recent surveys in Europe and North America, however, have produced a rather different picture: in some cases colonies kept in city centres are thriving while those in surrounding farmland are struggling.

B
One explanation lies in the way rural land is now used. Intensive agriculture has produced vast fields planted with a single crop, which function as a kind of green desert — there is abundant food for a few weeks of the year and almost nothing for the rest. Cities, by contrast, contain thousands of small gardens, parks, balconies and allotments, planted with a wide range of flowers that bloom in succession. The result is a supply of food that lasts considerably longer.

C
A second factor is pesticides. Neonicotinoid insecticides, widely applied to farmland, are known to impair the navigation and reproduction of bees even at low doses. Because these chemicals are largely prohibited in residential districts, urban colonies face far less chemical pressure than their rural counterparts.

D
Temperature also matters. Cities are consistently warmer than the surrounding countryside — the so-called urban heat island effect — so flowering begins earlier in spring and continues later into autumn, extending the period during which bees can forage. A longer season means more opportunities to gather food and raise young.

E
None of this means that cities are a paradise for insects. Urban colonies face hazards of their own, including a scarcity of suitable nesting sites, diseases that spread rapidly between densely packed commercial hives, and air pollution. As one researcher puts it, cities are not a substitute for a healthy countryside; they are, at best, an accidental refuge.

F
Even so, the findings have begun to change conservation advice. Rather than treating urban areas as a last resort, some ecologists now argue that they should be managed deliberately as habitat: planting native flowers, mowing grass less frequently, and leaving patches of bare ground for species that nest underground. Such measures are cheap, and they can be introduced on land that is already publicly owned.`,
    questions: [
      {
        qtype: 'tfng',
        prompt: 'Urban bee colonies are healthier than rural ones in every region that has been studied.',
        answer: 'FALSE',
        answer_alt: ['False', 'F', 'NO'],
        explanation:
          'A 段说 "in some cases colonies kept in city centres are thriving"，是部分情况，并非所有地区、全部群体。绝对化表述与原文不符。',
        para_ref: 'A',
      },
      {
        qtype: 'tfng',
        prompt: 'The writer believes that cities can replace a healthy countryside as a habitat for bees.',
        answer: 'FALSE',
        answer_alt: ['False', 'F', 'NO'],
        explanation: 'E 段明确写道 "cities are not a substitute for a healthy countryside"，与题干相反。',
        para_ref: 'E',
      },
      {
        qtype: 'tfng',
        prompt: 'Honey produced in cities is more nutritious than honey produced on farms.',
        answer: 'NOT GIVEN',
        answer_alt: ['Not Given', 'NG', 'NOTGIVEN'],
        explanation: '全文讨论的是蜜蜂的生存条件与数量，完全没有提到蜂蜜的营养价值。',
        para_ref: '-',
      },
      {
        qtype: 'choice',
        prompt: 'According to Paragraph B, why is farmland less suitable for bees than cities?',
        options: [
          'It is planted with a single crop for most of the year.',
          'Rural bees are generally smaller in size.',
          'Urban gardens use more fertiliser.',
          'Cities contain fewer natural predators.',
        ],
        answer: 'It is planted with a single crop for most of the year.',
        answer_alt: ['It is planted with a single crop for most of the year'],
        explanation: 'B 段说单一种植的田地 "function as a kind of green desert"，一年中只有几周有食物。',
        para_ref: 'B',
      },
      {
        qtype: 'completion',
        prompt: 'Because residential districts restrict neonicotinoids, urban bees experience far less chemical ______.',
        answer: 'pressure',
        answer_alt: ['pressure'],
        explanation: 'C 段末句："urban colonies face far less chemical pressure than their rural counterparts."',
        para_ref: 'C',
      },
      {
        qtype: 'choice',
        prompt: 'The urban heat island effect benefits bees mainly by',
        options: [
          'reducing the spread of disease among colonies.',
          'extending the period in which flowers are available.',
          'providing more nesting sites in buildings.',
          'lowering levels of air pollution.',
        ],
        answer: 'extending the period in which flowers are available.',
        explanation: 'D 段说开花提前、结束更晚，"extending the period during which bees can forage"。',
        para_ref: 'D',
      },
      {
        qtype: 'choice',
        prompt: 'Which of the following is NOT mentioned as a hazard facing urban bee colonies?',
        options: ['A lack of suitable nesting sites.', 'Diseases spreading between commercial hives.', 'Air pollution.', 'A shortage of flowers to feed on.'],
        answer: 'A shortage of flowers to feed on.',
        explanation: 'E 段列出的危险是筑巢地点不足、疾病、空气污染；文中恰恰强调城市花期长、花种多，因此 D 项未被提及。',
        para_ref: 'E',
      },
      {
        qtype: 'choice',
        prompt: 'The measures suggested in Paragraph F are described as attractive partly because they',
        options: [
          'can be carried out on land the public already owns.',
          'produce honey that can be sold locally.',
          'require new laws to be passed.',
          'remove the need for commercial hives.',
        ],
        answer: 'can be carried out on land the public already owns.',
        explanation: 'F 段末句："Such measures are cheap, and they can be introduced on land that is already publicly owned."',
        para_ref: 'F',
      },
    ],
  },

  {
    title: 'Why We Forget',
    topic: '心理与记忆',
    difficulty: 2,
    source: '原创模拟题（Academic Reading Passage 2）',
    content: `A
Forgetting is usually treated as a failure of memory, a sign that the system has broken down. Yet a growing body of research suggests the opposite: forgetting is not a malfunction but an essential feature, without which the brain would quickly become overwhelmed.

B
The human brain takes in an enormous quantity of information every waking hour, most of it trivial. If every detail were retained with equal weight, retrieving anything useful would become impossible, much as a library becomes useless if nothing is ever removed from its shelves. Forgetting, in this view, is a form of filtering that keeps the system workable.

C
The mechanism appears to involve competition between memories. When two experiences are similar, recalling one actively weakens the other, a phenomenon known as retrieval-induced forgetting. In one classic experiment, participants who were asked to recall some members of a list subsequently found it harder to remember the members they had not been asked about. The act of remembering, paradoxically, made them forget.

D
Sleep plays a central role as well. During deep sleep the brain appears to strengthen the connections that support important memories while weakening those that seem less relevant. Students who sleep after studying consistently outperform those who stay awake, even when the total study time is identical. Cramming through the night may therefore be doubly counterproductive: it adds little new information and removes the opportunity for the brain to sort what has already been learned.

E
There are, of course, cases in which forgetting is genuinely damaging. The gradual loss of memory in old age, and the severe impairment caused by certain diseases, are not useful filtering but destruction of the very structures that make recall possible. Researchers are careful to distinguish between ordinary forgetting, which is adaptive, and pathological memory loss, which is not.

F
Understanding forgetting has practical consequences. It suggests that spacing study sessions over time is more effective than massing them together, because each return to the material forces the brain to reconstruct a memory that has partly faded — and reconstruction strengthens it. It also explains why simply rereading a textbook feels productive while producing surprisingly little learning.`,
    questions: [
      {
        qtype: 'tfng',
        prompt: 'The writer regards forgetting as evidence that memory has failed.',
        answer: 'FALSE',
        answer_alt: ['False', 'F', 'NO'],
        explanation: 'A 段说研究显示 "forgetting is not a malfunction but an essential feature"，与题干相反。',
        para_ref: 'A',
      },
      {
        qtype: 'tfng',
        prompt: 'According to Paragraph C, remembering one item can make it harder to recall a similar item.',
        answer: 'TRUE',
        answer_alt: ['True', 'T', 'YES'],
        explanation: 'C 段描述的 retrieval-induced forgetting 正是这一现象，并举了经典实验为例。',
        para_ref: 'C',
      },
      {
        qtype: 'tfng',
        prompt: 'Students who study for longer hours always achieve better results.',
        answer: 'NOT GIVEN',
        answer_alt: ['Not Given', 'NG', 'NOTGIVEN'],
        explanation: 'D 段比较的是「学习后睡觉」与「通宵不睡」在总时长相同的情况下成绩差异，并未讨论学习时长本身与成绩的关系。',
        para_ref: '-',
      },
      {
        qtype: 'choice',
        prompt: 'The library comparison in Paragraph B is used to show that',
        options: [
          'libraries and brains store information in similar ways.',
          'a system becomes unusable if nothing is ever discarded.',
          'books are easier to retrieve than memories.',
          'forgetting is caused by too much reading.',
        ],
        answer: 'a system becomes unusable if nothing is ever discarded.',
        explanation: 'B 段用 "a library becomes useless if nothing is ever removed from its shelves" 类比说明遗忘是一种过滤机制。',
        para_ref: 'B',
      },
      {
        qtype: 'completion',
        prompt: 'During deep sleep the brain strengthens important connections while ______ those that seem less relevant.',
        answer: 'weakening',
        answer_alt: ['weakening', 'weaken'],
        explanation: 'D 段："the brain appears to strengthen the connections that support important memories while weakening those that seem less relevant."',
        para_ref: 'D',
      },
      {
        qtype: 'choice',
        prompt: 'Why does the writer describe cramming through the night as "doubly counterproductive"?',
        options: [
          'It wastes money and damages health.',
          'It adds little new information and prevents the brain from sorting what was learned.',
          'It makes students forget everything they already knew.',
          'It increases the total amount of study time needed.',
        ],
        answer: 'It adds little new information and prevents the brain from sorting what was learned.',
        explanation: 'D 段末句直接给出两个原因："it adds little new information and removes the opportunity for the brain to sort what has already been learned"。',
        para_ref: 'D',
      },
      {
        qtype: 'choice',
        prompt: 'What distinction do researchers make in Paragraph E?',
        options: [
          'Between short-term and long-term memory.',
          'Between ordinary forgetting and pathological memory loss.',
          'Between young and old learners.',
          'Between useful and useless information.',
        ],
        answer: 'Between ordinary forgetting and pathological memory loss.',
        explanation: 'E 段末句："Researchers are careful to distinguish between ordinary forgetting, which is adaptive, and pathological memory loss, which is not."',
        para_ref: 'E',
      },
      {
        qtype: 'choice',
        prompt: 'According to the final paragraph, spacing study sessions is effective because',
        options: [
          'it reduces the total time spent studying.',
          'reconstructing a partly faded memory strengthens it.',
          'it prevents the brain from filtering information.',
          'it makes rereading a textbook unnecessary.',
        ],
        answer: 'reconstructing a partly faded memory strengthens it.',
        explanation: 'F 段说明每次回到材料都迫使大脑重建已部分消退的记忆，而重建过程本身就强化了记忆。',
        para_ref: 'F',
      },
    ],
  },

  {
    title: 'The Quiet Rise of Second-hand Fashion',
    topic: '经济与消费',
    difficulty: 3,
    source: '原创模拟题（Academic Reading Passage 3）',
    content: `A
Buying used clothing was once associated with necessity. Today it is increasingly a matter of choice, and in some markets a matter of status. Global sales of second-hand garments have grown far faster than sales of new ones, and analysts expect the gap to widen further over the coming decade.

B
Several forces are behind the shift. The first is cost: average prices in the resale market are a fraction of those in shops, which matters to young consumers facing stagnant wages and high housing costs. The second is technology. Online platforms have solved the two problems that once made second-hand shopping tedious — finding what you want and trusting the seller. Sophisticated search tools let buyers filter by brand, size and condition, while rating systems and return policies have removed much of the risk.

C
A third force is environmental concern. Fashion is a resource-intensive industry, consuming enormous quantities of water and producing significant emissions, and clothes are frequently discarded long before they are worn out. Buying second-hand extends the useful life of a garment, which is among the most effective ways for an individual to reduce the environmental cost of their wardrobe. Critics point out that resale does not reduce production; it may even increase total consumption by making fashionable items cheaper. The evidence on this point remains contested.

D
The industry's response has been swift. Major retailers, having initially dismissed resale as a marginal activity, now operate their own second-hand platforms, and some have begun designing clothes with durability and resale value explicitly in mind. For retailers, the appeal is not purely ethical: resale brings customers into stores and generates data about what holds its value.

E
Not everyone benefits equally, however. The charities that once dominated the trade in used clothing now compete with well-funded commercial platforms for the same donations, and in several countries they report falling volumes. Meanwhile, the collection of used garments in wealthier countries for export to poorer ones has long been criticised for undermining local textile industries, an issue that growth in resale does little to resolve.

F
Whether resale will fundamentally change how clothing is produced, or merely add a profitable layer on top of existing patterns of consumption, is not yet clear. What is certain is that a practice once dismissed as marginal now sits close to the centre of the industry.`,
    questions: [
      {
        qtype: 'tfng',
        prompt: 'Second-hand clothing is bought mainly by people who cannot afford new clothes.',
        answer: 'FALSE',
        answer_alt: ['False', 'F', 'NO'],
        explanation: 'A 段说如今买二手 "increasingly a matter of choice, and in some markets a matter of status"，并非因为买不起新品。',
        para_ref: 'A',
      },
      {
        qtype: 'tfng',
        prompt: 'The writer states that resale definitely reduces the total number of clothes produced.',
        answer: 'FALSE',
        answer_alt: ['False', 'F', 'NO'],
        explanation: 'C 段说批评者认为转售不一定减少生产，"The evidence on this point remains contested"，作者并未认定会减少。',
        para_ref: 'C',
      },
      {
        qtype: 'tfng',
        prompt: 'Some retailers design clothes with their resale value in mind.',
        answer: 'TRUE',
        answer_alt: ['True', 'T', 'YES'],
        explanation: 'D 段："some have begun designing clothes with durability and resale value explicitly in mind."',
        para_ref: 'D',
      },
      {
        qtype: 'choice',
        prompt: 'According to Paragraph B, online platforms have helped the resale market mainly by',
        options: [
          'reducing the prices paid to sellers.',
          'making it easier to find items and reducing the risk of buying.',
          'persuading charities to sell their donations.',
          'producing clothes more cheaply than before.',
        ],
        answer: 'making it easier to find items and reducing the risk of buying.',
        explanation: 'B 段指出平台解决了两个问题：找到想要的商品、信任卖家，并用搜索工具和评价体系加以说明。',
        para_ref: 'B',
      },
      {
        qtype: 'completion',
        prompt: 'Buying second-hand extends the useful ______ of a garment, which helps reduce the environmental cost of a wardrobe.',
        answer: 'life',
        answer_alt: ['life'],
        explanation: 'C 段："Buying second-hand extends the useful life of a garment."',
        para_ref: 'C',
      },
      {
        qtype: 'choice',
        prompt: 'Why do retailers find resale attractive, according to Paragraph D?',
        options: [
          'It allows them to avoid paying tax.',
          'It brings customers into stores and reveals what holds its value.',
          'It removes the need to design new products.',
          'It reduces the cost of manufacturing.',
        ],
        answer: 'It brings customers into stores and reveals what holds its value.',
        explanation: 'D 段："resale brings customers into stores and generates data about what holds its value."',
        para_ref: 'D',
      },
      {
        qtype: 'choice',
        prompt: 'What problem for charities is described in Paragraph E?',
        options: [
          'They are no longer allowed to sell used clothes.',
          'They must compete with commercial platforms for donations.',
          'Their clothes are of poorer quality than before.',
          'They are unable to export garments.',
        ],
        answer: 'They must compete with commercial platforms for donations.',
        explanation: 'E 段说慈善机构如今要与资金充裕的商业平台争夺同样的捐赠，并报告收衣量下降。',
        para_ref: 'E',
      },
      {
        qtype: 'choice',
        prompt: 'What is the writer\'s attitude towards the future of resale in the final paragraph?',
        options: [
          'Confident that it will transform production.',
          'Certain that it is only a temporary trend.',
          'Uncertain whether it will change production fundamentally.',
          'Convinced that it harms the environment.',
        ],
        answer: 'Uncertain whether it will change production fundamentally.',
        explanation: 'F 段："is not yet clear"，作者对转售能否从根本上改变生产模式持不确定态度。',
        para_ref: 'F',
      },
    ],
  },

  {
    title: 'Sleep and the Adolescent Brain',
    topic: '健康与发育',
    difficulty: 2,
    source: '原创模拟题（Academic Reading Passage 4）',
    content: `A
Few topics in education attract as much agreement as the claim that teenagers do not get enough sleep. Surveys in several countries suggest that a substantial proportion of secondary school students sleep less than seven hours on school nights, well below the eight to ten hours generally recommended for their age group.

B
The reasons are partly biological. At puberty the body's internal clock shifts later by roughly two hours, so a teenager who felt sleepy at nine o'clock as a child may not feel tired until eleven. Since school start times have generally not changed, adolescents are being asked to fall asleep before their bodies are ready. Social factors compound the problem: homework, part-time jobs, and above all screens, which both delay sleep and, through the light they emit, suppress the hormone that prepares the body for rest.

C
The consequences extend well beyond feeling tired. Sleep deprivation in adolescents is associated with poorer concentration, weaker performance in tests, and higher rates of anxiety and low mood. Studies that followed students over time have also linked chronic short sleep to increased risk-taking behaviour, including dangerous driving. The effect on memory is especially relevant to schools: information consolidated during sleep is more likely to be retained, so a student who studies late and sleeps briefly may remember less than one who studies less and sleeps properly.

D
The most discussed remedy is a later start to the school day. Where districts have pushed the first bell back by an hour, researchers have recorded improved attendance, better test scores and, in some studies, fewer road accidents involving young drivers. Opponents raise practical objections: bus timetables must be reorganised, sports fixtures and after-school jobs may clash, and families with several children at different schools find the arrangements complicated.

E
Critics also argue that later starts simply shift the problem. If adolescents are allowed to sleep an hour longer in the morning, they may stay up an hour later at night, leaving total sleep unchanged. Evidence on this point is mixed, though several large studies suggest that most students do gain sleep rather than compensate by delaying bedtime.

F
More modest measures may still help. Delaying the first lesson for the oldest year groups only, limiting late-evening homework, and teaching students about the effect of screens have all been recommended. None of these is a complete solution, but each addresses part of a problem that no single change is likely to solve on its own.`,
    questions: [
      {
        qtype: 'tfng',
        prompt: 'Most secondary school students sleep more than eight hours on school nights.',
        answer: 'FALSE',
        answer_alt: ['False', 'F', 'NO'],
        explanation: 'A 段说 "a substantial proportion of secondary school students sleep less than seven hours on school nights"，与题干相反。',
        para_ref: 'A',
      },
      {
        qtype: 'tfng',
        prompt: 'Screens may delay sleep partly because of the light they produce.',
        answer: 'TRUE',
        answer_alt: ['True', 'T', 'YES'],
        explanation: 'B 段："screens, which both delay sleep and, through the light they emit, suppress the hormone that prepares the body for rest."',
        para_ref: 'B',
      },
      {
        qtype: 'tfng',
        prompt: 'Later school start times have been introduced successfully in every district where they were tried.',
        answer: 'NOT GIVEN',
        answer_alt: ['Not Given', 'NG', 'NOTGIVEN'],
        explanation: 'D 段提到 "where districts have pushed the first bell back"，但并未说所有试行的地区都成功。',
        para_ref: '-',
      },
      {
        qtype: 'choice',
        prompt: 'What change occurs at puberty, according to Paragraph B?',
        options: [
          'Teenagers need fewer hours of sleep than children.',
          'The internal clock shifts about two hours later.',
          'School start times become earlier.',
          'The body produces less light-sensitive hormone in the day.',
        ],
        answer: 'The internal clock shifts about two hours later.',
        explanation: 'B 段："At puberty the body\'s internal clock shifts later by roughly two hours."',
        para_ref: 'B',
      },
      {
        qtype: 'completion',
        prompt: 'Information ______ during sleep is more likely to be retained.',
        answer: 'consolidated',
        answer_alt: ['consolidated', 'consolidating'],
        explanation: 'C 段："information consolidated during sleep is more likely to be retained."',
        para_ref: 'C',
      },
      {
        qtype: 'choice',
        prompt: 'Which is described as an argument AGAINST later school start times?',
        options: [
          'It has no effect on attendance.',
          'It makes bus timetables and family arrangements more difficult.',
          'It reduces the amount of homework students do.',
          'It increases the number of road accidents.',
        ],
        answer: 'It makes bus timetables and family arrangements more difficult.',
        explanation: 'D 段列出的反对理由包括校车时刻需重排、体育活动与兼职冲突、多子女家庭的安排变复杂。',
        para_ref: 'D',
      },
      {
        qtype: 'choice',
        prompt: 'What does the evidence in Paragraph E suggest about the critics\' argument?',
        options: [
          'It is completely correct.',
          'It is supported by all large studies.',
          'It is only partly supported; most students seem to gain sleep.',
          'It has never been tested.',
        ],
        answer: 'It is only partly supported; most students seem to gain sleep.',
        explanation: 'E 段说证据 "mixed"，但多项大型研究表明多数学生确实获得了更多睡眠，而没有相应推迟就寝时间。',
        para_ref: 'E',
      },
      {
        qtype: 'choice',
        prompt: 'What is the writer\'s conclusion in the final paragraph?',
        options: [
          'Only a change in school start times can solve the problem.',
          'No single measure is a complete solution, but several partial measures help.',
          'Screens are the only cause worth addressing.',
          'The problem cannot be addressed by schools at all.',
        ],
        answer: 'No single measure is a complete solution, but several partial measures help.',
        explanation: 'F 段："None of these is a complete solution, but each addresses part of a problem that no single change is likely to solve on its own."',
        para_ref: 'F',
      },
    ],
  },

  {
    title: 'Mapping the Deep Ocean Floor',
    topic: '科学与探索',
    difficulty: 3,
    source: '原创模拟题（Academic Reading Passage 5）',
    content: `A
More than seventy per cent of the Earth's surface lies beneath the ocean, yet the shape of most of the sea floor remains unknown in any detail. The best existing maps of the deep ocean are less precise than the maps that were made of the Moon in the 1960s, a comparison that researchers use deliberately to underline how far the task still has to go.

B
Progress has historically been limited by physics. Satellite measurements can infer the rough shape of the sea floor from tiny variations in the height of the ocean surface, but they cannot resolve features smaller than a few kilometres. Detailed mapping requires a ship to sail over the area, sending sound pulses downwards and timing their return — a technique known as multibeam echo sounding. Covering the whole ocean this way would take many decades and an enormous sum of money at current rates.

C
A more recent approach has changed the arithmetic. Autonomous surface vessels, powered by wind and solar energy, can operate for months without a crew, and they carry the same echo-sounding equipment as research ships. Because their operating costs are a small fraction of those of a crewed vessel, they can cover far greater distances for the same budget. In a series of missions, one such fleet has mapped areas that would have taken a conventional ship many years to survey.

D
Why does the shape of the sea floor matter outside academic circles? Three reasons recur. First, safety: underwater mountains and ridges influence how sound travels through water, which affects navigation and the performance of sonar. Second, cables and pipelines carrying data and energy are laid across the ocean floor, and routing them around unstable slopes is far cheaper than repairing them after a failure. Third, the ocean absorbs a large share of the heat trapped by greenhouse gases, and the topography of the sea floor plays a role in how that heat is distributed. Modelling the climate accurately requires knowing the shape of the basin.

E
There are, however, limits to what mapping alone can achieve. A detailed map of the sea floor is a record of shape, not of life; it says nothing directly about the species living on the seabed, and the deep ocean remains poorly surveyed biologically. Scientists also note that more accurate maps make the exploitation of seabed resources easier as well as their protection, and that the same data can serve both purposes. How they are used is a political question, not a technical one.

F
Even so, the goal of a complete high-resolution map of the ocean floor by the end of the decade, once dismissed as unrealistic, is now treated by several organisations as achievable. Whether it is achieved depends less on the technology, which largely exists, than on sustained funding and international cooperation.`,
    questions: [
      {
        qtype: 'tfng',
        prompt: 'Existing maps of the deep ocean are more detailed than those made of the Moon in the 1960s.',
        answer: 'FALSE',
        answer_alt: ['False', 'F', 'NO'],
        explanation: 'A 段说深海地图 "less precise than the maps that were made of the Moon in the 1960s"，与题干相反。',
        para_ref: 'A',
      },
      {
        qtype: 'tfng',
        prompt: 'Autonomous vessels cost much less to operate than crewed research ships.',
        answer: 'TRUE',
        answer_alt: ['True', 'T', 'YES'],
        explanation: 'C 段："their operating costs are a small fraction of those of a crewed vessel."',
        para_ref: 'C',
      },
      {
        qtype: 'tfng',
        prompt: 'The writer argues that mapping the sea floor is only of interest to academic researchers.',
        answer: 'FALSE',
        answer_alt: ['False', 'F', 'NO'],
        explanation: 'D 段明确列出了安全、海底缆线与管道铺设、气候建模三项实际用途，题干与原文相反。',
        para_ref: 'D',
      },
      {
        qtype: 'choice',
        prompt: 'What limitation of satellite measurement is described in Paragraph B?',
        options: [
          'It cannot be used over deep water.',
          'It cannot distinguish features smaller than a few kilometres.',
          'It requires a ship to be present.',
          'It is more expensive than echo sounding.',
        ],
        answer: 'It cannot distinguish features smaller than a few kilometres.',
        explanation: 'B 段："they cannot resolve features smaller than a few kilometres."',
        para_ref: 'B',
      },
      {
        qtype: 'completion',
        prompt: 'Detailed mapping requires a ship to send sound pulses downwards and time their return, a technique called multibeam echo ______.',
        answer: 'sounding',
        answer_alt: ['sounding'],
        explanation: 'B 段："a technique known as multibeam echo sounding."',
        para_ref: 'B',
      },
      {
        qtype: 'choice',
        prompt: 'According to Paragraph D, why does the shape of the sea floor matter for navigation?',
        options: [
          'It determines the depth of harbours.',
          'It affects how sound travels through water, influencing sonar.',
          'It changes the direction of ocean currents.',
          'It controls the temperature of surface water.',
        ],
        answer: 'It affects how sound travels through water, influencing sonar.',
        explanation: 'D 段第一条理由："underwater mountains and ridges influence how sound travels through water, which affects navigation and the performance of sonar."',
        para_ref: 'D',
      },
      {
        qtype: 'choice',
        prompt: 'What point is made in Paragraph E about better maps?',
        options: [
          'They tell us almost everything about deep-sea life.',
          'They can be used both to exploit and to protect the seabed.',
          'They are of no commercial value.',
          'They have replaced biological surveys.',
        ],
        answer: 'They can be used both to exploit and to protect the seabed.',
        explanation: 'E 段说更精确的地图既方便开发海底资源，也有利于保护，如何使用是政治问题而非技术问题。',
        para_ref: 'E',
      },
      {
        qtype: 'choice',
        prompt: 'What does the writer say determines whether a complete map is produced in time?',
        options: [
          'The invention of new mapping technology.',
          'Sustained funding and international cooperation.',
          'The number of research ships available.',
          'Agreement on how the data will be used.',
        ],
        answer: 'Sustained funding and international cooperation.',
        explanation: 'F 段："depends less on the technology, which largely exists, than on sustained funding and international cooperation."',
        para_ref: 'F',
      },
    ],
  },
];

// 段落标题匹配题的候选标题（可按需扩展）
export const MATCH_HEADING_SETS = {
  default: [
    'An accidental refuge rather than a solution',
    'How temperature changes behaviour',
    'The effect of chemicals in the countryside',
    'A problem that has been exaggerated',
    'Practical measures for the future',
    'Why cities were once considered unsuitable',
  ],
};
