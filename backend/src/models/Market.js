const pool = require('../config/database');


// Save or update market in database
async function upsertMarket(marketData) {
    const query = `
        INSERT INTO markets (
            chain_id, market_address, pt_address, yt_address,
            underlying_asset, maturity, name, symbol
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (market_address)
        DO UPDATE SET
            name = EXCLUDED.name,
            symbol = EXCLUDED.symbol,
            maturity = EXCLUDED.maturity,
            underlying_asset = EXCLUDED.underlying_asset
        RETURNING id
    `;
    
    const values = [
        marketData.chainId,
        marketData.address,
        marketData.pt,
        marketData.yt,
        marketData.underlyingAsset,
        marketData.expiry,
        marketData.name,
        marketData.symbol
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0].id;
    } catch (error) {
        console.error('Error upserting market:', error);
        throw error;
    }
}


// Save price snapshot - UPDATED TO INCLUDE PT_PRICE_USD
async function savePriceSnapshot(snapshotData) {
    const query = `
        INSERT INTO price_snapshots (
            market_id, pt_price, pt_price_usd, yt_price, theoretical_pt_price,
            implied_apy, fixed_apy, liquidity, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    `;
    
    const values = [
        snapshotData.marketId,
        snapshotData.ptPrice,
        snapshotData.ptPriceUSD || 0,
        snapshotData.ytPrice,
        snapshotData.theoreticalPrice,
        snapshotData.impliedAPY,
        snapshotData.fixedAPY,
        snapshotData.liquidity,
        snapshotData.timestamp || new Date()
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0].id;
    } catch (error) {
        console.error('Error saving price snapshot:', error);
        throw error;
    }
}


// Get all markets from database - UPDATED TO INCLUDE PT_PRICE_USD
async function getAllMarketsFromDB() {
    const query = `
        SELECT m.*, 
               ps.pt_price, ps.pt_price_usd, ps.yt_price, ps.theoretical_pt_price,
               ps.implied_apy, ps.fixed_apy, ps.timestamp as last_updated
        FROM markets m
        LEFT JOIN LATERAL (
            SELECT * FROM price_snapshots
            WHERE market_id = m.id
            ORDER BY timestamp DESC
            LIMIT 1
        ) ps ON true
        ORDER BY m.created_at DESC
    `;
    
    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching markets:', error);
        throw error;
    }
}


// Get single market by address
async function getMarketByAddress(marketAddress) {
    const query = `SELECT * FROM markets WHERE market_address = $1`;
    
    try {
        const result = await pool.query(query, [marketAddress]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching market:', error);
        throw error;
    }
}


module.exports = {
    upsertMarket,
    savePriceSnapshot,
    getAllMarketsFromDB,
    getMarketByAddress
};
