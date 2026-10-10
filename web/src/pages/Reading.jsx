import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, fmtDate, fmtBand } from '../api.js';
import { useToast, Empty, Skeleton, CountUp, Sparkline } from '../components/ui.jsx';
import { speak } from '../lib/tts.js';
import {
  IcoBook,
  IcoClock,
  IcoCheck,
  IcoX,
  IcoPen,
  IcoSend,
  IcoChevronL,
  IcoSparkles,
  IcoTrendUp,
  IcoSpeaker,
  IcoStar,
} from '../components/icons.jsx';

const DIFF = ['', '入门', '常规', '较难'];
const DIFF_COLOR = ['', 'green', 'amber', 'red'];

const TYPE_LABEL = {
  tfng: 'True / False / Not Given',
  yng: 'Yes / No / Not Given',
  choice: '单项选择',
  match_heading: '段落标题匹配',
  completion: '摘要填空',
};

function parseParagraphs(content) {
  return String(content)
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n');
      const first = (lines[0] || '').trim();
      if (/^[A-Z]$/.test(first) || /^[A-Z][a-z]+$/.test(first) && lines.length > 1) {
        return { label: first, text: lines.slice(1).join(' ').trim() };
      }
      return { label: '', text: block.replace(/\n/g, ' ').trim() };
    })
    .filter((p) => p.text);
}

