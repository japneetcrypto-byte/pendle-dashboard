const API_BASE_URL = 'http://localhost:3001/api';

export interface Market {
  id: number;
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  underlyingAsset: string;
  maturity: string;
  daysToMaturity: number;
  ptPrice: number;
  ptPriceUSD: number;  // ✅ ADD THIS
  ytPrice: number;
  theoreticalPrice: number;
  impliedAPY: number;
  fixedAPY: number;
  deviation: number;
  change24h: number;
  lastUpdated: string;
}

// Convert string values to numbers safely
function parseMarket(market: any): Market {
  return {
    id: market.id || 0,
    chainId: market.chainId || market.chain_id || 0,
    address: market.address || market.market_address || '',
    name: market.name || '',
    symbol: market.symbol || '',
    underlyingAsset: market.underlyingAsset || market.underlying_asset || '',
    maturity: market.maturity || '',
    daysToMaturity: parseInt(market.daysToMaturity) || 0,
    ptPrice: parseFloat(market.ptPrice) || 0,
    ptPriceUSD: parseFloat(market.ptPriceUSD) || 0,  // ✅ ADD THIS
    ytPrice: parseFloat(market.ytPrice) || 0,
    theoreticalPrice: parseFloat(market.theoreticalPrice) || 0,
    impliedAPY: parseFloat(market.impliedAPY) || 0,
    fixedAPY: parseFloat(market.fixedAPY) || 0,
    deviation: parseFloat(market.deviation) || 0,
    change24h: parseFloat(market.change24h) || 0,
    lastUpdated: market.lastUpdated || '',
  };
}

export async function fetchMarkets(): Promise<Market[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/markets`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const data = await response.json();
    console.log('Raw API response:', data);
    return (data.markets || []).map(parseMarket);
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

export async function fetchMarketDetail(address: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/markets/${address}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const data = await response.json();
    return {
      ...data,
      market: data.market ? parseMarket(data.market) : null,
    };
  } catch (error) {
    console.error('Error fetching market detail:', error);
    return null;
  }
}

export async function fetchDeviations(address: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/markets/${address}/deviations`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching deviations:', error);
    return null;
  }
}
