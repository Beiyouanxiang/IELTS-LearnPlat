const TOKEN_KEY = 'ielts_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || `请求失败 (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const fmtDate = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '—');

// Band 统一保留一位小数：7 → "7.0"，7.5 → "7.5"，空值 → "—"
export const fmtBand = (n) => (n === null || n === undefined || n === '' ? '—' : Number(n).toFixed(1));

export const STATE_LABEL = {
  new: '未学',
  learning: '学习中',
  review: '复习中',
  mastered: '已掌握',
};

export const STATE_CLASS = {
  new: 'gray',
  learning: 'amber',
  review: '',
  mastered: 'green',
};
