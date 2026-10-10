// 雅思高频词表（按话题分册）
// 每行格式：word|pos|中文释义|同义替换(逗号分隔，可留空)
// 内容为通用雅思高频词汇，释义与同义替换为通用语言知识整理。

export const BOOKS = [
  {
    slug: 'core-basic',
    name: '雅思基础高频词',
    desc: '写作与口语的地基：最常用的基础词，先把这些吃透再上学术词',
    category: '基础高频',
    position: 15,
    topic: 'basic',
    difficulty: 2,
    rows: `
environment|n.|环境；自然环境|surroundings, setting, milieu
environmental|adj.|环境的；与环保有关的|ecological, green, conservation-related
pollution|n.|污染|contamination, defilement
pollute|v.|污染|contaminate, taint, foul
natural|adj.|自然的；天然的|innate, organic, untouched
nature|n.|自然；本性|the environment, essence, character
protect|v.|保护|safeguard, shield, defend
protection|n.|保护；防护|defence, safeguard, preservation
energy|n.|能源；精力|power, vigour, fuel
species|n.|物种|kind, breed, organism
wildlife|n.|野生动物|wild animals, fauna, native species
temperature|n.|温度；气温|warmth, heat level
flood|n./v.|洪水；淹没|inundation, deluge, submerge
global|adj.|全球的|worldwide, international, universal
education|n.|教育|schooling, instruction, teaching
educate|v.|教育；培养|teach, instruct, train
technique|n.|技巧；技术|method, approach, skill
skill|n.|技能；技巧|ability, expertise, competence
knowledge|n.|知识；认识|understanding, learning, awareness
study|v./n.|学习；研究|learn, research, examine
teach|v.|教；教授|instruct, educate, train
exam|n.|考试|test, assessment, examination
society|n.|社会|civilisation, community, public
social|adj.|社会的；社交的|communal, public, interpersonal
population|n.|人口|inhabitants, populace, citizenry
culture|n.|文化|civilisation, customs, heritage
cultural|adj.|文化的|artistic, ethnic, traditional
tradition|n.|传统|custom, convention, legacy
media|n.|媒体；传媒|press, broadcasting, news outlets
tourism|n.|旅游业|travel industry, sightseeing
tourist|n.|游客|traveller, visitor, holidaymaker
family|n.|家庭|household, relatives, kin
crime|n.|犯罪|offence, wrongdoing, felony
criminal|n./adj.|罪犯；犯罪的|offender, lawbreaker, illegal
transport|n./v.|交通；运输|transportation, conveyance, carriage
communicate|v.|交流；沟通|convey, interact, correspond
communication|n.|交流；通讯|interaction, exchange, correspondence
economic|adj.|经济的|financial, commercial, fiscal
money|n.|金钱|currency, funds, cash
finance|n./v.|金融；资助|funding, capital, subsidise
career|n.|职业；事业|profession, occupation, vocation
work|n./v.|工作；作品|job, employment, labour
job|n.|工作；职位|employment, post, occupation
business|n.|商业；生意|enterprise, trade, commerce
market|n.|市场|marketplace, bazaar, demand area
health|n.|健康|wellbeing, fitness, condition
healthy|adj.|健康的|fit, well, wholesome
medicine|n.|药物；医学|medication, remedy, drug
diet|n.|饮食|nutrition, food intake, eating habits
exercise|n./v.|锻炼；练习|workout, training, practice
stress|n.|压力；紧张|pressure, strain, tension
disease|n.|疾病|illness, ailment, disorder
government|n.|政府|administration, regime, authorities
politics|n.|政治|political affairs, statecraft, governance
political|adj.|政治的|governmental, partisan, civic
law|n.|法律；法则|legislation, statute, rule
legal|adj.|合法的；法律的|lawful, legitimate, judicial
public|adj./n.|公共的；公众|communal, civic, general
service|n.|服务；公共设施|assistance, provision, facility
develop|v.|发展；开发|grow, advance, evolve
development|n.|发展；开发|growth, progress, evolution
improve|v.|改善；提高|enhance, better, upgrade
improvement|n.|改进；改善|enhancement, upgrade, progress
increase|v./n.|增加；增长|rise, grow, augment
reduce|v.|减少；降低|decrease, lower, diminish
decline|v./n.|下降；衰退|decrease, diminish, deteriorate
problem|n.|问题；难题|issue, difficulty, dilemma
solution|n.|解决方案|remedy, answer, resolution
solve|v.|解决|resolve, settle, work out
reason|n.|原因；理由|cause, motive, rationale
result|n./v.|结果；导致|outcome, consequence, ensue
effect|n.|影响；效果|impact, consequence, influence
affect|v.|影响|influence, impact, shape
cause|n./v.|原因；导致|reason, trigger, bring about
opinion|n.|观点；看法|view, viewpoint, belief
advantage|n.|优势；好处|benefit, merit, upside
disadvantage|n.|劣势；缺点|drawback, downside, shortcoming
benefit|n./v.|益处；受益|advantage, gain, profit
harm|n./v.|伤害；损害|damage, injury, detriment
harmful|adj.|有害的|damaging, detrimental, injurious
support|v./n.|支持；支撑|back, endorse, advocate
oppose|v.|反对|resist, object to, contest
suggest|v.|建议；暗示|propose, recommend, imply
important|adj.|重要的|significant, crucial, key
necessary|adj.|必要的|essential, required, indispensable
common|adj.|常见的；共同的|widespread, prevalent, shared
popular|adj.|流行的；受欢迎的|well-liked, favoured, fashionable
serious|adj.|严重的；严肃的|severe, grave, solemn
positive|adj.|积极的；正面的|favourable, optimistic, constructive
negative|adj.|消极的；负面的|adverse, unfavourable, pessimistic
main|adj.|主要的|chief, principal, primary
various|adj.|各种各样的|diverse, assorted, numerous
modern|adj.|现代的|contemporary, current, up-to-date
traditional|adj.|传统的|conventional, customary, old-fashioned
community|n.|社区；群体|neighbourhood, society, public
national|adj.|国家的；全国的|domestic, state, nationwide
international|adj.|国际的|global, worldwide, multinational
children|n.|儿童；孩子们|kids, youngsters, offspring
elderly|adj.|年长的；上了年纪的|senior, aged, older
young|adj.|年轻的|youthful, junior, adolescent
gender|n.|性别|sex, gender identity
equality|n.|平等；均等|fairness, parity, impartiality
freedom|n.|自由|liberty, independence, autonomy
right|n.|权利|entitlement, privilege, claim
duty|n.|责任；义务|responsibility, obligation, task
responsibility|n.|责任；职责|duty, accountability, obligation
behaviour|n.|行为；举止|conduct, manner, demeanour
attitude|n.|态度；看法|outlook, stance, disposition
experience|n./v.|经验；经历|expertise, encounter, undergo
ability|n.|能力；才能|capability, competence, skill
talent|n.|天赋；人才|gift, aptitude, flair
challenge|n./v.|挑战；质疑|difficulty, test, confront
opportunity|n.|机会；时机|chance, opening, prospect
situation|n.|情况；形势|circumstance, condition, scenario
condition|n.|条件；状况|state, situation, prerequisite
change|v./n.|改变；变化|alter, transform, vary
technology|n.|技术；科技|technique, innovation, applied science
technological|adj.|技术的；科技的|technical, digital, innovative
internet|n.|互联网|the web, cyberspace, online network
computer|n.|计算机；电脑|PC, machine, device
information|n.|信息；资料|data, facts, details
`,
  },
  {
    slug: 'core-academic',
    name: '雅思核心学术词',
    desc: '学术写作与阅读中最常出现的高频词，写作提分的基础盘',
    category: '学术词表',
    position: 34,
    topic: 'academic',
    difficulty: 3,
    rows: `
achieve|v.|实现；取得；达到|accomplish, attain, reach
acquire|v.|获得；习得|obtain, gain, attain
adapt|v.|适应；改编|adjust, modify, accommodate
adequate|adj.|足够的；适当的|sufficient, ample, enough
advocate|v.|提倡；拥护|support, champion, endorse
allocate|v.|分配；拨给|assign, distribute, allot
alter|v.|改变；更改|change, modify, transform
ambiguous|adj.|模糊的；有歧义的|vague, unclear, equivocal
analyse|v.|分析|examine, dissect, evaluate
anticipate|v.|预料；预期|expect, foresee, predict
apparent|adj.|明显的；表面上的|obvious, evident, seeming
approach|n./v.|方法；接近|method, strategy, near
appropriate|adj.|适当的；恰当的|suitable, proper, fitting
arbitrary|adj.|任意的；武断的|random, capricious, subjective
assess|v.|评估；评定|evaluate, appraise, gauge
assume|v.|假定；认为|presume, suppose, postulate
attain|v.|达到；获得|achieve, accomplish, reach
attribute|v./n.|归因于；属性|ascribe, credit, characteristic
beneficial|adj.|有益的；有利的|advantageous, favourable, helpful
capable|adj.|有能力的；能够的|competent, able, proficient
category|n.|类别；范畴|class, group, classification
coherent|adj.|连贯的；条理清晰的|logical, consistent, cohesive
collapse|v./n.|崩溃；倒塌|crumble, break down, disintegrate
compel|v.|强迫；迫使|force, oblige, coerce
compensate|v.|补偿；弥补|offset, make up for, reimburse
competent|adj.|有能力的；胜任的|capable, qualified, proficient
complicated|adj.|复杂的|complex, intricate, convoluted
comprehensive|adj.|全面的；综合的|thorough, all-round, extensive
conceal|v.|隐藏；隐瞒|hide, disguise, obscure
concede|v.|承认；让步|admit, acknowledge, yield
conceive|v.|构想；设想|imagine, envisage, formulate
conclude|v.|得出结论；结束|deduce, infer, finish
conducive|adj.|有助于……的|favourable, helpful, beneficial
conform|v.|遵守；符合|comply, adhere, conform
consecutive|adj.|连续的；连贯的|successive, sequential, uninterrupted
consensus|n.|共识；一致意见|agreement, unanimity, accord
considerable|adj.|相当大的；可观的|substantial, significant, sizeable
consistent|adj.|一致的；始终如一的|uniform, coherent, steady
constitute|v.|构成；组成|compose, form, make up
constrain|v.|限制；约束|restrict, limit, confine
contradict|v.|反驳；与……矛盾|refute, oppose, challenge
controversial|adj.|有争议的|contentious, debatable, disputed
conventional|adj.|传统的；常规的|traditional, customary, orthodox
convey|v.|传达；表达|communicate, express, impart
crucial|adj.|至关重要的|vital, critical, essential
cumulative|adj.|累积的；渐增的|cumulative, accumulative, collective
deduce|v.|推断；演绎|infer, conclude, derive
deficient|adj.|缺乏的；不足的|lacking, inadequate, insufficient
demonstrate|v.|证明；展示|prove, illustrate, show
derive|v.|源自；取得|originate, obtain, stem from
deteriorate|v.|恶化；变坏|worsen, decline, degenerate
deviate|v.|偏离；违背|diverge, stray, depart
diminish|v.|减少；削弱|decrease, reduce, lessen
discrepancy|n.|差异；不一致|disparity, inconsistency, gap
distinct|adj.|明显的；截然不同的|clear, separate, distinguishable
distort|v.|扭曲；歪曲|twist, misrepresent, warp
diverse|adj.|多样的；不同的|varied, manifold, heterogeneous
dominate|v.|支配；主导|control, prevail, overshadow
elaborate|v./adj.|详述；精心制作的|expand, detailed, intricate
eliminate|v.|消除；淘汰|remove, eradicate, abolish
emerge|v.|出现；浮现|appear, surface, arise
emphasise|v.|强调|stress, highlight, underline
enhance|v.|提高；增强|improve, boost, augment
enormous|adj.|巨大的|huge, immense, vast
ensure|v.|确保；保证|guarantee, secure, make certain
entail|v.|需要；牵涉|involve, require, necessitate
essential|adj.|必要的；本质的|vital, indispensable, fundamental
establish|v.|建立；确立|found, set up, institute
evaluate|v.|评价；评估|assess, appraise, judge
evident|adj.|明显的|obvious, apparent, manifest
exacerbate|v.|加剧；恶化|aggravate, worsen, intensify
exceed|v.|超过；超出|surpass, outstrip, transcend
exclude|v.|排除；不包括|omit, rule out, bar
explicit|adj.|明确的；清晰的|clear, definite, unambiguous
exploit|v.|利用；剥削|utilise, harness, take advantage of
facilitate|v.|促进；使便利|ease, promote, expedite
feasible|adj.|可行的；行得通的|viable, practicable, workable
fluctuate|v.|波动；起伏|vary, oscillate, waver
formulate|v.|制定；系统阐述|devise, draft, frame
fundamental|adj.|基本的；根本的|basic, underlying, elementary
furthermore|adv.|此外；而且|moreover, besides, in addition
generate|v.|产生；生成|produce, create, yield
hence|adv.|因此；所以|therefore, thus, consequently
hypothesis|n.|假设；假说|theory, supposition, premise
identical|adj.|完全相同的|same, indistinguishable, matching
illustrate|v.|说明；举例说明|demonstrate, exemplify, depict
imply|v.|暗示；意味着|suggest, hint, indicate
impose|v.|强加；施加|enforce, inflict, levy
incentive|n.|激励；动机|motivation, inducement, stimulus
incline|v.|倾向于；倾向|tend, lean, be disposed
incorporate|v.|包含；纳入|include, integrate, embody
indicate|v.|表明；指出|show, signal, denote
inevitable|adj.|不可避免的|unavoidable, inescapable, certain
infer|v.|推断|deduce, conclude, gather
inherent|adj.|固有的；内在的|intrinsic, innate, built-in
inhibit|v.|抑制；阻碍|restrain, hinder, impede
initiate|v.|发起；开始|launch, commence, instigate
innovative|adj.|创新的|creative, original, pioneering
integrate|v.|整合；融合|combine, merge, incorporate
interpret|v.|解释；理解|explain, construe, decipher
intervene|v.|干预；介入|interfere, step in, mediate
intrinsic|adj.|内在的；本质的|inherent, innate, essential
justify|v.|证明……正当|warrant, defend, vindicate
maintain|v.|维持；主张|sustain, preserve, assert
margin|n.|差额；边缘|difference, edge, leeway
maximum|adj./n.|最大的；最大值|utmost, peak, ceiling
mechanism|n.|机制；机构|system, process, apparatus
minimal|adj.|最小的；极少的|negligible, least, token
modify|v.|修改；调整|alter, adjust, amend
mutual|adj.|相互的；共同的|reciprocal, shared, joint
nevertheless|adv.|然而；尽管如此|nonetheless, however, still
notion|n.|概念；观念|idea, concept, belief
objective|adj./n.|客观的；目标|impartial, neutral, goal
obtain|v.|获得|acquire, secure, procure
obvious|adj.|明显的|evident, apparent, plain
occupy|v.|占据；占用|take up, inhabit, engage
occur|v.|发生；出现|happen, arise, transpire
optimise|v.|优化|improve, refine, maximise
outcome|n.|结果；成果|result, consequence, upshot
overall|adj./adv.|总体的；总的来说|general, aggregate, broadly
perceive|v.|察觉；理解|notice, discern, regard
persist|v.|持续；坚持|continue, endure, persevere
perspective|n.|观点；视角|viewpoint, standpoint, outlook
phenomenon|n.|现象|occurrence, event, marvel
plausible|adj.|貌似合理的|believable, credible, reasonable
potential|adj./n.|潜在的；潜力|possible, latent, capacity
precede|v.|在……之前|come before, predate, antedate
precise|adj.|精确的；准确的|exact, accurate, specific
predominant|adj.|主要的；占优势的|main, prevailing, dominant
preliminary|adj.|初步的；预备的|initial, preparatory, introductory
prescribe|v.|规定；开处方|stipulate, specify, ordain
prevalent|adj.|普遍的；流行的|widespread, common, prevailing
prohibit|v.|禁止|forbid, ban, outlaw
prominent|adj.|显著的；杰出的|notable, conspicuous, eminent
prone|adj.|易于……的；倾向于|liable, inclined, susceptible
proportion|n.|比例；部分|ratio, share, fraction
prospect|n.|前景；可能性|outlook, likelihood, potential
pursue|v.|追求；从事|chase, seek, engage in
radical|adj.|激进的；根本的|drastic, extreme, fundamental
reinforce|v.|加强；巩固|strengthen, bolster, cement
reject|v.|拒绝；否决|refuse, decline, dismiss
relevant|adj.|相关的；切题的|pertinent, applicable, germane
reluctant|adj.|不情愿的|unwilling, hesitant, loath
reluctantly|adv.|不情愿地|unwillingly, hesitantly, grudgingly
remarkable|adj.|非凡的；显著的|extraordinary, notable, striking
require|v.|需要；要求|need, demand, necessitate
resemble|v.|与……相似|look like, be similar to, mirror
reside|v.|居住；存在于|dwell, inhabit, lie
restrict|v.|限制|limit, confine, curb
retain|v.|保留；保持|keep, preserve, maintain
reveal|v.|揭示；显露|disclose, uncover, expose
reverse|v./adj.|颠倒；相反的|invert, opposite, contrary
rigorous|adj.|严格的；严谨的|strict, thorough, exacting
scope|n.|范围；余地|range, extent, ambit
significant|adj.|重要的；显著的|important, notable, substantial
simultaneously|adv.|同时地|at the same time, concurrently, together
solely|adv.|仅仅；唯一地|only, exclusively, purely
sophisticated|adj.|复杂的；精致的|advanced, refined, complex
stable|adj.|稳定的|steady, firm, constant
static|adj.|静态的；不变的|fixed, stationary, unchanging
stimulate|v.|刺激；激励|encourage, spur, motivate
subsequent|adj.|随后的；后来的|following, later, succeeding
substitute|n./v.|替代品；代替|replacement, swap, supplant
subtle|adj.|微妙的；细微的|delicate, nuanced, understated
sufficient|adj.|足够的|adequate, ample, enough
supplement|v./n.|补充；增补|augment, add to, complement
suppress|v.|压制；抑制|quell, stifle, repress
surpass|v.|超越；胜过|exceed, outdo, eclipse
sustain|v.|维持；支撑|maintain, uphold, preserve
tendency|n.|趋势；倾向|trend, inclination, propensity
thereby|adv.|从而；因此|thus, by that means, consequently
thorough|adj.|彻底的；详尽的|exhaustive, meticulous, complete
transform|v.|转变；改造|change, convert, metamorphose
transmit|v.|传输；传播|send, convey, broadcast
undergo|v.|经历；遭受|experience, endure, go through
undermine|v.|削弱；破坏|weaken, erode, sabotage
undertake|v.|承担；着手|assume, embark on, take on
uniform|adj.|一致的；统一的|consistent, even, standardized
utilise|v.|利用|use, employ, apply
valid|adj.|有效的；合理的|sound, legitimate, cogent
vary|v.|变化；不同|differ, fluctuate, diverge
versatile|adj.|多才多艺的；通用的|adaptable, flexible, all-round
viable|adj.|可行的|feasible, workable, practicable
virtually|adv.|几乎；实际上|almost, practically, nearly
vital|adj.|至关重要的|essential, crucial, indispensable
widespread|adj.|广泛的；普遍的|prevalent, extensive, pervasive
`,
  },
  {
    slug: 'environment',
    name: '环境与气候',
    desc: '气候、污染、生态与可持续发展相关词汇',
    category: '话题词汇',
    position: 40,
    topic: 'environment',
    difficulty: 3,
    rows: `
biodiversity|n.|生物多样性|biological diversity, variety of species
carbon|n.|碳|C, carbon element
climate|n.|气候|weather pattern, atmospheric condition
conservation|n.|保护；保育|preservation, protection, safeguarding
contaminate|v.|污染；玷污|pollute, taint, adulterate
deforestation|n.|森林砍伐|forest clearance, logging
degrade|v.|退化；降级|deteriorate, decline, debase
deplete|v.|耗尽；枯竭|exhaust, drain, use up
drought|n.|干旱|dry spell, aridity, water shortage
ecosystem|n.|生态系统|ecological system, biosphere
emission|n.|排放；排放物|discharge, release, effluent
endangered|adj.|濒危的|threatened, at risk, imperilled
erosion|n.|侵蚀；腐蚀|wearing away, corrosion, abrasion
extinction|n.|灭绝|dying out, annihilation, eradication
fertiliser|n.|化肥；肥料|manure, nutrient, compost
glacier|n.|冰川|ice sheet, ice field, icecap
greenhouse|n.|温室|glasshouse, hothouse
habitat|n.|栖息地|natural home, environment, niche
hybrid|adj./n.|混合的；杂交品种|mixed, crossbred, composite
landfill|n.|垃圾填埋场|dump, waste site, tip
organic|adj.|有机的|natural, biological, chemical-free
ozone|n.|臭氧|O3, ozone layer
pesticide|n.|杀虫剂；农药|insecticide, herbicide, chemical spray
pollutant|n.|污染物|contaminant, impurity, toxic substance
recycle|v.|回收利用|reuse, reprocess, salvage
renewable|adj.|可再生的|sustainable, replenishable, green
resource|n.|资源|asset, reserve, supply
sustainability|n.|可持续性|viability, durability, eco-friendliness
toxic|adj.|有毒的|poisonous, harmful, noxious
waste|n./v.|废物；浪费|rubbish, refuse, squander
atmosphere|n.|大气；气氛|air, ambience, aura
absorb|v.|吸收|soak up, take in, assimilate
emerge|v.|出现；显露|appear, arise, surface
alternative|n./adj.|替代方案；可供选择的|substitute, option, backup
urgent|adj.|紧急的|pressing, critical, immediate
irreversible|adj.|不可逆的|permanent, unalterable, irreparable
drain|v./n.|排水；消耗|empty, deplete, sewer
preserve|v.|保护；保存|protect, conserve, maintain
rehabilitate|v.|恢复；修复|restore, renovate, reinstate
regulate|v.|管理；调节|control, govern, modulate
scarce|adj.|稀缺的|limited, insufficient, in short supply
surplus|n./adj.|过剩；剩余的|excess, glut, leftover
inevitably|adv.|不可避免地|unavoidably, necessarily, inescapably
adverse|adj.|不利的；有害的|harmful, unfavourable, detrimental
substantial|adj.|大量的；实质的|considerable, significant, sizeable
consequence|n.|后果；结果|result, outcome, repercussion
mitigate|v.|减轻；缓和|alleviate, ease, lessen
consumption|n.|消费；消耗|usage, expenditure, intake
efficiency|n.|效率|productivity, effectiveness, economy
urbanisation|n.|城市化|city growth, urban development
congestion|n.|拥堵；堵塞|overcrowding, blockage, jam
infrastructure|n.|基础设施|facilities, framework, public works
pedestrian|n.|行人|walker, foot traveller
commute|v./n.|通勤|travel to work, journey
`,
  },
  {
    slug: 'education',
    name: '教育与学习',
    desc: '学校、教学、评估与学习方式相关词汇',
    category: '话题词汇',
    position: 41,
    topic: 'education',
    difficulty: 2,
    rows: `
curriculum|n.|课程；课程体系|syllabus, programme of study
literacy|n.|读写能力|reading ability, competence in reading
numeracy|n.|计算能力|mathematical skill, number sense
tuition|n.|学费；教学|instruction, teaching, fees
tutor|n.|导师；家教|instructor, coach, mentor
seminar|n.|研讨会；研讨课|workshop, discussion group
lecture|n.|讲座；授课|talk, presentation, class
assignment|n.|作业；任务|task, coursework, project
dissertation|n.|学位论文|thesis, paper, treatise
scholarship|n.|奖学金|grant, bursary, award
enrol|v.|注册；报名|register, sign up, matriculate
graduate|v./n.|毕业；毕业生|complete studies, alumnus
undergraduate|n.|本科生|bachelor student, first-degree student
vocational|adj.|职业的|occupational, professional, trade
compulsory|adj.|强制的；义务的|mandatory, obligatory, required
discipline|n.|纪律；学科|order, field of study, subject
motivate|v.|激励|encourage, inspire, spur
engage|v.|参与；吸引|involve, participate, captivate
participate|v.|参加；参与|take part, join in, engage
attend|v.|出席；上（学）|be present at, go to, frequent
peer|n.|同龄人；同伴|equal, fellow, contemporary
cognitive|adj.|认知的|mental, intellectual, perceptual
retain|v.|记住；保留|remember, keep, preserve
comprehend|v.|理解|understand, grasp, apprehend
acquire|v.|习得；获得|learn, gain, obtain
aptitude|n.|天资；才能|talent, flair, capability
distraction|n.|分心；干扰|diversion, interference, interruption
concentration|n.|专注；集中|focus, attention, absorption
collaborate|v.|合作|cooperate, work together, team up
facilitate|v.|促进；使便利|ease, assist, enable
enhance|v.|提升；增强|improve, boost, augment
cultivate|v.|培养；培育|nurture, foster, develop
enlighten|v.|启发；开导|inform, edify, illuminate
stimulating|adj.|令人振奋的；启发性的|inspiring, thought-provoking, engaging
authoritative|adj.|权威的|reliable, definitive, trustworthy
innovative|adj.|创新的|original, inventive, novel
practical|adj.|实用的；实践的|hands-on, pragmatic, functional
theoretical|adj.|理论的|abstract, conceptual, academic
proficient|adj.|熟练的；精通的|skilled, adept, competent
fluent|adj.|流利的|articulate, smooth, effortless
`,
  },
  {
    slug: 'technology',
    name: '科技与创新',
    desc: '互联网、自动化、人工智能与数字化相关词汇',
    category: '话题词汇',
    position: 42,
    topic: 'technology',
    difficulty: 3,
    rows: `
innovation|n.|创新|novelty, breakthrough, invention
automation|n.|自动化|mechanisation, computerisation
algorithm|n.|算法|procedure, computation, formula
artificial|adj.|人工的；人造的|synthetic, man-made, simulated
digital|adj.|数字的|electronic, computerised, virtual
device|n.|设备；装置|gadget, appliance, instrument
gadget|n.|小装置；小玩意|device, contraption, tool
network|n.|网络|system, web, grid
database|n.|数据库|data store, repository, archive
encryption|n.|加密|encoding, ciphering, scrambling
privacy|n.|隐私|confidentiality, seclusion, intimacy
surveillance|n.|监控；监视|monitoring, observation, scrutiny
virtual|adj.|虚拟的|simulated, online, digital
prototype|n.|原型；样机|model, mock-up, trial version
patent|n.|专利|licence, copyright, exclusive right
breakthrough|n.|突破|advance, leap, discovery
obsolete|adj.|过时的|outdated, antiquated, outmoded
efficient|adj.|高效的|effective, productive, streamlined
productivity|n.|生产力；效率|output, efficiency, yield
revolutionise|v.|彻底改变|transform, overhaul, reinvent
integrate|v.|整合|combine, merge, incorporate
interface|n.|界面；接口|front end, connection, junction
manipulate|v.|操纵；操作|control, handle, manoeuvre
accessibility|n.|可访问性；无障碍|availability, ease of access
reliable|adj.|可靠的|dependable, trustworthy, consistent
versatile|adj.|多功能的|adaptable, flexible, multi-purpose
cyber|adj.|网络的|online, internet-based, computer
redundant|adj.|多余的；冗余的|superfluous, unnecessary, surplus
implement|v.|实施；执行|carry out, execute, apply
optimise|v.|优化|improve, refine, enhance
simulate|v.|模拟|replicate, imitate, model
automate|v.|使自动化|mechanise, computerise, streamline
wireless|adj.|无线的|cordless, Wi-Fi enabled, remote
portable|adj.|便携的|mobile, handheld, lightweight
consume|v.|消耗；消费|use up, expend, devour
dependence|n.|依赖；依靠|reliance, dependency, trust
exposure|n.|接触；暴露|contact, disclosure, revelation
immerse|v.|沉浸；使专注|engross, absorb, involve deeply
interactive|adj.|交互的|responsive, two-way, participatory
seamless|adj.|无缝的；顺畅的|smooth, uninterrupted, fluid
`,
  },
  {
    slug: 'society',
    name: '社会与文化',
    desc: '人口、公平、多元文化与城市化相关词汇',
    category: '话题词汇',
    position: 43,
    topic: 'society',
    difficulty: 3,
    rows: `
inequality|n.|不平等|disparity, imbalance, unfairness
disparity|n.|差距；悬殊|gap, difference, imbalance
poverty|n.|贫困|destitution, hardship, penury
welfare|n.|福利；福祉|benefits, wellbeing, aid
migration|n.|迁移；移民|movement, relocation, emigration
integrate|v.|融入；融合|assimilate, incorporate, blend
assimilate|v.|同化；吸收|absorb, integrate, absorb
discrimination|n.|歧视|prejudice, bias, unfair treatment
prejudice|n.|偏见|bias, preconception, partiality
stereotype|n.|刻板印象|cliché, generalisation, label
diversity|n.|多样性|variety, multiplicity, heterogeneity
heritage|n.|遗产；传统|legacy, tradition, inheritance
tradition|n.|传统|custom, convention, practice
custom|n.|习俗|custom, habit, convention
ritual|n.|仪式；例行公事|ceremony, rite, practice
generation|n.|一代人|age group, cohort, era
urban|adj.|城市的|metropolitan, city, civic
rural|adj.|乡村的|countryside, agricultural, pastoral
suburb|n.|郊区|outskirts, residential area, commuter belt
demographic|adj./n.|人口的；人口结构|population, statistical, census
ageing|adj./n.|老龄化的|growing old, elderly, senescence
cohesion|n.|凝聚力|unity, solidarity, togetherness
hierarchy|n.|等级制度|ranking, order, pecking order
conformity|n.|从众；一致性|compliance, obedience, adherence
individualism|n.|个人主义|self-reliance, independence, autonomy
collectivism|n.|集体主义|communalism, solidarity, group orientation
marginalise|v.|边缘化|sideline, exclude, alienate
exclude|v.|排斥；排除|shut out, bar, omit
norm|n.|规范；常态|standard, convention, benchmark
peer pressure|n.|同伴压力|social pressure, group influence
anonymity|n.|匿名|namelessness, obscurity, privacy
isolation|n.|孤立；隔离|seclusion, separation, solitude
solidarity|n.|团结|unity, mutual support, cohesion
urbanised|adj.|城市化的|citified, metropolitan, developed
cosmopolitan|adj.|世界性的；国际化的|international, global, multicultural
reciprocity|n.|互惠|mutual exchange, give-and-take
deprivation|n.|匮乏；剥夺|hardship, poverty, privation
inclusive|adj.|包容的|comprehensive, all-embracing, open
egalitarian|adj.|平等主义的|equal, democratic, fair
coexist|v.|共存|live together, coexist, harmonise
`,
  },
  {
    slug: 'health',
    name: '健康与医疗',
    desc: '疾病、营养、生活方式与医疗体系相关词汇',
    category: '话题词汇',
    position: 44,
    topic: 'health',
    difficulty: 3,
    rows: `
nutrition|n.|营养|nourishment, diet, sustenance
obesity|n.|肥胖|overweight, corpulence, fatness
sedentary|adj.|久坐的|inactive, desk-bound, stationary
epidemic|n.|流行病|outbreak, plague, contagion
pandemic|n.|大流行病|global outbreak, widespread disease
vaccination|n.|接种疫苗|immunisation, inoculation, jab
immunity|n.|免疫力|resistance, protection, defence
chronic|adj.|慢性的；长期的|persistent, long-term, lingering
symptom|n.|症状|sign, indication, manifestation
diagnosis|n.|诊断|identification, assessment, prognosis
therapy|n.|治疗；疗法|treatment, remedy, intervention
remedy|n.|疗法；补救办法|cure, treatment, solution
hygiene|n.|卫生|cleanliness, sanitation, health practices
calorie|n.|卡路里|energy unit, kilocalorie
addiction|n.|上瘾；成瘾|dependence, compulsion, habit
insomnia|n.|失眠|sleeplessness, wakefulness
metabolism|n.|新陈代谢|bodily process, biochemical conversion
infection|n.|感染|contagion, contamination, disease
antibiotic|n.|抗生素|antibacterial, antimicrobial drug
prevention|n.|预防|precaution, avoidance, prophylaxis
wellbeing|n.|身心健康|health, welfare, wellness
ailment|n.|小病；不适|illness, complaint, disorder
fatigue|n.|疲劳|exhaustion, tiredness, weariness
vitality|n.|活力|vigour, energy, liveliness
nutritious|adj.|有营养的|nourishing, wholesome, healthy
processed|adj.|加工过的|refined, manufactured, treated
allergy|n.|过敏|hypersensitivity, intolerance, reaction
depression|n.|抑郁；沮丧|melancholy, low mood, despondency
cognitive|adj.|认知的|mental, intellectual, cerebral
impair|v.|损害；削弱|damage, weaken, hinder
recuperate|v.|康复；恢复|recover, convalesce, heal
contagious|adj.|传染性的|infectious, transmissible, catching
beneficial|adj.|有益的|advantageous, healthful, helpful
supplement|n.|补充剂；营养品|additive, extra, complement
regimen|n.|养生法；方案|routine, programme, regime
immunise|v.|使免疫|vaccinate, inoculate, protect
hormone|n.|激素|chemical messenger, secretion
degenerative|adj.|退化的；变性的|deteriorating, progressive, worsening
rehabilitation|n.|康复治疗|recovery, restoration, therapy
preventive|adj.|预防性的|precautionary, prophylactic, protective
`,
  },
  {
    slug: 'economy',
    name: '经济与商业',
    desc: '市场、贸易、就业与个人理财相关词汇',
    category: '话题词汇',
    position: 45,
    topic: 'economy',
    difficulty: 3,
    rows: `
inflation|n.|通货膨胀|price rise, currency devaluation
recession|n.|经济衰退|downturn, slump, depression
unemployment|n.|失业|joblessness, redundancy, idle workforce
revenue|n.|收入；税收|income, earnings, proceeds
profit|n.|利润|gain, return, surplus
investment|n.|投资|funding, capital, stake
subsidy|n.|补贴|grant, allowance, subvention
tariff|n.|关税|duty, levy, tax on imports
monopoly|n.|垄断|exclusive control, domination, cartel
competition|n.|竞争|rivalry, contest, contention
entrepreneur|n.|企业家|business owner, innovator, founder
consumer|n.|消费者|customer, buyer, purchaser
demand|n./v.|需求；要求|requirement, call for, need
supply|n./v.|供给|provision, stock, furnish
budget|n.|预算|allocation, financial plan, allowance
deficit|n.|赤字；亏损|shortfall, shortfall, arrears
currency|n.|货币|money, legal tender, coinage
transaction|n.|交易|deal, exchange, purchase
retail|n./adj.|零售|sales, consumer trade, merchandising
commerce|n.|商业；贸易|trade, business, dealings
manufacture|v./n.|制造|produce, fabricate, make
industry|n.|工业；行业|sector, manufacturing, business
economy|n.|经济；节约|financial system, thrift, frugality
commodity|n.|商品|goods, merchandise, product
fluctuate|v.|波动|vary, waver, oscillate
stagnant|adj.|停滞的|static, sluggish, inactive
prosperity|n.|繁荣|wealth, affluence, boom
affluent|adj.|富裕的|wealthy, prosperous, well-off
frugal|adj.|节俭的|thrifty, economical, sparing
incentive|n.|激励措施|motivation, stimulus, inducement
entrepreneurial|adj.|创业的|enterprising, innovative, commercial
diversify|v.|使多样化|broaden, vary, expand
venture|n./v.|创业项目；冒险|enterprise, undertaking, gamble
leverage|v./n.|利用；杠杆|catalyse, capitalise on, influence
liquidity|n.|流动性|solvency, cash flow, marketability
depreciate|v.|贬值；折旧|devalue, decline, lose value
appreciate|v.|增值；升值|increase, rise, gain value
bankruptcy|n.|破产|insolvency, liquidation, ruin
outsource|v.|外包|contract out, subcontract, delegate
productivity|n.|生产率|output, efficiency, yield
`,
  },
  {
    slug: 'government',
    name: '政府与法律',
    desc: '立法、公共服务、政策与权利相关词汇',
    category: '话题词汇',
    position: 46,
    topic: 'government',
    difficulty: 4,
    rows: `
legislation|n.|立法；法规|laws, statutes, enactments
regulation|n.|法规；管制|rule, ordinance, control
policy|n.|政策|plan, strategy, guideline
authority|n.|权威；当局|power, jurisdiction, officials
parliament|n.|议会|legislature, congress, assembly
democracy|n.|民主|rule by the people, self-government
constitution|n.|宪法|charter, fundamental law
judicial|adj.|司法的|legal, judiciary, court-related
verdict|n.|裁决|ruling, decision, judgment
penalty|n.|处罚；罚款|punishment, sanction, fine
illegal|adj.|非法的|unlawful, illicit, prohibited
lawsuit|n.|诉讼|legal action, litigation, case
enforcement|n.|执法；强制执行|implementation, imposition, policing
taxation|n.|征税；税收|levy, duties, fiscal charges
petition|n./v.|请愿；请愿书|appeal, plea, request
campaign|n./v.|运动；竞选|drive, movement, crusade
referendum|n.|全民公投|public vote, plebiscite, ballot
sovereign|adj./n.|主权的；君主|autonomous, independent, ruler
bureaucracy|n.|官僚机构；官僚体制|administration, red tape, officialdom
municipal|adj.|市政的|local, civic, metropolitan
federal|adj.|联邦的|central, national, union
mandate|n./v.|授权；命令|authorisation, directive, instruction
compliance|n.|遵守；合规|obedience, adherence, conformity
accountability|n.|问责；责任|responsibility, liability, answerability
transparency|n.|透明度|openness, clarity, visibility
corruption|n.|腐败|dishonesty, bribery, graft
reform|n./v.|改革|improvement, overhaul, amend
ratify|v.|正式批准|approve, endorse, sanction
amend|v.|修订|revise, modify, alter
enact|v.|颁布；实施|pass, legislate, implement
sanction|n./v.|制裁；批准|penalty, embargo, approve
deterrent|n.|威慑；制止物|disincentive, restraint, check
jurisdiction|n.|司法权；管辖范围|authority, purview, remit
statutory|adj.|法定的|legal, prescribed, enacted by law
civic|adj.|城市的；公民的|public, municipal, citizen-related
egalitarian|adj.|平等主义的|equal, fair, democratic
subsidiary|adj./n.|附属的；子公司|secondary, auxiliary, branch
allocate|v.|分配；划拨|assign, apportion, distribute
advocate|v./n.|倡导；拥护者|support, champion, proponent
scrutiny|n.|审查；仔细检查|examination, inspection, review
`,
  },

  // ==================== 以下为话题扩充册 ====================
  {
    slug: 'urban',
    name: '城市与交通',
    desc: '城市化、住房、通勤与公共交通相关词汇，Task 2 城市类话题必备',
    category: '话题词汇',
    position: 47,
    topic: 'urban',
    difficulty: 3,
    rows: `
urbanisation|n.|城市化|urban growth, city expansion
urban|adj.|城市的；都市的|metropolitan, civic, city-based
rural|adj.|农村的；乡村的|countryside, agricultural, pastoral
suburb|n.|郊区；近郊|outskirts, residential district
outskirts|n.|市郊；外围|periphery, suburbs, fringe
commute|v./n.|通勤；上下班往返|travel to work, daily journey
commuter|n.|通勤者|daily traveller, passenger
congestion|n.|拥堵；堵塞|overcrowding, blockage, traffic jam
infrastructure|n.|基础设施|public facilities, basic services
transit|n.|运输；公共交通|transport, passage, conveyance
pedestrian|n.|行人；步行者|walker, foot passenger
cyclist|n.|骑自行车的人|biker, bicycle rider
highway|n.|公路；干道|motorway, expressway, freeway
railway|n.|铁路；铁道|railroad, rail network
metropolitan|adj.|大都市的|urban, citywide
migrate|v.|迁移；移居|relocate, resettle, move
migration|n.|迁移；移民|relocation, movement, resettlement
density|n.|密度|concentration, compactness
overcrowded|adj.|过度拥挤的|congested, packed, cramped
residential|adj.|住宅的；居住的|housing, domestic
commercial|adj.|商业的|business, trading
downtown|n.|市中心|city centre, central district
facility|n.|设施；设备|amenity, provision, installation
accessibility|n.|可达性；便利性|availability, ease of access
emission|n.|排放（物）|discharge, release
vehicle|n.|车辆；交通工具|automobile, conveyance
efficient|adj.|高效的|effective, productive
sustainable|adj.|可持续的|viable, maintainable, green
renovate|v.|翻新；整修|refurbish, restore, modernise
demolish|v.|拆除；摧毁|tear down, knock down
construct|v.|建造；构建|build, erect, assemble
expansion|n.|扩张；扩展|growth, enlargement
zone|n.|区域；地带|area, district, region
sprawl|n./v.|（城市）无序扩张|urban spread, outward growth
timetable|n.|时刻表；时间表|schedule, itinerary
fare|n.|车费；票价|charge, ticket price
route|n.|路线；航线|path, course, itinerary
underground|n.|地铁|subway, metro, tube
carriageway|n.|车道；车行道|roadway, lane
adjoining|adj.|毗邻的；相邻的|neighbouring, adjacent
amenity|n.|便利设施|facility, convenience, service
congested|adj.|拥堵的|jammed, blocked, overcrowded
`
  },
  {
    slug: 'media',
    name: '媒体与广告',
    desc: '新闻报道、社交媒体与广告营销相关词汇，Task 2 媒体类话题必备',
    category: '话题词汇',
    position: 48,
    topic: 'media',
    difficulty: 3,
    rows: `
journalism|n.|新闻业；新闻工作|reporting, news coverage
journalist|n.|记者|reporter, correspondent, columnist
broadcast|v./n.|播送；广播节目|transmit, air, stream
coverage|n.|报道；覆盖面|reporting, exposure
headline|n.|头条；标题|title, caption
editorial|n./adj.|社论；编辑的|commentary, opinion piece
publicity|n.|宣传；公众关注|promotion, exposure, attention
advertise|v.|做广告；宣传|promote, publicise, market
advertisement|n.|广告|commercial, promotion, ad
campaign|n.|（宣传）活动|drive, initiative, movement
audience|n.|观众；受众|viewers, readership, public
viewership|n.|收视观众（总数）|audience share, ratings
circulation|n.|发行量；流通|distribution, readership
censorship|n.|审查制度|suppression, restriction
propaganda|n.|（带倾向的）宣传|indoctrination, biased publicity
credibility|n.|可信度；公信力|reliability, trustworthiness
bias|n.|偏见；偏向|prejudice, slant, partiality
objective|adj.|客观的|impartial, neutral, unbiased
sensational|adj.|耸人听闻的|dramatic, exaggerated, lurid
misleading|adj.|误导性的|deceptive, inaccurate, false
persuade|v.|说服；劝说|convince, urge, coax
consumerism|n.|消费主义|materialism, commercialism
sponsor|v./n.|赞助；赞助商|fund, backer, patron
endorse|v.|代言；认可|support, promote, back
commercial|adj.|商业化的|profit-driven, mercenary
platform|n.|平台；媒介|channel, medium, outlet
subscription|n.|订阅；订阅费|membership, fee
streaming|n.|流媒体播放|online broadcasting, web streaming
privacy|n.|隐私|confidentiality, seclusion
copyright|n.|版权|intellectual property rights
stereotype|n.|刻板印象|generalisation, cliche
viral|adj.|病毒式传播的|rapidly shared, trending
influential|adj.|有影响力的|powerful, persuasive, significant
reputation|n.|名声；声誉|standing, repute, image
slander|n./v.|诽谤；造谣|defamation, libel
paparazzi|n.|狗仔队|press photographers, tabloid press
tabloid|n.|小报；通俗报刊|popular press, gutter press
discourse|n.|话语；论述|discussion, debate, dialogue
anonymous|adj.|匿名的|unnamed, unidentified
verification|n.|核实；验证|confirmation, validation
`
  },
  {
    slug: 'culture-travel',
    name: '文化与旅游',
    desc: '传统文化、文化遗产与旅游业相关词汇，Task 2 文化类话题必备',
    category: '话题词汇',
    position: 49,
    topic: 'culture',
    difficulty: 3,
    rows: `
heritage|n.|遗产；传统|cultural legacy, tradition
tradition|n.|传统；惯例|custom, convention, practice
custom|n.|风俗；习惯|tradition, practice, convention
ritual|n.|仪式；例行公事|ceremony, rite, practice
ceremony|n.|典礼；仪式|rite, formal occasion
folklore|n.|民间传说|folktale, legend, tradition
indigenous|adj.|本土的；原生的|native, aboriginal, local
ethnic|adj.|民族的；种族的|racial, cultural, tribal
diversity|n.|多样性|variety, multiplicity, range
multicultural|adj.|多元文化的|culturally diverse, pluralistic
assimilate|v.|同化；融入|integrate, absorb, blend in
preserve|v.|保护；保存|conserve, maintain, protect
conservation|n.|保护；保存|preservation, protection
restoration|n.|修复；恢复|repair, renovation, revival
artifact|n.|手工艺品；文物|relic, antiquity, artefact
antique|n./adj.|古董；古老的|vintage, ancient, old
monument|n.|纪念碑；遗迹|memorial, statue, landmark
landmark|n.|地标；里程碑|monument, milestone, feature
tourism|n.|旅游业|travel industry, sightseeing
destination|n.|目的地|endpoint, target location
souvenir|n.|纪念品|keepsake, memento
itinerary|n.|行程；旅行路线|travel plan, schedule, route
hospitality|n.|款待；酒店业|welcome, service industry
cuisine|n.|烹饪；菜系|cooking, culinary tradition
gastronomy|n.|美食学|culinary art, cooking
festival|n.|节日；节庆|celebration, carnival, fete
exhibition|n.|展览；展出|display, show, exposition
gallery|n.|画廊；美术馆|exhibition space, museum
craft|n.|工艺；手艺|handicraft, artistry, skill
authentic|adj.|真实的；正宗的|genuine, original, real
commercialise|v.|商业化|marketise, monetise
globalisation|n.|全球化|worldwide integration
exotic|adj.|异国情调的|foreign, unusual, striking
scenery|n.|风景；景色|landscape, view, vista
landscape|n.|风景；地貌|scenery, terrain, vista
excursion|n.|远足；短途旅行|trip, outing, tour
accommodation|n.|住宿|lodging, housing, quarters
ecotourism|n.|生态旅游|sustainable tourism, green travel
pilgrimage|n.|朝圣；朝觐|religious journey, quest
ancestor|n.|祖先；祖辈|forebear, forefather
descendant|n.|后代；子孙|offspring, successor
`
  },
  {
    slug: 'work',
    name: '工作与职业',
    desc: '就业、职业发展与职场相关词汇，Task 2 工作类话题必备',
    category: '话题词汇',
    position: 50,
    topic: 'work',
    difficulty: 3,
    rows: `
career|n.|职业；事业|profession, occupation, vocation
profession|n.|职业（专业型）|occupation, career, trade
occupation|n.|职业；占领|job, profession, employment
employment|n.|就业；雇用|work, job, engagement
unemployment|n.|失业|joblessness, redundancy
recruit|v.|招聘；招募|hire, enlist, take on
candidate|n.|候选人；应聘者|applicant, nominee
applicant|n.|申请人|candidate, aspirant
interview|n./v.|面试；采访|meeting, audition
qualification|n.|资格；学历|credential, certification
competence|n.|能力；胜任|ability, proficiency, skill
expertise|n.|专业知识；专长|know-how, proficiency, skill
promotion|n.|晋升；推广|advancement, upgrade
salary|n.|薪水|wage, pay, remuneration
wage|n.|工资（时薪/日薪）|pay, earnings, salary
remuneration|n.|报酬；酬金|payment, compensation
bonus|n.|奖金；红利|incentive, reward, premium
incentive|n.|激励；奖励|motivation, inducement, reward
allowance|n.|津贴；补助|stipend, grant, benefit
workload|n.|工作量|burden, task load
overtime|n.|加班（时间）|extra hours, additional work
flexible|adj.|灵活的|adaptable, adjustable, elastic
freelance|adj.|自由职业的|self-employed, independent
entrepreneur|n.|企业家；创业者|business owner, innovator
productivity|n.|生产力；效率|efficiency, output, yield
efficiency|n.|效率|productivity, effectiveness
colleague|n.|同事|coworker, associate, peer
supervisor|n.|主管；导师|manager, overseer, boss
subordinate|n./adj.|下属；从属的|junior, underling
appraisal|n.|评估；考核|evaluation, assessment, review
resign|v.|辞职|quit, step down, leave
dismiss|v.|解雇；驳回|fire, discharge, sack
redundancy|n.|裁员；冗余|layoff, downsizing
retire|v.|退休|step down, withdraw
pension|n.|养老金|retirement pay, annuity
benefit|n.|福利；好处|perk, advantage, entitlement
morale|n.|士气|spirit, confidence, motivation
burnout|n.|职业倦怠；过度疲劳|exhaustion, fatigue
specialise|v.|专门从事|focus on, concentrate on
versatile|adj.|多才多艺的；多用途的|adaptable, flexible, all-round
diligent|adj.|勤奋的|hardworking, industrious, assiduous
ambitious|adj.|有雄心的|aspiring, driven, determined
initiative|n.|主动性；倡议|enterprise, drive, proposal
discipline|n.|纪律；学科|self-control, order, field
`
  },
];
