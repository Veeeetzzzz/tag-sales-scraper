import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ENG');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('pokemonCardLanguage');
    if (savedLanguage && ['ENG', 'JAP'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  const changeLanguage = (newLanguage) => {
    if (['ENG', 'JAP'].includes(newLanguage)) {
      setLanguage(newLanguage);
      localStorage.setItem('pokemonCardLanguage', newLanguage);
    }
  };

  const value = {
    language,
    setLanguage: changeLanguage,
    isJapanese: language === 'JAP',
    isEnglish: language === 'ENG'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
