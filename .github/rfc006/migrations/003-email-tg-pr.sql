CREATE TABLE IF NOT EXISTS email_tg_map (
  state_id TEXT PRIMARY KEY,      -- pr123
  chat_id  TEXT NOT NULL,
  email_from TEXT,                -- for reply
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Message tracking table for reliability and debugging
CREATE TABLE IF NOT EXISTS message_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT UNIQUE NOT NULL,
  email_from TEXT NOT NULL,
  email_to TEXT NOT NULL,
  pr_id TEXT,
  telegram_chat_id TEXT,
  telegram_message_id TEXT,
  github_action TEXT,
  status TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  error TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_tracking_status ON message_tracking(status);
CREATE INDEX IF NOT EXISTS idx_message_tracking_pr_id ON message_tracking(pr_id);
CREATE INDEX IF NOT EXISTS idx_message_tracking_timestamp ON message_tracking(timestamp);
