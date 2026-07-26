CREATE TABLE IF NOT EXISTS publication_results (
  communication_id TEXT NOT NULL, campaign_id TEXT, destination TEXT NOT NULL,
  requested_action TEXT NOT NULL, idempotency_key TEXT NOT NULL, status TEXT NOT NULL,
  scheduled_time TEXT, external_platform_id TEXT, external_url TEXT, attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, completed_at TEXT, failure_code TEXT,
  recovery_message TEXT, request_fingerprint TEXT NOT NULL, correlation_id TEXT NOT NULL,
  PRIMARY KEY (idempotency_key, destination)
);
CREATE INDEX IF NOT EXISTS idx_publication_communication ON publication_results(communication_id, created_at DESC);
