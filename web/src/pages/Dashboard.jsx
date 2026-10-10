import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import {
  BarChart,
  CountUp,
  Heatmap,
  Ring,
  StatCard,
  Skeleton,
  Empty,
} from '../components/ui.jsx';
import {
  IcoArrowRight,
  IcoCards,
  IcoFlame,
  IcoSparkles,
  IcoTarget,
  IcoTrendUp,
  IcoTrophy,
  IcoZap,
  IcoBook,
  IcoHeadphones,
  IcoRead,
  IcoPen,
  IcoChart,
} from '../components/icons.jsx';

const ACHIEVEMENTS = [
  { id: 'first', icon: '🌱', t: '初次启程', d: '学习第 1 个单词', test: (s) => s.words.touched >= 1 },
  { id: 't50', icon: '📚', t: '入门', d: '接触 50 个单词', test: (s) => s.words.touched >= 50 },
  { id: 't200', icon: '🧭', t: '广度开拓', d: '接触 200 个单词', test: (s) => s.words.touched >= 200 },
  { id: 'm20', icon: '⭐', t: '小有掌握', d: '掌握 20 个单词', test: (s) => s.words.mastered >= 20 },
  { id: 'm100', icon: '🏅', t: '词汇达人', d: '掌握 100 个单词', test: (s) => s.words.mastered >= 100 },
  { id: 's3', icon: '🔥', t: '三日不辍', d: '连续打卡 3 天', test: (s) => s.streak >= 3 },
  { id: 's7', icon: '💎', t: '一周坚持', d: '连续打卡 7 天', test: (s) => s.streak >= 7 },
  { id: 's30', icon: '👑', t: '铁人', d: '连续打卡 30 天', test: (s) => s.streak >= 30 },
  { id: 'r500', icon: '⚡', t: '复习狂人', d: '累计复习 500 次', test: (s) => (s.totals?.reviews || 0) >= 500 },
  { id: 'star30', icon: '🔖', t: '收藏家', d: '生词本达 30 词', test: (s) => s.words.starred >= 30 },
];

