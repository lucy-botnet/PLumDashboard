CREATE TABLE escalations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escalation_id     TEXT UNIQUE NOT NULL,
  account_name      TEXT NOT NULL,
  account_tier      TEXT CHECK (account_tier IN ('Enterprise','Mid-Market','SMB')),
  channel           TEXT CHECK (channel IN ('WhatsApp','Slack','Email')),
  sender_name       TEXT,
  subject           TEXT,
  message           TEXT,
  priority_hint     TEXT,
  sla_hours         INTEGER,
  current_status    TEXT CHECK (current_status IN ('Open','Blocked','In Progress','Closed')),
  owner             TEXT DEFAULT '—',
  score             INTEGER DEFAULT 0,
  priority_bucket   TEXT CHECK (priority_bucket IN ('High','Medium','Low')),
  ai_summary        TEXT,
  ai_action         TEXT,
  risk_flags        TEXT[] DEFAULT '{}',
  dim_business      INTEGER DEFAULT 0,
  dim_time_age      INTEGER DEFAULT 0,
  dim_comms         INTEGER DEFAULT 0,
  dim_complexity    INTEGER DEFAULT 0,
  dim_risk          INTEGER DEFAULT 0,
  dim_ownership     INTEGER DEFAULT 0,
  dim_historical    INTEGER DEFAULT 0,
  age_hours         NUMERIC DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_priority_bucket ON escalations(priority_bucket);
CREATE INDEX idx_current_status ON escalations(current_status);
CREATE INDEX idx_channel ON escalations(channel);
CREATE INDEX idx_account_tier ON escalations(account_tier);
CREATE INDEX idx_score ON escalations(score DESC);

ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON escalations
  FOR SELECT USING (true);

CREATE POLICY "Public insert access" ON escalations
  FOR INSERT WITH CHECK (true);
