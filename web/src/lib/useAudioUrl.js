import { useEffect, useState } from 'react';
import { getToken } from '../api.js';

// 原生 audio 不能附带 Bearer 头，先认证读取再播放本地 Blob。
export function useAudioUrl(audioPath) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    setUrl('');
    if (!audioPath) return;
    const abort = new AbortController();
    let objectUrl;
    fetch(`${import.meta.env.BASE_URL}${audioPath}`, {
      headers: { Authorization: `Bearer ${getToken() || ''}` },
      signal: abort.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error('音频不可访问');
      const blob = await response.blob();
      if (abort.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch((error) => {
      if (error.name !== 'AbortError') console.warn('音频加载失败');
    });
    return () => { abort.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [audioPath]);
  return url;
}
