import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';

const TermsPage = () => {
  return (
    <>
      <Head>
        <title>Terms of Service - TAG Sales Tracker</title>
        <meta name="description" content="Terms of Service for TAG Sales Tracker - Legal terms and conditions for using our Pokemon card price tracking service." />
        <link rel="canonical" href="/terms" />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="prose max-w-none space-y-6 text-gray-700">
              <p>Last updated: {new Date().getFullYear()}</p>
              
              <h2 className="text-2xl font-bold text-gray-900">Acceptance of Terms</h2>
              <p>
                By accessing and using TAG Sales Tracker, you accept and agree to be bound by the terms and provision of this agreement.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">Use License</h2>
              <p>Permission is granted to temporarily use TAG Sales Tracker for personal, non-commercial transitory viewing only.</p>
              <ul>
                <li>This is the grant of a license, not a transfer of title</li>
                <li>You may not modify or copy the materials</li>
                <li>You may not use the materials for any commercial purpose</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">Disclaimer</h2>
              <p>
                The information on TAG Sales Tracker is provided on an 'as is' basis. We make no warranties, expressed or implied, 
                and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions 
                of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">Data Accuracy</h2>
              <p>
                While we strive to provide accurate market data, Pokemon card prices can be volatile and influenced by many factors. 
                This information is for educational purposes only and should not be considered investment advice.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">Limitations</h2>
              <p>
                In no event shall TAG Sales Tracker or its suppliers be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use 
                the materials on TAG Sales Tracker's website.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with applicable laws, and you irrevocably 
                submit to the exclusive jurisdiction of the courts in that state or location.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default TermsPage; 