CREATE TABLE IF NOT EXISTS communication_assets (
  asset_id TEXT PRIMARY KEY, communication_id TEXT NOT NULL,
  original_filename TEXT NOT NULL, safe_filename TEXT NOT NULL,
  object_key TEXT, public_url TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL,
  width INTEGER NOT NULL, height INTEGER NOT NULL, file_size INTEGER NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '', caption TEXT NOT NULL DEFAULT '',
  is_primary INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL, replaced_at TEXT, publication_usage TEXT NOT NULL DEFAULT '[]',
  checksum TEXT, storage_kind TEXT NOT NULL CHECK(storage_kind IN ('r2','legacy')),
  UNIQUE(communication_id, checksum)
);
CREATE INDEX IF NOT EXISTS idx_communication_assets_order ON communication_assets(communication_id, sort_order);
INSERT OR IGNORE INTO communication_assets VALUES
('AST-001','CN-001','cn-001 slide 1.png','cn-001-slide-1.png',NULL,'/assets/company-notices/cn-001/cn-001%20slide%201.png','image/png',1080,1350,46576,'SMCU Social Media company notice, slide 1 of 3','',1,0,'2026-07-25T00:00:00.000Z',NULL,'[]','65bd256761f62f90c776c407a26e7f3333023dfe88e5934e83afe1c7a575ed37','legacy'),
('AST-002','CN-001','cn-001 slide 2.png','cn-001-slide-2.png',NULL,'/assets/company-notices/cn-001/cn-001%20slide%202.png','image/png',1080,1350,56183,'SMCU Social Media company notice, slide 2 of 3','',0,1,'2026-07-25T00:00:00.000Z',NULL,'[]','413427e3076592c8e3bd022021c2ad5a65899da0d7dafc285c5e4a3ff8a6a1ce','legacy'),
('AST-003','CN-001','cn-001 slide 3.png','cn-001-slide-3.png',NULL,'/assets/company-notices/cn-001/cn-001%20slide%203.png','image/png',1080,1350,43326,'SMCU Social Media company notice, slide 3 of 3','',0,2,'2026-07-25T00:00:00.000Z',NULL,'[]','70bc310ae93f2ff7e7f00063bea51c0d755b082e860394ce069b2a99ed9f020a','legacy');
