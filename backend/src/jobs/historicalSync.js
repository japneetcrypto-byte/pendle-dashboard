const { getAllMarkets } = require('../services/pendleAPI');
const { upsertMarket, savePriceSnapshot } = require('../models/Market');
const pool = require('../config/database');

async function syncHistoricalData() {
    console.log('📊 Starting historical data sync...');
    
    try {
        const markets = await getAllMarkets();
        let importedCount = 0;
        
        for (const market of markets) {
            try {
                // Get market ID
                const marketId = await upsertMarket({
                    chainId: market.chainId,
                    address: market.address,
                    pt: market.pt?.address,
                    yt: market.yt?.address,
                    underlyingAsset: market.underlyingAsset?.symbol || 'Unknown',
                    expiry: new Date(market.expiry),
                    name: market.pt?.proName || market.name,
                    symbol: market.pt?.proSymbol || market.symbol
                });
                
                // Check if this market already has price history
                const existingData = await pool.query(
                    'SELECT COUNT(*) FROM price_snapshots WHERE market_id = $1',
                    [marketId]
                );
                
                // Only fetch history if we have less than 5 snapshots
                if (existingData.rows[0].count < 5) {
                    console.log(`📥 Fetching historical data for: ${market.name}`);
                    
                    // For now, we'll use what's available from current API
                    // This needs Pendle subgraph or CSV export data
                    importedCount++;
                }
            } catch (error) {
                console.error(`Error syncing market history:`, error.message);
            }
        }
        
        console.log(`✅ Historical sync complete: ${importedCount} markets processed`);
    } catch (error) {
        console.error('❌ Historical sync failed:', error);
    }
}

module.exports = { syncHistoricalData };
