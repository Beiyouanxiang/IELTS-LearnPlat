import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Ring, useHotkeys, useToast } from '../components/ui.jsx';
import { speak } from '../lib/tts.js';
import {
  IcoTarget,
  IcoPen,
  IcoHeadphones,
  IcoSpeaker,
  IcoZap,
  IcoRotate,
  IcoCheck,
  IcoX,
  IcoKeyboard,
  IcoChevronL,
} from '../components/icons.jsx';

const MODES = [
  { k: 'choice', label: '选择题', icon: <IcoTarget />, desc: '看单词选释义，或看释义选单词' },
  { k: 'spell', label: '拼写题', icon: <IcoPen />, desc: '看中文释义，拼出英文单词' },
  { k: 'listening', label: '听音辨词', icon: <IcoHeadphones />, desc: '听发音，选出正确拼写' },
];

export default function Quiz() {
  const toast = useToast();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [listId, setListId] = useState('');
  const [mode, setMode] = useState('choice');
  const [count, setCount] = useState(10);
  const [phase, setPhase] = useState('setup');

  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState(null); // {correct, answerText}
  const [results, setResults] = useState([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const startRef = useRef(Date.now());
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api('/vocab/lists').then((d) => setLists(d.lists || [])).catch(() => {});
  }, []);

  const q = questions[idx];

  const start = async () => {
    setErr('');
    setBusy(true);
    setSummary(null);
    setResults([]);
    setIdx(0);
    setPicked(null);
    setTyped('');
    setVerdict(null);
    setCombo(0);
    setMaxCombo(0);
    try {
      const d = await api(`/vocab/quiz?mode=${mode}&count=${count}${listId ? `&list_id=${listId}` : ''}`);
      setQuestions(d.questions || []);
      setPhase('playing');
      startRef.current = Date.now();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const finish = useCallback(async (all) => {
    try {
      const s = await api('/vocab/quiz/submit', {
        method: 'POST',
        body: { results: all, duration_ms: Date.now() - startRef.current },
      });
      setSummary({ ...s, maxCombo });
      setPhase('done');
    } catch (e) {
      setErr(e.message);
    }
  }, [maxCombo]);

  const advance = useCallback(
    (rec) => {
      const nextResults = [...results, rec];
      setResults(nextResults);
      if (idx + 1 < questions.length) {
        setIdx((i) => i + 1);
        setPicked(null);
        setTyped('');
        setVerdict(null);
      } else {
        finish(nextResults);
      }
    },
    [results, idx, questions.length, finish]
  );

  const choose = useCallback(
    (optId) => {
      if (picked != null || !q) return;
      const correct = optId === q.answer_id;
      setPicked(optId);
      setVerdict({ correct, answerText: q.answer_text || q.options?.find((o) => o.id === q.answer_id)?.text });
      setCombo((c) => {
        const n = correct ? c + 1 : 0;
        setMaxCombo((m) => Math.max(m, n));
        return n;
      });
      timerRef.current = setTimeout(() => {
        advance({
          word_id: q.word_id,
          answer_id: optId,
          correct,
          direction: q.direction || q.mode,
          mode: q.mode,
        });
      }, correct ? 620 : 1250);
    },
    [picked, q, advance]
  );

  const submitTyped = useCallback(() => {
    if (verdict || !q) return;
    const ok = typed.trim().toLowerCase() === String(q.answer_text || '').toLowerCase();
    setVerdict({ correct: ok, answerText: q.answer_text });
    setCombo((c) => {
      const n = ok ? c + 1 : 0;
      setMaxCombo((m) => Math.max(m, n));
      return n;
    });
    timerRef.current = setTimeout(() => {
      advance({
        word_id: q.word_id,
        answer_id: q.word_id,
        user_input: typed,
        correct: ok,
        direction: q.mode,
        mode: q.mode,
      });
    }, ok ? 700 : 1500);
  }, [verdict, q, typed, advance]);

  // 听音模式自动播放
  useEffect(() => {
    if (phase === 'playing' && q?.mode === 'listening') {
      const t = setTimeout(() => speak(q.audio_text || q.prompt, { accent: 'uk' }), 220);
      return () => clearTimeout(t);
    }
  }, [phase, q?.word_id, q?.mode]);

  // 拼写模式聚焦
  useEffect(() => {
    if (phase === 'playing' && q?.mode === 'spell' && !verdict) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [phase, idx, q?.mode, verdict]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useHotkeys(
    {
      '1': () => q?.options?.[0] && choose(q.options[0].id),
      '2': () => q?.options?.[1] && choose(q.options[1].id),
      '3': () => q?.options?.[2] && choose(q.options[2].id),
      '4': () => q?.options?.[3] && choose(q.options[3].id),
      space: () => q?.mode === 'listening' && speak(q.audio_text || q.prompt, { accent: 'uk' }),
      enter: () => {
        if (q?.mode === 'spell' && !verdict && typed.trim()) submitTyped();
      },
    },
    [q, choose, verdict, typed, submitTyped]
  );

  /* ---------------- 设置页 ---------------- */
  if (phase === 'setup') {
    return (
      <div className="narrow rise" style={{ margin: '0 auto' }}>
        <div className="page-head">
          <h1>词汇测验</h1>
          <div className="sub">选择一种题型开始。答错的词会自动按 SM-2 重新安排复习。</div>
        </div>

        {err && <div className="msg error">{err}</div>}

        <div className="card">
          <div className="card-title">
            <span className="dot" /> 题型
          </div>
          <div className="grid grid-3">
            {MODES.map((m) => (
              <button
                key={m.k}
                onClick={() => setMode(m.k)}
                className={`btn ${mode === m.k ? 'btn-primary' : ''}`}
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: 16,
                  height: 'auto',
                  textAlign: 'left',
                  gap: 6,
                }}
              >
                <div className="row" style={{ gap: 8 }}>
                  {m.icon}
                  <span style={{ fontWeight: 640 }}>{m.label}</span>
                </div>
                <span style={{ fontSize: 11.5, opacity: 0.8, whiteSpace: 'normal', fontWeight: 400 }}>{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span className="dot" /> 范围
          </div>
          <div className="chips" style={{ marginBottom: 16 }}>
            <button className={`chip ${!listId ? 'active' : ''}`} onClick={() => setListId('')}>
              全部词库
            </button>
            {lists.map((l) => (
              <button
                key={l.id}
                className={`chip ${String(l.id) === String(listId) ? 'active' : ''}`}
                onClick={() => setListId(String(l.id))}
              >
                {l.name}（{l.word_count}）
              </button>
            ))}
          </div>
          <div className="card-title" style={{ marginTop: 6 }}>
            <span className="dot" /> 题量
          </div>
          <div className="chips">
            {[10, 20, 30, 50].map((n) => (
              <button key={n} className={`chip ${count === n ? 'active' : ''}`} onClick={() => setCount(n)}>
                {n} 题
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary btn-lg" onClick={start} disabled={busy}>
            <IcoZap /> {busy ? '准备中…' : '开始测验'}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- 结算页 ---------------- */
  if (phase === 'done' && summary) {
    const acc = Math.round((summary.accuracy || 0) * 100);
    const wrongs = results.filter((r) => !r.correct);
    return (
      <div className="narrow pop" style={{ margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 36 }}>
          <h2 style={{ fontSize: 20 }}>测验完成</h2>
          <div className="muted" style={{ marginBottom: 18 }}>
            {MODES.find((m) => m.k === mode)?.label} · 用时 {Math.max(1, Math.round((Date.now() - startRef.current) / 1000))} 秒
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap', alignItems: 'center' }}>
            <Ring value={acc} size={158} stroke={14} from={acc >= 80 ? '#34d399' : acc >= 60 ? '#fbbf24' : '#fb7185'} to={acc >= 80 ? '#22d3ee' : '#a855f7'}>
              <div>
                <div className="mono" style={{ fontSize: 34, fontWeight: 760 }}>{acc}%</div>
                <div className="muted" style={{ fontSize: 11 }}>准确率</div>
              </div>
            </Ring>
            <div className="grid" style={{ gap: 12, textAlign: 'left' }}>
              <div>
                <div className="muted">答对</div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 720, color: 'var(--green)' }}>{summary.correct}</div>
              </div>
              <div>
                <div className="muted">答错</div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 720, color: 'var(--red)' }}>{summary.total - summary.correct}</div>
              </div>
              <div>
                <div className="muted">最长连对</div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 720, color: 'var(--cyan)' }}>{summary.maxCombo}</div>
              </div>
            </div>
          </div>

          {wrongs.length > 0 && (
            <div style={{ marginTop: 24, textAlign: 'left' }}>
              <div className="card-title">
                <span className="dot" /> 需要加强的词（{wrongs.length}）
              </div>
              <div className="row wrap" style={{ gap: 8 }}>
                {wrongs.map((w, i) => {
                  const qq = questions.find((x) => x.word_id === w.word_id);
                  return (
                    <span className="tag red" key={i}>
                      {qq?.answer_text || qq?.prompt || `#${w.word_id}`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="row" style={{ justifyContent: 'center', marginTop: 26 }}>
            <button className="btn btn-primary" onClick={start}>
              <IcoRotate /> 再来一轮
            </button>
            <button className="btn" onClick={() => setPhase('setup')}>
              换题型
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              返回工作台
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 答题中 ---------------- */
  if (!q) return <div className="msg error">题目加载失败</div>;

  const progress = Math.round((idx / questions.length) * 100);

  return (
    <div className="narrow rise" style={{ margin: '0 auto', paddingBottom: 40 }}>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setPhase('setup')}>
          <IcoChevronL /> 退出
        </button>
        <div className="row" style={{ gap: 8 }}>
          {combo >= 2 && <span className="tag cyan">连对 {combo}</span>}
          <span className="muted mono">
            {idx + 1} / {questions.length}
          </span>
        </div>
      </div>
      <div className="bar" style={{ marginBottom: 22 }}>
        <i style={{ width: `${progress}%` }} />
      </div>

      {err && <div className="msg error">{err}</div>}

      <div className="card">
        <div className="muted center" style={{ marginBottom: 14, letterSpacing: '0.04em' }}>
          {q.mode === 'choice'
            ? q.direction === 'word2meaning'
              ? '选出正确的中文释义'
              : '选出对应的英文单词'
            : q.mode === 'spell'
            ? '根据中文释义拼写英文单词'
            : '听发音，选出正确拼写'}
        </div>

        {/* 题干 */}
        {q.mode === 'choice' && (
          <div className="quiz-prompt" style={{ marginBottom: 22 }}>
            {q.prompt}
            {q.phonetic && <span className="phon">{q.phonetic}</span>}
          </div>
        )}

        {q.mode === 'spell' && (
          <>
            <div className="quiz-prompt" style={{ marginBottom: 6 }}>{q.prompt}</div>
            <div className="center muted mono" style={{ marginBottom: 20, letterSpacing: 4 }}>
              {q.answer_text?.split('').map(() => '•').join('')}（{q.answer_text?.length} 个字母）
            </div>
          </>
        )}

        {q.mode === 'listening' && (
          <div className="center" style={{ marginBottom: 22 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => speak(q.audio_text || q.prompt, { accent: 'uk' })}
              style={{ padding: '18px 30px' }}
            >
              <IcoSpeaker style={{ width: 22, height: 22 }} /> 播放发音
            </button>
            <div className="muted" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <IcoKeyboard style={{ width: 13, height: 13 }} /> 空格重播
            </div>
          </div>
        )}

        {/* 选项 / 输入 */}
        {q.mode === 'spell' ? (
          <div>
            <input
              ref={inputRef}
              className="input"
              style={{ fontSize: 20, textAlign: 'center', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}
              value={typed}
              disabled={!!verdict}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="输入英文单词"
            />
            {verdict && (
              <div
                className="msg"
                style={{
                  marginTop: 14,
                  background: verdict.correct ? 'var(--green-dim)' : 'var(--red-dim)',
                  color: verdict.correct ? 'var(--green)' : 'var(--red)',
                  borderColor: verdict.correct ? 'rgba(52,211,153,.3)' : 'rgba(251,113,133,.3)',
                }}
              >
                {verdict.correct ? <IcoCheck /> : <IcoX />}
                {verdict.correct ? '拼写正确' : `正确答案：${verdict.answerText}`}
              </div>
            )}
            {!verdict && (
              <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={submitTyped} disabled={!typed.trim()}>
                  提交 <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.8 }}>↵</kbd>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {(q.options || []).map((o, i) => {
              let cls = 'quiz-option';
              if (picked != null) {
                if (o.id === q.answer_id) cls += ' correct';
                else if (o.id === picked) cls += ' wrong';
              }
              return (
                <button key={o.id} className={cls} onClick={() => choose(o.id)} disabled={picked != null}>
                  <span className="idx">{i + 1}</span>
                  <span>{o.text}</span>
                  {picked != null && o.id === q.answer_id && <IcoCheck style={{ marginLeft: 'auto', color: 'var(--green)' }} />}
                  {picked != null && o.id === picked && o.id !== q.answer_id && (
                    <IcoX style={{ marginLeft: 'auto', color: 'var(--red)' }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {combo >= 3 && <div className="combo">🔥 连对 {combo}！</div>}
    </div>
  );
}
