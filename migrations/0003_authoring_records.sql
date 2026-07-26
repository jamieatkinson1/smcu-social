CREATE TABLE IF NOT EXISTS authoring_sequences (
  entity TEXT PRIMARY KEY CHECK(entity IN ('campaign','communication')),
  next_number INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS operational_campaigns (
  campaign_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('Draft','Active','Paused','Complete','Archived')),
  start_date TEXT,
  target_date TEXT,
  channels_json TEXT NOT NULL DEFAULT '[]',
  tasks_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS operational_communications (
  communication_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  working_title TEXT NOT NULL DEFAULT '',
  communication_type TEXT NOT NULL,
  campaign_id TEXT REFERENCES operational_campaigns(campaign_id),
  status TEXT NOT NULL CHECK(status IN ('Draft','In progress','Ready','Scheduled','Published','Archived')),
  channels_json TEXT NOT NULL DEFAULT '[]',
  publication_date TEXT,
  main_content_html TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  call_to_action TEXT NOT NULL DEFAULT '',
  shopify_title TEXT NOT NULL DEFAULT '',
  shopify_content_html TEXT NOT NULL DEFAULT '',
  instagram_caption TEXT NOT NULL DEFAULT '',
  facebook_caption TEXT NOT NULL DEFAULT '',
  promotional_copy TEXT NOT NULL DEFAULT '',
  use_main_shopify INTEGER NOT NULL DEFAULT 1,
  use_main_instagram INTEGER NOT NULL DEFAULT 1,
  use_main_facebook INTEGER NOT NULL DEFAULT 1,
  internal_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_operational_campaign_status ON operational_campaigns(status, target_date);
CREATE INDEX IF NOT EXISTS idx_operational_communication_campaign ON operational_communications(campaign_id, status);

INSERT OR IGNORE INTO authoring_sequences(entity,next_number) VALUES ('campaign',2),('communication',2);

INSERT OR IGNORE INTO operational_campaigns VALUES (
  'CMP-001','SMCU Social Media Launch','Launch the first approved SMCU social media communication package.',
  'Plan and publish the first approved SMCU social media communication package.','Complete','2026-07-21','2026-08-01',
  '["Shopify","Instagram","Facebook"]',
  '[{"id":"research","label":"Research","completed":true},{"id":"planning","label":"Planning","completed":true},{"id":"write","label":"Write communications","completed":true},{"id":"artwork","label":"Create artwork","completed":true},{"id":"review","label":"Review","completed":true},{"id":"assets","label":"Upload assets","completed":true},{"id":"buffer","label":"Schedule Buffer","completed":false},{"id":"shopify","label":"Publish Shopify","completed":false},{"id":"verify","label":"Verify publication","completed":false},{"id":"archive","label":"Archive campaign","completed":false}]',
  'Migrated from repository.json.','2026-07-21T00:00:00.000Z','2026-07-25T00:00:00.000Z',1
);

INSERT OR IGNORE INTO operational_communications VALUES (
  'CN-001','SMCU Social Media','SMCU Social Media','Company Memo','CMP-001','Published',
  '["Instagram","Facebook"]','2026-07-25',
  '<p>Approved social media carousel issued by the Communications Department.</p>',
  'Approved social media carousel issued by the Communications Department.','',
  'SMCU Social Media','', '', '', '',1,1,1,
  'Migrated from repository.json; existing artwork relationships are preserved in communication_assets.',
  '2026-07-25T00:00:00.000Z','2026-07-25T00:00:00.000Z',1
);
