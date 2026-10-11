import express from 'express';
import { getDb } from '../db.js';
import { authRequired } from '../auth.js';

const router = express.Router();
router.use(authRequired);

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const r1 = (n) => Math.round(n * 10) / 10;
const r05 = (n) => Math.round(n * 2) / 2;

function getOrCreateGoal(db, uid) {
  let g = db.prepare('SELECT * FROM user_goals WHERE user_id = ?').get(uid);
  if (!g) {
    db.prepare('INSERT INTO user_goals (user_id) VALUES (?)').run(uid);
    g = db.prepare('SELECT * FROM user_goals WHERE user_id = ?').get(uid);
  }
  return g;
}

// ---------- 目标读写 ----------
router.get('/goal', (req, res) => {
  const db = getDb();
  res.json({ goal: getOrCreateGoal(db, req.user.id) });
});

router.put('/goal', (req, res) => {
  const db = getDb();
  getOrCreateGoal(db, req.user.id);
  const allowed = ['exam_date', 'target_band', 'daily_words', 'daily_listening', 'daily_reading', 'daily_writing'];
  const sets = [];
  const params = { uid: req.user.id };
  for (const k of allowed) {
    if (k in (req.body || {})) {
      sets.push(`${k} = @${k}`);
      params[k] = req.body[k] === '' ? null : req.body[k];
    }
  }
  if (!sets.length) return res.json({ goal: getOrCreateGoal(db, req.user.id) });
  sets.push(`updated_at = datetime('now')`);
  db.prepare(`UPDATE user_goals SET ${sets.join(', ')} WHERE user_id = @uid`).run(params);
  res.json({ goal: getOrCreateGoal(db, req.user.id) });
});

