// Card matching service
const fs = require('fs').promises;
const path = require('path');

class CardMatcher {
  constructor() {
    this.cards = [];
    this.initialized = false;
  }

  async loadCards() {
    if (this.initialized) return;
    
    try {
      const cardsPath = path.join(process.cwd(), 'data', 'cards', 'tag-team-cards.json');
      const cardsData = await fs.readFile(cardsPath, 'utf8');
      const cardDatabase = JSON.parse(cardsData);
      this.cards = cardDatabase.cards;
      this.initialized = true;
      console.log(`Loaded ${this.cards.length} cards for matching`);
    } catch (error) {
      console.error('Error loading card database:', error);
      this.cards = [];
    }
  }

  // Fuzzy matching algorithm
  matchCard(saleTitle) {
    const normalizedTitle = saleTitle.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;

    for (const card of this.cards) {
      const score = this.calculateMatchScore(normalizedTitle, card);
      if (score > bestScore && score > 0.6) { // 60% confidence threshold
        bestScore = score;
        bestMatch = {
          card,
          confidence: score,
          matchedKeywords: this.getMatchedKeywords(normalizedTitle, card)
        };
      }
    }

    return bestMatch;
  }

  calculateMatchScore(title, card) {
    let score = 0;
    let maxPossibleScore = 0;

    // Check each matching keyword
    for (const keyword of card.matchingKeywords) {
      const normalizedKeyword = keyword.toLowerCase();
      maxPossibleScore += 1;

      if (title.includes(normalizedKeyword)) {
        // Exact match gets full points
        score += 1;
      } else {
        // Partial match using fuzzy logic
        const partialScore = this.fuzzyMatch(title, normalizedKeyword);
        score += partialScore;
      }
    }

    // Bonus for card name match
    const cardNameScore = this.fuzzyMatch(title, card.name.toLowerCase());
    score += cardNameScore * 2; // Weight card name higher
    maxPossibleScore += 2;

    // Bonus for set code match
    if (title.includes(card.setCode.toLowerCase())) {
      score += 0.5;
    }
    maxPossibleScore += 0.5;

    return maxPossibleScore > 0 ? score / maxPossibleScore : 0;
  }

  fuzzyMatch(text, pattern) {
    const words = pattern.split(' ');
    let matchedWords = 0;

    for (const word of words) {
      if (text.includes(word)) {
        matchedWords++;
      }
    }

    return words.length > 0 ? matchedWords / words.length : 0;
  }

  getMatchedKeywords(title, card) {
    const matched = [];
    for (const keyword of card.matchingKeywords) {
      if (title.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    }
    return matched;
  }

  // Detect variant from title
  detectVariant(title) {
    const normalizedTitle = title.toLowerCase();
    
    if (normalizedTitle.includes('rainbow') || normalizedTitle.includes('secret')) {
      return 'Rainbow Rare';
    }
    if (normalizedTitle.includes('full art') || normalizedTitle.includes('alt art')) {
      return 'Full Art';
    }
    return 'Regular';
  }

  // Group sales by card
  async groupSalesByCard(sales) {
    await this.loadCards();
    
    const cardSales = {};
    const unmatchedSales = [];

    for (const sale of sales) {
      const match = this.matchCard(sale.title);
      
      if (match) {
        const cardId = match.card.id;
        const variant = this.detectVariant(sale.title);
        
        if (!cardSales[cardId]) {
          cardSales[cardId] = {
            card: match.card,
            sales: [],
            variants: {}
          };
        }
        
        // Add to overall sales
        cardSales[cardId].sales.push({
          ...sale,
          matchConfidence: match.confidence,
          matchedKeywords: match.matchedKeywords,
          detectedVariant: variant
        });

        // Group by variant
        if (!cardSales[cardId].variants[variant]) {
          cardSales[cardId].variants[variant] = [];
        }
        cardSales[cardId].variants[variant].push(sale);
        
      } else {
        unmatchedSales.push(sale);
      }
    }

    // Calculate statistics for each card
    Object.keys(cardSales).forEach(cardId => {
      const cardData = cardSales[cardId];
      cardData.stats = this.calculateCardStats(cardData.sales);
      
      // Calculate variant stats
      Object.keys(cardData.variants).forEach(variant => {
        cardData.variants[variant + '_stats'] = this.calculateCardStats(cardData.variants[variant]);
      });
    });

    return {
      cardSales,
      unmatchedSales,
      totalMatched: Object.values(cardSales).reduce((sum, card) => sum + card.sales.length, 0),
      totalUnmatched: unmatchedSales.length
    };
  }

  calculateCardStats(sales) {
    if (sales.length === 0) return null;

    const prices = sales.map(sale => {
      const priceStr = sale.price.replace(/[£$,]/g, '');
      return parseFloat(priceStr) || 0;
    }).filter(price => price > 0);

    if (prices.length === 0) return null;

    const sorted = prices.sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);

    return {
      count: sales.length,
      averagePrice: sum / prices.length,
      medianPrice: sorted[Math.floor(sorted.length / 2)],
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      priceRange: Math.max(...prices) - Math.min(...prices),
      lastSale: sales[0] // Assuming sales are ordered by date
    };
  }
}

// API endpoint
export default async function handler(req, res) {
  try {
    const { sales } = req.body;
    
    if (!sales || !Array.isArray(sales)) {
      return res.status(400).json({ error: 'Sales data required' });
    }

    const matcher = new CardMatcher();
    const result = await matcher.groupSalesByCard(sales);
    
    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in card matcher:', error);
    res.status(500).json({ 
      error: 'Failed to match cards',
      message: error.message
    });
  }
} 