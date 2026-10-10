// SM-2 间隔重复调度（SuperMemo 2 的工程化简化版）
//
// 输入：用户对某个词的当前进度 + 本次回忆质量 quality(0..5)
// 输出：新的 ease / interval / reps / lapses / state 以及下次到期时间（分钟）
//
// quality 映射（前端四个按钮）：
//   完全忘记 forget → 0
//   有点难   hard   → 3
//   记得     good   → 4
//   太简单   easy   → 5

const MIN_EASE = 1.3;
const GRADUATING_INTERVAL = 1; // 首次记住 → 1 天后复习
const EASY_INTERVAL = 4; // 直接点「太简单」→ 4 天后复习
const SECOND_INTERVAL = 6; // 第二次记住 → 6 天
const MASTERED_INTERVAL = 21; // 间隔 >= 21 天视为已掌握
const RELEARN_MINUTES = 10; // 答错后 10 分钟重来

export const QUALITY = { forget: 0, hard: 3, good: 4, easy: 5 };

export function normalizeQuality(q) {
  const n = Number(q);
  if (!Number.isFinite(n)) return QUALITY.good;
  return Math.max(0, Math.min(5, Math.round(n)));
}

export function schedule(prev, quality) {
  const q = normalizeQuality(quality);
  const cur = {
    ease: Number(prev?.ease) || 2.5,
    interval_days: Number(prev?.interval_days) || 0,
    reps: Number(prev?.reps) || 0,
    lapses: Number(prev?.lapses) || 0,
    state: prev?.state || 'new',
  };

  let { ease, interval_days, reps, lapses } = cur;

  // ease 更新公式（SM-2 原式）
  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  let dueMinutes;

  if (q < 3) {
    // 没想起来：重置进度，当天内重来
    reps = 0;
    interval_days = 0;
    lapses += 1;
    dueMinutes = RELEARN_MINUTES;
  } else {
    if (reps === 0) {
      interval_days = q === QUALITY.easy ? EASY_INTERVAL : GRADUATING_INTERVAL;
    } else if (reps === 1) {
      interval_days = q === QUALITY.hard ? GRADUATING_INTERVAL + 1 : SECOND_INTERVAL;
    } else {
      const factor = q === QUALITY.hard ? 1.2 : ease;
      interval_days = Math.max(1, Math.round(interval_days * factor));
    }
    reps += 1;
    // quality 极佳时额外奖励
    if (q === QUALITY.easy) interval_days = Math.max(interval_days, Math.round(interval_days * 1.15));
    dueMinutes = Math.round(interval_days * 24 * 60);
  }

  let state;
  if (interval_days >= MASTERED_INTERVAL) state = 'mastered';
  else if (interval_days >= 1) state = 'review';
  else state = 'learning';

  return { ease: Number(ease.toFixed(3)), interval_days, reps, lapses, state, dueMinutes };
}

// 由答题结果推导 quality（选择题 / 听写用）
export function qualityFromResult({ correct, elapsedMs, hintUsed } = {}) {
  if (!correct) return QUALITY.forget;
  if (hintUsed) return QUALITY.hard;
  if (Number.isFinite(elapsedMs) && elapsedMs < 3000) return QUALITY.easy;
  return QUALITY.good;
}
