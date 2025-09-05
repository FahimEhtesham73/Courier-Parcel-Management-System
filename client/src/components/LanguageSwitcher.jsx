import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="language-switcher">
      <button 
        onClick={() => changeLanguage('en')} 
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
        title="English"
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('bn')} 
        className={`lang-btn ${i18n.language === 'bn' ? 'active' : ''}`}
        title="বাংলা"
      >
        বাং
      </button>
    </div>
  );
};

export default LanguageSwitcher;