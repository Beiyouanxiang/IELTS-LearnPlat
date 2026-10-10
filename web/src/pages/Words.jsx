import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, STATE_LABEL, STATE_CLASS } from '../api.js';
import { Drawer, Empty, Skeleton, useToast } from '../components/ui.jsx';
import { speak } from '../lib/tts.js';
import {
  IcoSearch,
  IcoGrid,
  IcoList,
  IcoSpeaker,
  IcoStar,
  IcoBook,
  IcoSparkles,
  IcoBrain,
  IcoChevronL,
  IcoChevronR,
} from '../components/icons.jsx';

const STATE_FILTERS = [
  { k: '', label: '全部' },
  { k: 'new', label: '未学' },
  { k: 'learning', label: '学习中' },
  { k: 'review', label: '复习中' },
  { k: 'mastered', label: '已掌握' },
  { k: 'starred', label: '生词本' },
];

const STATE_COLOR = { new: '#69739a', learning: '#fbbf24', review: '#a78bfa', mastered: '#34d399' };

export default function Words() {
  const toast = useToast();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [lists, setLists] = useState([]);
  const [listId, setListId] = useState('');
  const [state, setState] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(30);
  const [view, setView] = useState(() => localStorage.getItem('ielts_words_view') || 'grid');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [ai, setAi] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    api('/vocab/lists').then((d) => setLists(d.lists || [])).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('ielts_words_view', view);
  }, [view]);

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), size: String(size) });
      if (q) qs.set('q', q);
      if (state) qs.set('state', state);
      if (listId) qs.set('list_id', listId);
      const res = await api(`/vocab/words?${qs}`);
      setData(res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, size, q, state, listId]);

  useEffect(() => {
    const t = setTimeout(load, 160);
    return () => clearTimeout(t);
  }, [load]);

  const openDetail = useCallback(
    async (id, { fromQuery = false } = {}) => {
      setAi(null);
      setDetailLoading(true);
      setDetail({ word: { id } });
      try {
        const d = await api(`/vocab/words/${id}`);
        setDetail(d);
      } catch (e) {
        setErr(e.message);
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
      if (!fromQuery) {
        sp.set('word', String(id));
        setSp(sp, { replace: true });
      }
    },
    [sp, setSp]
  );

  const closeDetail = () => {
    setDetail(null);
    sp.delete('word');
    setSp(sp, { replace: true });
  };

  // 支持 /words?word=12 直达
  useEffect(() => {
    const wid = sp.get('word');
    if (wid) openDetail(wid, { fromQuery: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleStar = async (w, e) => {
    e?.stopPropagation();
    const starred = !w.is_starred;
    setData((d) =>
      d ? { ...d, words: d.words.map((x) => (x.id === w.id ? { ...x, is_starred: starred } : x)) } : d
    );
    if (detail?.word?.id === w.id) {
      setDetail((d) => ({ ...d, progress: { ...(d.progress || {}), is_starred: starred } }));
    }
    try {
      await api('/vocab/star', { method: 'POST', body: { word_id: w.id, starred } });
      toast(starred ? '已加入生词本' : '已移出生词本');
    } catch {
      /* ignore */
    }
  };

  const explain = async () => {
    if (!detail?.word?.id) return;
    setAiBusy(true);
    setAi(null);
    try {
      const d = await api(`/vocab/words/${detail.word.id}/explain`, { method: 'POST' });
      setAi(d);
    } catch (e) {
      setAi({ error: e.message });
    } finally {
      setAiBusy(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / size)) : 1;

  // 词库按分组归类展示（词库多起来后平铺一行会很长）。
  // lists 已按 position 排序，这里按出现顺序聚合即可保持手动排定的次序。
  const listGroups = [];
  {
    const byCat = new Map();
    for (const l of lists) {
      const k = l.category || '其他词库';
      if (!byCat.has(k)) {
        byCat.set(k, []);
        listGroups.push([k, byCat.get(k)]);
      }
      byCat.get(k).push(l);
    }
  }
  const totalListWords = lists.reduce((s, l) => s + (l.word_count || 0), 0);

  return (
    <>
      <div className="page-head head-row rise">
        <div>
          <h1>词库</h1>
          <div className="sub">
            {data ? `共 ${data.total} 个词` : '加载中…'} · 点发音图标跟读，点卡片查看详情与 AI 记忆法
          </div>
        </div>
        <div className="row">
          <div className="mode-tabs">
            <button className={`mode-tab ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
              <IcoGrid style={{ width: 14, height: 14, verticalAlign: -2, marginRight: 4 }} />
              卡片
            </button>
            <button className={`mode-tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              <IcoList style={{ width: 14, height: 14, verticalAlign: -2, marginRight: 4 }} />
              列表
            </button>
          </div>
        </div>
      </div>

      {err && <div className="msg error">{err}</div>}

      <div className="card rise" style={{ animationDelay: '40ms' }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <IcoSearch
              style={{
                position: 'absolute',
                left: 13,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
                color: 'var(--text-3)',
              }}
            />
            <input
              style={{ paddingLeft: 38 }}
              placeholder="搜索单词或中文释义，如 abandon / 放弃"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select style={{ width: 'auto', minWidth: 110 }} value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
            <option value={30}>30 / 页</option>
            <option value={50}>50 / 页</option>
            <option value={100}>100 / 页</option>
          </select>
        </div>

        <div className="list-filter" style={{ marginBottom: 10 }}>
          <div className="list-group">
            <span className="list-group-label">全部</span>
            <div className="chips">
              <button className={`chip ${!listId ? 'active' : ''}`} onClick={() => { setListId(''); setPage(1); }}>
                全部词库{lists.length ? `（${lists.length} 个）` : ''}
              </button>
            </div>
          </div>
          {listGroups.map(([cat, items]) => (
            <div className="list-group" key={cat}>
              <span className="list-group-label">{cat}</span>
              <div className="chips">
                {items.map((l) => (
                  <button
                    key={l.id}
                    className={`chip ${String(l.id) === String(listId) ? 'active' : ''}`}
                    onClick={() => { setListId(String(l.id)); setPage(1); }}
                    title={l.description || ''}
                  >
                    {l.name}（{l.word_count}）
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="chips">
          {STATE_FILTERS.map((f) => (
            <button
              key={f.k}
              className={`chip ${state === f.k ? 'active' : ''}`}
              onClick={() => { setState(f.k); setPage(1); }}
            >
              {f.k === 'starred' ? <><IcoStar filled style={{ width: 11, height: 11, verticalAlign: -1 }} /> 生词本</> : f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading && !data ? (
          <div className="word-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="card" key={i}>
                <Skeleton w="50%" h={18} />
                <Skeleton w="80%" h={12} style={{ marginTop: 10 }} />
              </div>
            ))}
          </div>
        ) : !data || data.words.length === 0 ? (
          <div className="card">
            <Empty
              icon={<IcoBook />}
              title="没有匹配的单词"
              desc="试试换一个关键词，或清除筛选条件"
              action={
                <button
                  className="btn"
                  onClick={() => {
                    setQ('');
                    setState('');
                    setListId('');
                  }}
                >
                  清除全部筛选
                </button>
              }
            />
          </div>
        ) : view === 'grid' ? (
          <div className="word-grid">
            {data.words.map((w, i) => (
              <div
                className="word-tile rise"
                key={w.id}
                style={{ animationDelay: `${Math.min(i, 12) * 22}ms` }}
                onClick={() => openDetail(w.id)}
              >
                <button
                  className={`star ${w.is_starred ? 'on' : ''}`}
                  onClick={(e) => toggleStar(w, e)}
                  title="加入生词本"
                >
                  <IcoStar filled={w.is_starred} style={{ width: 16, height: 16 }} />
                </button>
                <div className="w">{w.word}</div>
                {w.phonetic_uk && <div className="p">{w.phonetic_uk}</div>}
                <div className="m">{w.meaning_cn || '—'}</div>
                <div className="foot">
                  <span className={`tag ${STATE_CLASS[w.state] || 'gray'}`}>{STATE_LABEL[w.state] || w.state}</span>
                  {w.pos && <span className="tag gray">{w.pos}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 8 }}>
            {data.words.map((w) => (
              <div className="word-row" key={w.id} onClick={() => openDetail(w.id)}>
                <span className="state-dot" style={{ background: STATE_COLOR[w.state] || '#69739a' }} />
                <span className="w">{w.word}</span>
                <span className="p mono muted" style={{ minWidth: 110 }}>{w.phonetic_uk || ''}</span>
                <span className="m">{w.meaning_cn || '—'}</span>
                <span className={`tag ${STATE_CLASS[w.state] || 'gray'}`}>{STATE_LABEL[w.state] || w.state}</span>
                <button className={`star ${w.is_starred ? 'on' : ''}`} onClick={(e) => toggleStar(w, e)}>
                  <IcoStar filled={w.is_starred} style={{ width: 15, height: 15 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.total > 0 && (
        <div className="row-between" style={{ marginTop: 16 }}>
          <span className="muted">
            共 {data.total} 词 · 第 {page} / {totalPages} 页
          </span>
          <div className="row">
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <IcoChevronL /> 上一页
            </button>
            <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              下一页 <IcoChevronR />
            </button>
          </div>
        </div>
      )}

      {/* 详情抽屉 */}
      <Drawer open={!!detail} onClose={closeDetail} title="单词详情">
        {detailLoading ? (
          <>
            <Skeleton w="40%" h={26} />
            <Skeleton h={14} style={{ marginTop: 14 }} />
            <Skeleton w="70%" h={14} style={{ marginTop: 8 }} />
          </>
        ) : detail?.word ? (
          <>
            <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 30, fontWeight: 720, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                  {detail.word.word}
                </div>
                <div className="mono muted" style={{ marginTop: 3 }}>
                  {detail.word.phonetic_uk}
                  {detail.word.phonetic_us && detail.word.phonetic_us !== detail.word.phonetic_uk
                    ? ` / ${detail.word.phonetic_us}`
                    : ''}
                </div>
              </div>
              <button className={`speak-btn ${aiBusy ? '' : ''}`} onClick={() => speak(detail.word.word)} title="朗读">
                <IcoSpeaker />
              </button>
              <button
                className={`star ${detail.progress?.is_starred ? 'on' : ''}`}
                onClick={(e) => toggleStar({ id: detail.word.id, is_starred: detail.progress?.is_starred }, e)}
                style={{ fontSize: 22 }}
              >
                <IcoStar filled={!!detail.progress?.is_starred} style={{ width: 21, height: 21 }} />
              </button>
            </div>

            <p style={{ fontSize: 16, marginTop: 14 }}>{detail.word.meaning_cn || '（暂无释义）'}</p>

            <div className="row wrap" style={{ gap: 6, marginBottom: 14 }}>
              {detail.word.pos && <span className="tag gray">{detail.word.pos}</span>}
              {detail.word.topic && <span className="tag gray">{detail.word.topic}</span>}
              {detail.word.difficulty ? <span className="tag gray">难度 {detail.word.difficulty}</span> : null}
              {detail.word.freq_rank
                ? <span className="tag gray" title="BNC 语料库词频排名（越小越常用）">BNC #{detail.word.freq_rank}</span>
                : null}
              {detail.word.tags?.map((t) => <span className="tag" key={t}>{t}</span>)}
            </div>

            {/* 词族形态：AWL 这类词表以词族为单位，记住词根可一次带走多个派生形式 */}
            {detail.word.word_forms?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="muted" style={{ fontSize: 11.5, marginBottom: 6 }}>词族形态（同根词一起记）</div>
                <div className="row wrap" style={{ gap: 6 }}>
                  {detail.word.word_forms.map((f) => (
                    <span className="tag cyan" key={f}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            {detail.progress && (
              <div className="card" style={{ background: 'var(--surface-hi)', boxShadow: 'none', marginBottom: 14 }}>
                <div className="row-between">
                  <span className="muted">学习进度</span>
                  <span className={`tag ${STATE_CLASS[detail.progress.state] || 'gray'}`}>
                    {STATE_LABEL[detail.progress.state] || detail.progress.state}
                  </span>
                </div>
                <div className="grid grid-3" style={{ marginTop: 10 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 11 }}>复习次数</div>
                    <div className="mono" style={{ fontWeight: 700 }}>{detail.progress.reps}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 11 }}>对 / 错</div>
                    <div className="mono" style={{ fontWeight: 700 }}>
                      <span style={{ color: 'var(--green)' }}>{detail.progress.correct}</span> /{' '}
                      <span style={{ color: 'var(--red)' }}>{detail.progress.wrong}</span>
                    </div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 11 }}>下次复习</div>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 12 }}>
                      {detail.progress.due_at ? String(detail.progress.due_at).slice(5, 16) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detail.word.synonyms?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="muted" style={{ marginBottom: 6 }}>同义替换</div>
                <div className="chips">
                  {detail.word.synonyms.map((s) => (
                    <span className="tag" key={s}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {detail.word.collocations?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="muted" style={{ marginBottom: 6 }}>高频搭配</div>
                <div className="chips">
                  {detail.word.collocations.map((s) => (
                    <span className="tag gray" key={s}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {detail.word.example_en && (
              <div className="card" style={{ background: 'var(--surface-hi)', boxShadow: 'none', marginBottom: 14 }}>
                <div className="row-between" style={{ marginBottom: 8 }}>
                  <span className="muted">例句</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => speak(detail.word.example_en)}>
                    <IcoSpeaker style={{ width: 14, height: 14 }} /> 朗读
                  </button>
                </div>
                <div style={{ fontSize: 14 }}>{detail.word.example_en}</div>
                {detail.word.example_cn && <div className="muted" style={{ marginTop: 4 }}>{detail.word.example_cn}</div>}
              </div>
            )}

            <button className="btn btn-primary btn-block" disabled={aiBusy} onClick={explain}>
              <IcoBrain /> {aiBusy ? 'AI 生成中…' : 'AI 记忆法（词根 / 联想 / 搭配）'}
            </button>

            {ai?.error && <div className="msg error" style={{ marginTop: 12 }}>{ai.error}</div>}
            {ai && !ai.error && (
              <div className="card rise" style={{ marginTop: 12, background: 'var(--surface-hi)', boxShadow: 'none' }}>
                <div className="card-title">
                  <IcoSparkles style={{ width: 15, height: 15 }} /> AI 记忆法
                </div>
                {ai.roots && <p><strong className="muted">词根词缀：</strong>{ai.roots}</p>}
                {ai.mnemonic && <p><strong className="muted">联想记忆：</strong>{ai.mnemonic}</p>}
                {ai.synonyms?.length > 0 && <p><strong className="muted">同义替换：</strong>{ai.synonyms.join(' / ')}</p>}
                {ai.collocations?.length > 0 && <p><strong className="muted">高频搭配：</strong>{ai.collocations.join(' / ')}</p>}
                {ai.example_en && (
                  <p>
                    <strong className="muted">例句：</strong>
                    {ai.example_en}
                    <br />
                    <span className="muted">{ai.example_cn}</span>
                  </p>
                )}
              </div>
            )}

            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn btn-block" onClick={() => { closeDetail(); navigate('/study'); }}>
                去闪卡复习
              </button>
            </div>
          </>
        ) : null}
      </Drawer>
    </>
  );
}
