import React, { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price-high, price-low, title-az, title-za
  const [showComingSoon, setShowComingSoon] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/ebay')
      .then(res => res.json())
      .then(data => {
        const itemsData = data.items || [];
        setItems(itemsData);
        setFilteredItems(itemsData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError('Failed to load eBay data. Please try again later.');
        setLoading(false);
      });
  };

  // Sorting function
  const sortItems = (itemsToSort, sortType) => {
    const sorted = [...itemsToSort].sort((a, b) => {
      switch (sortType) {
        case 'newest':
          // Since we don't have real dates, sort by index (newer items first)
          return 0; // Keep original order (newest first from eBay)
        case 'oldest':
          // Reverse the order
          return 0; // Will be handled by reversing the array
        case 'price-high':
          const priceA = parseFloat(a.price.replace(/[£$,]/g, '')) || 0;
          const priceB = parseFloat(b.price.replace(/[£$,]/g, '')) || 0;
          return priceB - priceA;
        case 'price-low':
          const priceA2 = parseFloat(a.price.replace(/[£$,]/g, '')) || 0;
          const priceB2 = parseFloat(b.price.replace(/[£$,]/g, '')) || 0;
          return priceA2 - priceB2;
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    
    // For oldest, reverse the array
    if (sortType === 'oldest') {
      return sorted.reverse();
    }
    
    return sorted;
  };

  // Fast client-side search/filter
  const handleSearch = (term) => {
    setSearchTerm(term);
    applyFilters(term, sortBy);
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    applyFilters(searchTerm, newSortBy);
  };

  // Apply both search and sort filters
  const applyFilters = (searchTerm, sortType) => {
    let filtered = items;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.price.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.soldDate && item.soldDate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.soldInfo && item.soldInfo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    filtered = sortItems(filtered, sortType);
    
    setFilteredItems(filtered);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters(searchTerm, sortBy);
  }, [items]);

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">TAG Price Tracker</h1>
            </div>
            
            {/* Navigation Links */}
            <div className="flex space-x-8">
              <span 
                className="text-blue-600 border-b-2 border-blue-600 px-1 pb-4 pt-5 text-sm font-medium"
              >
                All TAG Sales
              </span>
              <button 
                onClick={() => setShowComingSoon(true)}
                className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium cursor-pointer hover:text-gray-600 transition-colors"
              >
                Card List
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-center flex-1">eBay TAG 10 Pokemon Sales</h2>
            <div className="flex gap-2">
              <button 
                onClick={fetchData}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center">
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
              {(searchTerm || sortBy !== 'newest') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy('newest');
                    applyFilters('', 'newest');
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Results Info */}
            {(searchTerm || sortBy !== 'newest') && (
              <div className="text-center mt-3">
                <p className="text-sm text-gray-600">
                  Showing {filteredItems.length} of {items.length} items
                  {searchTerm && ` matching "${searchTerm}"`}
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
                  {(() => {
                    const prices = filteredItems.map(item => parseFloat(item.price.replace(/[£$,]/g, '')) || 0).filter(p => p > 0);
                    if (prices.length === 0) return '';
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                    return `Price range: £${min.toFixed(2)} - £${max.toFixed(2)} • Average: £${avg.toFixed(2)}`;
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
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchData} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 && items.length > 0 ? (
          <p className="text-center text-gray-500">No items match your search. Try different keywords.</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500">No items found. The scraper might need updating for current eBay structure.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow">
                <img src={item.img} alt={item.title} className="w-full h-48 object-contain mb-4 rounded" />
                <h2 className="text-lg font-semibold mb-2 line-clamp-2">{item.title}</h2>
                <p className="text-green-600 font-bold text-xl mb-2">{item.price}</p>
                
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
    </div>
  );
}
