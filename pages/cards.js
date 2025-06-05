import React, { useEffect, useState } from "react";
import Footer from '../components/Footer';

export default function Cards() {
  const [cardSales, setCardSales] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unmatchedSales, setUnmatchedSales] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  const fetchCardData = async () => {
    setLoading(true);
    try {
      // First, get the sales data
      const salesResponse = await fetch('/api/ebay');
      const salesData = await salesResponse.json();
      
      if (salesData.items && salesData.items.length > 0) {
        // Then match cards to sales
        const matchResponse = await fetch('/api/card-matcher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sales: salesData.items })
        });
        
        const matchData = await matchResponse.json();
        
        if (matchData.success) {
          setCardSales(matchData.cardSales);
          setUnmatchedSales(matchData.unmatchedSales);
        } else {
          setError('Failed to match cards to sales');
        }
      } else {
        setError('No sales data available');
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
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  const getPriceColor = (currentPrice, marketPrice) => {
    const ratio = currentPrice / marketPrice;
    if (ratio > 1.1) return 'text-red-600'; // Above market
    if (ratio < 0.9) return 'text-green-600'; // Below market
    return 'text-gray-700'; // Around market
  };

  const CardModal = ({ card, cardData, onClose }) => {
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
                    onError={(e) => {
                      // If the image fails to load, try to find another image from sales data
                      const altImages = cardData.sales
                        ?.map(sale => sale.img || sale.image)
                        .filter(img => img && img !== imageUrl);
                      
                      if (altImages && altImages.length > 0) {
                        e.target.src = altImages[0];
                      } else {
                        // Show placeholder if no images available
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                
                {/* Placeholder when no image is available */}
                <div 
                  className="w-full max-w-sm mx-auto h-96 bg-gray-100 rounded-lg shadow-lg flex items-center justify-center text-gray-400"
                  style={{ display: imageUrl ? 'none' : 'flex' }}
                >
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm8 3l3 4H7l2-2.5L11 13l3-4z"/>
                    </svg>
                    <p className="text-lg">No Image Available</p>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>HP:</strong> {card.hp}</p>
                  <p><strong>Type:</strong> {Array.isArray(card.type) ? card.type.join(', ') : (card.type || 'N/A')}</p>
                  <p><strong>Artist:</strong> {card.artist}</p>
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
          <p>Loading card data...</p>
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

  const cardEntries = Object.entries(cardSales);

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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Matched Cards</h2>
            <p className="text-gray-600">
              {cardEntries.length} cards with sales data • 
              {Object.values(cardSales).reduce((sum, card) => sum + card.sales.length, 0)} total sales matched
              {unmatchedSales.length > 0 && ` • ${unmatchedSales.length} unmatched sales`}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cardEntries.map(([cardId, cardData]) => {
              const card = cardData.card;
              const stats = cardData.stats;
              
              // Get fallback image from most recent eBay sale
              const fallbackImage = cardData.sales && cardData.sales.length > 0 
                ? cardData.sales[0].img || cardData.sales[0].image 
                : null;
              
              // Use card image if available, otherwise fallback to eBay listing image
              const imageUrl = card.imageUrl || fallbackImage;
              
              return (
                <div 
                  key={cardId}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedCard({ card, cardData })}
                >
                  <div className="p-4">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={card.name}
                        className="w-full h-48 object-contain rounded-lg mb-4"
                        onError={(e) => {
                          // If the image fails to load, try to find another image from sales data
                          const altImages = cardData.sales
                            ?.map(sale => sale.img || sale.image)
                            .filter(img => img && img !== imageUrl);
                          
                          if (altImages && altImages.length > 0) {
                            e.target.src = altImages[0];
                          } else {
                            // Show placeholder if no images available
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    
                    {/* Placeholder when no image is available */}
                    <div 
                      className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400"
                      style={{ display: imageUrl ? 'none' : 'flex' }}
                    >
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm8 3l3 4H7l2-2.5L11 13l3-4z"/>
                        </svg>
                        <p className="text-sm">No Image</p>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{card.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{card.setName}</p>
                    
                    {stats && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sales:</span>
                          <span className="font-medium">{stats.count}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg Price:</span>
                          <span className="font-medium text-green-600">
                            {formatPrice(stats.averagePrice)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Range:</span>
                          <span className="font-medium">
                            {formatPrice(stats.minPrice)} - {formatPrice(stats.maxPrice)}
                          </span>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500">
                            Last sale: {stats.lastSale?.soldInfo || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {cardEntries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No card sales data available yet.</p>
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