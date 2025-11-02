const cron = require('node-cron');
const pool = require('../config/database');

/**
 * MODULE: dailyUtcSnapshot.js
 * 
 * PURPOSE: Creates one price snapshot per market per day at exactly 12:00:00 UTC
 * in the daily_price_snapshots_utc table
 * 
 * IMPORTS: 
 *   - node-cron (scheduling)
 *   - database.js (pool for direct queries)
 * 
 * EXPORTS:
 *   - createDailySnapshot(forced = false) - Main logic, optional force parameter
 *   - startDailyUtcSnapshotCron() - Starts the cron job
 * 
 * EXPORTS TO:
 *   - server.js (calls startDailyUtcSnapshotCron() on startup)
 * 
 * LINKAGE:
 *   - INPUT: price_snapshots table (reads latest snapshot per market as of 12 AM UTC)
 *   - OUTPUT: daily_price_snapshots_utc table (writes one snapshot per market per day)
 */

async function createDailySnapshot(forced = false) {
  console.log(`\n📅 [${new Date().toISOString()}] Starting daily UTC snapshot creation${forced ? ' (FORCED)' : ''}`);
  
  try {
    // Get today's date in UTC
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const snapshotDate = utcDate.toISOString().split('T')[0];  // YYYY-MM-DD
    
    // 12 AM UTC timestamp for today
    const snapshotTime = new Date(`${snapshotDate}T12:00:00Z`);
    
    console.log(`📍 Snapshot date: ${snapshotDate} (12:00:00 UTC)`);
    
    // Query: Get all markets
    const marketsResult = await pool.query('SELECT id, name FROM markets ORDER BY id');
    const markets = marketsResult.rows;
    
    console.log(`📊 Found ${markets.length} markets to process`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each market
    for (const market of markets) {
      try {
        // Get latest price_snapshot as of 12 AM UTC today
        const priceQuery = `
          SELECT 
            ps.pt_price,
            ps.pt_price_usd,
            ps.yt_price,
            ps.theoretical_pt_price,
            ps.implied_apy,
            ps.fixed_apy,
            ps.liquidity,
            ps.timestamp
          FROM price_snapshots ps
          WHERE ps.market_id = $1
          AND ps.timestamp <= $2::timestamp AT TIME ZONE 'UTC'
          ORDER BY ps.timestamp DESC
          LIMIT 1
        `;
        
        const priceResult = await pool.query(priceQuery, [market.id, snapshotTime]);
        
        // If no price data for this market, skip
        if (priceResult.rows.length === 0) {
          skipped++;
          continue;
        }
        
        const priceData = priceResult.rows[0];
        
        // Check if daily snapshot already exists for this market today
        const existsQuery = `
          SELECT id FROM daily_price_snapshots_utc
          WHERE market_id = $1 AND snapshot_date = $2
        `;
        
        const existsResult = await pool.query(existsQuery, [market.id, snapshotDate]);
        
        if (existsResult.rows.length > 0) {
          // UPDATE existing record
          const updateQuery = `
            UPDATE daily_price_snapshots_utc
            SET 
              pt_price = $1,
              pt_price_usd = $2,
              yt_price = $3,
              theoretical_price = $4,
              implied_apy = $5,
              fixed_apy = $6,
              liquidity = $7,
              updated_at = CURRENT_TIMESTAMP
            WHERE market_id = $8 AND snapshot_date = $9
            RETURNING id
          `;
          
          await pool.query(updateQuery, [
            priceData.pt_price,
            priceData.pt_price_usd,
            priceData.yt_price,
            priceData.theoretical_pt_price,
            priceData.implied_apy,
            priceData.fixed_apy,
            priceData.liquidity,
            market.id,
            snapshotDate
          ]);
          
          updated++;
        } else {
          // INSERT new record
          const insertQuery = `
            INSERT INTO daily_price_snapshots_utc (
              market_id,
              snapshot_date,
              snapshot_time,
              pt_price,
              pt_price_usd,
              yt_price,
              theoretical_price,
              implied_apy,
              fixed_apy,
              liquidity,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
          `;
          
          await pool.query(insertQuery, [
            market.id,
            snapshotDate,
            snapshotTime,
            priceData.pt_price,
            priceData.pt_price_usd,
            priceData.yt_price,
            priceData.theoretical_pt_price,
            priceData.implied_apy,
            priceData.fixed_apy,
            priceData.liquidity
          ]);
          
          created++;
        }
      } catch (error) {
        console.error(`❌ Error processing market ${market.id} (${market.name}):`, error.message);
        errors++;
      }
    }
    
    console.log(`\n✅ Daily snapshot complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    if (errors > 0) console.log(`   Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Critical error in createDailySnapshot:', error);
    throw error;
  }
}

function startDailyUtcSnapshotCron() {
  console.log('🚀 Starting Daily UTC Snapshot Cron Job');
  console.log('   Schedule: Every day at 12:00:00 UTC');
  console.log('   Next run: Tomorrow at 12 AM UTC\n');
  
  // Run immediately on startup (optional - comment out if not wanted)
  // createDailySnapshot(true).catch(console.error);
  
  // Schedule: Run every day at 12 AM UTC
  // Cron: 0 0 * * * (minute hour day month weekday)
  // This runs at 00:00 UTC every day
  cron.schedule('0 0 * * *', async () => {
    try {
      await createDailySnapshot();
    } catch (error) {
      console.error('❌ Daily snapshot cron job failed:', error.message);
    }
  });
}

module.exports = {
  createDailySnapshot,
  startDailyUtcSnapshotCron
};