// ---------- 总览 ----------
router.get('/overview', (req, res) => {
  const db = getDb();
  const uid = req.user.id;
  const goal = getOrCreateGoal(db, uid);

  // ---- 词汇 ----
  const totalWords = db.prepare('SELECT COUNT(*) AS n FROM words').get().n - db.prepare('SELECT COUNT(*) n FROM user_word_progress WHERE user_id=? AND excluded=1').get(uid).n;
  const stateRows = db
    .prepare('SELECT state, COUNT(*) AS n FROM user_word_progress WHERE user_id = ? AND excluded=0 GROUP BY state')
    .all(uid);
  const st = { new: 0, learning: 0, review: 0, mastered: 0 };
  for (const r of stateRows) st[r.state] = r.n;
  const touched = Object.values(st).reduce((a, b) => a + b, 0);
  const dueNow = db
    .prepare(
      `SELECT COUNT(*) AS n FROM user_word_progress
        WHERE user_id = ? AND excluded=0 AND due_at IS NOT NULL AND due_at <= datetime('now') AND state != 'mastered'`
    )
    .get(uid).n;
  // 词汇掌握度：已掌握 + 复习中算 1，学习中算 0.5
  const vocabScore = totalWords ? clamp(((st.mastered + st.review * 0.6 + st.learning * 0.25) / totalWords) * 100) : 0;

  // ---- 听力 ----
  const lis = db
    .prepare(
      `SELECT COUNT(*) AS n, ROUND(AVG(score), 3) AS avg_score
         FROM listening_attempts WHERE user_id = ?`
    )
    .get(uid);
  const listenScore = clamp((lis.avg_score || 0) * 100);
  const listenBand = lis.n >= 5 ? r05(clamp(3.5 + (lis.avg_score || 0) * 5.5, 3, 8.5)) : null;

  // ---- 阅读 ----
  const rd = db
    .prepare(
      `SELECT COUNT(*) AS n, SUM(correct) AS correct, SUM(total) AS total, ROUND(AVG(band_score), 2) AS avg_band
         FROM reading_attempts WHERE user_id = ?`
    )
    .get(uid);
  const readAcc = rd.total ? rd.correct / rd.total : 0;
  const readScore = clamp(readAcc * 100);
  const readBand = rd.n >= 2 ? rd.avg_band : null;

  // ---- 写作 ----
  const wr = db
    .prepare(
      `SELECT COUNT(*) AS n, ROUND(AVG(band_overall), 2) AS avg_band,
              ROUND(AVG(band_tr),2) AS tr, ROUND(AVG(band_cc),2) AS cc,
              ROUND(AVG(band_lr),2) AS lr, ROUND(AVG(band_gra),2) AS gra
         FROM writing_essays WHERE user_id = ? AND status='done'`
    )
    .get(uid);
  const writeBand = wr.n >= 2 ? wr.avg_band : null;
  const writeScore = wr.avg_band ? clamp((wr.avg_band / 9) * 100) : 0;

  // ---- 今日任务完成度 ----
  const todayByModule = db
    .prepare(
      `SELECT module, action, COUNT(*) AS n,
              COALESCE(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END), 0) AS ok
         FROM study_logs
        WHERE user_id = ? AND date(created_at) = date('now')
        GROUP BY module, action`
    )
    .all(uid);
  const todayMap = {};
  for (const r of todayByModule) todayMap[`${r.module}:${r.action}`] = r.n;

  const todayWords = db
    .prepare(
      `SELECT COUNT(*) AS n FROM study_logs
        WHERE user_id = ? AND module='vocab' AND action IN ('review','quiz') AND date(created_at)=date('now')`
    )
    .get(uid).n;

  const todayStats = db
    .prepare(
      `SELECT COUNT(DISTINCT module) AS modules, COUNT(*) AS events,
              COALESCE(SUM(duration_ms),0) AS ms
         FROM study_logs WHERE user_id = ? AND date(created_at)=date('now')`
    )
    .get(uid);

  // ---- 连续打卡 ----
  const daily = db
    .prepare(
      `SELECT date(created_at) AS day, COUNT(*) AS n,
              COUNT(DISTINCT module) AS modules
         FROM study_logs
        WHERE user_id = ? AND created_at >= datetime('now','-90 days')
        GROUP BY day ORDER BY day`
    )
    .all(uid);
  const dayset = new Set(daily.map((d) => d.day));
  const fmt = (d) => d.toISOString().slice(0, 10);
  let streak = 0;
  const cur = new Date();
  if (!dayset.has(fmt(cur))) cur.setUTCDate(cur.getUTCDate() - 1);
  while (dayset.has(fmt(cur))) {
    streak += 1;
    cur.setUTCDate(cur.getUTCDate() - 1);
  }

  // ---- 内容库规模 ----
  const inventory = {
    words_total: totalWords,
    words_touched: touched,
    words_mastered: st.mastered,
    words_due: dueNow,
    writing_prompts: db.prepare('SELECT COUNT(*) AS n FROM writing_prompts').get().n,
    reading_passages: db.prepare("SELECT COUNT(*) AS n FROM reading_passages WHERE is_public=1").get().n,
    listening_materials: db.prepare('SELECT COUNT(*) AS n FROM listening_materials').get().n,
  };

  // ---- 四科能力（0-100）----
  const radar = [
    { key: 'vocab', label: '词汇', value: r1(vocabScore), band: r05(clamp(3.5 + (vocabScore / 100) * 5, 3, 8.5)), detail: `${touched}/${totalWords} 词已接触` },
    { key: 'listening', label: '听力', value: r1(listenScore), band: listenBand, detail: lis.n ? `${lis.n} 次练习` : '尚无练习' },
    { key: 'reading', label: '阅读', value: r1(readScore), band: readBand, detail: rd.n ? `${rd.n} 篇练习` : '尚无练习' },
    { key: 'writing', label: '写作', value: r1(writeScore), band: writeBand, detail: wr.n ? `${wr.n} 篇批改` : '尚无批改' },
  ];

  // ---- 预测分数：仅用有数据的科目，并按证据量加权 ----
  const evidence = [
    { key: 'listening', band: listenBand, weight: Math.min(1, lis.n / 10) },
    { key: 'reading', band: readBand, weight: Math.min(1, rd.n / 8) },
    { key: 'writing', band: writeBand, weight: Math.min(1, wr.n / 6) },
    { key: 'vocab', band: r05(clamp(3.5 + (vocabScore / 100) * 5, 3, 8.5)), weight: Math.min(1, touched / 300) * 0.6 },
  ].filter((e) => e.band != null && e.weight > 0);

  const wsum = evidence.reduce((a, e) => a + e.weight, 0);
  const predicted = wsum > 0 ? r05(evidence.reduce((a, e) => a + e.band * e.weight, 0) / wsum) : null;

  // ---- 倒计时 ----
  let countdown = null;
  if (goal.exam_date) {
    const target = new Date(goal.exam_date + 'T00:00:00Z');
    const now = new Date();
    const today0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    countdown = Math.round((target.getTime() - today0) / 86400000);
  }

  // ---- 今日任务清单 ----
  const tasks = [
    {
      key: 'review',
      module: 'vocab',
      label: `复习到期单词 ${dueNow} 个`,
      target: dueNow,
      done: Math.min(todayWords, dueNow),
      unit: '词',
      to: '/study',
      met: dueNow === 0 || todayWords >= dueNow,
    },
    {
      key: 'new-words',
      module: 'vocab',
      label: `新学单词 ${goal.daily_words} 个`,
      target: goal.daily_words,
      done: Math.min(st.learning + st.review + st.mastered, goal.daily_words),
      unit: '词',
      to: '/words',
      met: st.learning + st.review + st.mastered >= goal.daily_words,
    },
    {
      key: 'listening',
      module: 'listening',
      label: `听力练习 ${goal.daily_listening} 次`,
      target: goal.daily_listening,
      done: todayMap['listening:questions'] || 0,
      unit: '次',
      to: '/listening',
      met: (todayMap['listening:questions'] || 0) >= goal.daily_listening,
    },
    {
      key: 'reading',
      module: 'reading',
      label: `精读 ${goal.daily_reading} 篇`,
      target: goal.daily_reading,
      done: todayMap['reading:practice'] || 0,
      unit: '篇',
      to: '/reading',
      met: (todayMap['reading:practice'] || 0) >= goal.daily_reading,
    },
    {
      key: 'writing',
      module: 'writing',
      label: `写作 ${goal.daily_writing} 篇`,
      target: goal.daily_writing,
      done: todayMap['writing:submit'] || 0,
      unit: '篇',
      to: '/writing',
      met: (todayMap['writing:submit'] || 0) >= goal.daily_writing,
    },
  ].filter((t) => t.target > 0 || t.key === 'review');

  const doneCount = tasks.filter((t) => t.met).length;

  // ---- 诊断建议 ----
  const recommendations = buildRecommendations({ radar, dueNow, touched, totalWords, goal, wr, lis, rd, predicted, inventory });

  res.json({
    goal,
    countdown,
    inventory,
    radar,
    predicted_band: predicted,
    speaking_note: '口语模块尚未开放，预测分数不含口语项。',
    today: {
      tasks,
      done: doneCount,
      total: tasks.length,
      words_reviewed: todayWords,
      modules_touched: todayStats.modules || 0,
      events: todayStats.events || 0,
      minutes: Math.round((todayStats.ms || 0) / 60000),
    },
    streak,
    daily,
    writing_dimensions: { tr: wr.tr, cc: wr.cc, lr: wr.lr, gra: wr.gra, count: wr.n },
    recommendations,
  });
});

