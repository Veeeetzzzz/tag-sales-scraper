import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

const CurrencySelector = ({ className = '' }) => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Currency:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setCurrency('GBP')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
            currency === 'GBP'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          £ GBP
        </button>
        <button
          onClick={() => setCurrency('USD')}
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
  );
};

export default CurrencySelector; 