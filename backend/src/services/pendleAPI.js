const axios = require('axios');

const PENDLE_API = process.env.PENDLE_API_BASE;

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
            
            // Try the correct endpoint structure
            const response = await axios.get(
                `${PENDLE_API}/v1/${chainId}/markets`,
                { 
                    timeout: 15000,
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            
            // Handle different response structures
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
            
            // Add chain info to each market
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

// Helper function to safely extract numeric value
function extractNumericValue(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'object' && value !== null) {
        // Try to extract from object (e.g., {usd: 123, acc: 456})
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
        // Try fetching market data which should include prices
        const response = await axios.get(
            `${PENDLE_API}/v1/${chainId}/markets/${marketAddress}`,
            { 
                timeout: 10000,
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        // Extract price data from response
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
    CHAINS
};
