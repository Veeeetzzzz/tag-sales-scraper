import React, { useEffect, useState } from "react";
import Footer from '../components/Footer';
import CurrencySelector from '../components/CurrencySelector';
import SEOHead from '../components/SEOHead';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatPrice, convertCurrency } from '../utils/currency';

export default function Home() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price-high, price-low, title-az, title-za
  const [gradeFilter, setGradeFilter] = useState('all'); // all, tag-10, tag-9, tag-8, etc.
  const [marketplace, setMarketplace] = useState('uk'); // uk, us
  const [lastUpdated, setLastUpdated] = useState(null);
  const { currency, setCurrency } = useCurrency();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currencyOverridden, setCurrencyOverridden] = useState(false); // Track if user manually overrode currency

  // Cache keys for localStorage (marketplace-specific)
  const CACHE_KEY = `tag-sales-data-${marketplace}`;
  const CACHE_TIMESTAMP_KEY = `tag-sales-timestamp-${marketplace}`;

  // Load cached data from localStorage
  const loadCachedData = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        const parsedData = JSON.parse(cachedData);
        const timestamp = new Date(cachedTimestamp);
        
        console.log('Loaded cached data:', parsedData.length, 'items from', timestamp);
        setItems(parsedData);
        setFilteredItems(parsedData);
        setLastFetchTime(timestamp);
        return true;
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    }
    return false;
  };

  // Save data to localStorage
  const saveCachedData = (data, timestamp) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const fetchData = (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    fetch(`/api/ebay?marketplace=${marketplace}`)
      .then(res => res.json())
      .then(data => {
        const itemsData = data.items || [];
        const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
        
        if (data.error && itemsData.length === 0) {
          // If there's an error and no items, but we have cached data, show error with cached data
          if (items.length > 0) {
            setError(`Failed to update list - last refreshed at ${lastFetchTime?.toLocaleString() || 'unknown'}`);
          } else {
            setError(data.message || 'No items found. The scraper might need updating for current eBay structure.');
          }
        } else {
          // Success - update with new data
          setItems(itemsData);
          setFilteredItems(itemsData);
          setLastFetchTime(timestamp);
          
          // Save to cache
          saveCachedData(itemsData, timestamp.toISOString());
          
          if (isManualRefresh && itemsData.length > 0) {
            // Show brief success message for manual refresh
            setError(null);
          }
        }
        
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        
        // If we have cached data, show error but keep the data
        if (items.length > 0) {
          setError(`Failed to update list - last refreshed at ${lastFetchTime?.toLocaleString() || 'unknown'}`);
        } else {
          setError('Failed to load eBay data. Please try again later.');
        }
        
        setLoading(false);
        setIsRefreshing(false);
      });
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
  const sortItems = (itemsToSort, sortType) => {
    const sorted = [...itemsToSort];
    
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
          // Convert to same currency for proper comparison
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
          // Convert to same currency for proper comparison
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
      default:
        break;
    }
    
    return sorted;
  };

  // Fast client-side search/filter
  const handleSearch = (term) => {
    setSearchTerm(term);
    applyFilters(term, sortBy, gradeFilter);
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    applyFilters(searchTerm, newSortBy, gradeFilter);
  };

  // Handle grade filter change
  const handleGradeFilterChange = (newGradeFilter) => {
    setGradeFilter(newGradeFilter);
    applyFilters(searchTerm, sortBy, newGradeFilter);
  };

  // Handle marketplace change
  const handleMarketplaceChange = (newMarketplace) => {
    setMarketplace(newMarketplace);
    
    // Auto-switch currency based on marketplace ONLY if user hasn't manually overridden
    if (!currencyOverridden) {
      if (newMarketplace === 'us') {
        setCurrency('USD');
      } else if (newMarketplace === 'uk') {
        setCurrency('GBP');
      }
    }
    
    // Reset currency override flag when marketplace changes (return to default behavior)
    setCurrencyOverridden(false);
    
    // Clear current data to show loading
    setItems([]);
    setFilteredItems([]);
    // Clear filters
    setSearchTerm('');
    setGradeFilter('all');
    setSortBy('newest');
  };

  // Handle manual currency change (user override)
  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    setCurrencyOverridden(true); // Mark that user has manually overridden the currency
  };

  // Apply search, grade, and sort filters
  const applyFilters = (searchTerm, sortType, gradeFilterType = gradeFilter) => {
    let filtered = items;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.price.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.soldDate && item.soldDate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.soldInfo && item.soldInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply grade filter
    if (gradeFilterType !== 'all') {
      filtered = filtered.filter(item => {
        const title = item.title.toLowerCase();
        const grade = gradeFilterType.replace('tag-', '');
        
        // Check for various TAG grade formats:
        // "TAG 10", "TAG10", "TAG-10", etc.
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
    
    // Apply sorting
    filtered = sortItems(filtered, sortType);
    
    setFilteredItems(filtered);
  };

  useEffect(() => {
    // Set initial currency based on marketplace (only if not manually overridden)
    if (!currencyOverridden) {
      if (marketplace === 'us') {
        setCurrency('USD');
      } else if (marketplace === 'uk') {
        setCurrency('GBP');
      }
    }
    
    // Try to load cached data first
    const hasCachedData = loadCachedData();
    
    // Always fetch fresh data, but if we have cache, don't show loading
    if (hasCachedData) {
      setLoading(false);
      // Fetch fresh data in background
      fetchData();
    } else {
      // No cached data, show loading
      fetchData();
    }
  }, [marketplace]); // Run when marketplace changes

  useEffect(() => {
    applyFilters(searchTerm, sortBy, gradeFilter);
  }, [items, searchTerm, sortBy, gradeFilter]); // Only run when these specific values change

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      // Escape to clear search or close modal
      if (e.key === 'Escape') {
        if (showComingSoon) {
          setShowComingSoon(false);
        } else if (searchTerm) {
          handleSearch('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, showComingSoon]);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    
    return timestamp.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Structured data for sales listings
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "TAG Graded Pokemon Card Sales",
    "description": "Latest TAG graded Pokemon card sales from eBay UK and US marketplaces with real-time pricing data",
    "mainEntity": {
      "@type": "ItemList",
      "name": "TAG Pokemon Card Sales",
      "numberOfItems": filteredItems.length,
      "itemListElement": filteredItems.slice(0, 10).map((item, index) => ({
        "@type": "Product",
        "position": index + 1,
        "name": item.title,
        "offers": {
          "@type": "Offer",
          "price": parseFloat(item.price.replace(/[£$,]/g, '')) || 0,
          "priceCurrency": item.price.includes('$') ? 'USD' : 'GBP',
          "availability": "https://schema.org/SoldOut",
          "seller": {
            "@type": "Organization",
            "name": "eBay"
          }
        },
        "image": item.img,
        "url": item.listingUrl
      }))
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <SEOHead
        title="TAG Sales Tracker - Latest Pokemon Card Sales & Market Data"
        description={`Track ${items.length} TAG graded Pokemon card sales from eBay UK and US marketplaces. Real-time pricing data, market analytics, and sales history for graded Pokemon cards.`}
        keywords="TAG graded Pokemon cards, Pokemon card prices, eBay Pokemon sales, graded card market, Pokemon card values, TAG authentication, Pokemon TCG prices, card grading"
        canonicalUrl="https://tag-sales-tracker.vercel.app"
        structuredData={structuredData}
      />
      
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">TAG (Technical Authentication & Grading) Sales Tracker</h1>
            </div>
            
            {/* Right side: Navigation Links + Currency Selector */}
            <div className="flex items-center space-x-8">
              {/* Navigation Links */}
              <div className="flex space-x-8">
                <span 
                  className="text-blue-600 border-b-2 border-blue-600 px-1 pb-4 pt-5 text-sm font-medium"
                >
                  All TAG Sales
                </span>
                <a 
                  href="/best-offers"
                  className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Best Offers Accepted
                </a>
                <a 
                  href="/cards"
                  className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Card List
                </a>
                <a 
                  href="/sets"
                  className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Card Sets
                </a>
                <a 
                  href="/faq"
                  className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium cursor-pointer hover:text-gray-600 transition-colors"
                >
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
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-center flex-1 text-green-600">
              eBay TAG Graded Pokemon Sales
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => fetchData(true)}
                disabled={loading || isRefreshing}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Loading...' : isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Last Updated Info */}
          {lastFetchTime && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Last updated: {formatTimestamp(lastFetchTime)}
              </p>
            </div>
          )}
          
          {/* Search and Filter Controls */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Marketplace Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="marketplace-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Marketplace:
                </label>
                <select
                  id="marketplace-select"
                  value={marketplace}
                  onChange={(e) => handleMarketplaceChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="uk">🇬🇧 UK eBay</option>
                  <option value="us">🇺🇸 US eBay</option>
                </select>
              </div>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search items by title, price, or date... (Ctrl+K to focus)"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Grade Filter Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="grade-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Grade:
                </label>
                <select
                  id="grade-select"
                  value={gradeFilter}
                  onChange={(e) => handleGradeFilterChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Grades</option>
                  <option value="tag-10">TAG 10 (Pristine)</option>
                  <option value="tag-9">TAG 9 (Mint)</option>
                  <option value="tag-8">TAG 8 (Near Mint)</option>
                  <option value="tag-7">TAG 7</option>
                  <option value="tag-6">TAG 6</option>
                  <option value="tag-5">TAG 5</option>
                  <option value="tag-4">TAG 4</option>
                  <option value="tag-3">TAG 3</option>
                  <option value="tag-2">TAG 2</option>
                  <option value="tag-1">TAG 1</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="title-az">Title: A to Z</option>
                  <option value="title-za">Title: Z to A</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || sortBy !== 'newest' || gradeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy('newest');
                    setGradeFilter('all');
                    applyFilters('', 'newest', 'all');
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Info */}
            {(searchTerm || sortBy !== 'newest' || gradeFilter !== 'all') && (
              <div className="text-center mt-3">
                <p className="text-sm text-gray-600">
                  Showing {filteredItems.length} of {items.length} items from {marketplace === 'us' ? '🇺🇸 US eBay' : '🇬🇧 UK eBay'}
                  {searchTerm && ` matching "${searchTerm}"`}
                  {gradeFilter !== 'all' && ` filtered to ${gradeFilter.replace('-', ' ').toUpperCase()}`}
                  {sortBy !== 'newest' && ` sorted by ${
                    sortBy === 'oldest' ? 'oldest first' :
                    sortBy === 'price-high' ? 'price (high to low)' :
                    sortBy === 'price-low' ? 'price (low to high)' :
                    sortBy === 'title-az' ? 'title (A-Z)' :
                    sortBy === 'title-za' ? 'title (Z-A)' : ''
                  }`}
                </p>
              </div>
            )}

            {/* Quick Stats */}
            {!loading && items.length > 0 && (
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">
                  {filteredItems.length} TAG graded Pokemon cards from {marketplace === 'us' ? '🇺🇸 US eBay' : '🇬🇧 UK eBay'} • {(() => {
                    const prices = filteredItems.map(item => {
                      const price = parseFloat(item.price.replace(/[£$,]/g, '')) || 0;
                      if (price <= 0) return 0;
                      // Convert to target currency
                      const fromCurrency = item.price.includes('$') ? 'USD' : 'GBP';
                      return convertCurrency(price, fromCurrency, currency);
                    }).filter(p => p > 0);
                    
                    if (prices.length === 0) return 'No valid prices';
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                    const symbol = currency === 'USD' ? '$' : '£';
                    return `Price range: ${symbol}${min.toFixed(2)} - ${symbol}${max.toFixed(2)} • Average: ${symbol}${avg.toFixed(2)}`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-center">Loading latest sold listings...</p>
        ) : error ? (
          <div className="text-center">
            <p className={`mb-4 ${error.includes('Failed to update') ? 'text-orange-600' : 'text-red-600'}`}>
              {error}
            </p>
            {!error.includes('Failed to update') && (
              <button 
                onClick={() => fetchData()} 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Retry
              </button>
            )}
          </div>
        ) : filteredItems.length === 0 && items.length > 0 ? (
          <p className="text-center text-gray-500">No items match your search. Try different keywords.</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500">No items found. The scraper might need updating for current eBay structure.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow">
                <img 
                  src={item.img} 
                  alt={`${item.title} - TAG graded Pokemon card sold on eBay`} 
                  className="w-full h-48 object-contain mb-4 rounded"
                  loading="lazy"
                />
                <h2 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-900">{item.title}</h2>
                <p className="text-green-600 font-bold text-xl mb-2">
                  {convertAndFormatPrice(item.price, currency)}
                </p>
                
                {/* Sold Date/Time */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Sold:</span> {item.soldInfo || item.soldDate || 'Recently sold'}
                  </p>
                </div>
                
                {/* Link to Listing */}
                {item.listingUrl && (
                  <a 
                    href={item.listingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on eBay
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Card List Coming Soon! 🎴
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                We're working hard to bring you the ability to see sales data organized by individual cards. 
                This will include price history, market trends, and detailed analytics for each TAG card.
              </p>
              
              {/* Features Preview */}
              <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">What's Coming:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Individual card price tracking</li>
                  <li>• Historical price charts</li>
                  <li>• Market trend analysis</li>
                  <li>• Rarity-based filtering</li>
                  <li>• Set-by-set organization</li>
                </ul>
              </div>
              
              {/* Call to Action */}
              <p className="text-sm text-blue-600 font-medium mb-6">
                Hang tight - we're building something awesome! 🚀
              </p>
              
              {/* Close Button */}
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
