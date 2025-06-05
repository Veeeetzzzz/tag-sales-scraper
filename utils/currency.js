// Currency conversion utilities

// Exchange rates (GBP as base currency)
// In production, these would be fetched from a real API
const EXCHANGE_RATES = {
  GBP: 1.0,
  USD: 1.27  // 1 GBP = 1.27 USD (approximate)
};

// Currency symbols and formatting
const CURRENCY_CONFIG = {
  GBP: {
    symbol: '£',
    code: 'GBP',
    name: 'British Pound',
    locale: 'en-GB'
  },
  USD: {
    symbol: '$',
    code: 'USD', 
    name: 'US Dollar',
    locale: 'en-US'
  }
};

/**
 * Convert price from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code (GBP/USD)
 * @param {string} toCurrency - Target currency code (GBP/USD)
 * @returns {number} Converted amount
 */
export function convertCurrency(amount, fromCurrency = 'GBP', toCurrency = 'GBP') {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to GBP first (base currency)
  const gbpAmount = amount / EXCHANGE_RATES[fromCurrency];
  
  // Then convert to target currency
  return gbpAmount * EXCHANGE_RATES[toCurrency];
}

/**
 * Format price with currency symbol and locale
 * @param {number} price - Price to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
export function formatPrice(price, currency = 'GBP') {
  const config = CURRENCY_CONFIG[currency];
  if (!config) return `${price}`;
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Parse price string and extract numeric value
 * @param {string} priceString - Price string like "£25.99" or "$32.99"
 * @returns {number} Numeric price value
 */
export function parsePrice(priceString) {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  // Remove currency symbols, commas, and spaces
  const cleaned = priceString.replace(/[£$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Detect currency from price string
 * @param {string} priceString - Price string
 * @returns {string} Currency code (GBP or USD)
 */
export function detectCurrency(priceString) {
  if (!priceString) return 'GBP';
  if (priceString.includes('$')) return 'USD';
  if (priceString.includes('£')) return 'GBP';
  return 'GBP'; // Default to GBP
}

/**
 * Convert and format price to target currency
 * @param {string|number} price - Original price
 * @param {string} targetCurrency - Target currency code
 * @param {string} sourceCurrency - Source currency code (auto-detected if not provided)
 * @returns {string} Formatted price in target currency
 */
export function convertAndFormatPrice(price, targetCurrency = 'GBP', sourceCurrency = null) {
  const numericPrice = parsePrice(price);
  if (numericPrice === 0) return formatPrice(0, targetCurrency);
  
  const fromCurrency = sourceCurrency || detectCurrency(price);
  const convertedPrice = convertCurrency(numericPrice, fromCurrency, targetCurrency);
  
  return formatPrice(convertedPrice, targetCurrency);
}

/**
 * Get currency configuration
 * @param {string} currency - Currency code
 * @returns {object} Currency configuration
 */
export function getCurrencyConfig(currency) {
  return CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.GBP;
}

/**
 * Get available currencies
 * @returns {array} Array of currency objects
 */
export function getAvailableCurrencies() {
  return Object.keys(CURRENCY_CONFIG).map(code => ({
    code,
    ...CURRENCY_CONFIG[code]
  }));
}

/**
 * Update exchange rates (for future real-time updates)
 * @param {object} newRates - New exchange rates object
 */
export function updateExchangeRates(newRates) {
  Object.assign(EXCHANGE_RATES, newRates);
}

/**
 * Fetch current exchange rates from API
 * @returns {Promise<object>} Exchange rates object
 */
export async function fetchCurrentExchangeRates() {
  try {
    const response = await fetch('/api/exchange-rates');
    const data = await response.json();
    
    if (data.success && data.rates) {
      updateExchangeRates(data.rates);
      return data.rates;
    }
    
    throw new Error('Invalid response from exchange rate API');
  } catch (error) {
    console.warn('Failed to fetch current exchange rates, using cached rates:', error);
    return EXCHANGE_RATES;
  }
}

/**
 * Get current exchange rates (cached)
 * @returns {object} Current exchange rates
 */
export function getCurrentExchangeRates() {
  return { ...EXCHANGE_RATES };
}

export default {
  convertCurrency,
  formatPrice,
  parsePrice,
  detectCurrency,
  convertAndFormatPrice,
  getCurrencyConfig,
  getAvailableCurrencies,
  updateExchangeRates,
  fetchCurrentExchangeRates,
  getCurrentExchangeRates
}; 