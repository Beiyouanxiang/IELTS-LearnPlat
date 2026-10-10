import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { api } from '../api.js';
import CommandPalette from './CommandPalette.jsx';
import { useHotkeys, useTheme } from './ui.jsx';
import {
  IcoCards,
  IcoBook,
  IcoTarget,
  IcoHeadphones,
  IcoDashboard,
  IcoSettings,
  IcoSearch,
  IcoSun,
  IcoMoon,
  IcoLogout,
  IcoTrophy,
  IcoUser,
  IcoPen,
  IcoChart,
  IcoRead,
} from './icons.jsx';

const NAV_GROUPS = [
  {
    label: '词汇',
    items: [
      { to: '/', label: '工作台', icon: <IcoDashboard />, end: true },
      { to: '/study', label: '今日学习', icon: <IcoCards /> },
      { to: '/words', label: '词库', icon: <IcoBook /> },
      { to: '/quiz', label: '测验', icon: <IcoTarget /> },
      { to: '/wrong', label: '错题本', icon: <IcoTrophy /> },
    ],
  },
  {
    label: '输入训练',
    items: [
      { to: '/listening', label: '听力', icon: <IcoHeadphones /> },
      { to: '/reading', label: '阅读', icon: <IcoRead /> },
    ],
  },
  {
    label: '输出训练',
    items: [{ to: '/writing', label: '写作', icon: <IcoPen /> }],
  },
  {
    label: '规划',
    items: [
      { to: '/plan', label: '学习计划', icon: <IcoChart /> },
      { to: '/settings', label: '设置', icon: <IcoSettings /> },
    ],
  },
];

const ROLE_LABEL = { owner: '创建者', admin: '管理员', member: '成员' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const { theme, toggle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [due, setDue] = useState(0);

  const loadDue = useCallback(() => {
    api('/vocab/stats')
      .then((s) => setDue(s.words?.due_now || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadDue();
  }, [loadDue, loc.pathname]);

  useHotkeys({ 'ctrl+k': () => setPaletteOpen((v) => !v) }, []);

  const initial = (user?.display_name || user?.username || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-mark">IE</div>
          <div>
            <div className="t">雅思工作台</div>
            <div className="s">IELTS Workbench</div>
          </div>
        </div>

        <nav className="nav-items">
          {NAV_GROUPS.map((g) => (
            <div className="nav-group" key={g.label}>
              <div className="nav-group-label">{g.label}</div>
              {g.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  {n.icon}
                  <span>{n.label}</span>
                  {n.to === '/study' && due > 0 && <span className="badge">{due}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="nav-gap" />

        <div className="user-card">
          <div className="avatar">{initial}</div>
          <div className="meta">
            <div className="n">{user?.display_name || user?.username}</div>
            <div className="r">
              <IcoUser style={{ width: 11, height: 11, verticalAlign: -1, marginRight: 3 }} />
              {ROLE_LABEL[user?.role] || '成员'}
            </div>
          </div>
          <button className="icon-btn" title="退出登录" onClick={() => { logout(); navigate('/login'); }}>
            <IcoLogout />
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <button className="search-trigger" onClick={() => setPaletteOpen(true)}>
            <IcoSearch style={{ width: 16, height: 16 }} />
            <span>搜索单词、跳转页面…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="topbar-actions">
            <button className="icon-btn" title={theme === 'dark' ? '切换到浅色' : '切换到深色'} onClick={toggle}>
              {theme === 'dark' ? <IcoSun /> : <IcoMoon />}
            </button>
          </div>
        </div>

        <div className="content">
          <Outlet />
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
