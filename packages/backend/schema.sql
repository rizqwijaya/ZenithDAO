-- ZenithDAO indexer schema (PostgreSQL)
-- Domain tables are exactly as defined in GENERAL.md section 4.
-- Unique indexes + indexer_state are additive infrastructure for idempotent indexing.

CREATE TABLE IF NOT EXISTS proposals (
  proposal_id   TEXT PRIMARY KEY,
  proposer      TEXT NOT NULL,
  description   TEXT,
  start_block   BIGINT,
  end_block     BIGINT,
  status        TEXT DEFAULT 'pending',
  for_votes     TEXT DEFAULT '0',
  against_votes TEXT DEFAULT '0',
  abstain_votes TEXT DEFAULT '0',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id           SERIAL PRIMARY KEY,
  proposal_id  TEXT REFERENCES proposals(proposal_id),
  voter        TEXT NOT NULL,
  support      SMALLINT NOT NULL,  -- 0=against, 1=for, 2=abstain
  weight       TEXT NOT NULL,
  reason       TEXT,
  block_number BIGINT,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treasury_events (
  id           SERIAL PRIMARY KEY,
  event_type   TEXT NOT NULL,  -- 'received' | 'executed'
  sender       TEXT,
  target       TEXT,
  amount       TEXT NOT NULL,
  tx_hash      TEXT,
  block_number BIGINT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- One vote per (proposal, voter): keeps re-indexing idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_proposal_voter ON votes (proposal_id, voter);

-- De-dupe treasury events by transaction + type.
CREATE UNIQUE INDEX IF NOT EXISTS uq_treasury_tx_type ON treasury_events (tx_hash, event_type);

-- Cursor for the event indexer (last fully processed block).
CREATE TABLE IF NOT EXISTS indexer_state (
  id         INT PRIMARY KEY DEFAULT 1,
  last_block BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
