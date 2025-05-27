import fs from 'fs';
import path from 'path';

// Simple string similarity function for matching sales to cards
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  // Simple word matching approach
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matches = 0;
  for (const word1 of words1) {
    if (word1.length > 2) { // Only consider words longer than 2 characters
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches++;
          break;
        }
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

// Match sales data to cards
function matchSalesToCards(cards, salesData) {
  const cardsWithSales = cards.map(card => {
    const matchingSales = [];
    
    if (salesData && salesData.items) {
      for (const sale of salesData.items) {
        const similarity = calculateSimilarity(card.name, sale.title);
        
        // Also check for TAG TEAM specific matching
        const isTagTeam = card.subtype === 'TAG TEAM';
        const saleHasTagTeam = sale.title.toLowerCase().includes('tag team') || 
                              sale.title.toLowerCase().includes('tag') ||
                              sale.title.toLowerCase().includes('&');
        
        // Higher threshold for TAG TEAM cards
        const threshold = isTagTeam ? 0.3 : 0.4;
        
        if (similarity > threshold && (!isTagTeam || saleHasTagTeam)) {
          const price = parseFloat(sale.price.replace(/[£$,]/g, '')) || 0;
          if (price > 0) {
            matchingSales.push({
              title: sale.title,
              price: price,
              soldDate: sale.soldDate || sale.soldInfo,
              listingUrl: sale.listingUrl,
              similarity: similarity
            });
          }
        }
      }
    }
    
    // Sort by similarity and price
    matchingSales.sort((a, b) => b.similarity - a.similarity);
    
    // Calculate price statistics
    const prices = matchingSales.map(sale => sale.price);
    const priceStats = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      count: prices.length
    } : {
      min: 0,
      max: 0,
      average: 0,
      count: 0
    };
    
    return {
      ...card,
      recentSales: matchingSales.slice(0, 10), // Keep top 10 matches
      priceStats,
      lastSold: matchingSales.length > 0 ? matchingSales[0].soldDate : null
    };
  });
  
  return cardsWithSales;
}

export default async function handler(req, res) {
  try {
    // Load card database
    const dataPath = path.join(process.cwd(), 'data', 'cards', 'destined-rivals.json');
    const cardData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Optionally fetch recent sales data to match against cards
    let salesData = null;
    if (req.query.includeSales === 'true') {
      try {
        // Fetch from our eBay API
        const salesResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/ebay`);
        if (salesResponse.ok) {
          salesData = await salesResponse.json();
        }
      } catch (error) {
        console.log('Could not fetch sales data:', error.message);
      }
    }
    
    // Match sales to cards if sales data is available
    const cardsWithSales = salesData ? 
      matchSalesToCards(cardData.cards, salesData) : 
      cardData.cards.map(card => ({
        ...card,
        recentSales: [],
        priceStats: { min: 0, max: 0, average: 0, count: 0 },
        lastSold: null
      }));
    
    res.setHeader('Cache-Control', 's-maxage=300'); // Cache for 5 minutes
    res.status(200).json({
      setInfo: cardData.setInfo,
      cards: cardsWithSales,
      totalCards: cardsWithSales.length,
      salesMatched: salesData ? true : false
    });
    
  } catch (error) {
    console.error('Error loading card data:', error);
    res.status(500).json({ 
      error: 'Failed to load card data', 
      message: error.message 
    });
  }
} 