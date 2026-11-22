CREATE TABLE IF NOT EXISTS licenses (
  key         TEXT PRIMARY KEY,
  tier        TEXT NOT NULL DEFAULT 'standard',
  hwid        TEXT,
  discord_id  TEXT,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  revoked     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_licenses_discord ON licenses(discord_id);
CREATE INDEX IF NOT EXISTS idx_licenses_hwid    ON licenses(hwid);
