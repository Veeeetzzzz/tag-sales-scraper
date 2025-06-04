// Card matching service
const fs = require('fs').promises;
const path = require('path');

class CardMatcher {
  constructor() {
    this.cards = [];
    this.sets = {};
    this.initialized = false;
  }

  async loadCards() {
    if (this.initialized) return;
    
    try {
      const cardsDir = path.join(process.cwd(), 'data', 'cards');
      const files = await fs.readdir(cardsDir);
      
      // Load all JSON files in the cards directory
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(cardsDir, file);
          const fileData = await fs.readFile(filePath, 'utf8');
          const cardDatabase = JSON.parse(fileData);
          
          if (cardDatabase.cards && Array.isArray(cardDatabase.cards)) {
            // Store set info
            const setKey = file.replace('.json', '');
            this.sets[setKey] = {
              ...cardDatabase.setInfo,
              cards: cardDatabase.cards,
              fileName: file
            };
            
            // Add cards to main array for matching
            this.cards.push(...cardDatabase.cards);
          }
        } catch (error) {
          console.error(`Error loading ${file}:`, error);
        }
      }
      
      this.initialized = true;
      console.log(`Loaded ${this.cards.length} cards from ${Object.keys(this.sets).length} sets for matching`);
    } catch (error) {
      console.error('Error loading card database:', error);
      this.cards = [];
      this.sets = {};
    }
  }

  // Get all available sets
  async getSets() {
    await this.loadCards();
    return this.sets;
  }

  // Get specific set
  async getSet(setKey) {
    await this.loadCards();
    return this.sets[setKey] || null;
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

    // Check each matching keyword - safely handle missing matchingKeywords
    const keywords = card.matchingKeywords || [];
    for (const keyword of keywords) {
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
    if (card.setCode && title.includes(card.setCode.toLowerCase())) {
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
    const keywords = card.matchingKeywords || [];
    for (const keyword of keywords) {
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
    const matcher = new CardMatcher();
    
    if (req.method === 'GET') {
      // Return all sets information
      const { set } = req.query;
      
      if (set) {
        // Get specific set
        const setData = await matcher.getSet(set);
        if (!setData) {
          return res.status(404).json({ error: 'Set not found' });
        }
        res.status(200).json({
          success: true,
          set: setData,
          timestamp: new Date().toISOString()
        });
      } else {
        // Get all sets
        const sets = await matcher.getSets();
        res.status(200).json({
          success: true,
          sets: sets,
          setCount: Object.keys(sets).length,
          totalCards: Object.values(sets).reduce((sum, set) => sum + set.cards.length, 0),
          timestamp: new Date().toISOString()
        });
      }
    } else if (req.method === 'POST') {
      // Existing card matching functionality
      const { sales } = req.body;
      
      if (!sales || !Array.isArray(sales)) {
        return res.status(400).json({ error: 'Sales data required' });
      }

      const result = await matcher.groupSalesByCard(sales);
      
      res.status(200).json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Error in card matcher:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message
    });
  }
} 