const STATE_META = [
  { k: 'new', label: '未学', color: '#69739a' },
  { k: 'learning', label: '学习中', color: '#fbbf24' },
  { k: 'review', label: '复习中', color: '#a78bfa' },
  { k: 'mastered', label: '已掌握', color: '#34d399' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [session, setSession] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, se] = await Promise.all([api('/vocab/stats'), api('/vocab/session')]);
        setStats(s);
        setSession(se);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  const chart = useMemo(() => {
    if (!stats) return [];
    const map = new Map((stats.daily || []).map((d) => [d.day, d.n]));
    const out = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ label: key, v: map.get(key) || 0, day: key.slice(5) });
    }
    return out;
  }, [stats]);

  if (err) return <div className="msg error">{err}</div>;
  if (!stats) {
    return (
      <div className="grid grid-4">
        {[0, 1, 2, 3].map((i) => (
          <div className="card" key={i}>
            <Skeleton w="40%" h={12} />
            <Skeleton w="60%" h={28} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  const w = stats.words;
  const goal = session?.goal ?? 30;
  const goalDone = session?.reviewed_today ?? 0;
  const goalPct = goal ? Math.min(100, Math.round((goalDone / goal) * 100)) : 0;
  const learned = w.learning + w.review + w.mastered;
  const masteryPct = w.total ? Math.round(((w.mastered + w.review * 0.6 + w.learning * 0.2) / w.total) * 100) : 0;
  const weekTotal = chart.slice(-7).reduce((a, b) => a + b.v, 0);
  const prevWeekTotal = chart.slice(0, 7).reduce((a, b) => a + b.v, 0);
  const trend = prevWeekTotal ? Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100) : weekTotal > 0 ? 100 : 0;
  const unlocked = ACHIEVEMENTS.filter((a) => a.test(stats));

  const hour = new Date().getHours();
  const greet = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <>
      <div className="page-head head-row rise">
        <div>
          <h1>
            {greet}，{user?.display_name || user?.username}
          </h1>
          <div className="sub">
            {stats.streak > 0
              ? `已连续学习 ${stats.streak} 天 · 今天完成了 ${stats.today.reviews} 次复习`
              : '今天开始你的第一天吧，完成 1 次复习就能点亮打卡'}
          </div>
        </div>
        <div className="row">
          <button className="btn btn-primary" onClick={() => navigate('/study')}>
            <IcoZap /> 开始学习
          </button>
        </div>
      </div>

      {/* 顶部统计 */}
      <div className="grid grid-4">
        <div className="card stat-card rise" style={{ animationDelay: '40ms' }}>
          <div className="row-between" style={{ alignItems: 'center' }}>
            <div>
              <div className="k">今日目标</div>
              <div className="v">
                <CountUp to={goalDone} />
                <small>/ {goal} 词</small>
              </div>
              <div className="foot">{goalDone >= goal ? '已达成 🎉' : `还差 ${Math.max(0, goal - goalDone)} 词`}</div>
            </div>
            <Ring value={goalPct} size={74} stroke={8}>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{goalPct}%</span>
            </Ring>
          </div>
        </div>

        <StatCard
          label="待复习"
          value={<CountUp to={w.due_now} />}
          unit="词"
          accent="#fbbf24"
          accent2="#fb7185"
          foot={session?.new?.length ? `另有 ${session.new.length} 个新词待学` : '暂无新词'}
        />

        <StatCard
          label="已掌握"
          value={<CountUp to={w.mastered} />}
          unit="词"
          accent="#34d399"
          accent2="#22d3ee"
          foot={`生词本 ${w.starred} 词`}
        />

        <StatCard
          label="连续打卡"
          value={<CountUp to={stats.streak} />}
          unit="天"
          accent="#fb7185"
          accent2="#a855f7"
          foot={`本周复习 ${weekTotal} 次${trend >= 0 ? ` ↑${trend}%` : ` ↓${Math.abs(trend)}%`}`}
        />
      </div>

      {/* 掌握度 + 状态分布 */}
      <div className="grid dash-split">
        <div className="card rise" style={{ animationDelay: '80ms' }}>
          <div className="card-title">
            <span className="dot" /> 词库进度
          </div>
          <div className="row wrap" style={{ gap: 22, alignItems: 'center' }}>
            <Ring value={masteryPct} size={122} stroke={11}>
              <div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 740, letterSpacing: '-0.03em' }}>{masteryPct}%</div>
                <div className="muted" style={{ fontSize: 11 }}>掌握度</div>
              </div>
            </Ring>
            <div style={{ flex: 1, minWidth: 170 }}>
              <div className="muted" style={{ marginBottom: 10 }}>
                已接触 {w.touched} / {w.total} 词
              </div>
              {STATE_META.map((m) => {
                const n = w[m.k] || 0;
                const pct = w.total ? (n / w.total) * 100 : 0;
                return (
                  <div key={m.k} style={{ marginBottom: 8 }}>
                    <div className="row-between" style={{ fontSize: 12.5 }}>
                      <span className="dim">{m.label}</span>
                      <span className="mono" style={{ color: m.color }}>{n}</span>
                    </div>
                    <div className="bar" style={{ height: 5, marginTop: 3 }}>
                      <i style={{ width: `${pct}%`, background: m.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '120ms' }}>
          <div className="row-between">
            <div className="card-title" style={{ margin: 0 }}>
              <span className="dot" /> 最近 30 天学习量
            </div>
            <span className="tag cyan">
              <IcoTrendUp style={{ width: 12, height: 12 }} /> 本周 {weekTotal} 次
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <BarChart data={chart} height={130} unit=" 次" />
          </div>
          <div className="row-between" style={{ marginTop: 6 }}>
            <span className="muted mono">{chart[0]?.day}</span>
            <span className="muted">每日学习次数</span>
            <span className="muted mono">今天</span>
          </div>
        </div>
      </div>

      {/* 今日任务 + 快捷入口 */}
      <div className="grid dash-split-2">
        <div className="card rise" style={{ animationDelay: '160ms' }}>
          <div className="card-title">
            <span className="dot" /> 今日任务
          </div>
          <div className="grid grid-3">
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--surface-hi)', border: '1px solid var(--border)' }}>
              <div className="row-between">
                <span className="muted">复习到期</span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--amber)' }}>{session?.due?.length ?? 0}</span>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>按 SM-2 到期时间排序</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--surface-hi)', border: '1px solid var(--border)' }}>
              <div className="row-between">
                <span className="muted">新词</span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--violet)' }}>{session?.new?.length ?? 0}</span>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>受每日目标限制</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--surface-hi)', border: '1px solid var(--border)' }}>
              <div className="row-between">
                <span className="muted">今日正确率</span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--green)' }}>
                  {stats.today.reviews ? Math.round(((stats.today.correct || 0) / stats.today.reviews) * 100) : 0}%
                </span>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                {stats.today.correct || 0} / {stats.today.reviews} 次
              </div>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={() => navigate('/study')}>
              <IcoCards /> 闪卡学习
            </button>
            <button className="btn" onClick={() => navigate('/quiz')}>
              <IcoTarget /> 词汇测验
            </button>
            <button className="btn" onClick={() => navigate('/words')}>
              <IcoBook /> 浏览词库
            </button>
            <button className="btn" onClick={() => navigate('/listening')}>
              <IcoHeadphones /> 听力练习
            </button>
            <button className="btn" onClick={() => navigate('/reading')}>
              <IcoRead /> 阅读精读
            </button>
            <button className="btn" onClick={() => navigate('/writing')}>
              <IcoPen /> 写作批改
            </button>
          </div>

          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            <div className="spacer" />
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/plan')}>
              <IcoChart /> 学习计划与能力报告
              <IcoArrowRight />
            </button>
          </div>

          <div className="msg info" style={{ marginTop: 14, marginBottom: 0 }}>
            <IcoSparkles style={{ width: 15, height: 15, flex: 'none' }} />
            <span>
              {w.due_now > 0
                ? `今天有 ${w.due_now} 个词到期，建议先复习它们——间隔重复的收益远高于盲目学新词。`
                : session?.new?.length
                ? `今天没有到期复习，可以开始学习 ${session.remaining_today ?? session.new.length} 个新词。`
                : '今天的任务已经完成，去测验巩固一下，或者明天再来。'}
            </span>
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '200ms' }}>
          <div className="row-between">
            <div className="card-title" style={{ margin: 0 }}>
              <span className="dot" /> 成就
            </div>
            <span className="muted">{unlocked.length} / {ACHIEVEMENTS.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14, maxHeight: 260, overflowY: 'auto' }}>
            {ACHIEVEMENTS.map((a) => {
              const on = a.test(stats);
              return (
                <div className={`ach ${on ? '' : 'locked'}`} key={a.id}>
                  <div className="ico">{a.icon}</div>
                  <div>
                    <div className="t">{a.t}</div>
                    <div className="d">{a.d}</div>
                  </div>
                  {on && <span className="tag green" style={{ marginLeft: 'auto' }}>已解锁</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 热力图 */}
      <div className="card rise" style={{ marginTop: 14, animationDelay: '240ms' }}>
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <span className="dot" /> 学习热力图
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="muted">少</span>
            {['var(--heat-0)', 'rgba(99,102,241,0.35)', 'rgba(99,102,241,0.62)', 'rgba(139,92,246,0.88)'].map((c) => (
              <i key={c} style={{ width: 13, height: 13, borderRadius: 4, background: c, display: 'block' }} />
            ))}
            <span className="muted">多</span>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <Heatmap days={stats.daily || []} />
        </div>
      </div>

      {learned === 0 && (
        <div className="card rise" style={{ marginTop: 14 }}>
          <Empty
            icon={<IcoSparkles />}
            title="还没有学习记录"
            desc="从「今日学习」开始第一张闪卡，系统会自动为你安排复习节奏"
            action={
              <Link className="btn btn-primary" to="/study">
                开始第一张闪卡 <IcoArrowRight />
              </Link>
            }
          />
        </div>
      )}

      {stats.streak >= 3 && (
        <div className="card rise" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, animationDelay: '280ms' }}>
          <div className="row" style={{ gap: 10 }}>
            <IcoFlame style={{ width: 26, height: 26, color: 'var(--red)' }} />
            <div>
              <div style={{ fontWeight: 620 }}>连续 {stats.streak} 天，节奏很棒</div>
              <div className="muted">保持每天至少复习一次，间隔重复的效果会指数级放大</div>
            </div>
          </div>
          <div className="spacer" />
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/listening')}>
            <IcoHeadphones /> 顺便练听力
          </button>
        </div>
      )}
    </>
  );
}
