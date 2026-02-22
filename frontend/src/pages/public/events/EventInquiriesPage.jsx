import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone, Mail, MessageSquare, MonitorPlay, Users, Building, X, Heart, Star, Utensils, Award, ArrowRight, ShieldCheck, Maximize, MapPin } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

// Images
import heroimage from '../../../assets/images/heroimage3.webp'; 
import diningImg from '../../../assets/images/dining_area.webp';
import wechatQr from '../../../assets/images/qrcode.svg'; 
// MAKE SURE YOU ADD A WHATSAPP QR IMAGE TO YOUR FOLDER OR IT WILL BREAK
import whatsappQr from '../../../assets/images/qr-code-whatsapp.svg'; 

const EventInquiriesPage = () => {
  const [showWeChat, setShowWeChat] = useState(false);
  const { t, getFontClass } = useLanguage();

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans selection:bg-gold-500 selection:text-white pb-10">
      
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

      {/* --- SECTION 1: THE EXPERIENCE (Intro) --- */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-b border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          
          {/* Left Intro Text */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="lg:col-span-5 flex flex-col justify-center">
            <span className={`text-gold-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ${getFontClass()}`}>
                {t('events.subtitle')}
            </span>
            <h2 className={`text-3xl md:text-4xl font-serif text-gray-900 mb-6 leading-tight ${getFontClass()}`}>
              {t('events.headline')}
            </h2>
            <p className={`text-sm text-gray-500 font-light leading-relaxed ${getFontClass()}`}>
                {t('events.desc')}
            </p>
          </motion.div>

          {/* Right Features */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-10 lg:pl-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="flex gap-6">
              <div className="w-12 h-12 shrink-0 border border-gold-200 rounded-full flex items-center justify-center text-gold-600 shadow-sm bg-white">
                <Users size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className={`text-lg font-serif font-bold text-gray-900 mb-2 ${getFontClass()}`}>{t('events.f1Title')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light">{t('events.f1Desc')}</p>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }} className="flex gap-6">
              <div className="w-12 h-12 shrink-0 border border-gold-200 rounded-full flex items-center justify-center text-gold-600 shadow-sm bg-white">
                <Building size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className={`text-lg font-serif font-bold text-gray-900 mb-2 ${getFontClass()}`}>{t('events.f2Title')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light">{t('events.f2Desc')}</p>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.3 }} className="flex gap-6 sm:col-span-2">
              <div className="w-12 h-12 shrink-0 border border-gold-200 rounded-full flex items-center justify-center text-gold-600 shadow-sm bg-white">
                <MonitorPlay size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className={`text-lg font-serif font-bold text-gray-900 mb-2 ${getFontClass()}`}>{t('events.f3Title')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light max-w-lg">{t('events.f3Desc')}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- SECTION 1.5: THE GOLDEN BAY ADVANTAGE (Aggressive Marketing) --- */}
      <div className="bg-cream-100/50 py-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className={`text-3xl font-serif text-gray-900 mb-4 ${getFontClass()}`}>{t('events.advTitle')}</h2>
                <div className="h-px w-16 bg-gold-400 mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="bg-white p-10 rounded-sm shadow-lg border-t-4 border-gold-500 hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-12 h-12 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6">
                        <Maximize size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className={`text-xl font-serif font-bold text-gray-900 mb-4 ${getFontClass()}`}>{t('events.adv1Title')}</h3>
                    <p className={`text-sm text-gray-500 font-light leading-loose ${getFontClass()}`}>{t('events.adv1Desc')}</p>
                </motion.div>

                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }} className="bg-white p-10 rounded-sm shadow-lg border-t-4 border-gold-500 hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-12 h-12 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6">
                        <ShieldCheck size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className={`text-xl font-serif font-bold text-gray-900 mb-4 ${getFontClass()}`}>{t('events.adv2Title')}</h3>
                    <p className={`text-sm text-gray-500 font-light leading-loose ${getFontClass()}`}>{t('events.adv2Desc')}</p>
                </motion.div>

                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.3 }} className="bg-white p-10 rounded-sm shadow-lg border-t-4 border-gold-500 hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-12 h-12 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6">
                        <MapPin size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className={`text-xl font-serif font-bold text-gray-900 mb-4 ${getFontClass()}`}>{t('events.adv3Title')}</h3>
                    <p className={`text-sm text-gray-500 font-light leading-loose ${getFontClass()}`}>{t('events.adv3Desc')}</p>
                </motion.div>
            </div>
        </div>
      </div>

      {/* --- SECTION 2: MILESTONES (Dark Luxury Mode) --- */}
      <div className="bg-neutral-950 text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold-600/5 rounded-full -ml-48 -mt-48 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-600/5 rounded-full -mr-48 -mb-48 blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
                <h2 className={`text-3xl md:text-5xl font-serif text-white mb-6 ${getFontClass()}`}>
                    {t('events.milestones')}
                </h2>
                <div className="w-16 h-px bg-gold-500 mx-auto mb-6"></div>
                <p className={`text-gray-400 font-light max-w-xl mx-auto text-sm md:text-base ${getFontClass()}`}>
                    {t('events.milestonesDesc')}
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
                {[
                    { label: t('events.m1'), icon: <Heart strokeWidth={1.5} className="w-8 h-8"/> },
                    { label: t('events.m2'), icon: <Award strokeWidth={1.5} className="w-8 h-8"/> },
                    { label: t('events.m3'), icon: <Star strokeWidth={1.5} className="w-8 h-8"/> },
                    { label: t('events.m4'), icon: <Utensils strokeWidth={1.5} className="w-8 h-8"/> }
                ].map((item, i) => (
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex flex-col items-center justify-center p-8 md:p-12 border border-white/10 hover:border-gold-500/50 bg-white/[0.02] hover:bg-white/5 transition-all duration-500 group rounded-sm"
                    >
                        <div className="text-gold-500 mb-6 group-hover:-translate-y-2 transition-transform duration-500">{item.icon}</div>
                        <h4 className={`text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-gray-200 group-hover:text-white transition-colors ${getFontClass()}`}>{item.label}</h4>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>

      {/* --- SECTION 3: VENUE SPECS (Elegant List instead of Table) --- */}
      <div className="bg-white py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-6">
              <div className="mb-16">
                 <span className={`text-gold-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ${getFontClass()}`}>{t('events.capacities')}</span>
                 <h2 className={`text-3xl md:text-4xl font-serif text-gray-900 ${getFontClass()}`}>{t('events.venueSpecs')}</h2>
              </div>
              
              <div className="border-t-2 border-gray-900">
                {/* Headers */}
                <div className={`hidden md:grid grid-cols-12 gap-4 py-4 border-b border-gray-200 text-[10px] uppercase tracking-widest font-bold text-gray-400 ${getFontClass()}`}>
                    <div className="col-span-5">{t('events.space')}</div>
                    <div className="col-span-2">{t('events.banquet')}</div>
                    <div className="col-span-2">{t('events.cocktail')}</div>
                    <div className="col-span-3">{t('events.amenities')}</div>
                </div>

                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-8 border-b border-gray-100 group hover:bg-cream-50/50 transition-colors px-4 md:px-0 items-center rounded-md md:rounded-none">
                    <div className="col-span-5">
                        <h4 className={`text-xl font-serif text-gray-900 mb-1 ${getFontClass()}`}>{t('events.hallName')}</h4>
                    </div>
                    <div className="col-span-2 flex md:block items-center gap-2">
                        <span className="md:hidden text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('events.banquet')}:</span>
                        <span className="text-gray-700 font-sans">700 - 800</span>
                    </div>
                    <div className="col-span-2 flex md:block items-center gap-2">
                        <span className="md:hidden text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('events.cocktail')}:</span>
                        <span className="text-gray-700 font-sans">1,200</span>
                    </div>
                    <div className="col-span-3">
                        <span className={`text-xs text-gray-500 uppercase tracking-wider font-light ${getFontClass()}`}>{t('events.hallDesc')}</span>
                    </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-8 border-b border-gray-100 group hover:bg-cream-50/50 transition-colors px-4 md:px-0 items-center rounded-md md:rounded-none">
                    <div className="col-span-5">
                        <h4 className={`text-xl font-serif text-gray-900 mb-1 ${getFontClass()}`}>{t('events.miniHall')}</h4>
                    </div>
                    <div className="col-span-2 flex md:block items-center gap-2">
                        <span className="md:hidden text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('events.banquet')}:</span>
                        <span className="text-gray-700 font-sans">200</span>
                    </div>
                    <div className="col-span-2 flex md:block items-center gap-2">
                        <span className="md:hidden text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('events.cocktail')}:</span>
                        <span className="text-gray-700 font-sans">350</span>
                    </div>
                    <div className="col-span-3">
                        <span className={`text-xs text-gray-500 uppercase tracking-wider font-light ${getFontClass()}`}>{t('events.miniDesc')}</span>
                    </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-8 border-b border-gray-100 group hover:bg-cream-50/50 transition-colors px-4 md:px-0 items-center rounded-md md:rounded-none">
                    <div className="col-span-5">
                        <h4 className={`text-xl font-serif text-gray-900 mb-1 ${getFontClass()}`}>{t('events.vipManila')}</h4>
                    </div>
                    <div className="col-span-2 flex md:block items-center gap-2">
                        <span className="md:hidden text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('events.banquet')}:</span>
                        <span className="text-gray-700 font-sans">60</span>
                    </div>
                    <div className="col-span-2 flex md:block items-center gap-2">
                        <span className="md:hidden text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('events.cocktail')}:</span>
                        <span className="text-gray-700 font-sans">100</span>
                    </div>
                    <div className="col-span-3">
                        <span className={`text-xs text-gray-500 uppercase tracking-wider font-light ${getFontClass()}`}>{t('events.vipDesc')}</span>
                    </div>
                </div>
              </div>

          </div>
      </div>

      {/* --- SECTION 4: THE CONCIERGE (CTA) --- */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
        <div className="bg-neutral-900 overflow-hidden flex flex-col lg:flex-row shadow-2xl rounded-sm">
          
          {/* Image Panel */}
          <div className="w-full lg:w-1/2 h-[400px] lg:h-auto relative">
            <img src={diningImg} alt="Golden Bay Event Setup" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Contact Panel */}
          <div className="w-full lg:w-1/2 p-10 md:p-16 lg:p-24 flex flex-col justify-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <span className={`text-gold-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ${getFontClass()}`}>{t('events.consultation')}</span>
              <h2 className={`text-3xl md:text-5xl font-serif text-white mb-6 leading-tight ${getFontClass()}`}>{t('events.connect')}</h2>
              <p className={`text-gray-400 text-sm leading-loose mb-12 font-light ${getFontClass()}`}>{t('events.cDesc')}</p>

              {/* Minimalist Contact Links */}
              <div className="space-y-2">
                <a href="tel:+63288040332" className="flex items-center justify-between group py-5 border-b border-white/10 hover:border-gold-500 transition-colors">
                  <div className="flex items-center gap-6">
                      <Phone size={20} strokeWidth={1.5} className="text-gold-500" />
                      <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 ${getFontClass()}`}>{t('events.direct')}</p>
                          <p className="text-lg text-white font-light group-hover:text-gold-400 transition-colors font-sans">(02) 8804-0332</p>
                      </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-gold-500 transition-colors transform group-hover:translate-x-1" />
                </a>

                <a href="mailto:marketing@goldenbay.com.ph" className="flex items-center justify-between group py-5 border-b border-white/10 hover:border-gold-500 transition-colors">
                  <div className="flex items-center gap-6">
                      <Mail size={20} strokeWidth={1.5} className="text-gold-500" />
                      <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 ${getFontClass()}`}>{t('events.emailInq')}</p>
                          <p className="text-sm text-white font-light group-hover:text-gold-400 transition-colors">marketing@goldenbay.com.ph</p>
                      </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-gold-500 transition-colors transform group-hover:translate-x-1" />
                </a>
                
                {/* FORCED SCROLL TO TOP ON CLICK */}
                <button 
                  onClick={() => {
                      setShowWeChat(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="w-full flex items-center justify-between group py-5 border-b border-transparent hover:border-green-500 transition-colors text-left"
                >
                  <div className="flex items-center gap-6">
                      <MessageSquare size={20} strokeWidth={1.5} className="text-green-500" />
                      <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 ${getFontClass()}`}>{t('events.instant')}</p>
                          <p className={`text-sm text-white font-light group-hover:text-green-400 transition-colors ${getFontClass()}`}>{t('events.via')}</p>
                      </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-green-500 transition-colors transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- WECHAT / WHATSAPP MODAL --- */}
      <AnimatePresence>
        {showWeChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setShowWeChat(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white p-12 rounded-sm shadow-2xl max-w-2xl w-full text-center relative" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#07c160] to-[#25D366]"></div>
              
              <button onClick={() => setShowWeChat(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
                <X size={24} strokeWidth={1.5} />
              </button>
              
              <h3 className={`text-2xl font-serif text-gray-900 mb-2 mt-2 ${getFontClass()}`}>WeChat / WhatsApp</h3>
              <p className={`text-xs text-gray-500 font-light mb-8 ${getFontClass()}`}>{t('events.scanQR')}</p>
              
              <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
                  {/* WeChat QR */}
                  <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 flex flex-col items-center">
                    <img src={wechatQr} alt="WeChat QR" className="w-40 h-40 object-contain mb-4" />
                    <p className="font-bold text-[10px] text-[#07c160] uppercase tracking-widest">WeChat</p>
                  </div>

                  {/* WhatsApp QR */}
                  <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 flex flex-col items-center">
                    <img src={whatsappQr} alt="WhatsApp QR" className="w-40 h-40 object-contain mb-4" />
                    <p className="font-bold text-[10px] text-[#25D366] uppercase tracking-widest">WhatsApp</p>
                  </div>
              </div>
              
              <div className="space-y-1 pt-6 border-t border-gray-100">
                <p className={`text-[10px] text-gray-400 uppercase tracking-[0.2em] font-sans ${getFontClass()}`}>{t('events.coordinator')}</p>
                <p className="text-xl font-serif font-bold text-gray-900 tracking-wider font-sans">+63 917 580 7166</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EventInquiriesPage;