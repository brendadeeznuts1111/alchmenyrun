-- Phase-6 Email Metadata Database Schema
-- Stores routing analytics, audit logs, and AI analysis results

-- Core routing table
CREATE TABLE email_routing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,           -- infra, docs, qa, integrations, exec
  scope TEXT NOT NULL,            -- lead, senior, junior, bot, alert
  type TEXT NOT NULL,             -- pr, issue, deploy, alert, review
  hierarchy TEXT NOT NULL,        -- p0, p1, p2, p3, blk
  meta TEXT NOT NULL,             -- gh, tg, cf, 24h
  chat_id TEXT NOT NULL,          -- Telegram chat ID
  status TEXT NOT NULL,           -- success, failed, blocked
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  message_id TEXT,                -- Email Message-ID header
  from_address TEXT,              -- Sender email
  subject TEXT,                   -- Email subject
  processing_time_ms INTEGER      -- How long it took to process
);

-- AI analysis results (for Phase-6 expansion)
CREATE TABLE ai_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routing_id INTEGER REFERENCES email_routing(id),
  sentiment_score REAL,           -- -1 to 1 (negative to positive)
  urgency_score REAL,             -- 0 to 1 (low to high urgency)
  category TEXT,                  -- bug, feature, question, security, etc.
  keywords TEXT,                  -- JSON array of detected keywords
  summary TEXT,                   -- AI-generated summary
  confidence REAL,                -- 0 to 1 (AI confidence level)
  model_version TEXT,             -- Which AI model/version was used
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat ID mappings (for dynamic routing)
CREATE TABLE chat_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,    -- infra, docs, qa, etc.
  scope TEXT NOT NULL,            -- lead, senior, junior
  chat_id TEXT NOT NULL,          -- Telegram chat ID
  is_active BOOLEAN DEFAULT 1,    -- Soft delete
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OPA policy decisions (for compliance)
CREATE TABLE policy_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routing_id INTEGER REFERENCES email_routing(id),
  policy_name TEXT NOT NULL,      -- Which OPA policy was applied
  decision TEXT NOT NULL,         -- allow, deny, warn
  reason TEXT,                    -- Why this decision was made
  applied_by TEXT,                -- Which system/component applied it
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Metrics and analytics
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,      -- routing_total, ai_analysis_total, etc.
  value REAL NOT NULL,            -- Numeric value
  labels TEXT,                    -- JSON object of label key-value pairs
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_routing_domain ON email_routing(domain);
CREATE INDEX idx_routing_status ON email_routing(status);
CREATE INDEX idx_routing_created ON email_routing(created_at);
CREATE INDEX idx_ai_routing ON ai_analysis(routing_id);
CREATE INDEX idx_policy_routing ON policy_decisions(routing_id);
CREATE INDEX idx_metrics_name ON metrics(metric_name);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);

-- Insert default chat mappings
INSERT INTO chat_mappings (domain, scope, chat_id) VALUES
('infra', 'lead', '-1001234567890'),
('infra', 'senior', '-1001234567890'),
('infra', 'junior', '-1001234567890'),
('docs', 'lead', '-1001234567891'),
('docs', 'senior', '-1001234567891'),
('qa', 'lead', '-1001234567892'),
('qa', 'senior', '-1001234567892'),
('qa', 'bot', '-1001234567892'),
('integrations', 'lead', '-1001234567893'),
('integrations', 'senior', '-1001234567893'),
('integrations', 'junior', '-1001234567893'),
('exec', 'lead', '-1001234567894');
