import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { api, getToken, setToken } from './api.js';
import { ToastProvider } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Words from './pages/Words.jsx';
import Study from './pages/Study.jsx';
import Quiz from './pages/Quiz.jsx';
import Listening from './pages/Listening.jsx';
import Reading from './pages/Reading.jsx';
import Writing from './pages/Writing.jsx';
import WritingEditor from './pages/WritingEditor.jsx';
import Plan from './pages/Plan.jsx';
import Wrong from './pages/Wrong.jsx';
import Settings from './pages/Settings.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="auth" style={{ placeItems: 'center' }}>
        <div className="muted">正在加载…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await api('/auth/me');
      setUser(u);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = (token, u) => {
    setToken(token);
    setUser(u);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <ToastProvider>
      <div className="aurora">
        <div className="grid-lines" />
      </div>
      <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route
            path="/"
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="words" element={<Words />} />
            <Route path="study" element={<Study />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="listening" element={<Listening />} />
            <Route path="reading" element={<Reading />} />
            <Route path="writing" element={<Writing />} />
            <Route path="writing/e/:id" element={<WritingEditor />} />
            <Route path="plan" element={<Plan />} />
            <Route path="wrong" element={<Wrong />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthCtx.Provider>
    </ToastProvider>
  );
}
