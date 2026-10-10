import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, fmtBand } from '../api.js';
import { useToast, Drawer, Empty, Skeleton, Ring, Meter } from '../components/ui.jsx';
import {
  IcoChevronL,
  IcoPen,
  IcoSend,
  IcoClock,
  IcoQuote,
  IcoSparkles,
  IcoTrendUp,
  IcoFileText,
  IcoEye,
  IcoCheck,
} from '../components/icons.jsx';

const wordCount = (t) => (String(t).match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
const paraCount = (t) => String(t).split(/\n+/).filter((p) => p.trim()).length;

const DIM_META = [
  { k: 'tr', label: '任务回应', en: 'Task Response', color: '#818cf8' },
  { k: 'cc', label: '连贯与衔接', en: 'Coherence & Cohesion', color: '#22d3ee' },
  { k: 'lr', label: '词汇资源', en: 'Lexical Resource', color: '#34d399' },
  { k: 'gra', label: '语法范围与准确性', en: 'Grammar Range & Accuracy', color: '#fbbf24' },
];

const LEVEL_TAG = { high: 'red', mid: 'amber', low: 'gray' };
const LEVEL_TEXT = { high: '严重', mid: '中等', low: '轻微' };

export default function WritingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [essay, setEssay] = useState(null);
  const [content, setContent] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState('idle');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [promptDetail, setPromptDetail] = useState(null);

  const dirtyRef = useRef(false);
  const contentRef = useRef('');
  contentRef.current = content;

  // ---- 加载 ----
  useEffect(() => {
    (async () => {
      try {
        const d = await api(`/writing/essays/${id}`);
        setEssay(d.essay);
        setContent(d.essay.content || '');
        setAnalysis(d.essay.analysis || null);
        setSeconds(d.essay.duration_sec || 0);
        setRunning(!d.essay.content); // 空作文自动开始计时
        if (d.essay.prompt_id) {
          api(`/writing/prompts/${d.essay.prompt_id}`).then(setPromptDetail).catch(() => {});
        }
      } catch (e) {
        toast(e.message, 'err');
        navigate('/writing');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---- 计时 ----
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const save = useCallback(
    async (extra = {}) => {
      setSaving('saving');
      try {
        await api(`/writing/essays/${id}`, {
          method: 'PUT',
          body: { content: contentRef.current, duration_sec: seconds, ...extra },
        });
        dirtyRef.current = false;
        setSaving('saved');
        setTimeout(() => setSaving((s) => (s === 'saved' ? 'idle' : s)), 1600);
      } catch (e) {
        setSaving('error');
        toast(e.message, 'err');
      }
    },
    [id, seconds, toast]
  );

  // ---- 自动保存（20 秒）----
  useEffect(() => {
    const t = setInterval(() => {
      if (dirtyRef.current && saving !== 'saving') save();
    }, 20000);
    return () => clearInterval(t);
  }, [save, saving]);

  // ---- 离开前保存 ----
  useEffect(() => {
    return () => {
      if (dirtyRef.current) {
        api(`/writing/essays/${id}`, { method: 'PUT', body: { content: contentRef.current, duration_sec: seconds } }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (v) => {
    setContent(v);
    dirtyRef.current = true;
  };

  const submit = async () => {
    const wc = wordCount(content);
    if (wc < 40) {
      toast('内容太短，至少写满 40 词再提交批改', 'err');
      return;
    }
    setAnalyzing(true);
    setRunning(false);
    try {
      await save({ submit: true });
      const r = await api(`/writing/essays/${id}/analyze`, { method: 'POST' });
      setAnalysis(r.analysis);
      toast(`批改完成：Band ${fmtBand(r.bands.overall)}`);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setAnalyzing(false);
    }
  };

  const askAi = async () => {
    setAiBusy(true);
    try {
      const r = await api(`/writing/essays/${id}/ai-feedback`, { method: 'POST' });
      setAnalysis((a) => ({ ...(a || {}), ai: r.ai_feedback }));
      toast('AI 点评已生成');
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setAiBusy(false);
    }
  };

  const wc = useMemo(() => wordCount(content), [content]);
  const pc = useMemo(() => paraCount(content), [content]);
  const minWords = essay?.prompt?.min_words || 250;
  const limitMin = essay?.prompt?.minutes || 40;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const overTime = seconds > limitMin * 60;
  const progress = Math.min(100, Math.round((wc / minWords) * 100));

  if (!essay) {
    return (
      <div className="card">
        <Skeleton w="40%" h={20} />
        <Skeleton h={220} style={{ marginTop: 16 }} />
      </div>
    );
  }

  return (
    <>
      <div className="page-head head-row rise">
        <div style={{ minWidth: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/writing')} style={{ marginBottom: 6 }}>
            <IcoChevronL /> 返回写作
          </button>
          <h1 style={{ fontSize: 22 }}>{essay.prompt_title || '自由写作'}</h1>
          <div className="sub">
            {essay.prompt?.task_type === 'task1' ? 'Task 1' : 'Task 2'} · 要求 {minWords}+ 词 · 建议 {limitMin} 分钟
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {promptDetail?.model_essays?.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => setModelOpen(true)}>
              <IcoEye /> 范文
            </button>
          )}
          <button className="btn btn-sm" onClick={() => save()}>
            <IcoCheck /> {saving === 'saving' ? '保存中…' : saving === 'saved' ? '已保存' : '保存草稿'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={analyzing}>
            <IcoSend /> {analyzing ? '批改中…' : '提交批改'}
          </button>
        </div>
      </div>

      <div className="grid write-layout">
        {/* 题目 */}
        <div className="card rise" style={{ position: 'sticky', top: 16 }}>
          <div className="card-title">
            <span className="dot" /> 题目
          </div>
          <div className="prompt-body" style={{ fontSize: 14.5, lineHeight: 1.75 }}>{essay.prompt?.prompt_en}</div>
          {essay.prompt?.prompt_cn && (
            <div className="muted" style={{ marginTop: 12, lineHeight: 1.7 }}>{essay.prompt.prompt_cn}</div>
          )}

          <div className="write-timer" data-over={overTime}>
            <IcoClock style={{ width: 15, height: 15 }} />
            <span className="mono">{mm}:{ss}</span>
            <span className="muted" style={{ fontSize: 11 }}>
              {overTime ? `已超建议时长 ${limitMin} 分钟` : `剩余 ${limitMin - Math.floor(seconds / 60)} 分钟`}
            </span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setRunning((r) => !r)}>
              {running ? '暂停' : '继续'}
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <Meter
              value={progress}
              max={100}
              color={progress >= 100 ? 'var(--grad)' : 'linear-gradient(90deg,#fbbf24,#fb7185)'}
              label="字数进度"
              right={`${wc} / ${minWords}`}
            />
          </div>

          <div className="write-stats">
            <div><span className="mono">{wc}</span><small>词</small></div>
            <div><span className="mono">{pc}</span><small>段</small></div>
            <div><span className="mono">{content.split(/[.!?]+\s/).filter((s) => s.trim().length > 3).length}</span><small>句</small></div>
          </div>

          <div className="msg info" style={{ marginTop: 14, marginBottom: 0, fontSize: 12 }}>
            写完后点「提交批改」，系统会按 TR / CC / LR / GRA 四个维度给出分数与逐条修改建议。
          </div>
        </div>

        {/* 编辑区 */}
        <div className="card rise" style={{ animationDelay: '60ms' }}>
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="card-title" style={{ margin: 0 }}>
              <span className="dot" /> 正文
            </div>
            <span className="muted" style={{ fontSize: 11.5 }}>
              {saving === 'saving' ? '自动保存中…' : saving === 'saved' ? '已自动保存' : '每 20 秒自动保存'}
            </span>
          </div>
          <textarea
            className="essay-editor"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={'Write your answer here...\n\n建议结构：引言（改写题目 + 亮明立场）→ 主体段 A → 主体段 B → 结论'}
            spellCheck
          />
        </div>
      </div>

      {analysis && <Report analysis={analysis} onAi={askAi} aiBusy={aiBusy} />}

      <Drawer open={modelOpen} onClose={() => setModelOpen(false)} title="参考范文">
        {(promptDetail?.model_essays || []).map((m) => (
          <div className="card" key={m.id} style={{ marginBottom: 14 }}>
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="card-title" style={{ margin: 0 }}>
                <span className="dot" /> {m.title}
              </div>
              <span className="tag green">Band {m.band}</span>
            </div>
            <div className="essay-text">{m.content}</div>
            {m.highlights?.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="card-title"><span className="dot" /> 亮点句解析</div>
                {m.highlights.map((h, i) => (
                  <div className="highlight-item" key={i}>
                    <div className="q">{h.quote}</div>
                    <div className="c">{h.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Drawer>
    </>
  );
}

function Report({ analysis, onAi, aiBusy }) {
  const b = analysis.bands || {};
  const dims = Object.fromEntries((analysis.dimensions || []).map((d) => [d.key, d]));
  const issuesByDim = useMemo(() => {
    const m = { tr: [], cc: [], lr: [], gra: [] };
    for (const i of analysis.issues || []) (m[i.dim] || (m[i.dim] = [])).push(i);
    return m;
  }, [analysis]);

  return (
    <div className="card rise" style={{ marginTop: 14 }}>
      <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="card-title" style={{ margin: 0 }}>
          <span className="dot" /> 批改报告
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="tag gray">本地启发式评分 · 可复现</span>
          {!analysis.ai && (
            <button className="btn btn-outline btn-sm" onClick={onAi} disabled={aiBusy}>
              <IcoSparkles /> {aiBusy ? '生成中…' : 'AI 深度点评'}
            </button>
          )}
        </div>
      </div>

      <div className="grid report-top" style={{ marginTop: 16 }}>
        <div className="report-score">
          <Ring value={(b.overall / 9) * 100} size={148} stroke={13}>
            <div>
              <div className="mono" style={{ fontSize: 34, fontWeight: 760, letterSpacing: '-0.03em' }}>{fmtBand(b.overall)}</div>
              <div className="muted" style={{ fontSize: 11 }}>总分 Band</div>
            </div>
          </Ring>
          <div className="muted" style={{ marginTop: 10, textAlign: 'center' }}>{b.label}</div>
        </div>

        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 13 }}>
          {DIM_META.map((d) => {
            const dim = dims[d.k];
            if (!dim) return null;
            return (
              <div key={d.k}>
                <Meter value={dim.band} max={9} color={d.color} height={8} label={`${dim.label} · ${dim.en}`} right={fmtBand(dim.band)} />
                <div className="muted" style={{ fontSize: 11.5, marginTop: 5, lineHeight: 1.6 }}>{dim.notes[0]}</div>
                {issuesByDim[d.k]?.length > 0 && (
                  <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
                    {issuesByDim[d.k].map((i, n) => (
                      <span className={`tag ${LEVEL_TAG[i.level]}`} key={n} title={i.hint || ''}>
                        {LEVEL_TEXT[i.level]} · {i.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 量化指标 */}
      <div className="grid grid-4" style={{ marginTop: 18 }}>
        {[
          { k: '字数', v: analysis.word_count, s: `段落 ${analysis.paragraph_count}` },
          { k: '平均句长', v: analysis.avg_sentence_length, s: `波动 ${analysis.sentence_length_std}` },
          { k: '词汇多样性', v: analysis.stats?.lexical_diversity, s: `唯一词 ${analysis.stats?.unique_words}` },
          { k: '低频/学术词占比', v: `${analysis.stats?.advanced_word_ratio}%`, s: `核心词命中 ${analysis.stats?.ielts_core_hits}` },
          { k: '衔接词密度', v: `${analysis.stats?.linker_per100}/100`, s: `共 ${analysis.stats?.linker_count} 个` },
          { k: '复合句占比', v: `${analysis.stats?.complex_sentence_ratio}%`, s: `从句 ${analysis.stats?.subordinator_count} 处` },
          { k: '指代衔接', v: analysis.stats?.referencing_count, s: 'this / these / such' },
          { k: '题目关键词覆盖', v: `${analysis.stats?.keyword_coverage}%`, s: '越高越不跑题' },
        ].map((x, i) => (
          <div className="mini-stat" key={i}>
            <div className="k">{x.k}</div>
            <div className="v mono">{x.v}</div>
            <div className="s">{x.s}</div>
          </div>
        ))}
      </div>

      {/* 高频重复词 */}
      {analysis.stats?.repeated_words?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>
            <span className="dot" /> 高频重复词（同义替换机会）
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            {analysis.stats.repeated_words.map((r) => (
              <span className="tag amber" key={r.word}>
                {r.word} × {r.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 修改建议 */}
      <div style={{ marginTop: 18 }}>
        <div className="card-title">
          <span className="dot" /> 提分建议（按优先级）
        </div>
        <div className="advice-list">
          {(analysis.suggestions || []).map((s, i) => (
            <div className={`advice ${s.priority}`} key={i}>
              <div className="t">
                <span className={`tag ${s.priority === 'high' ? 'red' : s.priority === 'mid' ? 'amber' : 'gray'}`}>
                  {s.priority === 'high' ? '优先' : s.priority === 'mid' ? '建议' : '进阶'}
                </span>
                {s.title}
              </div>
              <div className="d">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 点评 */}
      {analysis.ai && (
        <div style={{ marginTop: 18 }}>
          <div className="card-title">
            <span className="dot" /> AI 深度点评
          </div>
          <div className="msg info" style={{ marginBottom: 12 }}>
            {analysis.ai.overall_comment}
          </div>
          {(analysis.ai.dimensions || []).map((d) => (
            <div className="highlight-item" key={d.key}>
              <div className="q">
                {d.key?.toUpperCase()} · Band {fmtBand(d.band)}
              </div>
              <div className="c">{d.comment}</div>
            </div>
          ))}
          {(analysis.ai.rewrites || []).length > 0 && (
            <>
              <div className="card-title" style={{ marginTop: 16 }}>
                <span className="dot" /> 句子改写示范
              </div>
              {(analysis.ai.rewrites || []).map((r, i) => (
                <div className="rewrite-item" key={i}>
                  <div className="old">{r.original}</div>
                  <div className="new">{r.improved}</div>
                  <div className="why">{r.reason}</div>
                </div>
              ))}
            </>
          )}
          {(analysis.ai.upgrade_plan || []).length > 0 && (
            <div className="msg ok" style={{ marginTop: 14 }}>
              <div>
                <b>下一步：</b>
                {(analysis.ai.upgrade_plan || []).map((p, i) => (
                  <div key={i} style={{ marginTop: 4 }}>· {p}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="muted" style={{ marginTop: 16, fontSize: 11.5, lineHeight: 1.7 }}>
        说明：本地批改基于文本的可测量特征（字数、结构、衔接词密度、词汇多样性、句长分布、表层语法错误）给出可解释评分，
        各维度上限为 8.0 —— 它无法判断论点是否有深度，因此不能完全等同于真人考官。
        需要语义层面的点评时，可配置 API Key 后使用「AI 深度点评」。
      </div>
    </div>
  );
}