function buildRecommendations({ radar, dueNow, touched, totalWords, goal, wr, lis, rd, predicted, inventory }) {
  const out = [];
  if (predicted == null) {
    out.push({
      priority: 'high',
      title: '先建立基线数据',
      detail: '每个模块做 2-3 次练习后，系统才能给出靠谱的预测分数。建议先做 1 篇阅读 + 1 篇写作 + 1 组听力题。',
      to: '/plan',
    });
  }

  const sorted = [...radar].filter((r) => r.band != null).sort((a, b) => a.value - b.value);
  const weakest = sorted[0];
  if (weakest) {
    const actions = {
      vocab: { text: '每天固定 30 分钟闪卡 + 1 轮测验，优先清掉到期的词。', to: '/study' },
      listening: { text: '用「听写填空」模式精听，单句循环 3 遍再作答，错句立刻加入生词本。', to: '/listening' },
      reading: { text: '做一篇精读，重点标记定位词与同义替换；错题看解析后回原文找依据。', to: '/reading' },
      writing: { text: '写一篇 Task 2 并提交批改，按最弱维度专项改一遍再重写同类题。', to: '/writing' },
    };
    out.push({
      priority: 'high',
      title: `最弱环节：${weakest.label}（${weakest.value} 分）`,
      detail: actions[weakest.key]?.text || '针对性补强这一项。',
      to: actions[weakest.key]?.to || '/',
    });
  }

  if (dueNow > 40) {
    out.push({
      priority: 'high',
      title: `积压了 ${dueNow} 个待复习词`,
      detail: '积压过多会让 SRS 失效。今天优先清空到期队列，暂缓学新词。',
      to: '/study',
    });
  }

  if (wr.n >= 2 && wr.tr != null && wr.cc != null) {
    const dims = [
      { k: 'TR 任务回应', v: wr.tr },
      { k: 'CC 连贯衔接', v: wr.cc },
      { k: 'LR 词汇资源', v: wr.lr },
      { k: 'GRA 语法准确', v: wr.gra },
    ].sort((a, b) => a.v - b.v);
    if (dims[0].v <= dims[3].v - 1) {
      out.push({
        priority: 'mid',
        title: `写作短板是「${dims[0].k.split(' ')[0]}」`,
        detail: `${dims[0].k} 平均 ${dims[0].v}，比最高的 ${dims[3].k}（${dims[3].v}）低了约 ${r1(dims[3].v - dims[0].v)} 分，专项训练这一维度提分最快。`,
        to: '/writing',
      });
    }
  }

  if (touched < totalWords * 0.15 && totalWords > 0) {
    out.push({
      priority: 'mid',
      title: '词库覆盖率偏低',
      detail: `只接触了 ${touched}/${totalWords} 个词。建议按话题词书成册攻克，而不是随机刷。`,
      to: '/words',
    });
  }

  if (goal.exam_date == null) {
    out.push({
      priority: 'low',
      title: '设置考试日期',
      detail: '填上考试日期后，系统会按剩余天数动态调整每日任务量。',
      to: '/plan',
    });
  }

  if (!out.length) {
    out.push({ priority: 'low', title: '保持节奏', detail: '各项数据都在稳步推进，继续按当前计划执行即可。', to: '/' });
  }
  return out.slice(0, 5);
}

export default router;
