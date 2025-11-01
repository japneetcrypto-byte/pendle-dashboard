const express = require('express');
const router = express.Router();
const { getAllMarketsFromDB, getMarketByAddress } = require('../models/Market');
const { getDaysToMaturity, calculateDeviation } = require('../utils/calculations');
const pool = require('../config/database');


// Helper function to calculate 24h change
async function calculate24hChange(marketId, currentPrice) {
  try {
    const query24h = `
      SELECT pt_price
      FROM price_snapshots
      WHERE market_id = $1 
      AND timestamp <= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const result24h = await pool.query(query24h, [marketId]);
    
    if (result24h.rows.length > 0) {
      const price24hAgo = parseFloat(result24h.rows[0].pt_price);
      
      if (price24hAgo === 0) {
        return 0;
      }
      
      const change = ((currentPrice - price24hAgo) / price24hAgo) * 100;
      return parseFloat(change.toFixed(2));
    }
    
    const queryOldest = `
      SELECT pt_price
      FROM price_snapshots
      WHERE market_id = $1
      ORDER BY timestamp ASC
      LIMIT 1
    `;
    
    const resultOldest = await pool.query(queryOldest, [marketId]);
    
    if (resultOldest.rows.length === 0) {
      return 0;
    }
    
    const oldestPrice = parseFloat(resultOldest.rows[0].pt_price);
    
    if (oldestPrice === 0) {
      return 0;
    }
    
    const change = ((currentPrice - oldestPrice) / oldestPrice) * 100;
    return parseFloat(change.toFixed(2));
    
  } catch (error) {
    console.error('Error calculating 24h change:', error);
    return 0;
  }
}


// GET /api/markets - Returns all markets with latest prices and 24h change
router.get('/', async (req, res) => {
  try {
    const markets = await getAllMarketsFromDB();
    
    // Add calculated fields for each market
    const enrichedMarkets = await Promise.all(markets.map(async (market) => {
      const daysToMaturity = getDaysToMaturity(market.maturity);
      const deviation = market.pt_price && market.theoretical_pt_price 
        ? calculateDeviation(parseFloat(market.pt_price), parseFloat(market.theoretical_pt_price))
        : 0;
      
      // Calculate 24h change
      const change24h = await calculate24hChange(market.id, parseFloat(market.pt_price));
      
      return {
        id: market.id,
        chainId: market.chain_id,
        address: market.market_address,
        name: market.name,
        symbol: market.symbol,
        underlyingAsset: market.underlying_asset,
        maturity: market.maturity,
        daysToMaturity: daysToMaturity,
        ptPrice: parseFloat(market.pt_price),
        ptPriceUSD: parseFloat(market.pt_price_usd) || 0,
        ytPrice: parseFloat(market.yt_price),
        theoreticalPrice: parseFloat(market.theoretical_pt_price),
        impliedAPY: parseFloat(market.implied_apy),
        fixedAPY: parseFloat(market.fixed_apy),
        deviation: parseFloat(deviation),
        change24h: parseFloat(change24h),
        lastUpdated: market.last_updated
      };
    }));
    
    res.json({
      success: true,
      count: enrichedMarkets.length,
      markets: enrichedMarkets
    });
  } catch (error) {
    console.error('Error in GET /markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch markets'
    });
  }
});


// GET /api/markets/:address - Returns single market with history
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const market = await getMarketByAddress(address);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    // Get price history for this market
    const historyQuery = `
      SELECT 
        pt_price, pt_price_usd, yt_price, theoretical_pt_price,
        implied_apy, fixed_apy, timestamp
      FROM price_snapshots
      WHERE market_id = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    
    const historyResult = await pool.query(historyQuery, [market.id]);
    
    // Calculate 24h change for detail page
    const change24h = await calculate24hChange(market.id, parseFloat(market.pt_price));
    
    res.json({
      success: true,
      market: {
        ...market,
        daysToMaturity: getDaysToMaturity(market.maturity),
        ptPrice: parseFloat(market.pt_price),
        ptPriceUSD: parseFloat(market.pt_price_usd) || 0,
        ytPrice: parseFloat(market.yt_price),
        theoreticalPrice: parseFloat(market.theoretical_pt_price),
        impliedAPY: parseFloat(market.implied_apy),
        fixedAPY: parseFloat(market.fixed_apy),
        deviation: parseFloat(market.deviation),
        change24h: parseFloat(change24h)
      },
      priceHistory: historyResult.rows
    });
  } catch (error) {
    console.error('Error in GET /markets/:address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market details'
    });
  }
});


// GET /api/markets/:address/deviations - Returns deviation history
router.get('/:address/deviations', async (req, res) => {
  try {
    const { address } = req.params;
    const market = await getMarketByAddress(address);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    const deviationQuery = `
      SELECT 
        actual_price, expected_price, deviation_pct,
        z_score, timestamp
      FROM price_deviations
      WHERE market_id = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    
    const result = await pool.query(deviationQuery, [market.id]);
    
    res.json({
      success: true,
      deviations: result.rows
    });
  } catch (error) {
    console.error('Error in GET deviations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deviation history'
    });
  }
});


module.exports = router;
