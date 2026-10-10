import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useTheme } from '../components/ui.jsx';
import { IcoSun, IcoMoon, IcoCheck, IcoPlus } from '../components/icons.jsx';

const PROVIDERS = [
  { k: 'deepseek', label: 'DeepSeek' },
  { k: 'glm', label: '智谱 GLM' },
  { k: 'kimi', label: 'Kimi (Moonshot)' },
];

export default function Settings() {
  const { user, refresh } = useAuth();
  const { theme, toggle } = useTheme();
  const [form, setForm] = useState({ display_name: '', daily_goal_words: 30, llm_provider: 'deepseek' });
  const [invites, setInvites] = useState(null);
  const [newInvite, setNewInvite] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || '',
        daily_goal_words: user.daily_goal_words || 30,
        llm_provider: user.llm_provider || 'deepseek',
      });
    }
  }, [user]);

  useEffect(() => {
    api('/info').then(setInfo).catch(() => {});
    if (user && (user.role === 'owner' || user.role === 'admin')) {
      api('/auth/invites').then((d) => setInvites(d.invites)).catch(() => setInvites([]));
    }
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setOk('');
    try {
      await api('/auth/me', { method: 'PATCH', body: { ...form, daily_goal_words: Number(form.daily_goal_words) } });
      await refresh();
      setOk('已保存');
      setTimeout(() => setOk(''), 2000);
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const genInvite = async () => {
    setErr('');
    try {
      const r = await api('/auth/invites', { method: 'POST', body: { note: '' } });
      setNewInvite(r.code);
      const d = await api('/auth/invites');
      setInvites(d.invites);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="narrow rise" style={{ margin: '0 auto', maxWidth: 760 }}>
      <div className="page-head">
        <h1>设置</h1>
        <div className="sub">学习目标、AI 提供商与邀请码管理。</div>
      </div>

      {err && <div className="msg error">{err}</div>}
      {ok && <div className="msg ok">{ok}</div>}

      <form className="card rise" onSubmit={save}>
        <div className="card-title">
          <span className="dot" /> 个人偏好
        </div>
        <label className="field">
          <span>昵称</span>
          <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        </label>
        <label className="field">
          <span>每日学习目标（词）</span>
          <input type="number" min="5" max="300" value={form.daily_goal_words}
            onChange={(e) => setForm({ ...form, daily_goal_words: e.target.value })} />
        </label>
        <label className="field">
          <span>AI 提供商（用于记忆法生成等）</span>
          <select value={form.llm_provider} onChange={(e) => setForm({ ...form, llm_provider: e.target.value })}>
            {PROVIDERS.map((p) => {
              const conf = info?.llm?.find((x) => x.name === p.k);
              return (
                <option key={p.k} value={p.k}>
                  {p.label}{conf ? (conf.configured ? '（已配置）' : '（未配置 Key）') : ''}
                </option>
              );
            })}
          </select>
        </label>
        <button className="btn btn-primary">
          <IcoCheck /> 保存
        </button>
      </form>

      <div className="card rise" style={{ animationDelay: '60ms' }}>
        <div className="card-title">
          <span className="dot" /> 外观
        </div>
        <div className="row-between">
          <div>
            <div style={{ fontWeight: 560 }}>{theme === 'dark' ? '深色主题' : '浅色主题'}</div>
            <div className="muted">极光玻璃界面，切换后自动记住你的选择</div>
          </div>
          <button className="btn" onClick={toggle}>
            {theme === 'dark' ? <IcoSun /> : <IcoMoon />}
            切换到{theme === 'dark' ? '浅色' : '深色'}
          </button>
        </div>
      </div>

      {(user?.role === 'owner' || user?.role === 'admin') && (
        <div className="card rise" style={{ animationDelay: '90ms' }}>
          <div className="row-between">
            <div className="card-title" style={{ margin: 0 }}>
              <span className="dot" /> 邀请码
            </div>
            <button className="btn btn-primary btn-sm" onClick={genInvite}>
              <IcoPlus /> 生成新邀请码
            </button>
          </div>
          {newInvite && (
            <div className="card" style={{ background: 'var(--surface-2)', boxShadow: 'none', textAlign: 'center', marginTop: 12 }}>
              <span className="mono" style={{ fontSize: 17, letterSpacing: 1 }}>{newInvite}</span>
            </div>
          )}
          {invites && invites.length > 0 && (
            <table style={{ marginTop: 12 }}>
              <thead>
                <tr><th>邀请码</th><th>备注</th><th>状态</th><th>使用者</th></tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id}>
                    <td className="mono">{i.code}</td>
                    <td>{i.note || '—'}</td>
                    <td>{i.used_by ? <span className="tag green">已使用</span> : <span className="tag">未使用</span>}</td>
                    <td>{i.used_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {info && (
        <div className="card">
          <div className="card-title">
            <span className="dot" /> 系统信息
          </div>
          <table className="table">
            <tbody>
              <tr><td className="muted">版本</td><td>{info.name} v{info.version}</td></tr>
              <tr><td className="muted">词库</td><td>{info.stats?.words} 词 · {info.stats?.lists ?? '—'} 本词书</td></tr>
              <tr><td className="muted">用户</td><td>{info.stats?.users} 人</td></tr>
              <tr><td className="muted">功能模块</td><td>{(info.features || []).join(' · ')}</td></tr>
              <tr><td className="muted">启动时间</td><td className="mono">{info.boot_at?.replace('T', ' ').slice(0, 19)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
