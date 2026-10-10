import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import {
  IcoDashboard,
  IcoCards,
  IcoBook,
  IcoTarget,
  IcoHeadphones,
  IcoSettings,
  IcoTrophy,
  IcoSearch,
  IcoRead,
  IcoPen,
  IcoChart,
} from './icons.jsx';

const PAGES = [
  { to: '/', label: '工作台', hint: '总览与今日任务', icon: <IcoDashboard /> },
  { to: '/study', label: '今日学习', hint: '间隔重复闪卡', icon: <IcoCards /> },
  { to: '/words', label: '词库', hint: '浏览与搜索单词', icon: <IcoBook /> },
  { to: '/quiz', label: '测验', hint: '选择 / 拼写 / 听音', icon: <IcoTarget /> },
  { to: '/wrong', label: '错题本', hint: '反复出错的词', icon: <IcoTrophy /> },
  { to: '/listening', label: '听力', hint: '精听 · 听写 · 题型练习', icon: <IcoHeadphones /> },
  { to: '/reading', label: '阅读', hint: '判断题 / 选择题 / 填空', icon: <IcoRead /> },
  { to: '/writing', label: '写作', hint: '限时写作与四维批改', icon: <IcoPen /> },
  { to: '/plan', label: '学习计划', hint: '目标 · 倒计时 · 能力雷达', icon: <IcoChart /> },
  { to: '/settings', label: '设置', hint: '目标与邀请码', icon: <IcoSettings /> },
];

export default function CommandPalette({ open, onClose, actions = [] }) {
  const [q, setQ] = useState('');
  const [words, setWords] = useState([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ('');
      setWords([]);
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // 输入防抖搜索单词
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 1) {
      setWords([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const d = await api(`/vocab/search?q=${encodeURIComponent(term)}`);
        setWords((d.words || []).slice(0, 6));
      } catch {
        setWords([]);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    const acts = (actions || []).map((a) => ({ ...a, group: '操作' }));
    const pages = PAGES.filter(
      (p) => !term || p.label.toLowerCase().includes(term) || p.hint.toLowerCase().includes(term)
    ).map((p) => ({ key: p.to, label: p.label, hint: p.hint, icon: p.icon, group: '跳转' }));
    const ws = words.map((w) => ({
      key: `w${w.id}`,
      label: w.word,
      hint: w.meaning_cn || '',
      icon: <IcoSearch />,
      group: '单词',
      word: w,
    }));
    return [...acts, ...pages, ...ws];
  }, [q, words, actions]);

  useEffect(() => {
    setSel(0);
  }, [q, words.length]);

  if (!open) return null;

  const run = (item) => {
    if (!item) return;
    if (item.word) navigate(`/words?word=${item.word.id}`);
    else if (item.run) item.run();
    else navigate(item.key);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(items.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(items[sel]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <>
      <div className="palette-backdrop" onClick={onClose} />
      <div className="palette">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="搜索单词、跳转页面或执行操作…"
        />
        <div className="palette-list">
          {items.length === 0 && <div className="muted" style={{ padding: 18, textAlign: 'center' }}>没有匹配结果</div>}
          {items.map((it, i) => {
            const showGroup = it.group !== lastGroup;
            lastGroup = it.group;
            return (
              <div key={it.key + i}>
                {showGroup && <div className="palette-group">{it.group}</div>}
                <div
                  className={`palette-item ${i === sel ? 'sel' : ''}`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => run(it)}
                >
                  {it.icon}
                  <span style={{ fontWeight: 560 }}>{it.label}</span>
                  {it.hint && (
                    <span className="muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                      {it.hint}
                    </span>
                  )}
                  {i === sel && <span className="k">↵</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
