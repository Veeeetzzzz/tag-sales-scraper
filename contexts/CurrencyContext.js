import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('GBP');

  // Load currency preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('preferred-currency');
      if (savedCurrency && (savedCurrency === 'GBP' || savedCurrency === 'USD')) {
        setCurrency(savedCurrency);
      }
    }
  }, []);

  // Save currency preference to localStorage when it changes
  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-currency', newCurrency);
    }
  };

  const value = {
    currency,
    setCurrency: updateCurrency,
    isGBP: currency === 'GBP',
    isUSD: currency === 'USD'
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext; 