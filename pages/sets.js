import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import Footer from '../components/Footer';
import CurrencySelector from '../components/CurrencySelector';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatPrice } from '../utils/currency';

export default function Sets() {
  const [sets, setSets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cardSales, setCardSales] = useState({});
  const [salesLoading, setSalesLoading] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name-az, name-za
  const router = useRouter();
  const { currency } = useCurrency();

  const fetchSets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/card-matcher');
      const data = await response.json();
      
      if (data.success) {
        setSets(data.sets);
      } else {
        setError('Failed to load card sets');
      }
    } catch (error) {
      console.error('Error fetching sets:', error);
      setError('Failed to load card sets');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    setSalesLoading(true);
    try {
      // Get the sales data
      const salesResponse = await fetch('/api/ebay');
      const salesData = await salesResponse.json();
      
      if (salesData.items && salesData.items.length > 0) {
        // Match cards to sales
        const matchResponse = await fetch('/api/card-matcher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sales: salesData.items })
        });
        
        const matchData = await matchResponse.json();
        
        if (matchData.success) {
          setCardSales(matchData.cardSales);
        }
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
    fetchSalesData();
  }, []);

  const formatPrice = (price) => {
    return convertAndFormatPrice(price, currency, 'GBP');
  };

  const getCardImage = (card) => {
    return card.imageUrl || 'https://via.placeholder.com/250x350/e5e7eb/9ca3af?text=No+Image';
  };

  const CardModal = ({ card, onClose }) => {
    const cardData = cardSales[card.id];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{card.name}</h2>
                <p className="text-gray-600">{card.setName} • {card.setCode} {card.cardNumber}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <img 
                  src={getCardImage(card)} 
                  alt={card.name}
                  className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                />

                <div className="mt-4 space-y-3 text-sm">
                  <div><strong>HP:</strong> {card.hp || 'N/A'}</div>
                  <div><strong>Type:</strong> {Array.isArray(card.type) ? card.type.join(', ') : (card.type || 'N/A')}</div>
                  <div><strong>Rarity:</strong> {card.rarity || 'N/A'}</div>
                  <div><strong>Artist:</strong> {card.artist || 'N/A'}</div>
                  <div><strong>Card Number:</strong> {card.fullNumber || card.cardNumber}</div>
                </div>

                {card.matchingKeywords && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Search Keywords</h3>
                    <div className="flex flex-wrap gap-1">
                      {card.matchingKeywords.slice(0, 6).map((keyword, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sales Data Section */}
              <div>
                {salesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : cardData ? (
                  <>
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
                                  <p className="font-semibold text-green-600">
                                    {convertAndFormatPrice(sale.price, currency)}
                                  </p>
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
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-600">No sales data available for this card</p>
                    <p className="text-xs text-gray-500 mt-1">Sales data may take a moment to load or this card hasn't been sold recently</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SetView = ({ setData, onBack }) => {
    const filteredCards = setData.cards.filter(card =>
      searchTerm === '' || 
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.type && (
        (Array.isArray(card.type) && card.type.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (!Array.isArray(card.type) && card.type.toLowerCase().includes(searchTerm.toLowerCase()))
      )) ||
      (card.rarity && card.rarity.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div>
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sets
          </button>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{setData.name}</h2>
          <p className="text-gray-600 mb-4">{setData.description}</p>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {filteredCards.length} of {setData.cards.length} cards
            </p>
            
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-3"
              onClick={() => setSelectedCard(card)}
            >
              <img
                src={getCardImage(card)}
                alt={card.name}
                className="w-full h-40 object-contain rounded mb-2"
              />
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{card.name}</h3>
              <p className="text-xs text-gray-600 mb-1">{card.fullNumber || card.cardNumber}</p>
              <p className="text-xs text-gray-500">{card.rarity}</p>
            </div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No cards match your search.</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading card sets...</p>
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
            onClick={fetchSets}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Sort sets based on selected option
  const sortSets = (setsData) => {
    const setEntries = Object.entries(setsData);
    
    return setEntries.sort(([keyA, setA], [keyB, setB]) => {
      // Get setInfo or fallback to set data itself
      const infoA = setA.setInfo || setA;
      const infoB = setB.setInfo || setB;
      
      switch (sortBy) {
        case 'newest':
          // Sort by release date (newest first)
          const dateA = new Date(infoA.releaseDate || '1900-01-01');
          const dateB = new Date(infoB.releaseDate || '1900-01-01');
          return dateB - dateA;
        case 'oldest':
          // Sort by release date (oldest first)
          const dateA2 = new Date(infoA.releaseDate || '2099-01-01');
          const dateB2 = new Date(infoB.releaseDate || '2099-01-01');
          return dateA2 - dateB2;
        case 'name-az':
          return infoA.name.localeCompare(infoB.name);
        case 'name-za':
          return infoB.name.localeCompare(infoA.name);
        case 'sales-high':
          return (infoB.tagSales || 0) - (infoA.tagSales || 0);
        case 'sales-low':
          return (infoA.tagSales || 0) - (infoB.tagSales || 0);
        default:
          return 0;
      }
    });
  };

  const sortedSetEntries = sortSets(sets);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
                              <h1 className="text-xl font-bold text-gray-900">TAG (Technical Authentication & Grading) Sales Tracker</h1>
            </div>
            <div className="flex space-x-8">
              <a href="/" className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium hover:text-gray-600">
                All Sales
              </a>
              <a href="/cards" className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium hover:text-gray-600">
                Card List
              </a>
              <span className="text-blue-600 border-b-2 border-blue-600 px-1 pb-4 pt-5 text-sm font-medium">
                Card Sets
              </span>
              <a href="/faq" className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium hover:text-gray-600">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {selectedSet ? (
            <SetView 
              setData={selectedSet} 
              onBack={() => {
                setSelectedSet(null);
                setSearchTerm('');
              }}
            />
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Card Sets</h2>
                    <p className="text-gray-600">
                      Browse Pokemon cards organized by set • {sortedSetEntries.length} sets available
                    </p>
                  </div>
                  
                  {/* Controls */}
                  <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col sm:flex-row gap-4">
                    <CurrencySelector />
                    
                    {/* Sort Controls */}
                    <div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="sort-sets" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Sort by:
                        </label>
                        <select
                          id="sort-sets"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                        >
                          <option value="newest">Release Date (Newest)</option>
                          <option value="oldest">Release Date (Oldest)</option>
                          <option value="name-az">Name (A-Z)</option>
                          <option value="name-za">Name (Z-A)</option>
                          <option value="sales-high">TAG Sales (High)</option>
                          <option value="sales-low">TAG Sales (Low)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedSetEntries.map(([setKey, setData]) => {
                  // Get setInfo or fallback to set data itself
                  const setInfo = setData.setInfo || setData;
                  
                  return (
                  <div
                    key={setKey}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => setSelectedSet(setData)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{setInfo.name}</h3>
                          <p className="text-gray-600 text-sm mb-3">{setInfo.description}</p>
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {setInfo.setCode}
                        </div>
                      </div>

                      {/* Set Stats */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Cards:</span>
                          <span className="font-medium">{setData.cards.length}</span>
                        </div>
                        
                        {setInfo.releaseDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Release Date:</span>
                            <span className="font-medium">{setInfo.releaseDate.substring(2).replace(/-/g, '/')}</span>
                          </div>
                        )}
                        
                        {setInfo.tagSales && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">TAG Sales:</span>
                            <span className="font-medium">{setInfo.tagSales.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <button className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                          Browse Cards →
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {sortedSetEntries.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500">No card sets available yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardModal 
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      <Footer />
    </div>
  );
} 