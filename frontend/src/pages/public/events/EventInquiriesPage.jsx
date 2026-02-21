import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone, Mail, MessageSquare, MonitorPlay, Users, Building, ChevronDown, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

import heroimage from '../../../assets/images/heroimage3.webp'; 
import diningImg from '../../../assets/images/dining_area.webp';
import wechatQr from '../../../assets/images/qrcode.svg'; 

const EventInquiriesPage = () => {
  const [showWeChat, setShowWeChat] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const { t, getFontClass } = useLanguage();

  const toggleFaq = (index) => setActiveFaq(activeFaq === index ? null : index);
  const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } };

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans">
      
      <div className="relative h-[50vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-50">
          <img src={heroimage} className="w-full h-full object-cover" alt="Golden Bay Grand Events" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <span className={`text-gold-500 text-xs font-bold uppercase tracking-[0.3em] mb-4 block ${getFontClass()}`}>{t('events.subtitle')}</span>
          <h1 className={`text-4xl md:text-6xl font-serif tracking-widest text-white drop-shadow-lg mb-6 ${getFontClass()}`}>{t('events.title')}</h1>
          <p className={`text-gray-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed ${getFontClass()}`}>
            {t('events.desc')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6"><Users size={28} strokeWidth={1.5} /></div>
            <h3 className={`text-xl font-serif text-gray-900 ${getFontClass()}`}>{t('events.f1Title')}</h3>
            <p className={`text-sm text-gray-500 leading-relaxed font-light px-4 ${getFontClass()}`}>{t('events.f1Desc')}</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }} className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6"><Building size={28} strokeWidth={1.5} /></div>
            <h3 className={`text-xl font-serif text-gray-900 ${getFontClass()}`}>{t('events.f2Title')}</h3>
            <p className={`text-sm text-gray-500 leading-relaxed font-light px-4 ${getFontClass()}`}>{t('events.f2Desc')}</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.3 }} className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6"><MonitorPlay size={28} strokeWidth={1.5} /></div>
            <h3 className={`text-xl font-serif text-gray-900 ${getFontClass()}`}>{t('events.f3Title')}</h3>
            <p className={`text-sm text-gray-500 leading-relaxed font-light px-4 ${getFontClass()}`}>{t('events.f3Desc')}</p>
          </motion.div>
        </div>
      </div>

      <div className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          <div className="relative h-96 lg:h-auto overflow-hidden">
            <img src={diningImg} alt="Event Setup" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <div className="p-12 lg:p-24 flex flex-col justify-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className={`text-3xl md:text-4xl font-serif text-gray-900 mb-6 ${getFontClass()}`}>{t('events.connect')}</h2>
              <p className={`text-gray-500 text-sm leading-loose mb-10 ${getFontClass()}`}>{t('events.cDesc')}</p>

              <div className="space-y-4">
                <a href="tel:+63288040332" className="group flex items-center gap-6 p-5 rounded-sm border border-gray-200 hover:border-gold-400 hover:shadow-md transition-all bg-gray-50 hover:bg-white">
                  <div className="text-gold-600 group-hover:scale-110 transition-transform"><Phone size={24} /></div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.direct')}</p>
                    <p className="text-lg font-serif text-gray-900">(02) 8804-0332</p>
                  </div>
                </a>
                <a href="mailto:marketing@goldenbay.com.ph" className="group flex items-center gap-6 p-5 rounded-sm border border-gray-200 hover:border-gold-400 hover:shadow-md transition-all bg-gray-50 hover:bg-white">
                  <div className="text-gold-600 group-hover:scale-110 transition-transform"><Mail size={24} /></div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ${getFontClass()}`}>{t('events.emailInq')}</p>
                    <p className="text-sm font-medium text-gray-900">marketing@goldenbay.com.ph</p>
                  </div>
                </a>
                <button onClick={() => setShowWeChat(true)} className="w-full group flex items-center gap-6 p-5 rounded-sm border border-gray-200 hover:border-green-400 hover:shadow-md transition-all bg-gray-50 hover:bg-white text-left">
                  <div className="text-green-600 group-hover:scale-110 transition-transform"><MessageSquare size={24} /></div>
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

      <AnimatePresence>
        {showWeChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowWeChat(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white p-10 rounded-sm shadow-2xl max-w-sm w-full text-center relative border-t-4 border-green-500" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowWeChat(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"><X size={24} /></button>
              <h3 className={`text-2xl font-serif text-gray-900 mb-2 ${getFontClass()}`}>WeChat / Viber</h3>
              <div className="bg-gray-50 p-4 rounded-lg inline-block border border-gray-200 mb-8 mt-4">
                <img src={wechatQr} alt="Golden Bay WeChat QR" className="w-48 h-48 object-contain opacity-80" />
              </div>
              <div className="space-y-2 pt-6 border-t border-gray-100">
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