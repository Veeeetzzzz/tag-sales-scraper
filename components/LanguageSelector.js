import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Language:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setLanguage('ENG')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
            language === 'ENG'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ENG
        </button>
        <button
          onClick={() => setLanguage('JAP')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
            language === 'JAP'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          JAP
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;
