-- Creates the database tables for storing Pendle market data

CREATE TABLE markets (
    id SERIAL PRIMARY KEY,
    chain_id INTEGER NOT NULL,
    market_address VARCHAR(42) UNIQUE NOT NULL,
    pt_address VARCHAR(42) NOT NULL,
    yt_address VARCHAR(42) NOT NULL,
    underlying_asset VARCHAR(100),
    maturity TIMESTAMP NOT NULL,
    name VARCHAR(200),
    symbol VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_snapshots (
    id SERIAL PRIMARY KEY,
    market_id INTEGER REFERENCES markets(id),
    pt_price DECIMAL(18, 8),
    yt_price DECIMAL(18, 8),
    theoretical_pt_price DECIMAL(18, 8),
    implied_apy DECIMAL(10, 4),
    liquidity DECIMAL(20, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_deviations (
    id SERIAL PRIMARY KEY,
    market_id INTEGER REFERENCES markets(id),
    actual_price DECIMAL(18, 8),
    expected_price DECIMAL(18, 8),
    deviation_pct DECIMAL(10, 4),
    z_score DECIMAL(10, 4),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_address ON markets(market_address);
CREATE INDEX idx_price_snapshots_timestamp ON price_snapshots(timestamp);
CREATE INDEX idx_price_deviations_market ON price_deviations(market_id);