export default function Reading() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [passages, setPassages] = useState(null);
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState(null);

  // 支持 ?passage=<id> 直接进入练习（可分享链接）
  const activeId = Number(searchParams.get('passage')) || null;
  const setActiveId = (id) => {
    if (id) setSearchParams({ passage: String(id) });
    else setSearchParams({});
  };

  const load = useCallback(() => {
    api('/reading/passages').then(setPassages).catch((e) => toast(e.message, 'err'));
    api('/reading/stats').then(setStats).catch(() => {});
    api('/reading/attempts').then(setAttempts).catch(() => {});
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (activeId) {
    return (
      <Practice
        passageId={activeId}
        onExit={() => {
          setActiveId(null);
          load();
        }}
      />
    );
  }

  const s = stats?.summary;
  const trendPoints = (stats?.trend || []).map((t) => t.band || 0);

  return (
    <>
      <div className="page-head head-row rise">
        <div>
          <h1>阅读</h1>
          <div className="sub">题型化精读：判断题 · 选择题 · 标题匹配 · 摘要填空，提交后逐题解析并可一键收词。</div>
        </div>
      </div>

      {s && (
        <div className="grid grid-4">
          <div className="card stat-card rise">
            <div className="k">已练文章</div>
            <div className="v"><CountUp to={s.passages_read} /><small>篇</small></div>
            <div className="foot">累计 {s.attempts} 次练习</div>
          </div>
          <div className="card stat-card rise" style={{ animationDelay: '40ms' }}>
            <div className="k">总正确率</div>
            <div className="v">
              {s.accuracy == null ? '—' : Math.round(s.accuracy * 100)}
              {s.accuracy != null && <small>%</small>}
            </div>
            <div className="foot">{s.correct} / {s.total} 题</div>
          </div>
          <div className="card stat-card rise" style={{ animationDelay: '80ms' }}>
            <div className="k">平均分</div>
            <div className="v">{fmtBand(s.avg_band)}</div>
            <div className="foot">按正确率换算</div>
          </div>
          <div className="card stat-card rise" style={{ animationDelay: '120ms' }}>
            <div className="k">最高分</div>
            <div className="v">{fmtBand(s.best_band)}</div>
            <div className="foot">目标 7.0+</div>
          </div>
        </div>
      )}

      <div className="grid dash-split" style={{ marginTop: 14 }}>
        <div className="card rise">
          <div className="card-title"><span className="dot" /> 文章库</div>
          {!passages ? (
            <Skeleton h={100} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {passages.passages.map((p) => (
                <button className="passage-card" key={p.id} onClick={() => setActiveId(p.id)}>
                  <div className="ico"><IcoBook /></div>
                  <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    <div className="t">{p.title}</div>
                    <div className="d muted">
                      {p.topic} · {p.word_count} 词 · {p.question_count} 题
                      {p.attempt_count > 0 && ` · 练过 ${p.attempt_count} 次`}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6, flex: 'none' }}>
                    <span className={`tag ${DIFF_COLOR[p.difficulty]}`}>{DIFF[p.difficulty]}</span>
                    {p.best_band != null && <span className="tag cyan">最好 {fmtBand(p.best_band)}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card rise" style={{ animationDelay: '60ms' }}>
          <div className="row-between">
            <div className="card-title" style={{ margin: 0 }}><span className="dot" /> 分数走势</div>
            {trendPoints.length >= 2 && (
              <span className="tag cyan"><IcoTrendUp style={{ width: 12, height: 12 }} /> {trendPoints[trendPoints.length - 1]}</span>
            )}
          </div>
          {trendPoints.length >= 2 ? (
            <div style={{ marginTop: 12 }}><Sparkline points={trendPoints} width={380} height={70} /></div>
          ) : (
            <div className="muted" style={{ marginTop: 12 }}>完成 2 次以上练习后显示趋势</div>
          )}

          <div className="card-title" style={{ marginTop: 20 }}><span className="dot" /> 最近记录</div>
          {!attempts ? (
            <Skeleton h={60} />
          ) : attempts.attempts.length === 0 ? (
            <div className="muted">还没有练习记录</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
              {attempts.attempts.slice(0, 12).map((a) => (
                <div className="row-between" key={a.id} style={{ fontSize: 12.5 }}>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                  <span className="row" style={{ gap: 8, flex: 'none' }}>
                    <span className="mono muted">{a.correct}/{a.total}</span>
                    <span className={`tag ${a.band_score >= 7 ? 'green' : a.band_score >= 5.5 ? 'amber' : 'red'}`}>{fmtBand(a.band_score)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {(stats?.weak_topics || []).length > 0 && (
            <>
              <div className="card-title" style={{ marginTop: 20 }}><span className="dot" /> 薄弱话题</div>
              <div className="row wrap" style={{ gap: 8 }}>
                {stats.weak_topics.map((t) => (
                  <span className="tag amber" key={t.topic}>{t.topic} × {t.n}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Practice({ passageId, onExit }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [activePara, setActivePara] = useState('');
  const [popup, setPopup] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    api(`/reading/passages/${passageId}`)
      .then((d) => {
        setData(d);
        setAnswers({});
        setResult(null);
        setSeconds(0);
      })
      .catch((e) => {
        toast(e.message, 'err');
        onExit();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageId]);

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [result]);

  const paras = useMemo(() => (data ? parseParagraphs(data.passage.content) : []), [data]);

  const answeredCount = Object.values(answers).filter((v) => String(v || '').trim()).length;

  const submit = async () => {
    if (answeredCount < (data.questions.length || 1)) {
      if (!window.confirm(`还有 ${data.questions.length - answeredCount} 题未作答，确定提交？`)) return;
    }
    setBusy(true);
    try {
      const r = await api(`/reading/passages/${passageId}/submit`, {
        method: 'POST',
        body: { answers, duration_sec: seconds },
      });
      setResult(r);
      toast(`正确率 ${Math.round(r.accuracy * 100)}%，换算 ${fmtBand(r.band_score)} 分`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  // 选中单词 → 加入生词本
  const onMouseUp = () => {
    const sel = window.getSelection();
    const text = String(sel?.toString() || '').trim();
    if (!/^[A-Za-z][A-Za-z'-]{1,24}$/.test(text)) return setPopup(null);
    const range = sel.getRangeAt(0).getBoundingClientRect();
    setPopup({ word: text.toLowerCase(), x: range.left + range.width / 2, y: range.top - 6 });
  };

  const addWord = async () => {
    if (!popup) return;
    try {
      await api('/listening/vocab-add', { method: 'POST', body: { word: popup.word } });
      toast(`「${popup.word}」已加入生词本`);
    } catch (e) {
      toast(e.message, 'err');
    }
    setPopup(null);
  };

  if (!data) {
    return (
      <div className="card">
        <Skeleton w="50%" h={20} />
        <Skeleton h={260} style={{ marginTop: 16 }} />
      </div>
    );
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const resultMap = result ? Object.fromEntries(result.detail.map((d) => [d.id, d])) : null;

  return (
    <>
      <div className="page-head head-row rise">
        <div style={{ minWidth: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={onExit} style={{ marginBottom: 6 }}>
            <IcoChevronL /> 返回阅读
          </button>
          <h1 style={{ fontSize: 22 }}>{data.passage.title}</h1>
          <div className="sub">
            {data.passage.topic} · {data.passage.word_count} 词 · {data.questions.length} 题
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <span className="write-timer" data-over={seconds > 1200} style={{ margin: 0 }}>
            <IcoClock style={{ width: 15, height: 15 }} />
            <span className="mono">{mm}:{ss}</span>
          </span>
          {!result ? (
            <>
              <span className="muted" style={{ fontSize: 12 }}>{answeredCount}/{data.questions.length} 已答</span>
              <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>
                <IcoSend /> {busy ? '批改中…' : '提交答案'}
              </button>
            </>
          ) : (
            <div className="row" style={{ gap: 8 }}>
              <span className={`tag ${result.band_score >= 7 ? 'green' : result.band_score >= 5.5 ? 'amber' : 'red'}`}>
                {result.correct}/{result.total} · 换算 {fmtBand(result.band_score)} 分
              </span>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setAnswers({});
                  setResult(null);
                  setSeconds(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                重做
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid read-layout">
        <div className="card rise read-passage">
          <div className="card-title">
            <span className="dot" /> 原文
            <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>（选中单词可加入生词本）</span>
          </div>
          <div ref={bodyRef} onMouseUp={onMouseUp} className="read-body">
            {paras.map((p, i) => {
              const dim = activePara && p.label && activePara !== p.label;
              return (
                <div
                  className={`read-para ${activePara === p.label ? 'focus' : ''} ${dim ? 'dimmed' : ''}`}
                  key={i}
                  onClick={() => setActivePara(activePara === p.label ? '' : p.label)}
                >
                  {p.label && <span className="plabel">{p.label}</span>}
                  <span>{p.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card rise read-questions" style={{ animationDelay: '60ms' }}>
          <div className="card-title"><span className="dot" /> 题目</div>
          {data.questions.map((q) => {
            const r = resultMap?.[q.id];
            const given = answers[q.id];
            return (
              <div
                className={`q-block ${r ? (r.correct ? 'ok' : 'bad') : ''}`}
                key={q.id}
                onMouseEnter={() => r?.para_ref && r.para_ref !== '-' && setActivePara(r.para_ref)}
                onMouseLeave={() => setActivePara('')}
              >
                <div className="q-head">
                  <span className="q-idx">{q.idx}</span>
                  <span className="q-type">{q.qtype_label}</span>
                  {r && <span className={`tag ${r.correct ? 'green' : 'red'}`}>{r.correct ? '正确' : '错误'}</span>}
                  {r?.para_ref && r.para_ref !== '-' && <span className="tag gray">第 {r.para_ref} 段</span>}
                </div>
                <div className="q-text">{q.prompt}</div>

                {q.qtype === 'tfng' || q.qtype === 'yng' ? (
                  <div className="chips" style={{ marginTop: 10 }}>
                    {(q.qtype === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map((opt) => {
                      const chosen = given === opt;
                      const isAns = r && r.answer.toUpperCase() === opt;
                      return (
                        <button
                          key={opt}
                          className={`chip ${chosen ? 'active' : ''} ${r && isAns ? 'right' : ''} ${r && chosen && !r.correct ? 'wrong' : ''}`}
                          disabled={!!r}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : q.qtype === 'completion' ? (
                  <div style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder="填入一词"
                      value={given || ''}
                      disabled={!!r}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    />
                    {r && !r.correct && <div className="muted" style={{ marginTop: 6 }}>正确答案：<b>{r.answer}</b></div>}
                  </div>
                ) : (
                  <div className="q-options">
                    {(q.options || []).map((opt) => {
                      const chosen = given === opt;
                      const isAns = r && r.answer === opt;
                      return (
                        <button
                          key={opt}
                          className={`q-opt ${chosen ? 'sel' : ''} ${r && isAns ? 'right' : ''} ${r && chosen && !r.correct ? 'wrong' : ''}`}
                          disabled={!!r}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {r?.explanation && (
                  <div className="q-explain">
                    <b>解析：</b>{r.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {popup && (
        <div className="word-pop" style={{ left: popup.x, top: popup.y + window.scrollY }}>
          <span className="mono">{popup.word}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { speak(popup.word); }} title="朗读">
            <IcoSpeaker />
          </button>
          <button className="btn btn-primary btn-sm" onClick={addWord}>
            <IcoStar /> 加入生词本
          </button>
        </div>
      )}
    </>
  );
}
