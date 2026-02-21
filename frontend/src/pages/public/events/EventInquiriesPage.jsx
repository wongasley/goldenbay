import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Phone, Mail, MessageSquare, MonitorPlay, Users, 
  Building, ChevronDown, X, Utensils, Music, Calendar 
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

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

  const eventTypes = [
    { title: "Grand Weddings", icon: <Heart className="w-6 h-6 text-gold-600" /> },
    { title: "Corporate Galas", icon: <Building className="w-6 h-6 text-gold-600" /> },
    { title: "Debut & Birthdays", icon: <Star className="w-6 h-6 text-gold-600" /> },
    { title: "Engagement Parties", icon: <Utensils className="w-6 h-6 text-gold-600" /> },
  ];

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans selection:bg-gold-200">
      
      {/* --- HERO SECTION --- */}
      <div className="relative h-[60vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-50">
          <img src={heroimage} className="w-full h-full object-cover" alt="Golden Bay Grand Events" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.span 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-gold-500 text-xs font-bold uppercase tracking-[0.4em] mb-4 block ${getFontClass()}`}
          >
            {t('events.subtitle')}
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`text-5xl md:text-7xl font-serif tracking-tight text-white mb-6 ${getFontClass()}`}
          >
            {t('events.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className={`text-gray-200 text-sm md:text-lg font-light leading-relaxed max-w-2xl mx-auto ${getFontClass()}`}
          >
            {t('events.desc')}
          </motion.p>
        </div>
      </div>

      {/* --- KEY FEATURES SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-4xl font-serif mb-4 ${getFontClass()}`}>World-Class Amenities</h2>
          <div className="w-20 h-px bg-gold-400 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="group">
            <div className="w-20 h-20 mx-auto bg-white border border-gold-100 text-gold-600 rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:bg-gold-600 group-hover:text-white transition-all duration-500">
              <Users size={32} strokeWidth={1} />
            </div>
            <h3 className={`text-xl font-serif mb-4 ${getFontClass()}`}>{t('events.f1Title')}</h3>
            <p className={`text-sm text-gray-500 leading-relaxed font-light px-4 ${getFontClass()}`}>{t('events.f1Desc')}</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }} className="group">
            <div className="w-20 h-20 mx-auto bg-white border border-gold-100 text-gold-600 rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:bg-gold-600 group-hover:text-white transition-all duration-500">
              <Building size={32} strokeWidth={1} />
            </div>
            <h3 className={`text-xl font-serif mb-4 ${getFontClass()}`}>{t('events.f2Title')}</h3>
            <p className={`text-sm text-gray-500 leading-relaxed font-light px-4 ${getFontClass()}`}>{t('events.f2Desc')}</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.3 }} className="group">
            <div className="w-20 h-20 mx-auto bg-white border border-gold-100 text-gold-600 rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:bg-gold-600 group-hover:text-white transition-all duration-500">
              <MonitorPlay size={32} strokeWidth={1} />
            </div>
            <h3 className={`text-xl font-serif mb-4 ${getFontClass()}`}>{t('events.f3Title')}</h3>
            <p className={`text-sm text-gray-500 leading-relaxed font-light px-4 ${getFontClass()}`}>{t('events.f3Desc')}</p>
          </motion.div>
        </div>
      </div>

      {/* --- EVENT TYPES SECTION --- */}
      <div className="bg-neutral-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
             <h2 className={`text-3xl font-serif text-gold-500 mb-4 ${getFontClass()}`}>Milestones We Host</h2>
             <p className="text-gray-400 text-sm font-light">Tailored catering and dedicated coordination for every occasion.</p>
          </div>
          {["Weddings", "Conferences", "Debuts", "Corporate Events"].map((item, i) => (
            <div key={i} className="border-l border-white/10 pl-6 py-2">
              <span className="text-gold-500 text-xs font-bold block mb-2">0{i+1}</span>
              <h4 className="text-xl font-serif tracking-wide">{item}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* --- CAPACITY TABLE SECTION --- */}
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="bg-white p-8 md:p-12 border border-gray-100 shadow-xl rounded-sm">
          <h2 className={`text-2xl font-serif text-center mb-10 ${getFontClass()}`}>Venue Specifications</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-100 text-gold-600 uppercase text-[10px] tracking-widest font-bold">
                <tr>
                  <th className="pb-4">Function Space</th>
                  <th className="pb-4">Banquet (Pax)</th>
                  <th className="pb-4">Cocktail (Pax)</th>
                  <th className="pb-4">Amenities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-600">
                <tr className="hover:bg-cream-50 transition-colors">
                  <td className="py-5 font-medium text-gray-900">Grand Banquet Hall</td>
                  <td className="py-5">800</td>
                  <td className="py-5">1,200</td>
                  <td className="py-5 text-xs">Stage, LED Wall, Full Audio</td>
                </tr>
                <tr className="hover:bg-cream-50 transition-colors">
                  <td className="py-5 font-medium text-gray-900">Main Dining (Mini-Banquet)</td>
                  <td className="py-5">200</td>
                  <td className="py-5">350</td>
                  <td className="py-5 text-xs">Standard AV, Buffet Area</td>
                </tr>
                <tr className="hover:bg-cream-50 transition-colors">
                  <td className="py-5 font-medium text-gray-900">VIP Manila Room</td>
                  <td className="py-5">60</td>
                  <td className="py-5">80</td>
                  <td className="py-5 text-xs">Private Restroom, KTV</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- CONTACT SPLIT SECTION --- */}
      <div className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          <div className="relative h-[500px] lg:h-auto overflow-hidden">
            <img src={diningImg} alt="Event Setup" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <div className="p-12 lg:p-24 flex flex-col justify-center bg-cream-50/50">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className={`text-3xl md:text-5xl font-serif text-gray-900 mb-6 ${getFontClass()}`}>{t('events.connect')}</h2>
              <p className={`text-gray-500 text-sm leading-loose mb-10 font-light max-w-md ${getFontClass()}`}>{t('events.cDesc')}</p>

              <div className="space-y-4">
                <a href="tel:+63288040332" className="group flex items-center gap-6 p-6 rounded-sm border border-gray-200 hover:border-gold-400 hover:shadow-lg transition-all bg-white">
                  <div className="w-12 h-12 bg-gold-50 flex items-center justify-center rounded-full text-gold-600 group-hover:bg-gold-600 group-hover:text-white transition-all duration-300"><Phone size={20} /></div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.direct')}</p>
                    <p className="text-xl font-serif text-gray-900">(02) 8804-0332</p>
                  </div>
                </a>
                <a href="mailto:marketing@goldenbay.com.ph" className="group flex items-center gap-6 p-6 rounded-sm border border-gray-200 hover:border-gold-400 hover:shadow-lg transition-all bg-white">
                  <div className="w-12 h-12 bg-gold-50 flex items-center justify-center rounded-full text-gold-600 group-hover:bg-gold-600 group-hover:text-white transition-all duration-300"><Mail size={20} /></div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.emailInq')}</p>
                    <p className="text-sm font-medium text-gray-900">marketing@goldenbay.com.ph</p>
                  </div>
                </a>
                <button onClick={() => setShowWeChat(true)} className="w-full group flex items-center gap-6 p-6 rounded-sm border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all bg-white text-left">
                  <div className="w-12 h-12 bg-green-50 flex items-center justify-center rounded-full text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300"><MessageSquare size={20} /></div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.instant')}</p>
                    <p className={`text-sm font-medium text-gray-900 ${getFontClass()}`}>{t('events.via')}</p>
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
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" 
            onClick={() => setShowWeChat(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} 
              className="bg-white p-10 rounded-sm shadow-2xl max-w-sm w-full text-center relative border-t-4 border-green-500" 
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowWeChat(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-900 transition-colors"><X size={24} /></button>
              <h3 className={`text-2xl font-serif text-gray-900 mb-2 ${getFontClass()}`}>WeChat / Viber</h3>
              <div className="bg-gray-50 p-4 rounded-lg inline-block border border-gray-100 mb-8 mt-4">
                <img src={wechatQr} alt="Golden Bay WeChat QR" className="w-48 h-48 object-contain opacity-80" />
              </div>
              <div className="space-y-2 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Direct Event Mobile</p>
                <p className="text-2xl font-bold text-gray-900 tracking-wider">+63 917 580 7166</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventInquiriesPage;