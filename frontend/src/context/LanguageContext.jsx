import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Load saved language or default to English
    const [language, setLanguage] = useState(() => localStorage.getItem('siteLang') || 'en');

    useEffect(() => {
        localStorage.setItem('siteLang', language);
    }, [language]);

    // Simple nested key translator: t('nav.menu')
    const t = (key) => {
        const keys = key.split('.');
        let result = translations[language];
        for (const k of keys) {
            if (!result || result[k] === undefined) return key; // Fallback to key name if missing
            result = result[k];
        }
        return result;
    };

    // Font dynamic class
    const getFontClass = () => {
        switch(language) {
            case 'zh': return 'font-chinese';
            case 'zh_hant': return 'font-chinese_traditional';
            case 'ja': return 'font-japanese';
            case 'ko': return 'font-korean';
            default: return 'font-serif';
        }
    };

    // Helper to extract translated data from API models
    const getLocData = (obj, fieldName) => {
        if (!obj) return "";
        if (language === 'en') return obj[fieldName];
        return obj[`${fieldName}_${language}`] || obj[fieldName];
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, getFontClass, getLocData }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);