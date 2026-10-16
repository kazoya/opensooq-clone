-- 003_market: buyer/seller messages and ad reports (document style, like the other collections)
CREATE TABLE IF NOT EXISTS messages (
  seq BIGSERIAL, id TEXT PRIMARY KEY, data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_seq_idx ON messages (seq);
CREATE INDEX IF NOT EXISTS messages_thread_idx ON messages ((data->>'thread'));
CREATE TABLE IF NOT EXISTS reports (
  seq BIGSERIAL, id TEXT PRIMARY KEY, data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_seq_idx ON reports (seq);
