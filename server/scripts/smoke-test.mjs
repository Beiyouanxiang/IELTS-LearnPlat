// 端到端冒烟测试：覆盖注册/登录 → 词库 → 检索 → 状态筛选 → SRS → 三种题型测验 → 错题本 → 统计 → 听力
// 用法：node scripts/smoke-test.mjs
// 环境变量：BASE（默认 http://127.0.0.1:3007）、SMOKE_USER、SMOKE_PASS、SMOKE_INVITE
const BASE = process.env.BASE || 'http://127.0.0.1:3007';
const USER = process.env.SMOKE_USER || 'smoketest';
const PASS = process.env.SMOKE_PASS || 'smoke12345';
const INVITE = process.env.SMOKE_INVITE || '';

let token = null;
let passed = 0;
let failed = 0;
const failures = [];

function check(name, ok, extra = '') {
  if (ok) {
    passed += 1;
    console.log(`  \u2713 ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  \u2717 ${name}${extra ? '  → ' + extra : ''}`);
  }
}

function section(t) {
  console.log(`\n${t}`);
}

async function call(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${raw ? '' : '/api'}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data, contentType: res.headers.get('content-type') };
}

async function main() {
  console.log(`目标：${BASE}  用户：${USER}`);

  // ---------- 健康 ----------
  section('① 基础');
  const h = await call('/health', { auth: false });
  check('健康检查返回 ok', h.status === 200 && h.data?.ok === true);

  const info = await call('/info', { auth: false });
  check('信息接口返回名称与版本', !!info.data?.name && !!info.data?.version);
  check('词库容量大于 400', (info.data?.stats?.words || 0) > 400, `当前 ${info.data?.stats?.words}`);
  check('信息接口不泄露密钥', !JSON.stringify(info.data).match(/sk-|API_KEY|apiKey/i));

  const noAuth = await call('/vocab/stats', { auth: false });
  check('无 token 访问被拒绝（401）', noAuth.status === 401);

  // ---------- 登录 ----------
  section('② 鉴权');
  let login = await call('/auth/login', { method: 'POST', body: { username: USER, password: PASS }, auth: false });
  if (login.status !== 200 && INVITE) {
    const reg = await call('/auth/register', {
      method: 'POST',
      auth: false,
      body: { username: USER, password: PASS, invite_code: INVITE },
    });
    check('用邀请码注册成功（201）', reg.status === 201, JSON.stringify(reg.data).slice(0, 120));
    login = { status: 200, data: reg.data };
  }
  check('登录成功并返回 token', login.status === 200 && !!login.data?.token, JSON.stringify(login.data).slice(0, 120));
  token = login.data?.token;
  if (!token) {
    console.error('\n未能取得 token，后续用例无法执行。');
    console.error(`服务端返回：${JSON.stringify(login.data)}`);
    if (login.status === 429) {
      console.error('提示：触发了登录限流，请等 15 分钟或清空 rate_limits 表后重试。');
    } else if (!INVITE) {
      console.error('提示：该账号不存在时可设置 SMOKE_INVITE=<邀请码> 让其自动注册。');
    }
    process.exit(1);
  }

  const me = await call('/auth/me');
  check('获取当前用户信息', me.status === 200 && me.data?.user?.username === USER);

  const bad = await call('/auth/login', { method: 'POST', auth: false, body: { username: USER, password: 'wrong-pass-1' } });
  check('错误密码被拒绝（401）', bad.status === 401);

  // ---------- 词库 ----------
  section('③ 词库与检索');
  const lists = await call('/vocab/lists');
  check('词书列表返回 9 本以上', (lists.data?.lists?.length || 0) >= 9, `当前 ${lists.data?.lists?.length}`);

  const firstList = lists.data?.lists?.find((l) => l.slug === 'environment') || lists.data?.lists?.[0];
  const listDetail = await call(`/vocab/lists/${firstList.id}?page=1&size=10`);
  check('词书详情带分页', listDetail.status === 200 && Array.isArray(listDetail.data?.words));

  const words = await call('/vocab/words?page=1&size=10');
  check('单词列表分页返回', words.status === 200 && words.data?.words?.length === 10);

  const cjk = await call(`/vocab/words?q=${encodeURIComponent('环境')}`);
  check('中文逐字切词检索可用', cjk.status === 200 && (cjk.data?.total || 0) > 0, `命中 ${cjk.data?.total}`);

  const en = await call('/vocab/words?q=under');
  check('英文前缀检索可用', en.status === 200 && (en.data?.total || 0) > 0, `命中 ${en.data?.total}`);

  const st = await call('/vocab/words?state=starred');
  check('按状态筛选（生词本）可用', st.status === 200 && Array.isArray(st.data?.words));

  const byList = await call(`/vocab/words?list_id=${firstList.id}`);
  check('按词书筛选可用', byList.status === 200 && (byList.data?.total || 0) > 0);

  const target = (en.data?.words || words.data?.words || [])[0];
  const detail = await call(`/vocab/words/${target.id}`);
  check('单词详情返回同义替换数组', detail.status === 200 && Array.isArray(detail.data?.word?.synonyms));

  // ---------- 生词本 ----------
  section('④ 生词本');
  const starOn = await call('/vocab/star', { method: 'POST', body: { word_id: target.id, starred: true } });
  check('加入生词本', starOn.status === 200 && starOn.data?.starred === true);
  const starred = await call('/vocab/starred');
  check('生词本列表包含该词', (starred.data?.words || []).some((w) => w.id === target.id));
  const starOff = await call('/vocab/star', { method: 'POST', body: { word_id: target.id, starred: false } });
  check('移出生词本', starOff.status === 200 && starOff.data?.starred === false);

  // ---------- SRS ----------
  section('⑤ 间隔重复');
  const session = await call('/vocab/session');
  check('学习会话返回目标与队列', typeof session.data?.goal === 'number' && Array.isArray(session.data?.new));

  const rev = await call('/vocab/review', { method: 'POST', body: { word_id: target.id, quality: 4, source: 'smoke' } });
  check('提交复习并返回下次间隔', rev.status === 200 && (rev.data?.next?.interval_days ?? -1) >= 0, JSON.stringify(rev.data?.next));

  const revBad = await call('/vocab/review', { method: 'POST', body: { quality: 4 } });
  check('缺少 word_id 被拒绝（400）', revBad.status === 400);

  const rev0 = await call('/vocab/review', { method: 'POST', body: { word_id: target.id, quality: 0 } });
  check('「完全忘记」按 lapse 重新排期', rev0.status === 200 && rev0.data?.next?.state !== 'mastered');

  // ---------- 测验三种题型 ----------
  section('⑥ 测验（三种题型）');
  const cQuiz = await call('/vocab/quiz?mode=choice&count=10');
  const q1 = cQuiz.data?.questions?.[0];
  check('选择题返回 4 个选项', cQuiz.status === 200 && q1?.options?.length === 4);
  check('选择题选项含正确答案', !!q1?.options?.some((o) => o.id === q1.answer_id));
  check('选择题 4 个选项互不相同', new Set((q1?.options || []).map((o) => o.id)).size === 4);

  const sQuiz = await call('/vocab/quiz?mode=spell&count=10');
  const sq = sQuiz.data?.questions?.[0];
  check('拼写题返回答案文本与中文提示', sQuiz.status === 200 && !!sq?.answer_text && !!sq?.prompt);
  check('拼写题不返回选项', sq?.options === undefined);

  const lQuiz = await call('/vocab/quiz?mode=listening&count=10');
  const lq = lQuiz.data?.questions?.[0];
  check('听音题返回 4 个拼写选项', lQuiz.status === 200 && lq?.options?.length === 4 && !!lq?.audio_text);

  const badMode = await call('/vocab/quiz?mode=unknown&count=10');
  check('未知题型回落为选择题', badMode.data?.mode === 'choice');

  // 提交一轮测验（含对与错）
  const results = (cQuiz.data?.questions || []).map((qq, i) => ({
    word_id: qq.word_id,
    answer_id: i % 2 === 0 ? qq.answer_id : (qq.options.find((o) => o.id !== qq.answer_id) || {}).id,
    correct: i % 2 === 0,
    direction: qq.direction,
    mode: 'choice',
  }));
  const submit = await call('/vocab/quiz/submit', { method: 'POST', body: { results, duration_ms: 1234 } });
  check('提交测验返回准确率', submit.status === 200 && typeof submit.data?.accuracy === 'number');
  check('准确率等于对题数比例', Math.abs((submit.data?.accuracy || 0) - submit.data.correct / results.length) < 1e-6);

  const submitBad = await call('/vocab/quiz/submit', { method: 'POST', body: { results: 'nope' } });
  check('非法 results 被拒绝（400）', submitBad.status === 400);

  // ---------- 错题本 ----------
  section('⑦ 错题本');
  const wrong = await call('/vocab/wrong');
  check('错题本返回单词列表', wrong.status === 200 && Array.isArray(wrong.data?.words));
  check('错题本含累计答错次数', typeof wrong.data?.total_wrong === 'number');
  check('答错的词进入错题本', (wrong.data?.words || []).some((w) => w.id === target.id), '期望包含刚答错的词');

  // ---------- 统计 ----------
  section('⑧ 统计');
  const stats = await call('/vocab/stats');
  const w = stats.data?.words;
  check('统计返回四态分布', !!w && ['new', 'learning', 'review', 'mastered'].every((k) => typeof w[k] === 'number'));
  check('统计返回待复习数', typeof w?.due_now === 'number');
  check('统计返回累计复习次数', typeof stats.data?.totals?.reviews === 'number');
  check('统计返回活跃天数', typeof stats.data?.totals?.active_days === 'number');
  check('统计返回 30 天活跃数据', Array.isArray(stats.data?.daily));
  check('连续打卡为数字', typeof stats.data?.streak === 'number');

  // ---------- 听力 ----------
  section('⑨ 听力');
  const mats = await call('/listening/materials');
  check('听力素材列表可用', mats.status === 200 && Array.isArray(mats.data?.materials));

  const mk = await call('/listening/materials', {
    method: 'POST',
    body: { title: 'Smoke test material', transcript: 'Hello world. This is a test. Learning English is fun.', duration_sec: 9 },
  });
  check('创建听力素材（201）', mk.status === 201 && mk.data?.segment_count >= 3, JSON.stringify(mk.data).slice(0, 140));

  const matId = mk.data?.material?.id;
  const practice = await call(`/listening/materials/${matId}/practice?blind=1`);
  check('听写模式不返回原文', practice.status === 200 && !practice.data?.segments?.[0]?.text);
  const practice2 = await call(`/listening/materials/${matId}/practice?blind=0`);
  check('非听写模式返回原文', !!practice2.data?.segments?.[0]?.text);

  const segId = practice2.data?.segments?.[0]?.id;
  const attempt = await call('/listening/attempt', {
    method: 'POST',
    body: { segment_id: segId, user_input: 'Hello world', mode: 'dictation' },
  });
  check('听写比对返回分数与 diff', attempt.status === 200 && typeof attempt.data?.score === 'number' && !!attempt.data?.diff?.ops);

  const addWord = await call('/listening/vocab-add', { method: 'POST', body: { word: 'smoketestword' } });
  check('听力生词加入词库', (addWord.status === 200 || addWord.status === 201) && !!addWord.data?.word_id);

  await call(`/listening/materials/${matId}`, { method: 'DELETE' });
  const afterDel = await call(`/listening/materials/${matId}`);
  check('素材删除生效（404）', afterDel.status === 404);

  // ---------- 写作 ----------
  section('⑩ 写作与四维批改');
  const t2 = await call('/writing/prompts?task_type=task2');
  check('Task 2 题库至少 10 题', (t2.data?.total || 0) >= 10, `当前 ${t2.data?.total}`);
  check('题库返回分类列表', Array.isArray(t2.data?.categories) && t2.data.categories.length > 0);

  const t1 = await call('/writing/prompts?task_type=task1');
  check('Task 1 题库至少 6 题', (t1.data?.total || 0) >= 6, `当前 ${t1.data?.total}`);

  const promptId = t2.data?.prompts?.[0]?.id;
  const promptDetail = await call(`/writing/prompts/${promptId}`);
  check('题目详情返回提示与范文', promptDetail.status === 200 && !!promptDetail.data?.prompt?.prompt_en);
  check('范文带亮点句解析', (promptDetail.data?.model_essays?.[0]?.highlights || []).length > 0);
  check('不存在的题目返回 404', (await call('/writing/prompts/999999')).status === 404);

  const newEssay = await call('/writing/essays', { method: 'POST', body: { prompt_id: promptId, content: '', submit: false } });
  check('创建作文草稿', newEssay.status === 200 && !!newEssay.data?.id);
  const essayId = newEssay.data.id;

  const SAMPLE = `It is often argued that governments should invest more heavily in public transport than in new roads, and I broadly agree with this position.

The primary reason is efficiency. A single train can carry several hundred passengers using a fraction of the road space required by the same number of private cars. Consequently, investment in rail and bus networks relieves congestion far more effectively per unit of spending than the construction of additional lanes, which frequently attracts further traffic.

Environmental considerations point in the same direction. Transport accounts for a substantial share of urban emissions, and buses and trains emit considerably less per passenger kilometre. Shifting commuters onto these services is therefore one of the most practical measures available to a city.

Admittedly, new roads remain essential in rural regions where no realistic alternative exists. In dense urban areas, however, they offer only a temporary solution.

In conclusion, although road building has a limited role, public transport deserves the greater share of transport spending.`;

  const upd = await call(`/writing/essays/${essayId}`, { method: 'PUT', body: { content: SAMPLE, submit: true } });
  check('保存正文并提交', upd.status === 200 && upd.data?.ok === true);

  const an = await call(`/writing/essays/${essayId}/analyze`, { method: 'POST' });
  const bands = an.data?.bands;
  check('批改返回四维与总分', !!bands && ['overall', 'tr', 'cc', 'lr', 'gra'].every((k) => typeof bands[k] === 'number'));
  check('分数落在合理区间（3.0–8.5）', bands?.overall >= 3 && bands?.overall <= 8.5, `overall=${bands?.overall}`);
  check('批改含四个维度明细', (an.data?.analysis?.dimensions || []).length === 4);
  check('批改含可执行建议', (an.data?.analysis?.suggestions || []).length > 0);
  check('批改统计字数为正', (an.data?.analysis?.word_count || 0) > 100, `wc=${an.data?.analysis?.word_count}`);

  const shortEssay = await call('/writing/essays', { method: 'POST', body: { prompt_id: promptId, content: ' ', submit: false } });
  const shortAn = await call(`/writing/essays/${shortEssay.data.id}/analyze`, { method: 'POST' });
  check('空作文批改被拒绝（400）', shortAn.status === 400);
  await call(`/writing/essays/${shortEssay.data.id}`, { method: 'DELETE' });

  const wStats = await call('/writing/stats');
  check('写作统计返回汇总', typeof wStats.data?.summary?.total === 'number');
  check('写作统计返回四维均分', !!wStats.data?.dimension_avg);
  check('写作统计返回趋势数组', Array.isArray(wStats.data?.trend));

  const essayDetail = await call(`/writing/essays/${essayId}`);
  check('作文详情包含批改结果', !!essayDetail.data?.essay?.analysis?.bands);
  check('删除作文生效', (await call(`/writing/essays/${essayId}`, { method: 'DELETE' })).status === 200);

  // ---------- 阅读 ----------
  section('⑪ 阅读题型训练');
  const rps = await call('/reading/passages');
  check('阅读文章至少 5 篇', (rps.data?.total || 0) >= 5, `当前 ${rps.data?.total}`);
  const pid = rps.data.passages[0].id;
  check('文章列表带题目数量', (rps.data.passages[0].question_count || 0) >= 5);

  const rdetail = await call(`/reading/passages/${pid}`);
  check('文章详情返回原文与题目', rdetail.status === 200 && !!rdetail.data?.passage?.content && rdetail.data?.questions?.length > 0);
  check('下发题目时剥离答案', rdetail.data.questions.every((q) => q.answer === undefined));
  check('选择题带选项', rdetail.data.questions.some((q) => Array.isArray(q.options) && q.options.length > 1));
  check('不存在的文章返回 404', (await call('/reading/passages/999999')).status === 404);

  const emptySubmit = await call(`/reading/passages/${pid}/submit`, { method: 'POST', body: { answers: {}, duration_sec: 30 } });
  check('空卷提交得 0 分', emptySubmit.data?.correct === 0 && emptySubmit.data?.total > 0);
  const rightMap = {};
  for (const d of emptySubmit.data.detail) rightMap[d.id] = d.answer;
  const fullSubmit = await call(`/reading/passages/${pid}/submit`, { method: 'POST', body: { answers: rightMap, duration_sec: 300 } });
  check('全对提交得满分与 9 分换算', fullSubmit.data?.correct === fullSubmit.data?.total && fullSubmit.data?.band_score === 9);
  check('逐题返回解析', (fullSubmit.data?.detail || []).every((d) => typeof d.correct === 'boolean'));

  const rStats = await call('/reading/stats');
  check('阅读统计返回正确率', typeof rStats.data?.summary?.accuracy === 'number');
  check('阅读历史记录可用', Array.isArray((await call('/reading/attempts')).data?.attempts));
  check('非法 answers 被拒绝（400）', (await call(`/reading/passages/${pid}/submit`, { method: 'POST', body: { answers: 'nope' } })).status === 400);

  // ---------- 听力题型 ----------
  section('⑫ 听力题型化练习');
  const qmat = await call('/listening/materials', {
    method: 'POST',
    body: {
      title: 'Smoke listening questions',
      transcript:
        'The library opens at eight thirty on weekdays. Borrowing limits have increased to twelve items. Study pods can be booked free of charge.',
      duration_sec: 20,
    },
  });
  const qmatId = qmat.data?.material?.id;
  check('创建带文本的听力素材', !!qmatId);

  const gen = await call(`/listening/materials/${qmatId}/questions/generate`, { method: 'POST', body: { count: 6 } });
  check('自动生成题型练习', gen.status === 200 && (gen.data?.question_count || 0) >= 3, `生成 ${gen.data?.question_count} 题`);

  const qlist = await call(`/listening/materials/${qmatId}/questions`);
  check('取题返回题目列表', (qlist.data?.questions || []).length >= 3);
  check('取题不返回答案', qlist.data.questions.every((q) => q.answer === undefined));
  check('题目含填空与选择两类', new Set(qlist.data.questions.map((q) => q.qtype)).size >= 1);

  const wrongAns = {};
  for (const q of qlist.data.questions) wrongAns[q.id] = 'zzzzzz';
  const qsub = await call(`/listening/materials/${qmatId}/questions/submit`, { method: 'POST', body: { answers: wrongAns, duration_sec: 60 } });
  check('提交整套作答并评分', qsub.status === 200 && qsub.data?.total > 0);
  check('错误答案判为错', qsub.data?.correct === 0);

  const lStats = await call('/listening/stats');
  check('听力统计返回模式分布', Array.isArray(lStats.data?.by_mode));
  await call(`/listening/materials/${qmatId}`, { method: 'DELETE' });

  // ---------- 学习计划 ----------
  section('⑬ 学习计划与能力报告');
  const plan = await call('/plan/overview');
  check('计划总览返回四个能力维度', (plan.data?.radar || []).length === 4);
  check('能力维度含数值与估算 Band', plan.data.radar.every((r) => typeof r.value === 'number' && 'band' in r));
  check('计划返回今日任务清单', (plan.data?.today?.tasks || []).length >= 3);
  check('任务项含完成状态', plan.data.today.tasks.every((t) => typeof t.met === 'boolean'));
  check('计划返回建议列表', Array.isArray(plan.data?.recommendations) && plan.data.recommendations.length > 0);
  check('计划返回内容库规模', typeof plan.data?.inventory?.words_total === 'number');
  check('明确说明不含口语', typeof plan.data?.speaking_note === 'string');

  const goalUpd = await call('/plan/goal', { method: 'PUT', body: { target_band: 7.5, daily_words: 25 } });
  check('更新学习目标', goalUpd.data?.goal?.target_band === 7.5 && goalUpd.data?.goal?.daily_words === 25);
  const plan2 = await call('/plan/overview');
  check('目标更新后总览同步', plan2.data?.goal?.daily_words === 25);
  await call('/plan/goal', { method: 'PUT', body: { target_band: 7, daily_words: 30 } });

  // ---------- 前端 ----------
  section('⑭ 前端静态资源');
  const home = await call('/', { auth: false, raw: true });
  check('首页返回 HTML', home.status === 200 && String(home.contentType).includes('html'));
  const spa = await call('/wrong', { auth: false, raw: true });
  check('前端路由回退（/wrong）', spa.status === 200 && String(spa.contentType).includes('html'));
  const spaWriting = await call('/writing', { auth: false, raw: true });
  check('前端路由回退（/writing）', spaWriting.status === 200 && String(spaWriting.contentType).includes('html'));
  const spaPlan = await call('/plan', { auth: false, raw: true });
  check('前端路由回退（/plan）', spaPlan.status === 200 && String(spaPlan.contentType).includes('html'));

  // ---------- 汇总 ----------
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`通过 ${passed} / ${passed + failed}`);
  if (failed) {
    console.log(`失败：${failures.join('、')}`);
    process.exit(1);
  }
  console.log('全部通过 ✅');
}

main().catch((e) => {
  console.error('测试执行异常：', e);
  process.exit(1);
});
