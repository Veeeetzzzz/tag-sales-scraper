import React, { useState } from 'react';
import Link from 'next/link';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const FAQPage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqData = [
    {
      id: 1,
      question: "What is TAG Sales Tracker?",
      answer: "TAG (Technical Authentication & Grading) Sales Tracker is a comprehensive Pokemon card price tracking platform that monitors eBay sales data, provides market analytics, and helps collectors understand current market values for graded and ungraded Pokemon cards."
    },
    {
      id: 2,
      question: "How does the price tracking work?",
      answer: "Our system automatically scrapes eBay sold listings for Pokemon cards, analyzing titles, prices, and sale dates. We use advanced matching algorithms to identify specific cards and variants, then calculate market statistics including average prices, price ranges, and sales trends."
    },
    {
      id: 3,
      question: "What card sets do you track?",
      answer: "We currently track multiple Pokemon card sets including Base Set, Jungle, Team Rocket, Scarlet & Violet, Paldea Evolved, Prismatic Evolutions, and many more. Our database includes thousands of cards with detailed market data."
    },
    {
      id: 4,
      question: "How often is the data updated?",
      answer: "Sales data is updated regularly throughout the day. The system caches recent data to ensure fast loading times while continuously fetching fresh sales information from eBay to keep our analytics current."
    },
    {
      id: 5,
      question: "Can I track specific cards?",
      answer: "Yes! Use our Card Analytics and Card Sets pages to search for specific Pokemon cards. Our intelligent search system can match cards by name, set, or keywords, and provides detailed sales history and price statistics."
    },
    {
      id: 6,
      question: "What types of cards do you track?",
      answer: "We track all types of Pokemon cards including Base Set classics, modern cards, promotional cards, graded cards (PSA, BGS, CGC), raw cards, full art cards, rainbow rares, and special variants. Our system identifies different conditions and grades."
    },
    {
      id: 7,
      question: "Is this data accurate?",
      answer: "Our data comes directly from eBay sold listings, making it highly accurate for market trends. However, individual sales can vary based on condition, seller reputation, and market timing. We provide statistical analysis to help identify reliable market values."
    },
    {
      id: 8,
      question: "Do you provide investment advice?",
      answer: "No, we provide market data and analytics tools only. This information is for educational purposes and should not be considered investment advice. Pokemon card values can be volatile and influenced by many factors."
    },
    {
      id: 9,
      question: "How can I use this data?",
      answer: "Collectors use our data to understand market values before buying or selling, track their collection values, identify market trends, research specific cards, and make informed decisions about Pokemon card transactions."
    },
    {
      id: 10,
      question: "Is the service free?",
      answer: "Yes, TAG Sales Tracker is currently free to use. We provide comprehensive market data, analytics, and tracking tools at no cost to help the Pokemon card collecting community."
    }
  ];

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <SEOHead
        title="FAQ - TAG Sales Tracker | Pokemon Card Price Tracking Questions"
        description="Frequently asked questions about TAG Sales Tracker - the premier Pokemon card price tracking platform. Get answers about market data, pricing analytics, and card tracking features."
        keywords="TAG Sales Tracker FAQ, Pokemon card price tracking questions, Pokemon card market data, eBay sales tracking, graded card values, Pokemon TCG analytics"
        canonicalUrl="https://tag-sales-tracker.vercel.app/faq"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">TAG (Technical Authentication & Grading) Sales Tracker</h1>
                </Link>
                <nav className="hidden md:flex space-x-6">
                  <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Sales Tracker
                  </Link>
                  <Link href="/cards" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Card Analytics
                  </Link>
                  <Link href="/sets" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Card Sets
                  </Link>
                  <Link href="/faq" className="text-blue-600 font-medium">
                    FAQ
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
              <p className="text-lg text-gray-600">
                Everything you need to know about TAG Sales Tracker and Pokemon card price tracking
              </p>
            </div>

            <div className="space-y-4">
              {faqData.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {faq.question}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          openFAQ === faq.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {openFAQ === faq.id && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center bg-blue-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Track Pokemon Card Prices?
              </h2>
              <p className="text-gray-600 mb-6">
                Start exploring our comprehensive Pokemon card price database and market analytics.
              </p>
              <div className="space-x-4">
                <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  View Sales Tracker
                </Link>
                <Link href="/sets" className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors">
                  Browse Card Sets
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default FAQPage; 