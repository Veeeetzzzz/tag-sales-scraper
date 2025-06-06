import React, { useEffect, useState } from "react";
import Footer from '../components/Footer';
import CurrencySelector from '../components/CurrencySelector';
import SEOHead from '../components/SEOHead';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatPrice, convertCurrency } from '../utils/currency';

export default function Cards() {
  const [allSales, setAllSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [cardSales, setCardSales] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unmatchedSales, setUnmatchedSales] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const { currency, setCurrency } = useCurrency();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [matchFilter, setMatchFilter] = useState('matched'); // Default to matched only
  const [marketplaceFilter, setMarketplaceFilter] = useState('all'); // all, uk, us
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [currencyOverridden, setCurrencyOverridden] = useState(false);

  // Utility function to get high-quality image URL
  const getHighQualityImageUrl = (originalUrl) => {
    if (!originalUrl) return originalUrl;
    
    // Replace s-l140 with s-l500 for higher quality
    // Also handle other low-res formats
    return originalUrl
      .replace(/s-l140/g, 's-l500')
      .replace(/s-l225/g, 's-l500')
      .replace(/s-l300/g, 's-l500')
      .replace(/\.webp$/g, '.jpg'); // Prefer JPG over WebP for better compatibility
  };

  const fetchCardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from both UK and US marketplaces
      const [ukResponse, usResponse] = await Promise.all([
        fetch('/api/ebay?marketplace=uk'),
        fetch('/api/ebay?marketplace=us')
      ]);
      
      const [ukData, usData] = await Promise.all([
        ukResponse.json(),
        usResponse.json()
      ]);
      
      // Combine sales data from both marketplaces
      const allItems = [];
      
      if (ukData.items && ukData.items.length > 0) {
        ukData.items.forEach(item => {
          allItems.push({
            ...item,
            marketplace: 'uk',
            img: getHighQualityImageUrl(item.img) // Upgrade image quality
          });
        });
      }
      
      if (usData.items && usData.items.length > 0) {
        usData.items.forEach(item => {
          allItems.push({
            ...item,
            marketplace: 'us',
            img: getHighQualityImageUrl(item.img) // Upgrade image quality
          });
        });
      }
      
      if (allItems.length > 0) {
        // Then match cards to sales
        const matchResponse = await fetch('/api/card-matcher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sales: allItems })
        });
        
        const matchData = await matchResponse.json();
        
        if (matchData.success) {
          setCardSales(matchData.cardSales);
          setUnmatchedSales(matchData.unmatchedSales);
          
          // Create a combined array of all sales with match information
          const allSalesWithMatches = [];
          
          // Add matched sales
          Object.values(matchData.cardSales).forEach(cardData => {
            cardData.sales.forEach(sale => {
              allSalesWithMatches.push({
                ...sale,
                matched: true,
                matchedCard: cardData.card,
                matchConfidence: sale.matchConfidence,
                img: getHighQualityImageUrl(sale.img) // Ensure high quality image
              });
            });
          });
          
          // Add unmatched sales
          matchData.unmatchedSales.forEach(sale => {
            allSalesWithMatches.push({
              ...sale,
              matched: false,
              matchedCard: null,
              matchConfidence: 0,
              img: getHighQualityImageUrl(sale.img) // Ensure high quality image
            });
          });
          
          setAllSales(allSalesWithMatches);
          setFilteredSales(allSalesWithMatches);
        } else {
          setError('Failed to match cards to sales');
        }
      } else {
        setError('No sales data available from either marketplace');
      }
    } catch (error) {
      console.error('Error fetching card data:', error);
      setError('Failed to load card data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardData();
  }, []);

  const formatPrice = (price) => {
    return convertAndFormatPrice(price, currency, 'GBP');
  };

  // Handle manual currency change (user override)
  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    setCurrencyOverridden(true);
  };

  // Helper function to parse date from soldInfo
  const parseSoldDate = (soldInfo) => {
    if (!soldInfo) return new Date();
    
    // Try to parse various date formats
    const text = soldInfo.toLowerCase();
    
    // Handle "X days ago", "X hours ago" format
    if (text.includes('ago')) {
      const now = new Date();
      if (text.includes('hour')) {
        const hours = parseInt(text.match(/(\d+)\s*hour/)?.[1]) || 0;
        return new Date(now.getTime() - (hours * 60 * 60 * 1000));
      } else if (text.includes('day')) {
        const days = parseInt(text.match(/(\d+)\s*day/)?.[1]) || 0;
        return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      }
    }
    
    // Handle "DD MMM YYYY" format (e.g., "29 May 2025")
    const dateMatch = soldInfo.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const monthMap = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      const monthNum = monthMap[month.toLowerCase()];
      if (monthNum !== undefined) {
        return new Date(parseInt(year), monthNum, parseInt(day));
      }
    }
    
    // Fallback: try to parse as standard date
    const fallbackDate = new Date(soldInfo);
    return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
  };

  // Sorting function
  const sortSales = (salesToSort, sortType) => {
    const sorted = [...salesToSort];
    
    switch (sortType) {
      case 'newest':
        // Sort by date, newest first
        sorted.sort((a, b) => {
          const dateA = parseSoldDate(a.soldInfo || a.soldDate);
          const dateB = parseSoldDate(b.soldInfo || b.soldDate);
          return dateB.getTime() - dateA.getTime(); // Newest first
        });
        break;
      case 'oldest':
        // Sort by date, oldest first
        sorted.sort((a, b) => {
          const dateA = parseSoldDate(a.soldInfo || a.soldDate);
          const dateB = parseSoldDate(b.soldInfo || b.soldDate);
          return dateA.getTime() - dateB.getTime(); // Oldest first
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[£$,]/g, '')) || 0;
          const priceB = parseFloat(b.price.replace(/[£$,]/g, '')) || 0;
          const fromCurrencyA = a.price.includes('$') ? 'USD' : 'GBP';
          const fromCurrencyB = b.price.includes('$') ? 'USD' : 'GBP';
          const convertedPriceA = convertCurrency(priceA, fromCurrencyA, currency);
          const convertedPriceB = convertCurrency(priceB, fromCurrencyB, currency);
          return convertedPriceB - convertedPriceA;
        });
        break;
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[£$,]/g, '')) || 0;
          const priceB = parseFloat(b.price.replace(/[£$,]/g, '')) || 0;
          const fromCurrencyA = a.price.includes('$') ? 'USD' : 'GBP';
          const fromCurrencyB = b.price.includes('$') ? 'USD' : 'GBP';
          const convertedPriceA = convertCurrency(priceA, fromCurrencyA, currency);
          const convertedPriceB = convertCurrency(priceB, fromCurrencyB, currency);
          return convertedPriceA - convertedPriceB;
        });
        break;
      case 'title-az':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-za':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'confidence-high':
        sorted.sort((a, b) => (b.matchConfidence || 0) - (a.matchConfidence || 0));
        break;
      case 'confidence-low':
        sorted.sort((a, b) => (a.matchConfidence || 0) - (b.matchConfidence || 0));
        break;
      default:
        break;
    }
    
    return sorted;
  };

  // Apply all filters
  const applyFilters = (searchTerm, gradeFilter, matchFilter, marketplaceFilter, sortBy, priceRange) => {
    let filtered = allSales;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(sale => 
        sale.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.price.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.soldDate && sale.soldDate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.soldInfo && sale.soldInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.matchedCard && sale.matchedCard.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(sale => {
        const title = sale.title.toLowerCase();
        const grade = gradeFilter.replace('tag-', '');
        
        // Check for various TAG grade formats
        const gradePatterns = [
          `tag ${grade}`,    // "TAG 10"
          `tag${grade}`,     // "TAG10"  
          `tag-${grade}`,    // "TAG-10"
          `tag_${grade}`,    // "TAG_10"
          `tag  ${grade}`,   // "TAG  10" (extra space)
        ];
        
        return gradePatterns.some(pattern => title.includes(pattern));
      });
    }
    
    // Apply match filter
    if (matchFilter === 'matched') {
      filtered = filtered.filter(sale => sale.matched);
    } else if (matchFilter === 'unmatched') {
      filtered = filtered.filter(sale => !sale.matched);
    }
    
    // Apply marketplace filter
    if (marketplaceFilter !== 'all') {
      filtered = filtered.filter(sale => sale.marketplace === marketplaceFilter);
    }
    
    // Apply price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(sale => {
        const price = parseFloat(sale.price.replace(/[£$,]/g, '')) || 0;
        const fromCurrency = sale.price.includes('$') ? 'USD' : 'GBP';
        const convertedPrice = convertCurrency(price, fromCurrency, 'GBP');
        
        if (priceRange.min && convertedPrice < parseFloat(priceRange.min)) return false;
        if (priceRange.max && convertedPrice > parseFloat(priceRange.max)) return false;
        return true;
      });
    }
    
    // Apply sorting
    filtered = sortSales(filtered, sortBy);
    
    setFilteredSales(filtered);
  };

  // Filter handlers
  const handleSearch = (term) => {
    setSearchTerm(term);
    applyFilters(term, gradeFilter, matchFilter, marketplaceFilter, sortBy, priceRange);
  };

  const handleGradeFilterChange = (newGradeFilter) => {
    setGradeFilter(newGradeFilter);
    applyFilters(searchTerm, newGradeFilter, matchFilter, marketplaceFilter, sortBy, priceRange);
  };

  const handleMatchFilterChange = (newMatchFilter) => {
    setMatchFilter(newMatchFilter);
    applyFilters(searchTerm, gradeFilter, newMatchFilter, marketplaceFilter, sortBy, priceRange);
  };

  const handleMarketplaceFilterChange = (newMarketplaceFilter) => {
    setMarketplaceFilter(newMarketplaceFilter);
    applyFilters(searchTerm, gradeFilter, matchFilter, newMarketplaceFilter, sortBy, priceRange);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    applyFilters(searchTerm, gradeFilter, matchFilter, marketplaceFilter, newSortBy, priceRange);
  };

  const handlePriceRangeChange = (newPriceRange) => {
    setPriceRange(newPriceRange);
    applyFilters(searchTerm, gradeFilter, matchFilter, marketplaceFilter, sortBy, newPriceRange);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setGradeFilter('all');
    setMatchFilter('matched'); // Reset to matched (don't show unmatched by default)
    setMarketplaceFilter('all');
    setSortBy('newest');
    setPriceRange({ min: '', max: '' });
    applyFilters('', 'all', 'matched', 'all', 'newest', { min: '', max: '' });
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters(searchTerm, gradeFilter, matchFilter, marketplaceFilter, sortBy, priceRange);
  }, [allSales, searchTerm, gradeFilter, matchFilter, marketplaceFilter, sortBy, priceRange]);

  const CardModal = ({ card, cardData, onClose }) => {
    if (!card || !cardData) return null;
    
    // Get fallback image from most recent eBay sale
    const fallbackImage = cardData.sales && cardData.sales.length > 0 
      ? cardData.sales[0].img || cardData.sales[0].image 
      : null;
    
    // Use card image if available, otherwise fallback to eBay listing image
    const imageUrl = card.imageUrl || fallbackImage;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{card.name}</h2>
                <p className="text-gray-600">{card.setName} • {card.setCode} {card.cardNumber}</p>
                {card.setName && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium rounded-full mt-1">
                    {card.setName}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Image and Info */}
              <div>
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={card.name}
                    className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full max-w-sm mx-auto h-96 bg-gray-100 rounded-lg shadow-lg flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm8 3l3 4H7l2-2.5L11 13l3-4z"/>
                      </svg>
                      <p className="text-lg">No Image Available</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>HP:</strong> {card.hp || card.metadata?.hp || '-'}</p>
                  <p><strong>Type:</strong> {Array.isArray(card.type) ? card.type.join(', ') : (card.type || 'N/A')}</p>
                  <p><strong>Artist:</strong> {card.artist || card.metadata?.artist || '-'}</p>
                  <p><strong>Rarity:</strong> {card.rarity}</p>
                </div>
              </div>

              {/* Sales Data */}
              <div>
                {/* Statistics */}
                {cardData.stats && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2">Sales Statistics</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Total Sales: <span className="font-medium">{cardData.stats.count}</span></div>
                      <div>Average: <span className="font-medium">{formatPrice(cardData.stats.averagePrice)}</span></div>
                      <div>Median: <span className="font-medium">{formatPrice(cardData.stats.medianPrice)}</span></div>
                      <div>Range: <span className="font-medium">{formatPrice(cardData.stats.minPrice)} - {formatPrice(cardData.stats.maxPrice)}</span></div>
                    </div>
                  </div>
                )}

                {/* Recent Sales */}
                <div>
                  <h3 className="font-semibold mb-2">Recent Sales</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {cardData.sales
                      .slice(0, 10)
                      .map((sale, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-2">{sale.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Confidence: {(sale.matchConfidence * 100).toFixed(0)}%
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-green-600">{sale.price}</p>
                              <p className="text-xs text-gray-500">{sale.soldInfo}</p>
                            </div>
                          </div>
                          {sale.listingUrl && (
                            <a 
                              href={sale.listingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                            >
                              View on eBay →
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchCardData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const matchedSalesCount = filteredSales.filter(sale => sale.matched).length;
  const unmatchedSalesCount = filteredSales.filter(sale => !sale.matched).length;

  // Card sales structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "TAG Pokemon Card Database & Sales Analytics",
    "description": "Comprehensive database of TAG graded Pokemon cards with sales analytics, price tracking, and market insights",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Matched TAG Pokemon Cards",
      "numberOfItems": filteredSales.filter(sale => sale.matched).length
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <SEOHead
        title="TAG Pokemon Card Database - Sales Analytics & Price Tracking"
        description={`Browse ${filteredSales.length} TAG graded Pokemon card sales with detailed analytics. Track price history, market trends, and card matching data across UK and US eBay marketplaces.`}
        keywords="TAG Pokemon card database, Pokemon card analytics, graded card sales data, Pokemon card matching, TAG card prices, Pokemon market analysis"
        canonicalUrl="https://tag-sales-tracker.vercel.app/cards"
        structuredData={structuredData}
      />
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">TAG (Technical Authentication & Grading) Sales Tracker</h1>
            </div>
            
            {/* Right side: Navigation Links + Currency Selector */}
            <div className="flex items-center space-x-8">
              {/* Navigation Links */}
              <div className="flex space-x-8">
                <a href="/" className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium hover:text-gray-600">
                  All Sales
                </a>
                <span className="text-blue-600 border-b-2 border-blue-600 px-1 pb-4 pt-5 text-sm font-medium">
                  Card List
                </span>
                <a href="/sets" className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium hover:text-gray-600">
                  Card Sets
                </a>
                <a href="/faq" className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium hover:text-gray-600">
                  FAQ
                </a>
              </div>
              
              {/* Currency Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Currency:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleCurrencyChange('GBP')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                      currency === 'GBP'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    £ GBP
                  </button>
                  <button
                    onClick={() => handleCurrencyChange('USD')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                      currency === 'USD'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    $ USD
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">All TAG Sales</h2>
                <p className="text-gray-600">
                  {filteredSales.length} of {allSales.length} sales •
                  {matchedSalesCount} matched • {unmatchedSalesCount} unmatched
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex gap-2">
                <button 
                  onClick={fetchCardData}
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div className="xl:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search titles, cards, prices..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => handleSearch('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grade Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => handleGradeFilterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Grades</option>
                    <option value="tag-10">TAG 10</option>
                    <option value="tag-9">TAG 9</option>
                    <option value="tag-8">TAG 8</option>
                    <option value="tag-7">TAG 7</option>
                    <option value="tag-6">TAG 6</option>
                    <option value="tag-5">TAG 5</option>
                    <option value="tag-4">TAG 4</option>
                    <option value="tag-3">TAG 3</option>
                    <option value="tag-2">TAG 2</option>
                    <option value="tag-1">TAG 1</option>
                  </select>
                </div>

                {/* Match Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Match Status</label>
                  <select
                    value={matchFilter}
                    onChange={(e) => handleMatchFilterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="matched">Matched Only</option>
                    <option value="unmatched">Unmatched Only</option>
                  </select>
                </div>

                {/* Marketplace Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace</label>
                  <select
                    value={marketplaceFilter}
                    onChange={(e) => handleMarketplaceFilterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Marketplaces</option>
                    <option value="uk">UK</option>
                    <option value="us">US</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="title-az">Title: A to Z</option>
                    <option value="title-za">Title: Z to A</option>
                    <option value="confidence-high">Confidence: High to Low</option>
                    <option value="confidence-low">Confidence: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (£)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e) => handlePriceRangeChange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (£)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={priceRange.max}
                    onChange={(e) => handlePriceRangeChange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearAllFilters}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSales.map((sale, idx) => (
              <div 
                key={idx} 
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow ${
                  sale.matched ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'
                }`}
              >
                <div className="p-4">
                  <img 
                    src={sale.img} 
                    alt={`${sale.title} - TAG graded Pokemon card${sale.matched ? ` matched to ${sale.matchedCard.name}` : ''}`} 
                    className="w-full h-48 object-contain rounded-lg mb-4"
                    loading="lazy"
                  />
                  
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{sale.title}</h3>
                  
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-green-600 font-bold text-xl">
                      {convertAndFormatPrice(sale.price, currency)}
                    </p>
                    {sale.matched && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {(sale.matchConfidence * 100).toFixed(0)}% match
                      </span>
                    )}
                  </div>

                  {sale.matched && sale.matchedCard && (
                    <div className="mb-2">
                      <p className="text-sm text-blue-600 font-medium">
                        → {sale.matchedCard.name}
                      </p>
                      <p className="text-xs text-gray-500">{sale.matchedCard.setName}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Sold:</span> {sale.soldInfo || sale.soldDate || 'Recently sold'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {sale.listingUrl && (
                      <a 
                        href={sale.listingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        View on eBay
                      </a>
                    )}
                    {sale.matched && sale.matchedCard && (
                      <button
                        onClick={() => setSelectedCard({ 
                          card: sale.matchedCard, 
                          cardData: cardSales[sale.matchedCard.id] 
                        })}
                        className="flex-1 text-center bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                      >
                        Card Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSales.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {allSales.length === 0 
                  ? "No sales data available yet." 
                  : "No sales match your filters. Try adjusting your search criteria."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardModal 
          card={selectedCard.card}
          cardData={selectedCard.cardData}
          onClose={() => setSelectedCard(null)}
        />
      )}

      <Footer />
    </div>
  );
} 