import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtBand } from '../api.js';
import { useToast, Radar, Ring, BarChart, CountUp, Skeleton, Empty, Meter } from '../components/ui.jsx';
import {
  IcoCalendar,
  IcoTarget,
  IcoCheck,
  IcoArrowRight,
  IcoSparkles,
  IcoTrendUp,
  IcoCards,
  IcoHeadphones,
  IcoBook,
  IcoPen,
  IcoChart,
  IcoZap,
} from '../components/icons.jsx';

const MODULE_ICON = {
  vocab: <IcoCards />,
  listening: <IcoHeadphones />,
  reading: <IcoBook />,
  writing: <IcoPen />,
};

export default function Plan() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const load = () =>
    api('/plan/overview')
      .then((d) => {
        setData(d);
        setForm({
          exam_date: d.goal.exam_date || '',
          target_band: d.goal.target_band || 7,
          daily_words: d.goal.daily_words ?? 30,
          daily_listening: d.goal.daily_listening ?? 1,
          daily_reading: d.goal.daily_reading ?? 1,
          daily_writing: d.goal.daily_writing ?? 0,
        });
      })
      .catch((e) => toast(e.message, 'err'));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api('/plan/goal', { method: 'PUT', body: form });
      toast('计划已更新');
      await load();
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const dailyChart = useMemo(() => {
    if (!data) return [];
    const map = new Map((data.daily || []).map((d) => [d.day, d.n]));
    const out = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ label: key, v: map.get(key) || 0, day: key.slice(5) });
    }
    return out;
  }, [data]);

  if (!data || !form) {
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

  const gap = data.predicted_band != null ? Math.max(0, (data.goal.target_band || 7) - data.predicted_band) : null;
  const sortedRadar = [...data.radar].sort((a, b) => a.value - b.value);
  const weakest = sortedRadar[0];

  return (
    <>
      <div className="page-head head-row rise">
        <div>
          <h1>学习计划</h1>
          <div className="sub">设定目标 → 每日任务 → 四科能力雷达 → 达标差距。所有数据来自你的真实练习记录。</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/study')}>
          <IcoZap /> 开始今日任务
        </button>
      </div>

      {/* 倒计时 + 预测分 */}
      <div className="grid grid-3">
        <div className="card stat-card rise">
          <div className="glow-spot" style={{ background: 'radial-gradient(circle, #fb7185, transparent 70%)' }} />
          <div className="k">距考试</div>
          <div className="v">
            {data.countdown != null ? (
              <>
                <CountUp to={Math.max(0, data.countdown)} />
                <small>天</small>
              </>
            ) : (
              <span style={{ fontSize: 22 }}>未设置日期</span>
            )}
          </div>
          <div className="foot">
            {data.goal.exam_date ? `考试日 ${data.goal.exam_date}` : '在下方设置考试日期'}
          </div>
        </div>

        <div className="card stat-card rise" style={{ animationDelay: '40ms' }}>
          <div className="glow-spot" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
          <div className="k">预测分数（不含口语）</div>
          <div className="v">
            {data.predicted_band != null ? (
              <>
                <CountUp to={data.predicted_band} duration={900} />
                <small>/ {data.goal.target_band}</small>
              </>
            ) : (
              <span style={{ fontSize: 22 }}>数据不足</span>
            )}
          </div>
          <div className="foot">
            {data.predicted_band == null
              ? '每个模块练 2-3 次后可见'
              : gap > 0
              ? `距目标还差 ${gap.toFixed(1)} 分`
              : '已达到目标分数 🎉'}
          </div>
        </div>

        <div className="card stat-card rise" style={{ animationDelay: '80ms' }}>
          <div className="glow-spot" style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)' }} />
          <div className="k">连续打卡</div>
          <div className="v">
            <CountUp to={data.streak} />
            <small>天</small>
          </div>
          <div className="foot">今日已学 {data.today.minutes} 分钟 · {data.today.events} 次操作</div>
        </div>
      </div>

      {/* 今日任务 */}
      <div className="card rise" style={{ marginTop: 14, animationDelay: '60ms' }}>
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <span className="dot" /> 今日任务
          </div>
          <span className="tag cyan">{data.today.done} / {data.today.total} 完成</span>
        </div>
        <div className="grid task-grid" style={{ marginTop: 14 }}>
          {data.today.tasks.map((t) => (
            <button className={`task-card ${t.met ? 'done' : ''}`} key={t.key} onClick={() => navigate(t.to)}>
              <div className="ico">{MODULE_ICON[t.module] || <IcoTarget />}</div>
              <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <div className="t">{t.label}</div>
                <div className="bar" style={{ height: 5, marginTop: 7 }}>
                  <i style={{ width: `${t.target ? Math.min(100, (t.done / t.target) * 100) : 100}%` }} />
                </div>
              </div>
              <div className="mark">
                {t.met ? <IcoCheck /> : <span className="mono muted">{t.done}/{t.target}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 雷达 + 建议 */}
      <div className="grid dash-split" style={{ marginTop: 14 }}>
        <div className="card rise">
          <div className="card-title">
            <span className="dot" /> 四科能力雷达
          </div>
          <Radar data={data.radar} size={280} />
          <div className="grid grid-2" style={{ marginTop: 14, gap: 10 }}>
            {data.radar.map((r) => (
              <div key={r.key} className="mini-stat" style={{ padding: '10px 12px' }}>
                <div className="k">{r.label}</div>
                <div className="v mono" style={{ fontSize: 18 }}>
                  {fmtBand(r.band)}
                  <small style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>Band</small>
                </div>
                <div className="s">{r.detail}</div>
              </div>
            ))}
          </div>
          <div className="muted" style={{ marginTop: 12, fontSize: 11.5 }}>{data.speaking_note}</div>
        </div>

        <div className="card rise" style={{ animationDelay: '60ms' }}>
          <div className="card-title">
            <span className="dot" /> 诊断与建议
          </div>
          <div className="advice-list">
            {data.recommendations.map((r, i) => (
              <div className={`advice ${r.priority}`} key={i} onClick={() => r.to && navigate(r.to)} style={{ cursor: r.to ? 'pointer' : 'default' }}>
                <div className="t">
                  <span className={`tag ${r.priority === 'high' ? 'red' : r.priority === 'mid' ? 'amber' : 'gray'}`}>
                    {r.priority === 'high' ? '优先' : r.priority === 'mid' ? '建议' : '提示'}
                  </span>
                  {r.title}
                </div>
                <div className="d">{r.detail}</div>
              </div>
            ))}
          </div>

          <div className="card-title" style={{ marginTop: 20 }}>
            <span className="dot" /> 内容库规模
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Meter value={data.inventory.words_touched} max={data.inventory.words_total} label="词库覆盖率" right={`${data.inventory.words_touched}/${data.inventory.words_total}`} />
            <Meter value={data.inventory.words_mastered} max={data.inventory.words_total} color="linear-gradient(90deg,#34d399,#22d3ee)" label="已掌握" right={`${data.inventory.words_mastered} 词`} />
          </div>
          <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
            <span className="tag gray">写作题 {data.inventory.writing_prompts}</span>
            <span className="tag gray">阅读文 {data.inventory.reading_passages}</span>
            <span className="tag gray">听力素材 {data.inventory.listening_materials}</span>
          </div>
        </div>
      </div>

      {/* 学习量 + 目标设置 */}
      <div className="grid dash-split-2" style={{ marginTop: 14 }}>
        <div className="card rise">
          <div className="row-between">
            <div className="card-title" style={{ margin: 0 }}>
              <span className="dot" /> 最近 30 天学习量
            </div>
            <span className="tag cyan">
              <IcoTrendUp style={{ width: 12, height: 12 }} /> 今日 {data.today.events} 次
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <BarChart data={dailyChart} height={140} unit=" 次" />
          </div>
          <div className="row-between" style={{ marginTop: 6 }}>
            <span className="muted mono">{dailyChart[0]?.day}</span>
            <span className="muted">每天的学习操作次数</span>
            <span className="muted mono">今天</span>
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '60ms' }}>
          <div className="card-title">
            <span className="dot" /> 目标设置
          </div>

          <label className="field">
            <span>
              <IcoCalendar style={{ width: 13, height: 13, verticalAlign: -2, marginRight: 4 }} />
              考试日期
            </span>
            <input
              type="date"
              value={form.exam_date}
              onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
            />
          </label>

          <label className="field">
            <span>目标分数（Band）</span>
            <select value={form.target_band} onChange={(e) => setForm({ ...form, target_band: Number(e.target.value) })}>
              {[5.5, 6, 6.5, 7, 7.5, 8, 8.5].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-2" style={{ gap: 12 }}>
            <label className="field">
              <span>每日新词</span>
              <input type="number" min="0" max="200" value={form.daily_words} onChange={(e) => setForm({ ...form, daily_words: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>每日听力（次）</span>
              <input type="number" min="0" max="10" value={form.daily_listening} onChange={(e) => setForm({ ...form, daily_listening: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>每日阅读（篇）</span>
              <input type="number" min="0" max="10" value={form.daily_reading} onChange={(e) => setForm({ ...form, daily_reading: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>每日写作（篇）</span>
              <input type="number" min="0" max="5" value={form.daily_writing} onChange={(e) => setForm({ ...form, daily_writing: Number(e.target.value) })} />
            </label>
          </div>

          <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>
            {saving ? '保存中…' : '保存计划'}
          </button>

          {weakest && (
            <div className="msg info" style={{ marginTop: 14, marginBottom: 0 }}>
              <IcoSparkles style={{ width: 15, height: 15, flex: 'none' }} />
              <span>
                当前最弱是 <b>{weakest.label}</b>（{weakest.value} 分），把每日任务里这一项调高，提分效率最高。
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
