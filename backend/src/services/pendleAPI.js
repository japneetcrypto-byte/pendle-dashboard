const axios = require('axios');

const PENDLE_API = process.env.PENDLE_API_BASE || "https://api-v2.pendle.finance/core";

// Supported blockchain chains
const CHAINS = {
    ETHEREUM: 1,
    ARBITRUM: 42161,
    OPTIMISM: 10,
    BASE: 8453,
    BSC: 56
};

// Fetch all active markets from all chains
async function getAllMarkets() {
    const allMarkets = [];
    
    for (const [chainName, chainId] of Object.entries(CHAINS)) {
        try {
            console.log(`Fetching markets from ${chainName}...`);
            
            const response = await axios.get(
                `${PENDLE_API}/v1/${chainId}/markets`,  // ← This becomes correct now
                { 
                    timeout: 15000,
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            
            let markets = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    markets = response.data;
                } else if (response.data.results) {
                    markets = response.data.results;
                } else if (response.data.markets) {
                    markets = response.data.markets;
                }
            }
            
            const marketsWithChain = markets.map(market => ({
                ...market,
                chainId,
                chainName
            }));
            
            allMarkets.push(...marketsWithChain);
            console.log(`  ✅ Found ${marketsWithChain.length} markets on ${chainName}`);
            
        } catch (error) {
            if (error.response) {
                console.error(`  ❌ ${chainName} Error: ${error.response.status} - ${error.response.statusText}`);
            } else {
                console.error(`  ❌ ${chainName} Error:`, error.message);
            }
        }
    }
    
    return allMarkets;
}

// Get specific market details including PT/YT prices
async function getMarketDetails(chainId, marketAddress) {
    try {
        const response = await axios.get(
            `${PENDLE_API}/v1/${chainId}/markets/${marketAddress}`,
            { 
                timeout: 10000,
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching market ${marketAddress}:`, error.message);
        return null;
    }
}

// ✅ NEW: Fetch historical price data for a market
async function getMarketHistoricalData(chainId, marketAddress, limit = 100) {
    try {
        // Try multiple possible endpoints for historical data
        const endpoints = [
            `${PENDLE_API}/v1/${chainId}/markets/${marketAddress}/history`,
            `${PENDLE_API}/v1/${chainId}/markets/${marketAddress}/prices/history`,
            `${PENDLE_API}/v1/${chainId}/price-history/${marketAddress}`,
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint, {
                    params: { limit, orderBy: 'timestamp', orderDirection: 'desc' },
                    timeout: 10000,
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.data && (Array.isArray(response.data) || response.data.data || response.data.prices)) {
                    console.log(`✅ Historical data found at: ${endpoint}`);
                    return Array.isArray(response.data) ? response.data : (response.data.data || response.data.prices || []);
                }
            } catch (err) {
                // Try next endpoint
                continue;
            }
        }
        
        return [];
    } catch (error) {
        console.error(`Error fetching historical data for ${marketAddress}:`, error.message);
        return [];
    }
}

// ✅ NEW: Fetch historical data for all markets
async function getAllMarketsHistoricalData(limit = 100) {
    const allHistoricalData = {};
    
    try {
        const markets = await getAllMarkets();
        console.log(`\n📊 Fetching historical data for ${markets.length} markets...\n`);
        
        for (const market of markets) {
            try {
                const marketAddress = market.address || market.marketAddress;
                const chainId = market.chainId;
                
                if (!marketAddress || !chainId) continue;
                
                const historicalData = await getMarketHistoricalData(chainId, marketAddress, limit);
                
                if (historicalData.length > 0) {
                    allHistoricalData[marketAddress] = {
                        chainId,
                        name: market.pt?.proName || market.name,
                        priceHistory: historicalData
                    };
                    console.log(`  ✅ ${market.pt?.proName || market.name}: ${historicalData.length} records`);
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error(`  ❌ Error fetching history for market:`, error.message);
            }
        }
        
        console.log(`\n✅ Historical data fetched for ${Object.keys(allHistoricalData).length} markets`);
        return allHistoricalData;
    } catch (error) {
        console.error('❌ Error fetching all historical data:', error);
        return {};
    }
}

// Helper function to safely extract numeric value
function extractNumericValue(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'object' && value !== null) {
        return value.usd || value.acc || value.value || 0;
    }
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

// Get asset data (underlying, PT, YT prices)
async function getAssetPrices(chainId, marketAddress) {
    try {
        const response = await axios.get(
            `${PENDLE_API}/v1/${chainId}/markets/${marketAddress}`,
            { 
                timeout: 10000,
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        const data = response.data;
        
        return {
            ptPrice: extractNumericValue(data.pt?.price || data.ptPrice),
            ytPrice: extractNumericValue(data.yt?.price || data.ytPrice),
            impliedApy: extractNumericValue(data.impliedApy || data.apy || data.underlyingApy),
            liquidity: extractNumericValue(data.liquidity || data.totalLiquidity)
        };
    } catch (error) {
        console.error(`Error fetching prices for ${marketAddress}:`, error.message);
        return null;
    }
}

module.exports = {
    getAllMarkets,
    getMarketDetails,
    getAssetPrices,
    getMarketHistoricalData,      // ✅ NEW
    getAllMarketsHistoricalData,  // ✅ NEW
    CHAINS
};
