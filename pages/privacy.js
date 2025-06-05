import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';

const PrivacyPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy - TAG Sales Tracker</title>
        <meta name="description" content="Privacy Policy for TAG Sales Tracker - Learn how we protect your privacy and handle data." />
        <link rel="canonical" href="/privacy" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">TAG (Technical Authentication & Grading) Sales Tracker</h1>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose max-w-none space-y-6 text-gray-700">
              <p>Last updated: {new Date().getFullYear()}</p>
              
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
              <p>We collect minimal information to provide our service:</p>
              <ul>
                <li>Anonymous usage analytics</li>
                <li>Browser localStorage for caching preferences</li>
                <li>No personal identification information is collected</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">How We Use Information</h2>
              <p>Any information collected is used solely to:</p>
              <ul>
                <li>Improve website performance</li>
                <li>Provide cached data for better user experience</li>
                <li>Analyze general usage patterns</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">Data Storage</h2>
              <p>
                Data is stored locally in your browser's localStorage for caching purposes. 
                No personal data is transmitted to our servers.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">Third-Party Services</h2>
              <p>We may use third-party services for analytics and performance monitoring. These services may collect anonymous usage data.</p>

              <h2 className="text-2xl font-bold text-gray-900">Contact</h2>
              <p>If you have questions about this Privacy Policy, please contact us through our website.</p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPage; 