// LLM provider 抽象（与 Bookmark-Page 保持一致：全 OpenAI 兼容协议）
import axios from 'axios';

const PROVIDERS = {
  deepseek: {
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },
  glm: {
    baseUrl: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY || '',
    model: process.env.GLM_MODEL || 'glm-4-flash',
  },
  kimi: {
    baseUrl: process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.cn/v1',
    apiKey: process.env.MOONSHOT_API_KEY || '',
    model: process.env.MOONSHOT_MODEL || 'moonshot-v1-8k',
  },
};

export function listProviders() {
  return Object.entries(PROVIDERS).map(([name, p]) => ({
    name,
    model: p.model,
    configured: Boolean(p.apiKey),
  }));
}

function getProvider(name) {
  const key = PROVIDERS[name] ? name : 'deepseek';
  const p = PROVIDERS[key];
  if (!p.apiKey) {
    throw new Error(`LLM 提供商「${key}」未配置 API Key（请在 server/.env 中填写）`);
  }
  return p;
}

export async function chat({ provider, messages, temperature = 0.3, maxTokens } = {}) {
  const p = getProvider(provider);
  const url = `${p.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body = { model: p.model, messages, temperature };
  if (maxTokens) body.max_tokens = maxTokens;

  const resp = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${p.apiKey}`, 'Content-Type': 'application/json' },
    timeout: 120000,
    validateStatus: () => true,
  });
  if (resp.status >= 400) {
    const detail = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data).slice(0, 300);
    throw new Error(`LLM 调用失败 HTTP ${resp.status}: ${detail}`);
  }
  return resp.data?.choices?.[0]?.message?.content || '';
}

// 要求模型返回 JSON 时统一走这里：容忍 ```json 包裹与前后废话
export async function chatJson({ provider, messages, temperature = 0.2 }) {
  const raw = await chat({ provider, messages, temperature });
  return parseJsonLoose(raw);
}

export function parseJsonLoose(raw) {
  if (!raw) throw new Error('LLM 返回为空');
  let s = String(raw).trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const first = Math.min(...[s.indexOf('{'), s.indexOf('[')].filter((i) => i >= 0));
  const lastBrace = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (Number.isFinite(first) && lastBrace > first) s = s.slice(first, lastBrace + 1);
  return JSON.parse(s);
}
