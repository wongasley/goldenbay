import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Phone, Mail, MessageSquare, MonitorPlay, Users, 
  Building, X, Utensils, Heart, Star, Sparkles, ChevronRight 
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

  const venues = [
    { name: "Grand Banquet Hall", cap: "800", use: "Weddings & Large Galas", feat: "Pillar-less, LED Walls" },
    { name: "Main Dining Hall", cap: "200", use: "Corporate Luncheons", feat: "Buffet Setup, Centralized" },
    { name: "VIP Manila Room", cap: "60", use: "Private Celebrations", feat: "KTV, Private Restroom" },
  ];

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans selection:bg-gold-200">
      
      {/* --- STANDARDIZED HERO BANNER --- */}
      <div className="relative h-[45vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={heroimage} className="w-full h-full object-cover" alt="Golden Bay Grand Events" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <Link to="/" className={`text-[10px] md:text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block ${getFontClass()}`}>{t('home.back')}</Link>
          <span className={`text-gold-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-3 block ${getFontClass()}`}>{t('events.subtitle')}</span>
          <h1 className={`text-4xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md ${getFontClass()}`}>{t('events.title')}</h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
        </div>
      </div>

      {/* --- INTRO SECTION --- */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className={`text-2xl md:text-3xl font-serif mb-6 ${getFontClass()}`}>Host an Unforgettable Milestone</h2>
          <p className={`text-gray-500 leading-relaxed font-light text-sm md:text-base ${getFontClass()}`}>
            {t('events.desc')}
          </p>
        </motion.div>
      </section>

      {/* --- KEY FEATURES SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="p-8 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group rounded-sm text-center">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-gold-600 group-hover:text-white transition-colors"><Users size={28} strokeWidth={1.5} /></div>
            <h3 className={`text-lg font-serif mb-4 ${getFontClass()}`}>{t('events.f1Title')}</h3>
            <p className={`text-xs text-gray-400 leading-relaxed font-light ${getFontClass()}`}>{t('events.f1Desc')}</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }} className="p-8 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group rounded-sm text-center">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-gold-600 group-hover:text-white transition-colors"><Building size={28} strokeWidth={1.5} /></div>
            <h3 className={`text-lg font-serif mb-4 ${getFontClass()}`}>{t('events.f2Title')}</h3>
            <p className={`text-xs text-gray-400 leading-relaxed font-light ${getFontClass()}`}>{t('events.f2Desc')}</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.3 }} className="p-8 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group rounded-sm text-center">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-gold-600 group-hover:text-white transition-colors"><MonitorPlay size={28} strokeWidth={1.5} /></div>
            <h3 className={`text-lg font-serif mb-4 ${getFontClass()}`}>{t('events.f3Title')}</h3>
            <p className={`text-xs text-gray-400 leading-relaxed font-light ${getFontClass()}`}>{t('events.f3Desc')}</p>
          </motion.div>
        </div>
      </div>

      {/* --- VENUE SPECS TABLE --- */}
      <div className="bg-white border-y border-gray-100 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-lg">
              <h2 className={`text-3xl font-serif mb-4 ${getFontClass()}`}>Venue Capacities</h2>
              <p className="text-sm text-gray-400 font-light italic">Choose the perfect space based on your guest list.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gold-600 uppercase text-[10px] tracking-widest font-bold">
                  <th className="pb-4 pr-4">Function Room</th>
                  <th className="pb-4 px-4">Max Capacity (Pax)</th>
                  <th className="pb-4 px-4">Event Type</th>
                  <th className="pb-4 pl-4 text-right">Special Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {venues.map((v, i) => (
                  <tr key={i} className="hover:bg-cream-50 transition-colors group">
                    <td className="py-6 pr-4 font-serif text-lg text-gray-900">{v.name}</td>
                    <td className="py-6 px-4 text-gray-600 font-mono font-bold">{v.cap} Guests</td>
                    <td className="py-6 px-4 text-gray-500">{v.use}</td>
                    <td className="py-6 pl-4 text-right text-xs text-gold-600 font-bold uppercase tracking-wider">{v.feat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- CONTACT SPLIT SECTION --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 mt-20 border border-gray-100 bg-white shadow-2xl rounded-sm overflow-hidden">
        <div className="relative h-96 lg:h-auto overflow-hidden border-r border-gray-100">
          <img src={diningImg} alt="Event Setup" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-10 left-10 text-white">
             <div className="flex items-center gap-2 mb-2"><Sparkles size={18} className="text-gold-400" /><span className="text-[10px] font-bold uppercase tracking-widest">Premium Service</span></div>
             <h4 className="text-2xl font-serif">Tailored to perfection.</h4>
          </div>
        </div>
        
        <div className="p-12 lg:p-20 flex flex-col justify-center bg-gray-50/30">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className={`text-3xl md:text-4xl font-serif text-gray-900 mb-6 ${getFontClass()}`}>{t('events.connect')}</h2>
            <p className={`text-gray-500 text-sm leading-loose mb-10 ${getFontClass()}`}>{t('events.cDesc')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <a href="tel:+63288040332" className="flex flex-col gap-3 p-6 rounded-sm border border-gray-200 hover:border-gold-400 hover:bg-white transition-all group">
                <Phone size={20} className="text-gold-600" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-tighter">Direct Events Line</p>
                  <p className="text-sm font-bold">(02) 8804-0332</p>
                </div>
              </a>
              <a href="mailto:marketing@goldenbay.com.ph" className="flex flex-col gap-3 p-6 rounded-sm border border-gray-200 hover:border-gold-400 hover:bg-white transition-all group">
                <Mail size={20} className="text-gold-600" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-tighter">Email Inquiry</p>
                  <p className="text-sm font-bold truncate">marketing@goldenbay.com.ph</p>
                </div>
              </a>
            </div>

            <button 
              onClick={() => setShowWeChat(true)} 
              className="w-full group flex items-center justify-between p-6 rounded-sm bg-neutral-900 text-white hover:bg-black transition-all shadow-lg"
            >
              <div className="flex items-center gap-6">
                <MessageSquare size={24} className="text-green-500" />
                <div className="text-left">
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.instant')}</p>
                  <p className={`text-sm font-medium ${getFontClass()}`}>{t('events.via')}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gold-500 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>

      <div className="py-20 text-center">
         <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Milestone Partners</p>
         <div className="flex justify-center gap-12 opacity-30 grayscale contrast-125">
             {/* Add minor sponsor/milestone partner icons here if any */}
         </div>
      </div>

      {/* --- WECHAT MODAL --- */}
      <AnimatePresence>
        {showWeChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowWeChat(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white p-10 rounded-sm shadow-2xl max-w-sm w-full text-center relative border-t-4 border-green-500" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowWeChat(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"><X size={24} /></button>
              <h3 className={`text-2xl font-serif text-gray-900 mb-2 ${getFontClass()}`}>WeChat / Viber</h3>
              <div className="bg-gray-50 p-4 rounded-lg inline-block border border-gray-200 mb-8 mt-4">
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