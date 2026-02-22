import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, X, ZoomIn } from 'lucide-react'; 
import logo from '../../../assets/images/goldenbaylogo.svg'; 
import heroimage from '../../../assets/images/heroimage.webp'; 
import { useLanguage } from '../../../context/LanguageContext';
import SEO from '../../../components/seo/SEO';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const MenuPage = () => {
  const [menuData, setMenuData] = useState([]);
  const [activeTab, setActiveTab] = useState("All"); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // NEW: State to hold the currently selected dish for the Lightbox
  const [selectedDish, setSelectedDish] = useState(null);
  
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

  // Lock body scroll when Lightbox is open
  useEffect(() => {
    if (selectedDish) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedDish]);

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
    <motion.div 
        layout 
        initial={{ opacity: 0 }} 
        whileInView={{ opacity: 1 }} 
        onClick={() => setSelectedDish(item)}
        className="group bg-white border border-gray-200 hover:border-gold-400/50 transition-all duration-500 rounded-sm overflow-hidden flex flex-col shadow-sm hover:shadow-xl cursor-pointer"
    >
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
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <ZoomIn className="text-white w-8 h-8 opacity-80" />
            </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
            <div className="mb-4 text-center">
                <h3 className={`text-2xl font-bold text-gray-900 uppercase tracking-widest group-hover:text-gold-600 transition-colors ${getFontClass()}`}>{getLocData(item, 'name')}</h3>
                {language !== 'en' && <h4 className="text-xs text-gray-500 font-sans mt-2 uppercase tracking-wider">{item.name}</h4>}
                {language === 'en' && <h4 className="text-lg text-gold-600 font-chinese mt-1">{item.name_zh}</h4>}
                <p className={`text-sm text-gray-400 mt-2 uppercase tracking-widest ${getFontClass()}`}>{t('menu.seasonal')}</p>
            </div>
            <div className="h-px w-full bg-gray-100 mb-4 transition-colors group-hover:bg-gold-200"></div>
            <div className="flex-1">
                <p className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center ${getFontClass()}`}>{t('menu.styles')}</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {item.cooking_methods.map((method) => (
                        <span key={method.id} className={`bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1 text-xs rounded-full group-hover:border-gold-200 transition-colors ${getFontClass()}`}>
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
      <SEO 
        title="Exquisite Menu & Live Catch" 
        description="Browse our selection of premium Chinese cuisine, dimsum, and live catch seafood cooked to your preference."
      />
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
        
        {/* Search Bar */}
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

        {/* Category Tabs */}
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
                : <motion.div 
                    key={item.id} layout initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} 
                    onClick={() => setSelectedDish(item)}
                    className="group bg-white border border-gray-200 hover:border-gold-400/50 transition-all duration-500 rounded-sm overflow-hidden flex flex-col shadow-sm hover:shadow-xl cursor-pointer"
                  >
                    <div className="aspect-[4/3] overflow-hidden relative bg-gray-50 border-b border-gray-100">
                      {item.image ? (
                        <img src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-gray-100" alt={item.name} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-10"><img src={logo} className="h-20 w-auto grayscale" alt="placeholder" /></div>
                      )}
                      <div className="absolute top-0 right-0 bg-white/95 px-4 py-2 text-xs font-bold text-gray-900 border-l border-b border-gray-100 shadow-sm z-10 tracking-widest">{item.code}</div>
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ZoomIn className="text-white w-8 h-8 opacity-80" />
                      </div>
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

                      <div className="mt-auto pt-4 border-t border-gray-100 space-y-2 group-hover:border-gold-200 transition-colors">
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

      {/* --- LUXURY IMAGE LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {selectedDish && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
                onClick={() => setSelectedDish(null)}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-sm shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden relative"
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setSelectedDish(null)}
                        className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-gold-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>

                    {/* Left: High Res Image */}
                    <div className="w-full md:w-3/5 h-[30vh] md:h-[600px] bg-gray-100 relative">
                        {selectedDish.image ? (
                            <img 
                                src={selectedDish.image.startsWith('http') ? selectedDish.image : `${BACKEND_URL}${selectedDish.image}`} 
                                alt={selectedDish.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                <img src={logo} className="w-32 h-auto grayscale" alt="logo" />
                            </div>
                        )}
                        {/* Elegant Item Code overlay */}
                        {selectedDish.code && (
                             <div className="absolute top-0 left-0 bg-gold-600 text-white px-4 py-2 text-sm font-bold tracking-widest shadow-md">
                                 {selectedDish.code}
                             </div>
                        )}
                    </div>

                    {/* Right: Dish Details */}
                    <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center bg-cream-50">
                        <div className="mb-6">
                            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-widest leading-tight ${getFontClass()}`}>
                                {getLocData(selectedDish, 'name')}
                            </h2>
                            {language !== 'en' && <h3 className="text-sm text-gray-500 font-sans mt-2 uppercase tracking-widest">{selectedDish.name}</h3>}
                            {language === 'en' && <h3 className="text-2xl text-gold-600 font-chinese mt-2">{selectedDish.name_zh}</h3>}
                        </div>

                        {selectedDish.description && (
                            <p className={`text-base text-gray-600 font-light leading-relaxed mb-8 ${getFontClass()}`}>
                                {getLocData(selectedDish, 'description')}
                            </p>
                        )}

                        <div className="w-12 h-1 bg-gold-400 mb-8"></div>

                        {/* Prices OR Cooking Methods */}
                        {selectedDish.cooking_methods && selectedDish.cooking_methods.length > 0 ? (
                            <div>
                                <p className={`text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 ${getFontClass()}`}>{t('menu.styles')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedDish.cooking_methods.map((method) => (
                                        <span key={method.id} className={`bg-white border border-gray-200 text-gray-700 px-4 py-2 text-sm rounded-sm ${getFontClass()}`}>
                                            {getLocData(method, 'name')}
                                        </span>
                                    ))}
                                </div>
                                <p className={`mt-6 text-sm text-gold-600 uppercase tracking-widest font-bold ${getFontClass()}`}>{t('menu.seasonal')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedDish.prices.map((price) => (
                                    <div key={price.id} className="flex justify-between items-end border-b border-gray-200 pb-2">
                                        <span className={`text-gray-500 uppercase text-sm font-bold tracking-widest ${getFontClass()}`}>
                                            {price.size === 'Regular' ? t('menu.standard') : price.size}
                                        </span>
                                        <span className={`text-gray-900 text-2xl font-bold font-serif ${getFontClass()}`}>
                                            {price.is_seasonal 
                                                ? <span className="italic text-gold-600 text-lg font-sans font-normal">{t('menu.market')}</span> 
                                                : `₱ ${parseFloat(price.price).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuPage;