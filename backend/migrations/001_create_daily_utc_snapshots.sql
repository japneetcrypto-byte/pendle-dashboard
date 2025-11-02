-- Migration: Create daily_price_snapshots_utc table
-- Purpose: Store one price snapshot per market per day at 12 AM UTC
-- Date: 2025-11-02

CREATE TABLE IF NOT EXISTS daily_price_snapshots_utc (
  id BIGSERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  
  -- Price data
  pt_price NUMERIC(20,10),
  yt_price NUMERIC(20,10),
  pt_price_usd NUMERIC(20,10),
  theoretical_price NUMERIC(20,10),
  
  -- APY data
  implied_apy NUMERIC(10,4),
  fixed_apy NUMERIC(10,4),
  
  -- Metadata
  liquidity NUMERIC(20,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(market_id, snapshot_date),
  CHECK (snapshot_time::time = '12:00:00+00'::time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_market_date 
  ON daily_price_snapshots_utc(market_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_date 
  ON daily_price_snapshots_utc(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_market 
  ON daily_price_snapshots_utc(market_id);

\echo 'Migration 001: daily_price_snapshots_utc table created ✓'
