-- 001_init: one table per collection; each row is stored as JSONB (document style).
CREATE TABLE IF NOT EXISTS categories (
  seq BIGSERIAL,
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS categories_seq_idx ON categories (seq);
CREATE TABLE IF NOT EXISTS cities (
  seq BIGSERIAL,
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cities_seq_idx ON cities (seq);
CREATE TABLE IF NOT EXISTS ads (
  seq BIGSERIAL,
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ads_seq_idx ON ads (seq);
CREATE TABLE IF NOT EXISTS users (
  seq BIGSERIAL,
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_seq_idx ON users (seq);
