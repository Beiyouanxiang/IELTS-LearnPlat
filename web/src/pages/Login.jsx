import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { IcoArrowRight } from '../components/icons.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const d = await api('/auth/login', { method: 'POST', body: form });
      login(d.token, d.user);
      navigate(loc.state?.from || '/', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="登录" subtitle="继续你的学习进度">
      {err && <div className="msg error">{err}</div>}
      <form onSubmit={submit}>
        <label className="field">
          <span>用户名</span>
          <input
            autoFocus
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="your_username"
          />
        </label>
        <label className="field">
          <span>密码</span>
          <input
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </label>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? '登录中…' : '登录'}
          {!busy && <IcoArrowRight />}
        </button>
      </form>
      <div className="muted" style={{ textAlign: 'center', marginTop: 14 }}>
        还没有账号？<Link to="/register">用邀请码注册</Link>
      </div>
    </AuthShell>
  );
}
