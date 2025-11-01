const axios = require('axios');
const pool = require('../config/database');

const PENDLE_API_BASE = 'https://api-v2.pendle.finance/core';

async function fetchMarketHistoricalData(chainId, marketAddress) {
    try {
        const response = await axios.get(
            `${PENDLE_API_BASE}/v1/${chainId}/markets/${marketAddress}/historical-data`,
            {
                timeout: 30000,
                headers: { 'Accept': 'application/json' }
            }
        );

        const data = response.data;
        
        // Combine timestamps with APY data
        const records = [];
        for (let i = 0; i < data.timestamp.length; i++) {
            records.push({
                timestamp: new Date(data.timestamp[i] * 1000),
                impliedApy: (parseFloat(data.impliedApy[i]) || 0),  // ✅ Already in decimal form
                baseApy: parseFloat(data.baseApy[i]) || 0,
                maxApy: parseFloat(data.maxApy[i]) || 0,
                tvl: parseFloat(data.tvl[i]) || 0,
                underlyingApy: parseFloat(data.underlyingApy[i]) || 0
            });
        }
        
        return records;
    } catch (error) {
        console.error(`Error fetching historical data for ${marketAddress}:`, error.message);
        return [];
    }
}

async function backfillHistoricalData() {
    try {
        console.log('📊 Starting historical data backfill from Pendle API...\n');
        
        // Get all active markets
        const marketsResult = await pool.query(`
            SELECT id, name, market_address, chain_id, maturity
            FROM markets 
            WHERE market_address IS NOT NULL
            AND maturity > NOW()
            ORDER BY name
        `);
        const markets = marketsResult.rows;
        
        let totalInserted = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        let skipped = 0;
        
        for (const market of markets) {
            try {
                console.log(`📥 Fetching history: ${market.name} (${market.market_address.slice(0, 10)}...)`);
                
                const historicalData = await fetchMarketHistoricalData(
                    market.chain_id,
                    market.market_address
                );
                
                if (historicalData.length === 0) {
                    console.log(`⚠️  No data found\n`);
                    skipped++;
                    continue;
                }
                
                // Update historical records with correct implied APY
                let inserted = 0;
                let updated = 0;
                let recordSkipped = 0;
                
                for (const record of historicalData) {
                    try {
                        // ✅ Convert implied APY to percentage (multiply by 100)
                        const impliedAPYPercent = record.impliedApy * 100;
                        
                        // Calculate days to maturity
                        const daysToMaturity = Math.max(1, Math.ceil(
                            (market.maturity - record.timestamp) / (1000 * 60 * 60 * 24)
                        ));
                        
                        // ✅ Calculate PT price from implied APY
                        // Formula: PT = 1 / (1 + APY)^(days/365)
                        const ptPrice = 1 / Math.pow(
                            1 + (record.impliedApy), 
                            daysToMaturity / 365
                        );
                        const ytPrice = 1 - ptPrice;
                        
                        // Try to update first
                        const updateResult = await pool.query(`
                            UPDATE price_snapshots
                            SET 
                                implied_apy = $1,
                                fixed_apy = $2,
                                liquidity = $3,
                                pt_price = $4,
                                yt_price = $5
                            WHERE market_id = $6
                            AND DATE_TRUNC('hour', timestamp AT TIME ZONE 'UTC') = DATE_TRUNC('hour', $7::timestamp AT TIME ZONE 'UTC')
                        `, [
                            impliedAPYPercent,
                            record.baseApy * 100,
                            record.tvl,
                            ptPrice,
                            ytPrice,
                            market.id,
                            record.timestamp
                        ]);
                        
                        if (updateResult.rowCount > 0) {
                            updated++;
                        } else {
                            // Insert if doesn't exist
                            await pool.query(`
                                INSERT INTO price_snapshots (
                                    market_id, 
                                    implied_apy, 
                                    fixed_apy, 
                                    liquidity,
                                    pt_price,
                                    yt_price,
                                    timestamp
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                            `, [
                                market.id,
                                impliedAPYPercent,
                                record.baseApy * 100,
                                record.tvl,
                                ptPrice,
                                ytPrice,
                                record.timestamp
                            ]);
                            inserted++;
                        }
                    } catch (error) {
                        recordSkipped++;
                    }
                }
                
                totalInserted += inserted;
                totalUpdated += updated;
                totalSkipped += recordSkipped;
                console.log(`  ✅ Inserted ${inserted} | Updated ${updated} records (${recordSkipped} skipped)\n`);
                
                // Rate limit API
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`❌ Error: ${error.message}\n`);
                skipped++;
            }
        }
        
        console.log(`\n✅ Backfill complete:`);
        console.log(`   - Total inserted: ${totalInserted}`);
        console.log(`   - Total updated: ${totalUpdated}`);
        console.log(`   - Total skipped: ${totalSkipped}`);
        console.log(`   - Markets skipped: ${skipped}\n`);
    } catch (error) {
        console.error('❌ Backfill failed:', error);
    }
}

module.exports = { backfillHistoricalData, fetchMarketHistoricalData };
