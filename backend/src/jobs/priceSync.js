const cron = require('node-cron');
const { getAllMarkets, getAssetPrices } = require('../services/pendleAPI');
const { upsertMarket, savePriceSnapshot } = require('../models/Market');
const { calculateTheoreticalPrice, calculateDeviation, getDaysToMaturity, calculateImpliedAPY } = require('../utils/calculations');
const pool = require('../config/database');


// Main sync function - fetches and stores latest prices
async function syncPrices() {
    console.log('🔄 Starting price sync...');
    
    try {
        // Step 1: Fetch all active markets from Pendle API
        const markets = await getAllMarkets();
        console.log(`📊 Found ${markets.length} active markets\n`);
        
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        // Step 2: Process each market
        for (const market of markets) {
            try {
                // Parse expiry date - handle multiple possible formats
                let expiryDate;
                
                // Try multiple date sources in order of preference
                if (market.expiry && !market.expiry.includes('1970')) {
                    expiryDate = new Date(market.expiry);
                } else if (market.maturity && !market.maturity.includes('1970')) {
                    expiryDate = new Date(market.maturity);
                } else if (market.pt?.expiry && !market.pt.expiry.includes('1970')) {
                    expiryDate = new Date(market.pt.expiry);
                } else if (market.pt?.maturity && !market.pt.maturity.includes('1970')) {
                    expiryDate = new Date(market.pt.maturity);
                } else if (market.expiryDate && !market.expiryDate.includes('1970')) {
                    expiryDate = new Date(market.expiryDate);
                } else {
                    console.warn(`⚠️  Skipping market with invalid/1970 date: ${market.name || market.symbol}`);
                    skippedCount++;
                    continue;
                }
                
                // Validate the date
                if (isNaN(expiryDate.getTime()) || expiryDate.getFullYear() === 1970 || expiryDate.getFullYear() < 2025) {
                    console.warn(`⚠️  Invalid expiry date for market: ${market.name || market.symbol} - ${expiryDate}`);
                    skippedCount++;
                    continue;
                }
                
                // Skip expired markets
                const now = new Date();
                if (expiryDate < now) {
                    skippedCount++;
                    continue;
                }
                
                // Calculate days to maturity
                const daysToMaturity = getDaysToMaturity(expiryDate);
                
                // Skip markets with less than 1 day to maturity
                if (daysToMaturity < 1) {
                    skippedCount++;
                    continue;
                }
                
                // Extract addresses safely
                const ptAddress = market.pt?.address || market.ptAddress || market.pt || 'unknown';
                const ytAddress = market.yt?.address || market.ytAddress || market.yt || 'unknown';
                const marketAddress = market.address || market.marketAddress || market.id;
                
                // Extract underlying asset symbol
                const underlyingAsset = market.underlyingAsset?.symbol 
                    || market.sy?.symbol
                    || market.accountingAsset?.symbol
                    || 'Unknown';
                
                // Use the proName for better display
                let marketName = market.pt?.proName || market.pt?.name || market.proName || market.name;
                let marketSymbol = market.pt?.proSymbol || market.pt?.symbol || market.proSymbol || market.symbol;
                
                // Save/update market in database
                const marketId = await upsertMarket({
                    chainId: market.chainId,
                    address: marketAddress,
                    pt: ptAddress,
                    yt: ytAddress,
                    underlyingAsset: underlyingAsset,
                    expiry: expiryDate,
                    name: marketName,
                    symbol: marketSymbol
                });
                
                // Extract prices from the market object
                const ptPriceUSD = market.pt?.price?.usd;
                const ytPrice = market.yt?.price?.usd;
                
                // Get the correct base asset price for conversion
                const baseAssetPrice = market.basePricingAsset?.price?.usd 
                    || market.accountingAsset?.price?.usd 
                    || market.sy?.price?.usd 
                    || 1;
                
                const impliedAPY = market.impliedApy ? market.impliedApy * 100 : 0;
                const liquidity = market.liquidity?.usd;
                
                if (ptPriceUSD && ptPriceUSD > 0 && baseAssetPrice > 0) {
                    const ptInAssets = ptPriceUSD / baseAssetPrice;
                    const fixedAPY = calculateImpliedAPY(ptInAssets, daysToMaturity);
                    const theoreticalPrice = calculateTheoreticalPrice(
                        expiryDate,
                        fixedAPY,
                        ptInAssets
                    );
                    
                    let liquidityValue = liquidity || 0;
                    if (liquidityValue > 999999999999999) {
                        liquidityValue = 999999999999999;
                    }
                    
                    // Save price snapshot
                    await savePriceSnapshot({
                        marketId,
                        ptPrice: ptInAssets,
                        ptPriceUSD: ptPriceUSD,
                        ytPrice: ytPrice || 0,
                        theoreticalPrice,
                        impliedAPY: impliedAPY,
                        fixedAPY: fixedAPY,
                        liquidity: liquidityValue,
                        timestamp: new Date()
                    });
                    
                    // Calculate and save deviation
                    const deviation = calculateDeviation(ptInAssets, theoreticalPrice);
                    
                    await pool.query(`
                        INSERT INTO price_deviations (
                            market_id, actual_price, expected_price, 
                            deviation_pct, timestamp
                        ) VALUES ($1, $2, $3, $4, $5)
                    `, [marketId, ptInAssets, theoreticalPrice, deviation, new Date()]);
                    
                    const baseAssetName = market.basePricingAsset?.symbol 
                        || market.accountingAsset?.symbol 
                        || market.sy?.symbol 
                        || 'Asset';
                    
                    successCount++;
                    console.log(`  ✅ ${marketName}`);
                    console.log(`     PT: ${ptInAssets.toFixed(4)} ${baseAssetName} ($${ptPriceUSD.toFixed(4)}) | Fixed APY: ${fixedAPY.toFixed(2)}% | Implied APY: ${impliedAPY.toFixed(2)}% | Days: ${daysToMaturity}`);
                } else {
                    skippedCount++;
                }
            } catch (error) {
                console.error(`❌ Error:`, error.message);
                errorCount++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`\n✅ Sync complete: ${successCount} success, ${errorCount} errors, ${skippedCount} skipped\n`);
        
    } catch (error) {
        console.error('❌ Price sync failed:', error);
    }
}

function startPriceSyncJob() {
    console.log('🚀 Starting automated price sync job (runs every hour)');
    syncPrices();
    cron.schedule('0 * * * *', () => {
        console.log('⏰ Hourly sync triggered');
        syncPrices();
    });
}

async function triggerManualSync() {
    console.log('🔧 Manual sync triggered');
    await syncPrices();
}

module.exports = {
    startPriceSyncJob,
    triggerManualSync,
    syncPrices
};
