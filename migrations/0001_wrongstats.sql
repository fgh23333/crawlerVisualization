-- 匿名错题频率采集：全站聚合表 + 批次幂等台账（D1，binding 名 DB）
-- 只存题目 ID 与计数，无题目文本 / 账号 / IP。
-- 幂等：sync_ledger.batch_id 主键先行 INSERT ON CONFLICT DO NOTHING，
--       重放批次 changes===0 直接确认 duplicate，聚合表不会重复累加。

CREATE TABLE IF NOT EXISTS question_stats (
  question_id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  attempts_sum INTEGER NOT NULL DEFAULT 0,
  errors_sum INTEGER NOT NULL DEFAULT 0,
  last_seen INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_question_stats_subject ON question_stats(subject, errors_sum DESC);

CREATE TABLE IF NOT EXISTS sync_ledger (
  batch_id TEXT PRIMARY KEY,
  client_uuid TEXT NOT NULL,
  item_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_ledger_uuid ON sync_ledger(client_uuid, created_at);
