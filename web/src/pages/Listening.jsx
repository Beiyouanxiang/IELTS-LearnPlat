import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Empty, Skeleton, useHotkeys, useToast } from '../components/ui.jsx';
import { speak } from '../lib/tts.js';
import ListeningQuestions from './ListeningQuestions.jsx';
import {
  IcoHeadphones,
  IcoPlus,
  IcoUpload,
  IcoPlay,
  IcoRotate,
  IcoChevronL,
  IcoChevronR,
  IcoSpeaker,
  IcoWave,
  IcoTarget,
} from '../components/icons.jsx';

const LEVEL_LABEL = { easy: '简单', medium: '中等', hard: '困难' };

// 由文本生成稳定的伪波形（同一段文本每次一样）
function waveHeights(text, n = 56) {
  const out = [];
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 100000;
  let seed = h || 7;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const r = (seed / 2147483648) * 0.75 + 0.25;
    const env = Math.sin((i / n) * Math.PI) * 0.5 + 0.6;
    out.push(Math.max(0.12, Math.min(1, r * env)));
  }
  return out;
}

export default function Listening() {
  const toast = useToast();
  const [materials, setMaterials] = useState(null);
  const [err, setErr] = useState('');
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [qMat, setQMat] = useState(null);

  const [form, setForm] = useState({
    title: '',
    source_url: '',
    transcript: '',
    translation: '',
    accent: 'uk',
    level: 'medium',
    topic: '',
    duration_sec: '',
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const [mat, setMat] = useState(null);
  const [segments, setSegments] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [blind, setBlind] = useState(true);
  const [newWord, setNewWord] = useState('');

  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const stopAtRef = useRef(null);
  const inputRef = useRef(null);

  const loadMaterials = useCallback(async () => {
    try {
      const d = await api('/listening/materials');
      const list = d.materials || [];
      setMaterials(list);
      return list;
    } catch (e) {
      setErr(e.message);
      return [];
    }
  }, []);

  useEffect(() => {
    loadMaterials().then((list) => {
      // 支持 ?material=<id>&mode=questions 直接进入题型练习（可分享链接）
      const mid = Number(new URLSearchParams(window.location.search).get('material'));
      const mode = new URLSearchParams(window.location.search).get('mode');
      if (mid && mode === 'questions') {
        const m = list.find((x) => x.id === mid);
        if (m) setQMat(m);
      }
    });
  }, [loadMaterials]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setErr('请填写标题');
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
      if (file) fd.append('audio', file);
      await api('/listening/materials', { method: 'POST', body: fd, isForm: true });
      setForm({ title: '', source_url: '', transcript: '', translation: '', accent: 'uk', level: 'medium', topic: '', duration_sec: '' });
      setFile(null);
      setShowForm(false);
      toast('素材已保存');
      await loadMaterials();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const openPractice = async (m) => {
    setErr('');
    setResult(null);
    setInput('');
    setNewWord('');
    setIdx(0);
    setCurTime(0);
    try {
      const d = await api(`/listening/materials/${m.id}/practice?blind=${blind ? 1 : 0}`);
      setMat(d.material);
      setSegments(d.segments || []);
      setView('practice');
    } catch (e) {
      setErr(e.message);
    }
  };

  const toggleBlind = async (next) => {
    setBlind(next);
    if (mat) {
      try {
        const d = await api(`/listening/materials/${mat.id}/practice?blind=${next ? 1 : 0}`);
        setSegments(d.segments || []);
        setResult(null);
      } catch (e) {
        setErr(e.message);
      }
    }
  };

  const seg = segments[idx];

  const playSegment = useCallback(
    (i = idx) => {
      const a = audioRef.current;
      const s = segments[i];
      if (!a || !s) return;
      a.currentTime = Number(s.start_sec) || 0;
      stopAtRef.current = Number(s.end_sec) || null;
      a.playbackRate = rate;
      a.play().catch(() => {});
    },
    [segments, idx, rate]
  );

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      stopAtRef.current = null;
      a.playbackRate = rate;
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = rate;
  }, [rate, mat]);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurTime(a.currentTime);
    if (stopAtRef.current && a.currentTime >= stopAtRef.current) {
      if (loop) {
        a.currentTime = Number(segments[idx]?.start_sec) || 0;
      } else {
        a.pause();
        stopAtRef.current = null;
      }
    }
  };

  const check = async () => {
    setErr('');
    try {
      const d = await api('/listening/attempt', {
        method: 'POST',
        body: { segment_id: seg.id, user_input: input, mode: 'dictation' },
      });
      setResult(d);
    } catch (e) {
      setErr(e.message);
    }
  };

  const nextSeg = () => {
    setResult(null);
    setInput('');
    setNewWord('');
    setIdx((i) => Math.min(i + 1, segments.length - 1));
    setTimeout(() => inputRef.current?.focus(), 60);
  };
  const prevSeg = () => {
    setResult(null);
    setInput('');
    setNewWord('');
    setIdx((i) => Math.max(0, i - 1));
  };

  const addWord = async () => {
    if (!newWord.trim()) return;
    try {
      const r = await api('/listening/vocab-add', { method: 'POST', body: { word: newWord.trim() } });
      toast(r.created ? `已新增「${r.word}」并加入生词本` : `「${r.word}」已在词库，已加入生词本`);
      setNewWord('');
    } catch (e) {
      setErr(e.message);
    }
  };

  useHotkeys(
    {
      space: () => view === 'practice' && playSegment(),
      arrowright: () => view === 'practice' && nextSeg(),
      arrowleft: () => view === 'practice' && prevSeg(),
      enter: () => {
        if (view === 'practice' && !result && input.trim()) check();
      },
    },
    [view, input, result, segments, idx]
  );

  const wave = useMemo(() => waveHeights(seg?.text || String(idx)), [seg?.text, idx]);
  const playedRatio = useMemo(() => {
    if (!seg || !Number(seg.end_sec)) return 0;
    const s = Number(seg.start_sec) || 0;
    const e = Number(seg.end_sec) || 0;
    if (curTime <= s) return 0;
    if (curTime >= e) return 1;
    return (curTime - s) / (e - s);
  }, [curTime, seg]);

  /* ---------------- 题型练习视图 ---------------- */
  if (qMat) {
    return <ListeningQuestions material={qMat} onExit={() => { setQMat(null); loadMaterials(); }} />;
  }

  /* ---------------- 练习视图 ---------------- */
  if (view === 'practice' && mat) {
    return (
      <div className="narrow rise" style={{ margin: '0 auto', maxWidth: 820 }}>
        <div className="page-head head-row">
          <div>
            <h1>{mat.title}</h1>
            <div className="sub">
              {mat.accent?.toUpperCase()} · {LEVEL_LABEL[mat.level] || '未分级'} · 共 {segments.length} 句
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => { setView('list'); setMat(null); audioRef.current?.pause(); }}>
            <IcoChevronL /> 返回列表
          </button>
        </div>

        {err && <div className="msg error">{err}</div>}

        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <span className="muted mono">
              第 {idx + 1} / {segments.length} 句
            </span>
            <label className="row" style={{ gap: 7, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={blind} onChange={(e) => toggleBlind(e.target.checked)} />
              听写模式（隐藏原文）
            </label>
          </div>

          {mat.audio_path && (
            <>
              <audio
                ref={audioRef}
                src={`/${mat.audio_path}`}
                onTimeUpdate={onTimeUpdate}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.target.duration || 0)}
                style={{ display: 'none' }}
              />

              {/* 波形 */}
              <div className="wave" role="presentation">
                {wave.map((h, i) => (
                  <i
                    key={i}
                    className={i / wave.length <= playedRatio ? 'on' : ''}
                    style={{ height: `${h * 100}%` }}
                  />
                ))}
              </div>

              <div className="row-between" style={{ marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
                <div className="row">
                  <button className="btn btn-primary" onClick={() => playSegment()}>
                    <IcoPlay /> 播放本句
                  </button>
                  <button className="btn" onClick={togglePlay}>
                    {playing ? '暂停全篇' : '播放全篇'}
                  </button>
                  <button
                    className={`btn ${loop ? 'btn-primary' : ''}`}
                    onClick={() => setLoop((v) => !v)}
                    title="循环本句"
                  >
                    <IcoRotate /> 循环
                  </button>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <span className="muted mono">{curTime.toFixed(1)}s / {duration ? duration.toFixed(0) : '—'}s</span>
                </div>
              </div>

              <div className="chips" style={{ marginTop: 10 }}>
                {[0.75, 0.9, 1, 1.15, 1.3].map((r) => (
                  <button key={r} className={`chip ${rate === r ? 'active' : ''}`} onClick={() => setRate(r)}>
                    {r}x
                  </button>
                ))}
              </div>
            </>
          )}

          {!blind && seg?.text && (
            <div className="card" style={{ background: 'var(--surface-hi)', boxShadow: 'none', marginTop: 14 }}>
              <div className="row-between">
                <div style={{ flex: 1 }}>{seg.text}</div>
                <button className="icon-btn" onClick={() => speak(seg.text)} title="朗读">
                  <IcoSpeaker />
                </button>
              </div>
              {seg.translation && <div className="muted" style={{ marginTop: 6 }}>{seg.translation}</div>}
            </div>
          )}
        </div>

        <div className="card">
          {!result ? (
            <>
              <div className="card-title">
                <span className="dot" /> 听写这一句
              </div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type what you hear…"
                style={{ minHeight: 90 }}
                autoFocus
              />
              <div className="row-between" style={{ marginTop: 12 }}>
                <span className="muted">快捷键：空格播放本句 · ← → 切句 · ↵ 提交</span>
                <div className="row">
                  <button className="btn btn-ghost btn-sm" onClick={() => setInput('')}>清空</button>
                  <button className="btn btn-primary" onClick={check} disabled={!input.trim()}>
                    检查
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="row-between" style={{ marginBottom: 12 }}>
                <div className="card-title" style={{ margin: 0 }}>
                  <span className="dot" /> 比对结果
                </div>
                <span className={`tag ${result.score >= 0.9 ? 'green' : result.score >= 0.6 ? 'amber' : 'red'}`}>
                  准确率 {Math.round(result.score * 100)}%
                </span>
              </div>
              <div className="card" style={{ background: 'var(--surface-hi)', boxShadow: 'none' }}>
                <div className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
                  绿色正确 · <span style={{ color: 'var(--red)' }}>红色删除线</span> 为漏听/听错 ·{' '}
                  <span style={{ color: 'var(--amber)' }}>黄色</span> 为多写
                </div>
                <div className="diff-ops">
                  {result.diff.ops.map((op, i) => (
                    <span key={i} className={op.type}>
                      {op.type === 'extra' ? op.hyp : op.ref}{' '}
                    </span>
                  ))}
                </div>
              </div>
              <div className="row" style={{ marginTop: 12, gap: 16 }}>
                <span className="tag red">漏 {result.diff.missing} 词</span>
                <span className="tag amber">多/错 {result.diff.extra} 词</span>
              </div>

              <div className="row" style={{ marginTop: 14 }}>
                <input
                  placeholder="把这句里的生词加进词库…"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWord())}
                />
                <button className="btn" onClick={addWord}>
                  <IcoPlus /> 生词本
                </button>
              </div>

              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn btn-primary" onClick={nextSeg} disabled={idx >= segments.length - 1}>
                  下一句 <IcoChevronR />
                </button>
                <button className="btn btn-ghost" onClick={() => { setResult(null); setInput(''); }}>
                  <IcoRotate /> 重做本句
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- 列表视图 ---------------- */
  return (
    <>
      <div className="page-head head-row rise">
        <div>
          <h1>听力</h1>
          <div className="sub">导入音频与文本，逐句精听、听写比对。支持变速播放与单句循环。</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <IcoChevronL /> : <IcoPlus />}
          {showForm ? '收起' : '新建素材'}
        </button>
      </div>

      {err && <div className="msg error">{err}</div>}

      {showForm && (
        <form className="card rise" onSubmit={create} style={{ marginBottom: 14 }}>
          <div className="card-title">
            <span className="dot" /> 新建听力素材
          </div>
          <div className="grid grid-3">
            <label className="field">
              <span>标题 *</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如：Campus conversation 1" />
            </label>
            <label className="field">
              <span>来源链接</span>
              <input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://…" />
            </label>
            <label className="field">
              <span>口音</span>
              <select value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })}>
                <option value="uk">英音 UK</option>
                <option value="us">美音 US</option>
                <option value="au">澳音 AU</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label className="field">
              <span>难度</span>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </label>
            <label className="field">
              <span>话题</span>
              <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="education / environment…" />
            </label>
            <label className="field">
              <span>时长（秒，用于估算时间轴）</span>
              <input type="number" min="0" value={form.duration_sec} onChange={(e) => setForm({ ...form, duration_sec: e.target.value })} />
            </label>
          </div>

          <label className="field">
            <span>原文文本（必填才有句子切片；每句一行或正常标点均可）</span>
            <textarea value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} placeholder="Paste the transcript here…" />
          </label>
          <label className="field">
            <span>中文翻译（选填）</span>
            <textarea value={form.translation} onChange={(e) => setForm({ ...form, translation: e.target.value })} style={{ minHeight: 70 }} />
          </label>
          <label className="field">
            <span>音频文件（选填，mp3/m4a/wav/ogg/flac/aac/webm，≤50MB）</span>
            <input type="file" accept=".mp3,.m4a,.wav,.ogg,.oga,.flac,.aac,.webm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>

          <button className="btn btn-primary" disabled={busy}>
            <IcoUpload /> {busy ? '保存中…' : '保存素材'}
          </button>
        </form>
      )}

      {!materials ? (
        <div className="grid grid-3">
          {[0, 1, 2].map((i) => (
            <div className="card" key={i}>
              <Skeleton w="60%" h={18} />
              <Skeleton h={12} style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="card">
          <Empty
            icon={<IcoHeadphones />}
            title="还没有听力素材"
            desc="上传一段音频并粘贴原文，就能开始逐句精听与听写"
            action={
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <IcoPlus /> 新建素材
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-3">
          {materials.map((m, i) => (
            <div className="card hover-lift rise" key={m.id} style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 640, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.title}
                  </div>
                  {m.source_url && (
                    <div className="muted" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.source_url}
                    </div>
                  )}
                </div>
                {m.audio_path ? (
                  <span className="tag cyan"><IcoWave style={{ width: 12, height: 12 }} /> 有音频</span>
                ) : (
                  <span className="tag gray">纯文本</span>
                )}
              </div>

              <div className="row wrap" style={{ gap: 6, marginTop: 12 }}>
                <span className="tag gray">{m.accent?.toUpperCase() || '—'}</span>
                <span className="tag gray">{LEVEL_LABEL[m.level] || '—'}</span>
                <span className="tag gray">{m.segment_count} 句</span>
                <span className="tag">练习 {m.my_attempts} 次</span>
              </div>

              <div className="row" style={{ marginTop: 14, gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => openPractice(m)}
                  disabled={!m.segment_count}
                >
                  <IcoPlay /> 精听
                </button>
                <button
                  className="btn btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setQMat(m)}
                  disabled={!m.segment_count}
                  title="自动生成听音选词 / 听写填空题"
                >
                  <IcoTarget /> 题型练习
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
