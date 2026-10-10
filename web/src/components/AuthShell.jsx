import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { IcoCards, IcoBrain, IcoTarget, IcoFlame, IcoSparkles, IcoSun, IcoMoon } from './icons.jsx';
import { useTheme } from './ui.jsx';

const FEATS = [
  { icon: <IcoCards />, t: '间隔重复闪卡', d: 'SM-2 算法自动安排复习节奏，专注真正记不住的词' },
  { icon: <IcoTarget />, t: '三种题型测验', d: '选择、拼写、听音辨词，答错自动回流复习队列' },
  { icon: <IcoBrain />, t: 'AI 记忆法', d: '词根拆解 + 联想记忆 + 雅思语境例句，一点即得' },
  { icon: <IcoFlame />, t: '数据与成就', d: '连续打卡、掌握度曲线、30 天热力图一目了然' },
];

export default function AuthShell({ title, subtitle, children }) {
  const { theme, toggle } = useTheme();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    api('/info').then(setInfo).catch(() => {});
  }, []);

  const words = info?.stats?.words;

  return (
    <div className="auth">
      <div className="auth-visual">
        <div className="row" style={{ gap: 12, marginBottom: 30 }}>
          <div className="logo-mark">IE</div>
          <div>
            <div style={{ fontWeight: 680, fontSize: 15 }}>雅思学习工作台</div>
            <div className="muted" style={{ letterSpacing: '0.06em' }}>IELTS WORKBENCH</div>
          </div>
        </div>

        <h1>
          把雅思词汇
          <br />
          <span className="grad-text">真正装进长期记忆</span>
        </h1>
        <p>
          不只是背单词。间隔重复、多题型测验、听力精听与 AI 记忆法，
          用一套闭环把「学过」变成「掌握」。
        </p>

        <div className="auth-feats">
          {FEATS.map((f) => (
            <div className="auth-feat" key={f.t}>
              <div className="ico">{f.icon}</div>
              <div>
                <div className="t">{f.t}</div>
                <div className="d">{f.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="auth-stat-row">
          <div>
            <div style={{ fontSize: 22, fontWeight: 720 }} className="mono">{words ?? '—'}</div>
            <div className="muted">词库容量</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 720 }} className="mono">SM-2</div>
            <div className="muted">记忆算法</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 720 }} className="mono">3</div>
            <div className="muted">测验题型</div>
          </div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <div className="row-between" style={{ marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 24 }}>{title}</h1>
              <div className="muted" style={{ marginTop: 2 }}>{subtitle}</div>
            </div>
            <button className="icon-btn" onClick={toggle} title="切换主题">
              {theme === 'dark' ? <IcoSun /> : <IcoMoon />}
            </button>
          </div>
          <div className="card">{children}</div>
          <div className="muted" style={{ textAlign: 'center', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <IcoSparkles style={{ width: 13, height: 13 }} />
            数据只保存在你自己的服务器上
          </div>
        </div>
      </div>
    </div>
  );
}
