import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAudioUrl } from '../lib/useAudioUrl.js';
import { Empty, Skeleton, useToast } from '../components/ui.jsx';
import { speak, stopSpeak, ttsSupported } from '../lib/tts.js';
import {
  IcoChevronL,
  IcoChevronR,
  IcoPlay,
  IcoRotate,
  IcoSend,
  IcoSpeaker,
  IcoSparkles,
  IcoCheck,
  IcoX,
} from '../components/icons.jsx';

// 听力题型练习：听音选词 / 听写填空
// 有音频就播放对应片段；没有音频（如内置示例素材）则用浏览器 TTS 朗读该句。
export default function ListeningQuestions({ material, onExit }) {
  const toast = useToast();
  const audioUrl = useAudioUrl(material.audio_path);
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [transcript, setTranscript] = useState(null); // 无音频时的句子文本
  const audioRef = useRef(null);
  const stopAtRef = useRef(null);
  const inputRef = useRef(null);

  // 载入素材句子（用于 TTS 兜底）与题目
  useEffect(() => {
    (async () => {
      try {
        const [p, q] = await Promise.all([
          api(`/listening/materials/${material.id}/practice?blind=0`),
          api(`/listening/materials/${material.id}/questions`),
        ]);
        setTranscript(Object.fromEntries((p.segments || []).map((s) => [s.idx, s])));
        setData(q);
      } catch (e) {
        toast(e.message, 'err');
        onExit();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material.id]);

  const qs = data?.questions || [];
  const q = qs[idx];
  const seg = q && transcript ? transcript[q.segment_idx] : null;
  const hasAudio = !!material.audio_path;
  const answered = Object.values(answers).filter((v) => String(v || '').trim()).length;

  const playCurrent = useCallback(async () => {
    if (!q) return;
    if (hasAudio) {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Number(q.start_sec) || 0;
      stopAtRef.current = Number(q.end_sec) || null;
      a.playbackRate = rate;
      a.play().catch(() => {});
      return;
    }
    const text = seg?.text || q.explanation;
    if (!text) {
      toast('该句暂无文本，无法朗读', 'err');
      return;
    }
    setPlaying(true);
    await speak(text, { accent: material.accent || 'uk', rate: Math.min(1, rate * 0.92) });
    setPlaying(false);
  }, [q, seg, hasAudio, rate, material.accent, toast]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    if (q?.qtype !== 'choice' && q?.qtype !== 'blank') return;
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [idx, q?.qtype]);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    if (stopAtRef.current && a.currentTime >= stopAtRef.current) {
      a.pause();
      stopAtRef.current = null;
    }
  };

  const submit = async () => {
    setBusy(true);
    stopSpeak();
    audioRef.current?.pause();
    try {
      const r = await api(`/listening/materials/${material.id}/questions/submit`, {
        method: 'POST',
        body: { answers, duration_sec: 0 },
      });
      setResult(r);
      toast(`得分 ${r.correct}/${r.total}`);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="card">
        <Skeleton w="50%" h={20} />
        <Skeleton h={200} style={{ marginTop: 16 }} />
      </div>
    );
  }

  if (!qs.length) {
    return (
      <div className="card">
        <Empty
          icon={<IcoSparkles />}
          title="该素材还没有题目"
          desc="需要先有文本切片才能自动出题"
          action={<button className="btn btn-primary" onClick={onExit}>返回</button>}
        />
      </div>
    );
  }

  const resultMap = result ? Object.fromEntries(result.detail.map((d) => [d.id, d])) : null;
  const r = resultMap?.[q.id];

  return (
    <div className="narrow rise" style={{ margin: '0 auto', maxWidth: 860 }}>
      <div className="page-head head-row">
        <div>
          <h1>{material.title}</h1>
          <div className="sub">
            题型练习 · 共 {qs.length} 题 · {hasAudio ? '音频播放' : '浏览器朗读（无音频文件）'}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => { stopSpeak(); audioRef.current?.pause(); onExit(); }}>
          <IcoChevronL /> 返回列表
        </button>
      </div>

      {hasAudio && (
        <audio ref={audioRef} src={audioUrl || undefined} onTimeUpdate={onTimeUpdate} style={{ display: 'none' }} />
      )}

      {/* 播放控制 */}
      <div className="card">
        <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="row">
            <button className="btn btn-primary" onClick={playCurrent}>
              {playing ? <IcoRotate /> : <IcoPlay />} {playing ? '朗读中…' : '播放本题音频'}
            </button>
            {!hasAudio && ttsSupported() && (
              <button
                className="btn"
                onClick={() => speak(seg?.text || q.explanation || '', { accent: material.accent || 'uk', rate: 0.7 })}
                title="慢速朗读"
              >
                <IcoSpeaker /> 慢速
              </button>
            )}
          </div>
          <div className="chips">
            {[0.75, 1, 1.25, 1.5].map((x) => (
              <button key={x} className={`chip ${rate === x ? 'active' : ''}`} onClick={() => setRate(x)}>
                {x}x
              </button>
            ))}
          </div>
        </div>
        {!hasAudio && (
          <div className="muted" style={{ marginTop: 10, fontSize: 11.5 }}>
            该素材没有音频文件，使用浏览器语音合成朗读。想要真人发音可上传音频后重新出题。
          </div>
        )}
      </div>

      {/* 题目卡 */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <span className="muted mono">第 {idx + 1} / {qs.length} 题</span>
          <span className="row" style={{ gap: 6 }}>
            <span className="tag">{q.qtype_label}</span>
            <span className="muted" style={{ fontSize: 12 }}>已答 {answered}/{qs.length}</span>
          </span>
        </div>

        <div className="q-text" style={{ fontSize: 16 }}>
          {q.qtype === 'blank' ? q.prompt : q.prompt}
        </div>

        {q.qtype === 'choice' ? (
          <div className="q-options" style={{ marginTop: 14 }}>
            {(q.options || []).map((opt) => {
              const chosen = answers[q.id] === opt;
              const isAns = r && r.answer.toLowerCase() === String(opt).toLowerCase();
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
        ) : (
          <div style={{ marginTop: 14 }}>
            <input
              ref={inputRef}
              className="input"
              placeholder="听音频后填入缺失的单词"
              value={answers[q.id] || ''}
              disabled={!!r}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (idx < qs.length - 1) setIdx(idx + 1);
                }
              }}
            />
          </div>
        )}

        {r && (
          <div className={`msg ${r.correct ? 'ok' : 'error'}`} style={{ marginTop: 14 }}>
            <div>
              <b>{r.correct ? '正确' : `正确答案：${r.answer}`}</b>
              {r.explanation && <div style={{ marginTop: 6, opacity: 0.85 }}>原句：{r.explanation}</div>}
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: 16, gap: 8 }}>
          <button className="btn" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
            <IcoChevronL /> 上一题
          </button>
          {idx < qs.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setIdx((i) => i + 1)}>
              下一题 <IcoChevronR />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              <IcoSend /> {busy ? '批改中…' : '提交全部'}
            </button>
          )}
          <div className="spacer" />
          <button className="btn btn-ghost btn-sm" onClick={() => setResult(null)} hidden={!result}>
            <IcoRotate /> 重做
          </button>
        </div>
      </div>

      {/* 答题卡 */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">
          <span className="dot" /> 答题卡
        </div>
        <div className="answer-grid">
          {qs.map((x, i) => {
            const rr = resultMap?.[x.id];
            const filled = String(answers[x.id] || '').trim();
            return (
              <button
                key={x.id}
                className={`answer-cell ${i === idx ? 'cur' : ''} ${rr ? (rr.correct ? 'ok' : 'bad') : filled ? 'filled' : ''}`}
                onClick={() => setIdx(i)}
              >
                {rr ? (rr.correct ? <IcoCheck /> : <IcoX />) : i + 1}
              </button>
            );
          })}
        </div>

        {result && (
          <div className="row-between" style={{ marginTop: 16 }}>
            <span className="tag gray">
              得分 {result.correct} / {result.total} · 正确率 {Math.round(result.accuracy * 100)}%
            </span>
            <button className="btn btn-outline btn-sm" onClick={() => { setAnswers({}); setResult(null); setIdx(0); }}>
              <IcoRotate /> 重新练习
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
