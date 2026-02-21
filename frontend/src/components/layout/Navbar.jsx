import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
import logo from '../../assets/images/goldenbaylogo.svg';
import { useLanguage } from '../../context/LanguageContext';

const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: t('nav.menu'), path: '/menu' },
    { name: t('nav.events'), path: '/events' },
    { name: t('nav.news'), path: '/news' },
    { name: t('nav.rooms'), path: '/vip-rooms' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 flex flex-col">
      {/* 1. Language Bar */}
      <div className="w-full bg-black text-gray-400 py-1.5 px-6 flex justify-end items-center gap-3 text-[9px] md:text-[10px] uppercase tracking-widest relative z-[60]">
          <Globe size={12} className="text-gold-500" />
          <button onClick={() => setLanguage('en')} className={`transition-colors ${language === 'en' ? 'text-gold-500 font-bold' : 'hover:text-white'}`}>EN</button>
          <span>|</span>
          <button onClick={() => setLanguage('zh')} className={`transition-colors ${language === 'zh' ? 'text-gold-500 font-bold' : 'hover:text-white'}`}>简</button>
          <span>|</span>
          <button onClick={() => setLanguage('zh_hant')} className={`transition-colors ${language === 'zh_hant' ? 'text-gold-500 font-bold' : 'hover:text-white'}`}>繁</button>
          <span>|</span>
          <button onClick={() => setLanguage('ja')} className={`transition-colors ${language === 'ja' ? 'text-gold-500 font-bold' : 'hover:text-white'}`}>JA</button>
          <span>|</span>
          <button onClick={() => setLanguage('ko')} className={`transition-colors ${language === 'ko' ? 'text-gold-500 font-bold' : 'hover:text-white'}`}>KO</button>
      </div>

      {/* 2. Main Navigation (Removed top-7, it now naturally flows under the language bar) */}
      <nav className={`w-full transition-all duration-300 ${
        isHomePage && !isMobileMenuOpen
          ? 'bg-black/20 backdrop-blur-sm border-b border-white/5' 
          : 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 md:h-24 flex justify-between items-center">
          
          <Link to="/" className="flex items-center z-50">
              <img src={logo} alt="Golden Bay Logo" className={`h-12 md:h-14 w-auto hover:opacity-80 transition-all duration-300 ${isMobileMenuOpen ? 'invert grayscale opacity-100' : ''}`} />
          </Link>

          <div className={`hidden lg:flex items-center space-x-8 text-[11px] uppercase tracking-[0.2em] font-light ${isHomePage ? 'text-gray-300' : 'text-gray-600'}`}>
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="hover:text-gold-500 transition-colors">
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 z-50">
            <Link to="/reservations" className="hidden sm:block">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-sm transition-colors
                  ${isHomePage && !isMobileMenuOpen ? 'bg-gold-500 text-white hover:bg-white hover:text-black' : 'bg-gold-600 text-white hover:bg-black hover:text-white'}`}
              >
                {t('nav.book')}
              </motion.button>
            </Link>

            <button className={`lg:hidden p-2 focus:outline-none transition-colors ${isHomePage && !isMobileMenuOpen ? 'text-white' : 'text-gray-900'}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE FULLSCREEN MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 pb-6 flex flex-col justify-between md:hidden overflow-y-auto"
          >
            <div className="flex flex-col space-y-6 pt-10">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                >
                  <Link 
                    to={link.path} 
                    className="block text-2xl font-serif text-gray-900 hover:text-gold-600 transition-colors pb-4 border-b border-gray-100"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              {/* Mobile CTA (always visible on mobile) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-6"
              >
                <Link to="/reservations" className="block w-full">
                  <button className="w-full bg-gold-600 text-white font-bold py-4 text-sm uppercase tracking-widest rounded-sm hover:bg-black transition-colors">
                    Book a Table
                  </button>
                </Link>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center text-xs text-gray-500 uppercase tracking-widest space-y-2"
            >
              <p>Lot 3&4 Block A2, Diosdado Macapagal Blvd</p>
              <p>(02) 8804-0332</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;