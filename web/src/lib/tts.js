// Web Speech API TTS —— 零成本单词/句子发音
let VOICES = [];

function refreshVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    VOICES = window.speechSynthesis.getVoices() || [];
  } catch {
    VOICES = [];
  }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

export function ttsSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

const ACCENT_LANG = { uk: 'en-GB', us: 'en-US', au: 'en-AU', en: 'en-US' };

function pickVoice(accent) {
  if (!VOICES.length) refreshVoices();
  const lang = ACCENT_LANG[accent] || 'en-GB';
  const exact = VOICES.filter((v) => v.lang?.replace('_', '-').toLowerCase() === lang.toLowerCase());
  if (exact.length) {
    // 优先挑本地语音与常见高质量音色
    return (
      exact.find((v) => /daniel|serena|kate|sonia|google/i.test(v.name)) ||
      exact.find((v) => v.localService) ||
      exact[0]
    );
  }
  const anyEn = VOICES.filter((v) => (v.lang || '').toLowerCase().startsWith('en'));
  return anyEn[0] || null;
}

/**
 * 朗读文本。
 * @returns {Promise<void>} 播完/取消后 resolve
 */
export function speak(text, { accent = 'uk', rate = 0.92 } = {}) {
  return new Promise((resolve) => {
    if (!ttsSupported() || !text) return resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    const v = pickVoice(accent);
    if (v) u.voice = v;
    u.lang = ACCENT_LANG[accent] || 'en-GB';
    u.rate = rate;
    u.pitch = 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    // 某些浏览器首次调用需要 tick
    setTimeout(() => synth.speak(u), 20);
  });
}

export function stopSpeak() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
