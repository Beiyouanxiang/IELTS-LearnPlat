// 统一学习事件写入：所有模块的学习行为都落到 study_logs，
// streak / 热力图 / 能力雷达 / 学习报告 全部从这里聚合。
export function logStudy(db, userId, { module, action, refType, refId, isCorrect, score, durationMs, detail }) {
  db.prepare(
    `INSERT INTO study_logs (user_id, module, action, ref_type, ref_id, is_correct, score, duration_ms, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    module,
    action,
    refType ?? null,
    refId ?? null,
    isCorrect === undefined || isCorrect === null ? null : isCorrect ? 1 : 0,
    score ?? null,
    durationMs ?? null,
    detail ? JSON.stringify(detail) : null
  );
}
