import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold mb-3">TAG Sales Tracker</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-xs">
              Technical Authentication & Grading sales tracking for Pokemon cards.
            </p>
            <div className="text-xs text-gray-500">
              © 2024 TAG Sales Tracker
            </div>
          </div>

          {/* Navigation Column */}
          <div className="col-span-1">
            <h4 className="text-sm font-semibold mb-3 text-gray-300">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Sales Tracker
                </Link>
              </li>
              <li>
                <Link href="/cards" className="text-gray-400 hover:text-white transition-colors">
                  Card Analytics
                </Link>
              </li>
              <li>
                <Link href="/sets" className="text-gray-400 hover:text-white transition-colors">
                  Card Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="col-span-1">
            <h4 className="text-sm font-semibold mb-3 text-gray-300">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Column */}
          <div className="col-span-1">
            <h4 className="text-sm font-semibold mb-3 text-gray-300">Features</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Pokemon card price tracker</li>
              <li>eBay sales analytics</li>
              <li>Market trends</li>
              <li>Grading insights</li>
            </ul>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-gray-800 mt-6 pt-4">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto">
            Disclaimer: This site tracks publicly available eBay sales data. Not affiliated with Pokemon, eBay, or grading companies.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 