// Calculate theoretical PT price based on time to maturity
// PT should converge to 1.0 as it approaches expiry
function calculateTheoreticalPrice(maturityDate, impliedAPY, currentPTPrice) {
    const now = new Date();
    const maturity = new Date(maturityDate);
    const daysToMaturity = (maturity - now) / (1000 * 60 * 60 * 24);
    
    // If already expired, PT = 1.0
    if (daysToMaturity <= 0) {
        return 1.0;
    }
    
    // Formula: Theoretical Price = 1 / (1 + impliedAPY * (days/365))
    const yearsToMaturity = daysToMaturity / 365;
    const theoreticalPrice = 1 / (1 + (impliedAPY / 100) * yearsToMaturity);
    
    return parseFloat(theoreticalPrice.toFixed(8));
}

// Calculate deviation percentage
function calculateDeviation(actualPrice, theoreticalPrice) {
    if (!theoreticalPrice || theoreticalPrice === 0) {
        return 0;
    }
    
    const deviation = ((actualPrice - theoreticalPrice) / theoreticalPrice) * 100;
    return parseFloat(deviation.toFixed(4));
}

// Calculate Z-score (for mean reversion signals)
// Z-score shows how many standard deviations away from mean
function calculateZScore(value, mean, stdDev) {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
}

// Get days remaining to maturity
// Get days remaining to maturity - adjusted to match Pendle UI format
function getDaysToMaturity(maturityDate) {
    const now = new Date();
    const maturity = new Date(maturityDate);
    
    // Subtract 1 day to match Pendle UI format
    const days = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24)) - 1;
    return Math.max(0, days);
}
// Calculate implied APY from PT price
// Formula: ((1/PT_Price) - 1) * (365/Days_to_expiry)
function calculateImpliedAPY(ptPrice, daysToMaturity) {
    if (!ptPrice || ptPrice === 0 || daysToMaturity <= 0) {
        return 0;
    }
    
    const apy = ((1 / ptPrice) - 1) * (365 / daysToMaturity);
    return parseFloat((apy * 100).toFixed(4)); // Return as percentage
}
module.exports = {
    calculateTheoreticalPrice,
    calculateDeviation,
    calculateZScore,
    getDaysToMaturity,
    calculateImpliedAPY
};
