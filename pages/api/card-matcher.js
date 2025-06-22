// Card matching service
const fs = require('fs').promises;
const path = require('path');

class CardMatcher {
  constructor() {
    this.cards = [];
    this.sets = {};
    this.initialized = false;
  }

  async loadCards(forceReload = false) {
    if (this.initialized && !forceReload) return;
    
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
      
      // Clear any previous data when force reloading
      if (forceReload) {
        console.log('Force reloaded card database with updated data');
      }
          } catch (error) {
        console.error('Error loading card database:', error);
        this.cards = [];
        this.sets = {};
      }
      
      // Reset state when force reloading to ensure clean state
      if (forceReload) {
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
      if (score > bestScore && score > 0.5) { // 50% confidence threshold for better matching
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

    // Early filter: must contain "pokemon" OR "tag" (for TAG graded cards) to be considered valid
    if (!title.includes('pokemon') && !title.includes('tag')) {
      return 0;
    }

    // Check each matching keyword - but weight them differently
    const keywords = card.matchingKeywords || [];
    let keywordMatches = 0;
    
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      
      if (title.includes(normalizedKeyword)) {
        keywordMatches++;
      }
    }
    
    // Calculate keyword score based on percentage of matches, not total count
    // This prevents dilution from having too many keywords
    const keywordScore = keywords.length > 0 ? keywordMatches / keywords.length : 0;
    score += keywordScore * 2; // Weight keywords moderately
    maxPossibleScore += 2;

    // Bonus for card name match - require more precise matching
    const cardNameWords = card.name.toLowerCase().split(' ');
    let cardNameMatches = 0;
    for (const word of cardNameWords) {
      if (word.length > 2 && title.includes(word)) { // Ignore very short words
        cardNameMatches++;
      }
    }
    const cardNameScore = cardNameWords.length > 0 ? cardNameMatches / cardNameWords.length : 0;
    score += cardNameScore * 4; // Weight card name very high
    maxPossibleScore += 4;

    // Bonus for card number match (very important for Pokemon cards)
    if (card.fullNumber && title.includes(card.fullNumber)) {
      score += 2; // High weight for exact card number match
    } else if (card.cardNumber && title.includes(card.cardNumber + '/')) {
      score += 1.5; // Partial credit for card number without full format
    }
    maxPossibleScore += 2;

    // Bonus for set identification - check multiple variations
    let setMatch = false;
    if (card.setCode && title.includes(card.setCode.toLowerCase())) {
      setMatch = true;
    }
    // Check for set name variations
    if (card.setName) {
      const setNameVariations = [
        card.setName.toLowerCase(),
        card.setName.toLowerCase().replace(/\s+/g, ''),
        card.setName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        card.setName.toLowerCase().replace('&', 'and')
      ];
      
      for (const variation of setNameVariations) {
        if (title.includes(variation)) {
          setMatch = true;
          break;
        }
      }
    }
    
    if (setMatch) {
      score += 1;
    }
    maxPossibleScore += 1;

    // Penalty for mismatched grading companies in title (but not TAG since that's what we're looking for)
    if (title.includes('psa') || title.includes('cgc') || title.includes('bgs')) {
      score *= 0.1; // Heavy penalty for wrong grading company
    }

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
      const { set, action } = req.query;
      
      if (action === 'reload') {
        // Force reload the card database
        await matcher.loadCards(true);
        return res.status(200).json({
          success: true,
          message: 'Card database reloaded successfully',
          timestamp: new Date().toISOString()
        });
      }
      
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