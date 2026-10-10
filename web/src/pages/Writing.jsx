import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtDate, fmtBand } from '../api.js';
import { useToast, Drawer, Empty, Skeleton, CountUp, Sparkline, Meter } from '../components/ui.jsx';
import {
  IcoPen,
  IcoArrowRight,
  IcoQuote,
  IcoTrash,
  IcoTrendUp,
  IcoClock,
  IcoFileText,
  IcoSparkles,
  IcoEye,
} from '../components/icons.jsx';

const CATEGORY_LABEL = {
  opinion: '观点类',
  discussion: '讨论类',
  'problem-solution': '问题解决',
  'two-part': '两问类',
  advantage: '利弊类',
  chart: '图表',
  process: '流程',
  map: '地图',
  mixed: '组合图',
};

const DIFF = ['', '入门', '常规', '较难'];

const TABS = [
  { k: 'prompts', label: '题库' },
  { k: 'mine', label: '我的作文' },
  { k: 'stats', label: '批改报告' },
];

export default function Writing() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('prompts');
  const [taskType, setTaskType] = useState('task2');
  const [category, setCategory] = useState('');
  const [prompts, setPrompts] = useState(null);
  const [essays, setEssays] = useState(null);
  const [stats, setStats] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadPrompts = () => {
    const qs = new URLSearchParams({ task_type: taskType });
    if (category) qs.set('category', category);
    return api(`/writing/prompts?${qs}`).then((d) => {
      setPrompts(d);
      return d;
    });
  };

  useEffect(() => {
    loadPrompts().catch((e) => toast(e.message, 'err'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType, category]);

  useEffect(() => {
    api('/writing/essays').then(setEssays).catch(() => {});
    api('/writing/stats').then(setStats).catch(() => {});
  }, [tab]);

  const categories = useMemo(() => {
    if (!prompts) return [];
    return prompts.categories.filter((c) => {
      const known = ['opinion', 'discussion', 'problem-solution', 'two-part', 'advantage'];
      const chartish = ['chart', 'process', 'map', 'mixed'];
      return taskType === 'task2' ? known.includes(c) : chartish.includes(c);
    });
  }, [prompts, taskType]);

  const startWriting = async (p) => {
    setBusy(true);
    try {
      const r = await api('/writing/essays', { method: 'POST', body: { prompt_id: p.id, content: '', submit: false } });
      navigate(`/writing/e/${r.id}`);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const openModel = async (p) => {
    try {
      setDetail(await api(`/writing/prompts/${p.id}`));
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const removeEssay = async (id, ev) => {
    ev.stopPropagation();
    if (!window.confirm('删除这篇作文？')) return;
    try {
      await api(`/writing/essays/${id}`, { method: 'DELETE' });
      setEssays((prev) => ({ ...prev, essays: prev.essays.filter((e) => e.id !== id), total: prev.total - 1 }));
      toast('已删除');
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  return (
    <>
      <div className="page-head head-row rise">
        <div>
          <h1>写作</h1>
          <div className="sub">限时写作 · 四维批改 · 范文对照。批改用可解释的统计特征评分，不联网也能用。</div>
        </div>
        <div className="mode-tabs">
          {TABS.map((t) => (
            <button key={t.k} className={`mode-tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'prompts' && (
        <>
          <div className="card rise">
            <div className="row wrap" style={{ gap: 10 }}>
              <div className="mode-tabs">
                {[
                  { k: 'task2', label: 'Task 2 · 议论文' },
                  { k: 'task1', label: 'Task 1 · 图表' },
                ].map((t) => (
                  <button
                    key={t.k}
                    className={`mode-tab ${taskType === t.k ? 'active' : ''}`}
                    onClick={() => {
                      setTaskType(t.k);
                      setCategory('');
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="spacer" />
              <span className="muted">共 {prompts?.total ?? '—'} 道题</span>
            </div>

            {categories.length > 0 && (
              <div className="chips" style={{ marginTop: 12 }}>
                <button className={`chip ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>
                  全部
                </button>
                {categories.map((c) => (
                  <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                    {CATEGORY_LABEL[c] || c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!prompts ? (
            <div className="grid grid-2" style={{ marginTop: 14 }}>
              {[0, 1, 2, 3].map((i) => (
                <div className="card" key={i}>
                  <Skeleton w="60%" h={16} />
                  <Skeleton w="100%" h={40} style={{ marginTop: 12 }} />
                </div>
              ))}
            </div>
          ) : prompts.prompts.length === 0 ? (
            <div className="card" style={{ marginTop: 14 }}>
              <Empty icon={<IcoFileText />} title="这个分类下暂无题目" desc="换个分类看看" />
            </div>
          ) : (
            <div className="grid grid-2" style={{ marginTop: 14 }}>
              {prompts.prompts.map((p, i) => (
                <div className="card prompt-card rise" key={p.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="row-between" style={{ alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                        <span className={`tag ${p.task_type === 'task1' ? 'cyan' : ''}`}>
                          {p.task_type === 'task1' ? 'Task 1' : 'Task 2'}
                        </span>
                        {p.category && <span className="tag gray">{CATEGORY_LABEL[p.category] || p.category}</span>}
                        <span className="tag amber">{DIFF[p.difficulty] || '常规'}</span>
                      </div>
                      <div className="prompt-title" style={{ marginTop: 10 }}>{p.title}</div>
                    </div>
                    {p.my_count > 0 && <span className="tag green">已写 {p.my_count} 篇</span>}
                  </div>

                  <div className="prompt-body" style={{ marginTop: 10 }}>{p.prompt_en}</div>

                  <div className="row wrap muted" style={{ gap: 14, marginTop: 12, fontSize: 12 }}>
                    <span className="row" style={{ gap: 5 }}>
                      <IcoFileText style={{ width: 13, height: 13 }} /> {p.min_words}+ 词
                    </span>
                    <span className="row" style={{ gap: 5 }}>
                      <IcoClock style={{ width: 13, height: 13 }} /> {p.minutes} 分钟
                    </span>
                    {p.model_count > 0 && (
                      <span className="row" style={{ gap: 5, color: 'var(--cyan)' }}>
                        <IcoQuote style={{ width: 13, height: 13 }} /> {p.model_count} 篇范文
                      </span>
                    )}
                  </div>

                  <div className="row" style={{ marginTop: 14, gap: 8 }}>
                    <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => startWriting(p)}>
                      <IcoPen /> 开始写作
                    </button>
                    {p.model_count > 0 && (
                      <button className="btn btn-outline btn-sm" onClick={() => openModel(p)}>
                        <IcoEye /> 看范文
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'mine' && (
        <div className="card rise">
          <div className="card-title">
            <span className="dot" /> 我的作文（{essays?.total ?? 0}）
          </div>
          {!essays ? (
            <Skeleton h={80} />
          ) : essays.essays.length === 0 ? (
            <Empty
              icon={<IcoPen />}
              title="还没有写过作文"
              desc="从题库挑一道题开始，写完提交即可获得四维批改报告"
              action={
                <button className="btn btn-primary" onClick={() => setTab('prompts')}>
                  去挑题目 <IcoArrowRight />
                </button>
              }
            />
          ) : (
            <div className="essay-list">
              {essays.essays.map((e) => (
                <div className="essay-row" key={e.id} onClick={() => navigate(`/writing/e/${e.id}`)}>
                  <div className="score-badge" data-empty={!e.bands.overall}>
                    {fmtBand(e.bands.overall)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="t">{e.prompt_title || '自由写作'}</div>
                    <div className="d muted">
                      {e.word_count} 词 · {e.status === 'done' ? '已批改' : '草稿'} · {fmtDate(e.updated_at)}
                    </div>
                  </div>
                  {e.bands.overall != null && (
                    <div className="row" style={{ gap: 6 }}>
                      {['tr', 'cc', 'lr', 'gra'].map((k) => (
                        <span key={k} className="mini-band" title={k.toUpperCase()}>
                          <b>{k.toUpperCase()}</b>
                          {fmtBand(e.bands[k])}
                        </span>
                      ))}
                    </div>
                  )}
                  <button className="icon-btn" title="删除" onClick={(ev) => removeEssay(e.id, ev)}>
                    <IcoTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && <WritingStats stats={stats} />}

      <Drawer open={!!detail} onClose={() => setDetail(null)} title="参考范文">
        {detail && (
          <>
            <div className="msg info" style={{ marginBottom: 14 }}>
              {detail.prompt.prompt_en}
            </div>
            {detail.model_essays.length === 0 && <Empty title="该题暂无范文" desc="试试其他题目" />}
            {detail.model_essays.map((m) => (
              <div className="card" key={m.id} style={{ marginBottom: 14 }}>
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <div className="card-title" style={{ margin: 0 }}>
                    <span className="dot" /> {m.title || '范文'}
                  </div>
                  <span className="tag green">Band {m.band}</span>
                </div>
                <div className="essay-text">{m.content}</div>
                {m.highlights?.length > 0 && (
                  <>
                    <div className="card-title" style={{ marginTop: 18 }}>
                      <span className="dot" /> 亮点句解析
                    </div>
                    {m.highlights.map((h, i) => (
                      <div className="highlight-item" key={i}>
                        <div className="q">{h.quote}</div>
                        <div className="c">{h.comment}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </Drawer>
    </>
  );
}

function WritingStats({ stats }) {
  if (!stats) return <div className="card rise" style={{ marginTop: 14 }}><Skeleton h={120} /></div>;
  const s = stats.summary || {};
  const dims = stats.dimension_avg || {};
  const dimMeta = [
    { k: 'tr', label: 'TR 任务回应', color: '#818cf8' },
    { k: 'cc', label: 'CC 连贯衔接', color: '#22d3ee' },
    { k: 'lr', label: 'LR 词汇资源', color: '#34d399' },
    { k: 'gra', label: 'GRA 语法准确', color: '#fbbf24' },
  ];
  const trendPoints = (stats.trend || []).map((t) => t.band || 0);

  return (
    <>
      <div className="grid grid-4" style={{ marginTop: 14 }}>
        <div className="card stat-card rise">
          <div className="k">已批改</div>
          <div className="v">
            <CountUp to={s.done || 0} />
            <small>篇</small>
          </div>
          <div className="foot">共 {s.total || 0} 篇（含草稿）</div>
        </div>
        <div className="card stat-card rise" style={{ animationDelay: '40ms' }}>
          <div className="k">平均分</div>
          <div className="v">{fmtBand(s.avg_band)}</div>
          <div className="foot">目标 7.0+</div>
        </div>
        <div className="card stat-card rise" style={{ animationDelay: '80ms' }}>
          <div className="k">最高分</div>
          <div className="v">{fmtBand(s.best_band)}</div>
          <div className="foot">{s.prompts_touched || 0} 道题已练</div>
        </div>
        <div className="card stat-card rise" style={{ animationDelay: '120ms' }}>
          <div className="k">累计写作</div>
          <div className="v">
            <CountUp to={s.total_words || 0} />
            <small>词</small>
          </div>
          <div className="foot">约 {Math.round((s.total_words || 0) / 250)} 篇 Task2 的量</div>
        </div>
      </div>

      <div className="grid dash-split" style={{ marginTop: 14 }}>
        <div className="card rise">
          <div className="card-title">
            <span className="dot" /> 四维平均分
          </div>
          {s.done ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dimMeta.map((d) => (
                <Meter
                  key={d.k}
                  value={dims[d.k] || 0}
                  max={9}
                  color={d.color}
                  height={9}
                  label={d.label}
                  right={dims[d.k] ?? '—'}
                />
              ))}
              <div className="muted" style={{ marginTop: 4 }}>
                最弱维度是{' '}
                <b style={{ color: 'var(--amber)' }}>
                  {dimMeta.slice().sort((a, b) => (dims[a.k] || 0) - (dims[b.k] || 0))[0].label}
                </b>
                ，优先攻克它提分最快。
              </div>
            </div>
          ) : (
            <Empty title="还没有批改记录" desc="提交一篇作文后这里会显示四维得分" />
          )}
        </div>

        <div className="card rise">
          <div className="card-title">
            <span className="dot" /> 分数走势
          </div>
          {trendPoints.length >= 2 ? (
            <>
              <Sparkline points={trendPoints} width={420} height={90} />
              <div className="row-between" style={{ marginTop: 8 }}>
                <span className="muted mono">{stats.trend[0]?.day}</span>
                <span className="tag cyan">
                  <IcoTrendUp style={{ width: 12, height: 12 }} /> 最近 {trendPoints[trendPoints.length - 1]}
                </span>
                <span className="muted mono">{stats.trend[stats.trend.length - 1]?.day}</span>
              </div>
            </>
          ) : (
            <Empty
              icon={<IcoSparkles />}
              title="数据还不够"
              desc="至少完成 2 次批改才能看出趋势，坚持写下去"
            />
          )}
          {(stats.by_task || []).length > 0 && (
            <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
              {stats.by_task.map((b) => (
                <span className="tag" key={b.task_type}>
                  {b.task_type === 'task1' ? 'Task 1' : 'Task 2'}：{b.n} 篇 · 均分 {fmtBand(b.band)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
