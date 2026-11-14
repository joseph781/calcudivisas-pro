CREATE TABLE IF NOT EXISTS spread_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  captured_at TEXT NOT NULL,
  bcv_usd REAL NOT NULL,
  bcv_eur REAL NOT NULL,
  binance_buy REAL NOT NULL,
  bybit_buy REAL NOT NULL,
  brecha_pct REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spread_captured_at ON spread_history(captured_at);

CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  metric TEXT NOT NULL DEFAULT 'brecha_pct',
  threshold REAL NOT NULL DEFAULT 18.0,
  last_triggered_at TEXT
);
