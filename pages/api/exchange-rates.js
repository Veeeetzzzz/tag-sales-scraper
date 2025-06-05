// API endpoint to fetch current exchange rates
// This is a simple implementation that could be enhanced with real API calls

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In a real implementation, you would fetch from a currency API like:
    // - https://api.exchangerate-api.com/v4/latest/GBP
    // - https://api.fixer.io/latest?base=GBP
    // - https://openexchangerates.org/api/latest.json
    
    // For now, return static rates with some variation to simulate real data
    const baseRates = {
      GBP: 1.0,
      USD: 1.27
    };
    
    // Add small random variation (±2%) to simulate real exchange rate fluctuations
    const variation = 0.02;
    const rates = {};
    
    Object.keys(baseRates).forEach(currency => {
      if (currency === 'GBP') {
        rates[currency] = 1.0; // Base currency
      } else {
        const baseRate = baseRates[currency];
        const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;
        rates[currency] = Number((baseRate * randomFactor).toFixed(4));
      }
    });

    res.status(200).json({
      success: true,
      base: 'GBP',
      rates,
      timestamp: new Date().toISOString(),
      // Add some metadata
      source: 'simulated', // In production: 'exchangerate-api', 'fixer', etc.
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch exchange rates',
      // Fallback rates
      rates: {
        GBP: 1.0,
        USD: 1.27
      }
    });
  }
}

// Example of how to integrate with a real API:
/*
async function fetchRealExchangeRates() {
  const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
  const response = await fetch(`https://api.exchangerate-api.com/v4/latest/GBP`);
  const data = await response.json();
  
  return {
    GBP: 1.0,
    USD: data.rates.USD
  };
}
*/ 