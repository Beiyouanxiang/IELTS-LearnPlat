import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IcoX } from './icons.jsx';

/* ============================ Toast ============================ */
const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((text, type = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setList((l) => [...l, { id, text, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">
        {list.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ============================ 主题 ============================ */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ielts_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('ielts_theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, setTheme, toggle };
}

/* ============================ 快捷键 ============================ */
export function useHotkeys(handlers, deps = []) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      const map = ref.current || {};
      for (const [combo, fn] of Object.entries(map)) {
        const parts = combo.toLowerCase().split('+');
        const key = parts[parts.length - 1];
        const needCtrl = parts.includes('ctrl') || parts.includes('cmd');
        const needShift = parts.includes('shift');
        const needAlt = parts.includes('alt');
        const okCtrl = needCtrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        if (!okCtrl) continue;
        if (needShift !== e.shiftKey) continue;
        if (needAlt !== e.altKey) continue;
        const k = e.key.toLowerCase();
        const hit = key === 'space' ? e.code === 'Space' : k === key || key === 'enter' && k === 'enter';
        if (hit) {
          // 纯字符键在输入框里不触发，避免打断输入
          if (typing && !needCtrl && key !== 'escape') continue;
          e.preventDefault();
          fn(e);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ============================ 环形进度 ============================ */
export function Ring({
  value = 0,
  size = 128,
  stroke = 11,
  children,
  from = '#6366f1',
  to = '#22d3ee',
  track,
}) {
  const id = useId().replace(/:/g, '');
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const dash = (v / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: track || 'var(--track)' }}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.2,.9,.2,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================ 柱状趋势图 ============================ */
export function BarChart({ data = [], height = 130, color = '#6366f1', color2 = '#22d3ee', unit = '' }) {
  const id = useId().replace(/:/g, '');
  const W = 600;
  const H = height;
  const pad = 6;
  const max = Math.max(1, ...data.map((d) => d.v));
  const bw = data.length ? (W - pad * 2) / data.length : 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color2} stopOpacity="1" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const h = d.v > 0 ? Math.max(4, (d.v / max) * (H - 10)) : 2;
        return (
          <g key={i}>
            <title>{`${d.label}${unit ? '：' + d.v + unit : ''}`}</title>
            <rect
              x={pad + i * bw + bw * 0.18}
              y={H - h}
              width={Math.max(1, bw * 0.64)}
              height={h}
              rx={Math.min(3, bw * 0.3)}
              style={{ fill: d.v > 0 ? `url(#bg${id})` : 'var(--track-bar)' }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ============================ 迷你折线 ============================ */
export function Sparkline({ points = [], width = 120, height = 34, color = '#22d3ee' }) {
  const id = useId().replace(/:/g, '');
  if (!points.length) return null;
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - (p / max) * (height - 6) - 3).toFixed(1)}`)
    .join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================ 统计卡 ============================ */
export function StatCard({ label, value, unit, foot, accent = '#6366f1', accent2 = '#22d3ee', children, onClick }) {
  return (
    <div className={`card stat-card rise ${onClick ? 'hover-lift' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <div
        className="glow-spot"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      <div className="k">{label}</div>
      <div className="v">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {foot && <div className="foot">{foot}</div>}
      {children}
    </div>
  );
}

/* ============================ 骨架 / 空态 ============================ */
export function Skeleton({ w = '100%', h = 16, style }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }} />;
}

export function Empty({ icon, title, desc, action }) {
  return (
    <div className="empty">
      {icon && <div className="ico">{icon}</div>}
      <h3>{title}</h3>
      {desc && <div style={{ fontSize: 13 }}>{desc}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ============================ 抽屉 ============================ */
export function Drawer({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <div className="row-between" style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <IcoX />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

/* ============================ 热力图 ============================ */
export function Heatmap({ days = [] }) {
  const map = useMemo(() => new Map(days.map((d) => [d.day, d.n])), [days]);
  const cells = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const n = map.get(key) || 0;
    const level = n === 0 ? 0 : n < 8 ? 1 : n < 20 ? 2 : n < 40 ? 3 : 4;
    const bg = [
      'var(--heat-0)',
      'rgba(99,102,241,0.35)',
      'rgba(99,102,241,0.62)',
      'rgba(139,92,246,0.88)',
      'linear-gradient(135deg,#6366f1,#22d3ee)',
    ][level];
    cells.push(<i key={key} title={`${key}：学习 ${n} 次`} style={{ background: bg }} />);
  }
  return <div className="heat">{cells}</div>;
}

/* ============================ 雷达图 ============================ */
export function Radar({ data = [], size = 260, max = 100 }) {
  const id = useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 34;
  const n = Math.max(3, data.length);

  const angle = (i) => (-Math.PI / 2) + (i * 2 * Math.PI) / n;
  const pt = (i, ratio) => [cx + Math.cos(angle(i)) * R * ratio, cy + Math.sin(angle(i)) * R * ratio];

  const rings = [0.25, 0.5, 0.75, 1];
  const poly = (ratio) =>
    Array.from({ length: n }, (_, i) => pt(i, ratio).map((v) => v.toFixed(1)).join(',')).join(' ');

  const valuePoly = data.map((d, i) => pt(i, Math.max(0.04, Math.min(1, (d.value || 0) / max)))).map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');

  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', maxWidth: size, margin: '0 auto' }}>
      <defs>
        <radialGradient id={`rg${id}`}>
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.16" />
        </radialGradient>
      </defs>

      {rings.map((r) => (
        <polygon key={r} points={poly(r)} fill="none" style={{ stroke: 'var(--track)' }} strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} style={{ stroke: 'var(--track)' }} strokeWidth="1" />;
      })}

      <polygon points={valuePoly} fill={`url(#rg${id})`} style={{ stroke: '#818cf8' }} strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = pt(i, Math.max(0.04, Math.min(1, (d.value || 0) / max)));
        return <circle key={d.key || i} cx={x} cy={y} r="3.6" fill="#818cf8" stroke="var(--surface)" strokeWidth="1.6" />;
      })}

      {data.map((d, i) => {
        const [x, y] = pt(i, 1.2);
        return (
          <text
            key={`t${d.key || i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: 'var(--text-2)', fontSize: 11.5, fontFamily: 'inherit' }}
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ============================ 分段进度条 ============================ */
export function Meter({ value = 0, max = 100, color = 'var(--grad)', height = 8, label, right }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      {(label || right) && (
        <div className="row-between" style={{ fontSize: 12.5, marginBottom: 5 }}>
          <span className="dim">{label}</span>
          <span className="mono">{right}</span>
        </div>
      )}
      <div className="bar" style={{ height }}>
        <i style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ============================ 数字滚动 ============================ */
export function CountUp({ to = 0, duration = 700, suffix = '', decimals }) {
  // decimals 未显式传入时：整数目标按整数滚动，非整数（如 Band 6.5）保留一位小数
  const dec = decimals ?? (Number.isInteger(to) ? 0 : 1);
  const fix = (v) => Number(v).toFixed(dec);
  const [n, setN] = useState(() => fix(0));
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(fix(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // 兜底：某些环境（省电模式 / 无头浏览器）rAF 可能被节流，确保最终一定显示目标值
    const fallback = setTimeout(() => setN(fix(to)), duration + 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [to, duration, dec]);
  return (
    <>
      {n}
      {suffix}
    </>
  );
}
