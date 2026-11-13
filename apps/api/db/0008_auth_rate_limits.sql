-- Hashed, short-lived authentication request counters (no raw IP addresses).
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(key_hash, action, window_start)
);
CREATE INDEX IF NOT EXISTS ix_auth_rate_limits_expiry ON auth_rate_limits(window_start);
