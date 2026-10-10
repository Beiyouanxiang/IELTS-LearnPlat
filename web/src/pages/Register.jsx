import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { IcoCheck, IcoArrowRight } from '../components/icons.jsx';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirm: '', invite_code: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.password !== form.confirm) {
      setErr('两次输入的密码不一致');
      return;
    }
    setBusy(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: {
          username: form.username,
          password: form.password,
          invite_code: form.invite_code || undefined,
        },
      });
      login(data.token, data.user);
      if (data.first_invite) {
        setInvite(data.first_invite);
        return; // 先展示初始邀请码，再进入工作台
      }
      navigate('/', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  if (invite) {
    return (
      <AuthShell title="注册成功" subtitle="你是这台服务器的第一位用户">
        <div style={{ textAlign: 'center' }}>
          <div
            className="ico"
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 14px',
              borderRadius: 18,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--grad)',
              color: '#fff',
            }}
          >
            <IcoCheck style={{ width: 26, height: 26 }} />
          </div>
          <p className="muted" style={{ marginBottom: 14 }}>
            这是为你生成的初始邀请码，把它发给朋友即可注册。之后也能在「设置」里继续生成。
          </p>
          <div className="card" style={{ background: 'var(--surface-hi)', boxShadow: 'none' }}>
            <span className="mono" style={{ fontSize: 19, letterSpacing: 1.5 }}>{invite}</span>
          </div>
          <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 16 }} onClick={() => navigate('/', { replace: true })}>
            进入工作台 <IcoArrowRight />
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="注册" subtitle="需要邀请码才能加入">
      {err && <div className="msg error">{err}</div>}
      <form onSubmit={submit}>
        <label className="field">
          <span>用户名（3-32 位字母、数字或下划线）</span>
          <input autoFocus autoComplete="username" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="your_username" />
        </label>
        <label className="field">
          <span>密码（至少 8 位）</span>
          <input type="password" autoComplete="new-password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </label>
        <label className="field">
          <span>确认密码</span>
          <input type="password" autoComplete="new-password" value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" />
        </label>
        <label className="field">
          <span>邀请码（首次管理员注册使用初始化邀请码）</span>
          <input value={form.invite_code}
            onChange={(e) => setForm({ ...form, invite_code: e.target.value })} placeholder="粘贴邀请码" />
        </label>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? '创建中…' : '创建账号'}
          {!busy && <IcoArrowRight />}
        </button>
      </form>
      <div className="muted" style={{ textAlign: 'center', marginTop: 14 }}>
        已有账号？<Link to="/login">直接登录</Link>
      </div>
    </AuthShell>
  );
}
