import React, { useEffect, useState } from "react";
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatPrice } from '../utils/currency';

export default function BestOffers() {
  const [offersData, setOffersData] = useState(null);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price-high'); // price-high, price-low, title-az, date-newest
  const { currency } = useCurrency();

  useEffect(() => {
    // Load the best offers data
    fetch('/data/best-offers-accepted.json')
      .then(res => res.json())
      .then(data => {
        setOffersData(data);
        setFilteredOffers(data.offers || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading best offers data:', error);
        setLoading(false);
      });
  }, []);

  // Sorting function
  const sortOffers = (offersToSort, sortType) => {
    const sorted = [...offersToSort];
    
    switch (sortType) {
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.avgSold.replace(/[£$,]/g, '')) || 0;
          const priceB = parseFloat(b.avgSold.replace(/[£$,]/g, '')) || 0;
          return priceB - priceA;
        });
        break;
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.avgSold.replace(/[£$,]/g, '')) || 0;
          const priceB = parseFloat(b.avgSold.replace(/[£$,]/g, '')) || 0;
          return priceA - priceB;
        });
        break;
      case 'title-az':
        sorted.sort((a, b) => a.listingTitle.localeCompare(b.listingTitle));
        break;
      case 'date-newest':
        sorted.sort((a, b) => {
          // Parse dates in format "7 Jun 2025" or similar
          const parseDate = (dateStr) => {
            if (!dateStr || dateStr.includes('*') || dateStr.includes('%') || dateStr.includes('-')) {
              return new Date(0); // Put invalid dates at the end
            }
            
            try {
              const date = new Date(dateStr);
              // Check if the parsed date is valid
              if (isNaN(date.getTime())) {
                return new Date(0);
              }
              return date;
            } catch (e) {
              return new Date(0);
            }
          };
          
          const dateA = parseDate(a.dateLastSold);
          const dateB = parseDate(b.dateLastSold);
          
          return dateB - dateA;
        });
        break;
      default:
        break;
    }
    
    return sorted;
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    applyFilters(term, sortBy);
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    applyFilters(searchTerm, newSortBy);
  };

  // Apply filters and sorting
  const applyFilters = (searchTerm, sortType) => {
    if (!offersData?.offers) return;
    
    let filtered = offersData.offers;
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(offer => 
        offer.listingTitle.toLowerCase().includes(lowercaseSearch) ||
        offer.avgSold.toLowerCase().includes(lowercaseSearch) ||
        offer.dateLastSold.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply sorting
    filtered = sortOffers(filtered, sortType);
    
    setFilteredOffers(filtered);
  };

  // Calculate total value
  const calculateTotalValue = () => {
    return filteredOffers.reduce((total, offer) => {
      const price = parseFloat(offer.avgSold.replace(/[£$,]/g, '')) || 0;
      return total + price;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl">Loading Best Offers data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <SEOHead
        title="Best Offers Accepted - TAG Pokemon Card Sales Data"
        description="Exclusive data on accepted eBay Best Offers for TAG graded Pokemon cards. This premium data shows actual accepted offer amounts that are hidden from public view on eBay."
        keywords="TAG Pokemon best offers, accepted offers eBay, Pokemon card negotiated prices, TAG graded card offers, Pokemon card best offer data"
        canonicalUrl="https://tag-sales-tracker.vercel.app/best-offers"
      />
      
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                TAG Sales Tracker
              </a>
            </div>
            
            {/* Right side: Navigation Links */}
            <div className="flex items-center space-x-8">
              <div className="flex space-x-8">
                <a 
                  href="/"
                  className="text-gray-400 px-1 pb-4 pt-5 text-sm font-medium cursor-pointer hover:text-gray-600 transition-colors"
                >
                  All TAG Sales
                </a>
                <span 
                  className="text-blue-600 border-b-2 border-blue-600 px-1 pb-4 pt-5 text-sm font-medium"
                >
                  Best Offers Accepted
                </span>
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
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-center mb-4">Best Offers Accepted</h1>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Data Collection Nuance</h3>
                  <div className="text-blue-700 space-y-2">
                    <p>
                      <strong>Why this data is special:</strong> Unlike regular sold listings, this data represents actual accepted "Best Offer" amounts from eBay transactions. 
                      When a seller accepts a best offer on eBay, the final negotiated price becomes hidden from public view after the sale completes.
                    </p>
                    <p>
                      <strong>Manual collection:</strong> This data is manually compiled from protected seller data that is not accessible through automated scraping. 
                      Each entry represents a real negotiated transaction where the buyer made an offer below the asking price and the seller accepted it.
                    </p>
                    <p>
                      <strong>Market insight:</strong> This provides unique insight into the actual market dynamics and what sellers are willing to accept versus their listed prices, 
                      giving you a more complete picture of TAG graded Pokemon card values.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title, price, or date..."
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
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="title-az">Title: A to Z</option>
                  <option value="date-newest">Date: Newest First</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            {filteredOffers.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredOffers.length} of {offersData?.offers?.length || 0} accepted offers
                  {searchTerm && ` matching "${searchTerm}"`}
                  • Total value: £{calculateTotalValue().toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  • Average: £{(calculateTotalValue() / filteredOffers.length).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {offersData?.dataInfo?.lastUpdated || 'Unknown'}
                </p>
              </div>
            )}
          </div>

          {/* Data Table */}
          {filteredOffers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? 'No offers match your search criteria.' : 'No best offers data available.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Listing Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accepted Offer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Postage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Last Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        eBay Link
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOffers.map((offer, index) => (
                      <tr key={offer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-md">
                            <p className="line-clamp-2 text-gray-900">{offer.listingTitle}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          £{parseFloat(offer.avgSold).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          £{parseFloat(offer.postage).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {offer.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {offer.dateLastSold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {offer.listingUrl ? (
                            <a 
                              href={offer.listingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              View
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">About This Data</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-2">Data Source:</h4>
                <p>{offersData?.dataInfo?.dataSource || 'Manual compilation from protected eBay seller data'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Collection Method:</h4>
                <p>Manually updated from secure seller portal access - data not available through public eBay APIs</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Update Frequency:</h4>
                <p>Updated manually when new datasets become available</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Note:</h4>
                <p>Prices represent actual negotiated amounts, not original listing prices</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 