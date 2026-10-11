import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Ring, Skeleton, useHotkeys, useToast, Empty } from '../components/ui.jsx';
import { speak, stopSpeak, ttsSupported } from '../lib/tts.js';
import {
  IcoCards,
  IcoChevronL,
  IcoChevronR,
  IcoKeyboard,
  IcoRotate,
  IcoSpeaker,
  IcoSparkles,
  IcoStar,
  IcoZap,
} from '../components/icons.jsx';

const GRADES = [
  { q: 0, t: '完全忘记', k: 'Again', key: '1', color: '#fb7185' },
  { q: 3, t: '有点难', k: 'Hard', key: '2', color: '#fbbf24' },
  { q: 4, t: '记得', k: 'Good', key: '3', color: '#34d399' },
  { q: 5, t: '太简单', k: 'Easy', key: '4', color: '#22d3ee' },
];

export default function Study() {
  const toast = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [lists, setLists] = useState([]);
  const [listId, setListId] = useState(sp.get('list') || '');
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [meta, setMeta] = useState(null);
  const [tally, setTally] = useState({ again: 0, good: 0, total: 0, combo: 0, maxCombo: 0 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('ielts_autospeak') === '1');
  const startRef = useRef(Date.now());

  const load = useCallback(
    async (lid) => {
      setErr('');
      setQueue(null);
      try {
        const [ls, se] = await Promise.all([
          api('/vocab/lists'),
          api(`/vocab/session${lid ? `?list_id=${lid}` : ''}`),
        ]);
        setLists(ls.lists || []);
        const q = [
          ...(se.due || []).map((w) => ({ ...w, mode: 'review' })),
          ...(se.new || []).map((w) => ({ ...w, mode: 'new' })),
        ];
        setMeta(se);
        setQueue(q);
        setIdx(0);
        setFlipped(false);
        setTally({ again: 0, good: 0, total: q.length, combo: 0, maxCombo: 0 });
        startRef.current = Date.now();
      } catch (e) {
        setErr(e.message);
      }
    },
    []
  );

  useEffect(() => {
    load(listId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = queue?.[idx];
  const done = queue && idx >= queue.length;

  const say = useCallback(
    async (text) => {
      if (!text || !ttsSupported()) {
        if (!ttsSupported()) toast('当前浏览器不支持语音朗读', 'err');
        return;
      }
      setSpeaking(true);
      await speak(text, { accent: 'uk' });
      setSpeaking(false);
    },
    [toast]
  );

  // 自动朗读（新卡出现时）
  useEffect(() => {
    if (autoSpeak && card && !flipped) say(card.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpeak, card?.id]);

  useEffect(() => {
    localStorage.setItem('ielts_autospeak', autoSpeak ? '1' : '0');
  }, [autoSpeak]);

  const grade = useCallback(
    async (q) => {
      if (!card || busy) return;
      setBusy(true);
      const dur = Date.now() - startRef.current;
      try {
        await api('/vocab/review', {
          method: 'POST',
          body: {
            word_id: card.id,
            quality: q,
            source: card.mode === 'new' ? 'srs_new' : card.mode === 'relearn' ? 'srs_relearn' : 'srs_due',
            duration_ms: dur,
            quality_label: GRADES.find((g) => g.q === q)?.k,
          },
        });
        setTally((t) => {
          const combo = q >= 3 ? t.combo + 1 : 0;
          return {
            ...t,
            again: t.again + (q < 3 ? 1 : 0),
            good: t.good + (q >= 3 ? 1 : 0),
            combo,
            maxCombo: Math.max(t.maxCombo, combo),
          };
        });
        if (q === 0) setQueue((prev) => [...prev, { ...card, mode: 'relearn' }]);
        setIdx((i) => i + 1);
        setFlipped(false);
        startRef.current = Date.now();
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    },
    [card, busy]
  );

  const toggleStar = async (e) => {
    e?.stopPropagation();
    if (!card) return;
    const starred = !card.is_starred;
    setQueue((prev) => prev.map((w, i) => (i === idx ? { ...w, is_starred: starred } : w)));
    try {
      await api('/vocab/star', { method: 'POST', body: { word_id: card.id, starred } });
      toast(starred ? '已加入生词本' : '已移出生词本');
    } catch {
      /* ignore */
    }
  };

  const next = () => setIdx((i) => Math.min(i + 1, queue.length));
  const excludeCurrent = async () => {
    if (!card || busy) return;
    setBusy(true);
    try {
      await api('/vocab/exclude', { method: 'POST', body: { word_ids: [card.id], excluded: true } });
      setQueue(items => items.filter((item, index) => index < idx || item.id !== card.id));
      setTally(value => ({ ...value, total: Math.max(0, value.total - 1) }));
      setFlipped(false);
      toast('已移除，不再进入闪卡和测验；可在词库恢复');
    } catch (error) { toast(error.message, 'err'); }
    finally { setBusy(false); }
  };
  const prev = () => setIdx((i) => Math.max(0, i - 1));

  useHotkeys(
    {
      space: () => setFlipped((f) => !f),
      enter: () => !flipped && setFlipped(true),
      '1': () => flipped && grade(0),
      '2': () => flipped && grade(3),
      '3': () => flipped && grade(4),
      '4': () => flipped && grade(5),
      s: () => card && say(card.word),
      arrowleft: () => prev(),
      arrowright: () => next(),
    },
    [card, flipped, grade, say, queue?.length]
  );

  const progress = queue?.length ? Math.round((idx / queue.length) * 100) : 0;
  const listName = useMemo(
    () => lists.find((l) => String(l.id) === String(listId))?.name || '全部词库',
    [lists, listId]
  );

  // 词库按分组归类展示（词库多起来后平铺一行会很长）。
  // lists 已按 position 排序，此处按出现顺序聚合即可保持手动排定的次序。
  const listGroups = useMemo(() => {
    const groups = [];
    const byCat = new Map();
    for (const l of lists) {
      const k = l.category || '其他词库';
      if (!byCat.has(k)) {
        byCat.set(k, []);
        groups.push([k, byCat.get(k)]);
      }
      byCat.get(k).push(l);
    }
    return groups;
  }, [lists]);

  if (err) return <div className="msg error">{err}</div>;

  if (!queue) {
    return (
      <div className="narrow" style={{ margin: '0 auto' }}>
        <div className="card">
          <Skeleton w="40%" h={20} />
          <Skeleton h={300} style={{ marginTop: 14 }} />
        </div>
      </div>
    );
  }

  /* ---------------- 结算 ---------------- */
  if (queue.length === 0 || done) {
    const reviewed = tally.total - tally.again;
    const acc = tally.total ? Math.round((tally.good / tally.total) * 100) : 0;
    return (
      <div className="narrow pop" style={{ margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          {queue.length === 0 ? (
            <Empty
              icon={<IcoSparkles />}
              title="今天没有待学的内容"
              desc="所有到期单词都复习完了。可以去测验巩固，或明天再来。"
              action={
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/quiz')}>
                    <IcoZap /> 去测验
                  </button>
                  <button className="btn" onClick={() => navigate('/words')}>
                    浏览词库
                  </button>
                </div>
              }
            />
          ) : (
            <>
              <div className="row" style={{ justifyContent: 'center', marginBottom: 8 }}>
                <IcoSparkles style={{ width: 30, height: 30, color: 'var(--violet)' }} />
              </div>
              <h2 style={{ fontSize: 22 }}>本轮完成！</h2>
              <div className="muted" style={{ marginBottom: 20 }}>用时约 {Math.max(1, Math.round((Date.now() - startRef.current) / 60000))} 分钟</div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 26, flexWrap: 'wrap', alignItems: 'center' }}>
                <Ring value={acc} size={150} stroke={13}>
                  <div>
                    <div className="mono" style={{ fontSize: 32, fontWeight: 740 }}>{acc}%</div>
                    <div className="muted" style={{ fontSize: 11 }}>正确率</div>
                  </div>
                </Ring>
                <div className="grid" style={{ gap: 12, textAlign: 'left' }}>
                  <div>
                    <div className="muted">学习卡片</div>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 720 }}>{reviewed}</div>
                  </div>
                  <div>
                    <div className="muted">需要加强</div>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 720, color: 'var(--amber)' }}>{tally.again}</div>
                  </div>
                  <div>
                    <div className="muted">最长连对</div>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 720, color: 'var(--cyan)' }}>{tally.maxCombo}</div>
                  </div>
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'center', marginTop: 26 }}>
                <button className="btn btn-primary" onClick={() => load(listId)}>
                  <IcoRotate /> 再学一轮
                </button>
                <button className="btn" onClick={() => navigate('/')}>回到工作台</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- 学习中 ---------------- */
  return (
    <div className="narrow rise" style={{ margin: '0 auto' }}>
      <div className="page-head head-row">
        <div>
          <h1>今日学习</h1>
          <div className="sub">
            {listName} · 待复习 {meta?.due?.length || 0} · 新词 {meta?.new?.length || 0}
          </div>
        </div>
        <div className="row">
          <label className="row" style={{ gap: 7, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              style={{ width: 'auto' }}
            />
            自动发音
          </label>
        </div>
      </div>

      {/* 词书选择 */}
      <div className="list-filter" style={{ marginBottom: 14 }}>
        <div className="list-group">
          <span className="list-group-label">全部</span>
          <div className="chips">
            <button className={`chip ${!listId ? 'active' : ''}`} onClick={() => { setListId(''); load(''); }}>
              全部词库
            </button>
          </div>
        </div>
        {listGroups.map(([cat, items]) => (
          <div className="list-group" key={cat}>
            <span className="list-group-label" title={cat}>{cat}</span>
            <div className="chips">
              {items.map((l) => (
                <button
                  key={l.id}
                  className={`chip ${String(l.id) === String(listId) ? 'active' : ''}`}
                  onClick={() => { setListId(String(l.id)); load(String(l.id)); }}
                >
                  {l.name}（{l.word_count - (l.excluded_count || 0)}）
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="muted mono">
          {idx + 1} / {queue.length}
        </span>
        <div className="row" style={{ gap: 8 }}>
          {tally.combo >= 2 && <span className="tag cyan">连对 {tally.combo}</span>}
          <span className={`tag ${card.mode === 'new' ? '' : card.mode === 'relearn' ? 'red' : 'amber'}`}>
            {card.mode === 'new' ? '新词' : card.mode === 'relearn' ? '重来' : '复习'}
          </span>
        </div>
      </div>
      <div className="bar" style={{ marginBottom: 18 }}>
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="flash-stage">
        <div className={`flash-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
          {/* 正面 */}
          <div className="flash-face front">
            <button
              className={`star ${card.is_starred ? 'on' : ''}`}
              style={{ position: 'absolute', top: 14, right: 16, fontSize: 19 }}
              onClick={toggleStar}
            >
              <IcoStar filled={card.is_starred} style={{ width: 19, height: 19 }} />
            </button>
            <div className="word">{card.word}</div>
            {card.phonetic_uk && <div className="phon">{card.phonetic_uk}</div>}
            <button
              className={`speak-btn ${speaking ? 'speaking' : ''}`}
              style={{ marginTop: 6 }}
              onClick={(e) => {
                e.stopPropagation();
                say(card.word);
              }}
              title="朗读（S）"
            >
              <IcoSpeaker />
            </button>
            <div className="flash-hint" style={{ marginTop: 18 }}>
              <IcoKeyboard style={{ width: 14, height: 14 }} />
              <kbd>空格</kbd> 翻面 · <kbd>S</kbd> 发音
            </div>
          </div>

          {/* 背面 */}
          <div className="flash-face back">
            <div style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.04em' }}>{card.word}</div>
            <div className="meaning">{card.meaning_cn || '（暂无释义）'}</div>
            <div className="row wrap" style={{ justifyContent: 'center', gap: 6 }}>
              {card.pos && <span className="tag gray">{card.pos}</span>}
              {card.topic && <span className="tag gray">{card.topic}</span>}
              {card.difficulty ? <span className="tag gray">难度 {card.difficulty}</span> : null}
            </div>
            {card.synonyms?.length > 0 && (
              <div className="chips" style={{ justifyContent: 'center' }}>
                {card.synonyms.slice(0, 6).map((s) => (
                  <span className="tag" key={s}>{s}</span>
                ))}
              </div>
            )}
            {card.examples?.[0] && (
              <div className="ex">
                <div style={{ color: 'var(--text)' }}>{card.examples[0].en}</div>
                {card.examples[0].cn && <div className="muted">{card.examples[0].cn}</div>}
                <small className="muted">{card.examples[0].source}</small>
              </div>
            )}
            {flipped && (
              <div className="flash-hint">
                <IcoKeyboard style={{ width: 14, height: 14 }} />
                <kbd>1</kbd>
                <kbd>2</kbd>
                <kbd>3</kbd>
                <kbd>4</kbd> 评分
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row wrap" style={{ justifyContent: 'center', marginBottom: 12 }}>
        <button className="btn btn-sm" disabled={busy} onClick={excludeCurrent}>太基础，移出我的学习</button>
        <button className="btn btn-sm" onClick={() => navigate(`/words?word=${card.id}`)}>更多例句与记忆方法</button>
      </div>

      {flipped ? (
        <div className="grade-grid">
          {GRADES.map((g) => (
            <button key={g.q} className="grade-btn" data-g={g.q} disabled={busy} onClick={() => grade(g.q)}>
              <span className="num">{g.key}</span>
              <span className="t" style={{ color: g.color }}>{g.t}</span>
              <span className="k">{g.k}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
          <button className="btn btn-outline btn-sm" onClick={prev} disabled={idx === 0}>
            <IcoChevronL /> 上一个
          </button>
          <button className="btn btn-primary btn-lg" onClick={() => setFlipped(true)}>
            显示释义 <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.8 }}>空格</kbd>
          </button>
          <button className="btn btn-outline btn-sm" onClick={next} disabled={idx >= queue.length - 1}>
            跳过 <IcoChevronR />
          </button>
        </div>
      )}

      <div className="muted center" style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <IcoCards style={{ width: 13, height: 13 }} />
        「完全忘记」的单词会在本轮末尾再次出现
      </div>
    </div>
  );
}
