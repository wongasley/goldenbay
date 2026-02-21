import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react'; 
import logo from '../../../assets/images/goldenbaylogo.svg'; 
import heroimage from '../../../assets/images/heroimage.webp'; 
import { useLanguage } from '../../../context/LanguageContext';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const MenuPage = () => {
  const [menuData, setMenuData] = useState([]);
  const [activeTab, setActiveTab] = useState("All"); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { t, getFontClass, getLocData, language } = useLanguage(); 

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/menu/`);
        if (!response.ok) throw new Error('Failed to fetch menu data');
        const data = await response.json();
        
        const sortedData = data.map(category => {
            const sortedItems = [...category.items].sort((a, b) => {
                if (a.code && b.code) {
                    return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
                }
                return a.name.localeCompare(b.name);
            });
            return { ...category, items: sortedItems };
        });

        setMenuData(sortedData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Unable to load menu. Please try again later.");
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const displayedCategories = menuData.map(category => {
      const filteredItems = category.items.filter(item => {
          const query = searchQuery.toLowerCase();
          return (
              item.name.toLowerCase().includes(query) ||
              (item.name_zh && item.name_zh.includes(query)) ||
              (item.name_zh_hant && item.name_zh_hant.includes(query)) ||
              (item.name_ja && item.name_ja.includes(query)) ||
              (item.name_ko && item.name_ko.includes(query)) ||
              (item.code && item.code.toLowerCase().includes(query))
          );
      });
      return { ...category, items: filteredItems };
  }).filter(category => {
      const matchesTab = activeTab === "All" || category.name === activeTab;
      return matchesTab && category.items.length > 0;
  });

  if (loading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center text-gold-600 font-serif tracking-widest uppercase animate-pulse">Loading Exquisite Dishes...</div>;
  if (error) return <div className="min-h-screen bg-cream-50 flex items-center justify-center text-red-500 font-sans">{error}</div>;

  const LiveSeafoodCard = ({ item }) => (
    <motion.div layout initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="group bg-white border border-gray-200 hover:border-gold-400/50 transition-all duration-500 rounded-sm overflow-hidden flex flex-col shadow-sm hover:shadow-lg">
        <div className="aspect-[4/3] overflow-hidden relative bg-gray-50 border-b border-gray-100">
            {item.image ? (
                <img src={`${BACKEND_URL}${item.image}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-gray-100" alt={item.name} />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center opacity-10">
                    <img src={logo} className="h-20 w-auto grayscale" alt="placeholder" />
                </div>
            )}
            <div className={`absolute top-0 right-0 bg-gold-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest z-10 ${getFontClass()}`}>
                {t('menu.liveCatch')}
            </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
            <div className="mb-4 text-center">
                <h3 className={`text-2xl font-bold text-gray-900 uppercase tracking-widest ${getFontClass()}`}>{getLocData(item, 'name')}</h3>
                {language !== 'en' && <h4 className="text-xs text-gray-500 font-sans mt-2 uppercase tracking-wider">{item.name}</h4>}
                {language === 'en' && <h4 className="text-lg text-gold-600 font-chinese mt-1">{item.name_zh}</h4>}
                <p className={`text-sm text-gray-400 mt-2 uppercase tracking-widest ${getFontClass()}`}>{t('menu.seasonal')}</p>
            </div>
            <div className="h-px w-full bg-gray-100 mb-4"></div>
            <div className="flex-1">
                <p className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center ${getFontClass()}`}>{t('menu.styles')}</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {item.cooking_methods.map((method) => (
                        <span key={method.id} className={`bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1 text-xs rounded-full hover:bg-gold-50 hover:text-gold-700 transition-colors cursor-default ${getFontClass()}`}>
                            {getLocData(method, 'name')}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 overflow-x-hidden font-sans">
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={heroimage} className="w-full h-full object-cover" alt="Interior" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center">
          <Link to="/" className={`text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block ${getFontClass()}`}>{t('home.back')}</Link>
          <h1 className={`text-5xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md ${getFontClass()}`}>{t('menu.title')}</h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
        </div>
      </div>

      <div className="px-6 py-12 md:px-24">
        
        <div className="max-w-md mx-auto mb-10 relative mt-8">
          <div className="relative flex items-center w-full h-12 rounded-full bg-white overflow-hidden border border-gray-200 focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400 transition-all shadow-sm">
            <div className="grid place-items-center h-full w-12 text-gray-400"><Search size={18} /></div>
            <input className={`peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-transparent font-medium ${getFontClass()}`} type="text" placeholder={t('menu.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <AnimatePresence>
              {searchQuery && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => setSearchQuery('')} className="grid place-items-center h-full w-12 text-gray-400 hover:text-gold-600 transition-colors"><X size={16} /></motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-20">
            <button onClick={() => { setActiveTab("All"); setSearchQuery(''); }} className={`text-sm md:text-base tracking-[0.2em] uppercase transition-all duration-300 relative pb-2 ${activeTab === "All" ? "text-gold-600 font-bold" : "text-gray-400 hover:text-gold-600"} ${getFontClass()}`}>
              {t('menu.all')}
              {activeTab === "All" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-600" />}
            </button>
          {menuData.map(cat => (
            <button key={cat.name} onClick={() => { setActiveTab(cat.name); setSearchQuery(''); }} className={`text-sm md:text-base tracking-[0.2em] uppercase transition-all duration-300 relative pb-2 ${activeTab === cat.name ? "text-gold-600 font-bold" : "text-gray-400 hover:text-gold-600"} ${getFontClass()}`}>
              {getLocData(cat, 'name')}
              {activeTab === cat.name && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-600" />}
            </button>
          ))}
        </div>

        {displayedCategories.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4"><Search size={24} /></div>
            <h3 className={`text-xl font-serif text-gray-900 mb-2 ${getFontClass()}`}>{t('menu.empty')}</h3>
            <button onClick={() => setSearchQuery('')} className={`mt-6 text-xs font-bold uppercase tracking-widest text-gold-600 border-b border-gold-600 pb-1 hover:text-black transition-colors ${getFontClass()}`}>{t('menu.clear')}</button>
          </div>
        )}

        {displayedCategories.map((category) => (
          <div key={category.id} className="mb-24">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center">
              <h2 className={`text-3xl text-gray-900 tracking-widest ${getFontClass()}`}>{getLocData(category, 'name')}</h2>
              {language !== 'en' && <h3 className="text-sm font-sans text-gold-600 mt-2 uppercase tracking-widest">{category.name}</h3>}
              {language === 'en' && <h3 className="text-2xl font-chinese text-gold-600 mt-1">{category.name_zh}</h3>}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.items.map((item) => (
                (item.cooking_methods && item.cooking_methods.length > 0) 
                    ? <LiveSeafoodCard key={item.id} item={item} />
                : <motion.div key={item.id} layout initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="group bg-white border border-gray-200 hover:border-gold-400/50 transition-all duration-500 rounded-sm overflow-hidden flex flex-col shadow-sm hover:shadow-lg">
                    <div className="aspect-[4/3] overflow-hidden relative bg-gray-50 border-b border-gray-100">
                      {item.image ? (
                        <img src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-gray-100" alt={item.name} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-10"><img src={logo} className="h-20 w-auto grayscale" alt="placeholder" /></div>
                      )}
                      <div className="absolute top-0 right-0 bg-white/95 px-4 py-2 text-xs font-bold text-gray-900 border-l border-b border-gray-100 shadow-sm z-10 tracking-widest">{item.code}</div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h3 className={`text-xl font-bold text-gray-900 uppercase tracking-wider group-hover:text-gold-600 transition-colors leading-tight ${getFontClass()}`}>
                          {getLocData(item, 'name')}
                        </h3>
                        {language !== 'en' && <h4 className="text-xs text-gray-500 font-sans mt-1 uppercase tracking-wider">{item.name}</h4>}
                        {language === 'en' && <h4 className="text-lg text-gray-500 font-chinese mt-1 font-medium">{item.name_zh}</h4>}
                      </div>
                      
                      {item.description && <p className={`text-sm text-gray-400 font-light mb-4 line-clamp-2 ${getFontClass()}`}>{getLocData(item, 'description')}</p>}

                      <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                        {item.prices.map((price) => (
                          <div key={price.id} className="flex justify-between items-center text-sm font-light tracking-wide">
                            <span className={`text-gray-500 uppercase text-sm font-bold tracking-widest ${getFontClass()}`}>{price.size === 'Regular' ? t('menu.standard') : price.size}</span>
                            <span className={`text-gray-900 text-base font-bold font-serif ${getFontClass()}`}>
                              {price.is_seasonal 
                                ? <span className="italic text-gold-600 text-sm font-sans font-normal">{t('menu.market')}</span> 
                                : `₱ ${parseFloat(price.price).toLocaleString()}`
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;