import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone, Mail, MessageSquare, MonitorPlay, Users, Building, X, Heart, Star, Utensils, Award } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

// Images
import heroimage from '../../../assets/images/heroimage3.webp'; 
import diningImg from '../../../assets/images/dining_area.webp';
import wechatQr from '../../../assets/images/qrcode.svg'; 

const EventInquiriesPage = () => {
  const [showWeChat, setShowWeChat] = useState(false);
  const { t, getFontClass } = useLanguage();

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans selection:bg-gold-500 selection:text-white">
      
      {/* --- HERO BANNER (Matches Menu/Reservation Style) --- */}
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={heroimage} className="w-full h-full object-cover" alt="Golden Bay Grand Events" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <Link to="/" className={`text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block ${getFontClass()}`}>
            {t('home.back')}
          </Link>
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md ${getFontClass()}`}>
            {t('events.title')}
          </h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
        </div>
      </div>

      {/* --- CONTENT SECTION 1: USP --- */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
            <span className={`text-gold-600 text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block ${getFontClass()}`}>
                {t('events.subtitle')}
            </span>
            <p className={`text-xl md:text-2xl text-gray-800 font-light leading-relaxed italic ${getFontClass()}`}>
                "{t('events.desc')}"
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-white border border-gold-200 text-gold-600 rounded-full flex items-center justify-center mb-6 shadow-sm group hover:bg-gold-600 hover:text-white transition-all duration-500">
              <Users size={28} strokeWidth={1} />
            </div>
            <h3 className={`text-xl font-serif font-bold text-gray-900 ${getFontClass()}`}>{t('events.f1Title')}</h3>
            <p className="text-sm text-gray-500 leading-loose font-light">{t('events.f1Desc')}</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-white border border-gold-200 text-gold-600 rounded-full flex items-center justify-center mb-6 shadow-sm group hover:bg-gold-600 hover:text-white transition-all duration-500">
              <Building size={28} strokeWidth={1} />
            </div>
            <h3 className={`text-xl font-serif font-bold text-gray-900 ${getFontClass()}`}>{t('events.f2Title')}</h3>
            <p className="text-sm text-gray-500 leading-loose font-light">{t('events.f2Desc')}</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }} className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-white border border-gold-200 text-gold-600 rounded-full flex items-center justify-center mb-6 shadow-sm group hover:bg-gold-600 hover:text-white transition-all duration-500">
              <MonitorPlay size={28} strokeWidth={1} />
            </div>
            <h3 className={`text-xl font-serif font-bold text-gray-900 ${getFontClass()}`}>{t('events.f3Title')}</h3>
            <p className="text-sm text-gray-500 leading-loose font-light">{t('events.f3Desc')}</p>
          </motion.div>
        </div>
      </div>

      {/* --- CONTENT SECTION 2: MILESTONES (ENGAGING ICONS) --- */}
      <div className="bg-white py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className={`text-3xl md:text-4xl font-serif text-gray-900 mb-4 ${getFontClass()}`}>{t('events.milestones')}</h2>
                <p className="text-gray-500 font-light max-w-lg mx-auto">{t('events.milestonesDesc')}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "Weddings", icon: <Heart className="w-6 h-6"/> },
                    { label: "Corporate", icon: <Award className="w-6 h-6"/> },
                    { label: "Birthdays", icon: <Star className="w-6 h-6"/> },
                    { label: "Banquets", icon: <Utensils className="w-6 h-6"/> }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center p-10 border border-gray-100 bg-cream-50/20 rounded-sm hover:border-gold-400 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                        <div className="text-gold-600 mb-6 group-hover:scale-110 transition-transform">{item.icon}</div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900">{item.label}</h4>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* --- CONTENT SECTION 3: SPECS TABLE (PROFESSIONAL LOOK) --- */}
      <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-neutral-950 text-white p-8 md:p-16 rounded-sm shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gold-600/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
              <h2 className={`text-3xl font-serif mb-12 text-center text-gold-400 ${getFontClass()}`}>{t('events.venueSpecs')}</h2>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                      <thead className="border-b border-white/10 text-gold-500 uppercase text-[10px] tracking-[0.3em] font-bold">
                          <tr>
                              <th className="pb-8">{t('events.space')}</th>
                              <th className="pb-8">{t('events.banquet')}</th>
                              <th className="pb-8">{t('events.cocktail')}</th>
                              <th className="pb-8">{t('events.amenities')}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm font-light">
                          <tr>
                              <td className="py-8 font-serif text-xl pr-6 text-white">{t('events.hallName')}</td>
                              <td className="py-8 text-lg">800 - 1,200</td>
                              <td className="py-8 text-lg">1,500</td>
                              <td className="py-8 text-gray-400 text-xs leading-relaxed uppercase tracking-wider">{t('events.hallDesc')}</td>
                          </tr>
                          <tr>
                              <td className="py-8 font-serif text-xl pr-6 text-white">{t('events.miniHall')}</td>
                              <td className="py-8 text-lg">200</td>
                              <td className="py-8 text-lg">350</td>
                              <td className="py-8 text-gray-400 text-xs leading-relaxed uppercase tracking-wider">{t('events.miniDesc')}</td>
                          </tr>
                          <tr>
                              <td className="py-8 font-serif text-xl pr-6 text-white">{t('events.vipManila')}</td>
                              <td className="py-8 text-lg">60</td>
                              <td className="py-8 text-lg">100</td>
                              <td className="py-8 text-gray-400 text-xs leading-relaxed uppercase tracking-wider">{t('events.vipDesc')}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* --- CONTENT SECTION 4: CTA SPLIT --- */}
      <div className="bg-white border-t border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="relative h-96 lg:h-auto overflow-hidden group">
            <img src={diningImg} alt="Event Setup" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          <div className="p-12 lg:p-24 flex flex-col justify-center bg-white">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className={`text-3xl md:text-5xl font-serif text-gray-900 mb-6 ${getFontClass()}`}>{t('events.connect')}</h2>
              <p className={`text-gray-500 text-sm leading-loose mb-12 max-w-md ${getFontClass()}`}>{t('events.cDesc')}</p>

              <div className="space-y-6">
                <a href="tel:+63288040332" className="flex items-center gap-6 group transition-all">
                  <div className="w-12 h-12 bg-gold-50 flex items-center justify-center rounded-full text-gold-600 group-hover:bg-gold-600 group-hover:text-white transition-all duration-300 shadow-sm"><Phone size={20} /></div>
                  <div className="border-b border-gray-100 flex-1 pb-4">
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.direct')}</p>
                    <p className="text-xl font-serif text-gray-900 group-hover:text-gold-600 transition-colors">(02) 8804-0332</p>
                  </div>
                </a>

                <a href="mailto:marketing@goldenbay.com.ph" className="flex items-center gap-6 group transition-all">
                  <div className="w-12 h-12 bg-gold-50 flex items-center justify-center rounded-full text-gold-600 group-hover:bg-gold-600 group-hover:text-white transition-all duration-300 shadow-sm"><Mail size={20} /></div>
                  <div className="border-b border-gray-100 flex-1 pb-4">
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.emailInq')}</p>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-gold-600 transition-colors">marketing@goldenbay.com.ph</p>
                  </div>
                </a>
                
                <button onClick={() => setShowWeChat(true)} className="flex items-center gap-6 group transition-all w-full text-left">
                  <div className="w-12 h-12 bg-green-50 flex items-center justify-center rounded-full text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300 shadow-sm"><MessageSquare size={20} /></div>
                  <div className="flex-1 pb-4">
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.instant')}</p>
                    <p className={`text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors ${getFontClass()}`}>{t('events.via')}</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- WECHAT MODAL --- */}
      <AnimatePresence>
        {showWeChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setShowWeChat(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white p-12 rounded-sm shadow-2xl max-w-sm w-full text-center relative border-t-4 border-green-500" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowWeChat(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-900 transition-colors"><X size={24} /></button>
              <h3 className={`text-2xl font-serif text-gray-900 mb-2 ${getFontClass()}`}>WeChat / Viber</h3>
              <div className="bg-gray-100 p-6 rounded-lg inline-block border border-gray-100 mb-8 mt-6">
                <img src={wechatQr} alt="Golden Bay WeChat QR" className="w-48 h-48 object-contain" />
              </div>
              <div className="space-y-1 pt-6 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Events Manager</p>
                <p className="text-xl font-bold text-gray-900 tracking-wider">+63 917 580 7166</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventInquiriesPage;