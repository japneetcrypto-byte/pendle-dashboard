-- Migration: Optimize price_snapshots table
-- Purpose: Add indexes for performance + archive table
-- Date: 2025-11-02

-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_price_snapshots_market_timestamp 
  ON price_snapshots(market_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_created_at 
  ON price_snapshots(created_at);

-- Add columns for tracking
ALTER TABLE price_snapshots 
ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'pendle-api';

ALTER TABLE price_snapshots 
ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true;

-- Create archive table for old data (90+ days)
CREATE TABLE IF NOT EXISTS price_snapshots_archive (LIKE price_snapshots INCLUDING ALL);

\echo 'Migration 002: price_snapshots optimization complete ✓'
