import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Empty, Skeleton, StatCard, useToast } from '../components/ui.jsx';
import { speak } from '../lib/tts.js';
import { IcoTrophy, IcoSpeaker, IcoStar, IcoZap, IcoTrendUp } from '../components/icons.jsx';

export default function Wrong() {
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const d = await api('/vocab/wrong?limit=100');
      setData(d);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStar = async (w) => {
    const starred = !w.is_starred;
    setData((d) => ({ ...d, words: d.words.map((x) => (x.id === w.id ? { ...x, is_starred: starred } : x)) }));
    try {
      await api('/vocab/star', { method: 'POST', body: { word_id: w.id, starred } });
      toast(starred ? '已加入生词本' : '已移出生词本');
    } catch {
      /* ignore */
    }
  };

  if (err) return <div className="msg error">{err}</div>;

  if (!data) {
    return (
      <div className="grid grid-4">
        {[0, 1, 2, 3].map((i) => (
          <div className="card" key={i}>
            <Skeleton w="50%" h={12} />
            <Skeleton w="40%" h={26} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  const words = data.words || [];
  const totalWrong = data.total_wrong || 0;
  const worst = words[0];
  const recoverable = words.filter((w) => (w.wrong_count || 0) > 0 && (w.correct_count || 0) >= (w.wrong_count || 0)).length;

  return (
    <>
      <div className="page-head head-row rise">
        <div>
          <h1>错题本</h1>
          <div className="sub">反复出错的单词会自动排在最前，优先攻克它们提分最快。</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/study')}>
          <IcoZap /> 开始攻克
        </button>
      </div>

      <div className="grid grid-4">
        <StatCard label="错题单词数" value={words.length} unit="个" accent="#fb7185" accent2="#a855f7" foot="错误次数大于 0" />
        <StatCard label="累计答错" value={totalWrong} unit="次" accent="#fbbf24" accent2="#fb7185" />
        <StatCard label="最难词" value={worst ? worst.word : '—'} accent="#a855f7" accent2="#6366f1" foot={worst ? `答错 ${worst.wrong_count} 次` : '暂无'} />
        <StatCard label="已反超" value={recoverable} unit="个" accent="#34d399" accent2="#22d3ee" foot="正确次数 ≥ 错误次数" />
      </div>

      <div className="card rise" style={{ marginTop: 14 }}>
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <IcoTrophy style={{ width: 15, height: 15 }} /> 顽固词榜
          </div>
          <span className="muted">按答错次数排序</span>
        </div>

        {words.length === 0 ? (
          <Empty
            icon={<IcoTrendUp />}
            title="还没有错题记录"
            desc="做几轮测验或闪卡，答错的词会自动出现在这里"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/quiz')}>
                去测验
              </button>
            }
          />
        ) : (
          <div style={{ marginTop: 12 }}>
            {words.map((w, i) => {
              const wrong = w.wrong_count || 0;
              const correct = w.correct_count || 0;
              const total = wrong + correct || 1;
              const errRate = Math.round((wrong / total) * 100);
              return (
                <div className="word-row" key={w.id} style={{ cursor: 'default' }}>
                  <span className="muted mono" style={{ width: 26 }}>#{i + 1}</span>
                  <span className="w" style={{ minWidth: 130 }}>{w.word}</span>
                  <span className="muted mono" style={{ minWidth: 110 }}>{w.phonetic_uk || ''}</span>
                  <span className="m">{w.meaning_cn || '—'}</span>
                  <div style={{ width: 130, flex: 'none' }}>
                    <div className="bar amber" style={{ height: 5 }}>
                      <i style={{ width: `${errRate}%` }} />
                    </div>
                    <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>
                      错误率 {errRate}% · 错 {wrong} / 对 {correct}
                    </div>
                  </div>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => speak(w.word)} title="朗读">
                    <IcoSpeaker />
                  </button>
                  <button className={`star ${w.is_starred ? 'on' : ''}`} onClick={() => toggleStar(w)}>
                    <IcoStar filled={w.is_starred} style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
