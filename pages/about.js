import React, { useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { initSEO } from 'ai-seo';
import Footer from '../components/Footer';

const AboutPage = () => {
  useEffect(() => {
    initSEO({
      pageType: 'AboutPage',
      questionType: 'What is TAG Sales Tracker and how does it help Pokemon card collectors?',
      answerType: 'TAG Sales Tracker is a comprehensive Pokemon card price tracking platform that provides real-time market data, sales analytics, and price trends to help collectors make informed decisions about buying and selling Pokemon cards.'
    });
  }, []);

  return (
    <>
      <Head>
        <title>About Us - TAG Sales Tracker | Pokemon Card Price Analytics</title>
        <meta name="description" content="Learn about TAG Sales Tracker - the leading Pokemon card price tracking platform providing comprehensive market analytics and sales data." />
        <meta name="keywords" content="pokemon cards, price tracking, market analytics, about us, card values, eBay sales data" />
        <meta property="og:title" content="About TAG Sales Tracker" />
        <meta property="og:description" content="Discover how TAG Sales Tracker helps Pokemon card collectors with comprehensive price tracking and market analytics." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/about" />
      </Head>

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
                  <Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-4">About TAG Sales Tracker</h1>
              <p className="text-lg text-gray-600">
                Your trusted source for Pokemon card market data and price analytics
              </p>
            </div>

            <div className="prose max-w-none">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  TAG (Technical Authentication & Grading) Sales Tracker was created to provide Pokemon card collectors with accurate, real-time market data and comprehensive analytics. We believe that informed collectors make better decisions, and our platform empowers users with the insights they need to navigate the Pokemon card market confidently.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Do</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Price Tracking</h3>
                    <p className="text-gray-700">
                      Monitor eBay sold listings continuously to provide up-to-date market values for thousands of Pokemon cards across multiple sets and variants.
                    </p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Analytics</h3>
                    <p className="text-gray-700">
                      Advanced statistical analysis providing price trends, market insights, and comprehensive data visualization for informed decision-making.
                    </p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Database</h3>
                    <p className="text-gray-700">
                      Extensive card database covering Base Set classics to modern releases, including graded cards, variants, and special editions.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Matching</h3>
                    <p className="text-gray-700">
                      Intelligent algorithms that accurately match sales data to specific cards, accounting for conditions, grades, and variants.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose TAG Sales Tracker?</h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span><strong>Accurate Data:</strong> Direct from eBay sold listings for reliable market information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span><strong>Comprehensive Coverage:</strong> Thousands of cards across multiple sets and variants</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span><strong>Regular Updates:</strong> Fresh data updated throughout the day</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span><strong>User-Friendly:</strong> Clean, intuitive interface designed for collectors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span><strong>Free Access:</strong> No subscription fees or hidden costs</span>
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sources & Methodology</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our platform aggregates data from eBay's sold listings, focusing on completed sales to provide accurate market values. We use advanced parsing and matching algorithms to ensure data accuracy and relevance. Our system accounts for card conditions, grading services, and various market factors to provide comprehensive price analytics.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  All data is presented for informational purposes only and should not be considered as investment advice. Pokemon card values can fluctuate based on numerous market factors, and past performance does not guarantee future results.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started Today</h2>
                <p className="text-gray-700 mb-4">
                  Ready to explore the world of Pokemon card price tracking? Start by browsing our sales tracker, searching for specific cards, or exploring our comprehensive card sets database.
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
        </div>

        <Footer />
      </div>
    </>
  );
};

export default AboutPage; 