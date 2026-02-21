import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Shield, Anchor, Zap, Heart } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

// Images
import exteriorImg from '../../../assets/images/golden_bay_cover.webp';
import diningImg from '../../../assets/images/dining_area.webp';
import aquariumImg from '../../../assets/images/aquarium.webp';
import heroimage from '../../../assets/images/heroimage3.webp'; 

const Section = ({ children, className = "" }) => (
  <section className={`px-6 md:px-12 py-20 ${className}`}>
    <div className="max-w-5xl mx-auto">
      {children}
    </div>
  </section>
);

const AboutPage = () => {
  const { t, getFontClass } = useLanguage();
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const values = [
    { title: t('about.val1'), desc: t('about.val1d'), icon: Star },
    { title: t('about.val2'), desc: t('about.val2d'), icon: Shield },
    { title: t('about.val3'), desc: t('about.val3d'), icon: Anchor },
    { title: t('about.val4'), desc: t('about.val4d'), icon: Zap },
    { title: t('about.val5'), desc: t('about.val5d'), icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans selection:bg-gold-500 selection:text-white">
      
      {/* --- STANDARDIZED HERO BANNER --- */}
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={exteriorImg} className="w-full h-full object-cover" alt="Golden Bay Exterior" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <Link to="/" className={`text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block ${getFontClass()}`}>{t('home.back')}</Link>
          <h1 className={`text-4xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md ${getFontClass()}`}>{t('about.title')}</h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
        </div>
      </div>

      {/* 2. INTRODUCTION */}
      <Section className="bg-white text-center">
        <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="max-w-3xl mx-auto space-y-6"
        >
            <h2 className={`text-gold-600 text-xs font-bold uppercase tracking-[0.2em] mb-2 ${getFontClass()}`}>{t('about.since')}</h2>
            <p className={`text-xl md:text-2xl font-serif text-gray-900 leading-relaxed ${getFontClass()}`}>
              {t('about.p1')}
            </p>
            <p className={`text-gray-500 font-light leading-loose text-sm md:text-base ${getFontClass()}`}>
              {t('about.p2')}
            </p>
        </motion.div>
      </Section>

      {/* 3. VISUAL SPLIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-gray-50">
          <div className="h-64 md:h-auto overflow-hidden relative group">
               <img src={aquariumImg} alt="Fresh Seafood" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
          </div>
          <div className="p-12 md:p-20 flex flex-col justify-center space-y-10">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <h3 className={`text-2xl font-serif text-gray-900 mb-3 ${getFontClass()}`}>{t('about.vision')}</h3>
                  <p className={`text-gray-500 text-sm leading-relaxed ${getFontClass()}`}>
                      {t('about.vDesc')}
                  </p>
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <h3 className={`text-2xl font-serif text-gray-900 mb-3 ${getFontClass()}`}>{t('about.mission')}</h3>
                  <p className={`text-gray-500 text-sm leading-relaxed ${getFontClass()}`}>
                      {t('about.mDesc')}
                  </p>
              </motion.div>
          </div>
      </div>

      {/* 4. CORE VALUES */}
      <Section className="bg-white">
         <div className="text-center mb-12">
            <h2 className={`text-3xl font-serif text-gray-900 ${getFontClass()}`}>{t('about.values')}</h2>
            <div className="h-px w-16 bg-gold-400 mx-auto mt-4 opacity-50"></div>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {values.map((val, index) => (
                <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center group p-4"
                >
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-cream-100 text-gold-600 group-hover:bg-gold-600 group-hover:text-white transition-colors duration-300">
                        <val.icon size={20} />
                    </div>
                    <h4 className={`text-sm font-bold uppercase tracking-wider text-gray-900 mb-2 ${getFontClass()}`}>{val.title}</h4>
                    <p className={`text-xs text-gray-500 font-light leading-relaxed ${getFontClass()}`}>
                        {val.desc}
                    </p>
                </motion.div>
            ))}
         </div>
      </Section>

      {/* 5. SERVICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-neutral-900 text-white">
         <div className="p-12 md:p-20 flex flex-col justify-center order-2 md:order-1">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <span className={`text-gold-500 text-xs font-bold uppercase tracking-widest mb-2 block ${getFontClass()}`}>{t('about.services')}</span>
                <h2 className={`text-3xl md:text-4xl font-serif mb-6 text-white ${getFontClass()}`}>{t('about.sTitle')}</h2>
                <p className={`text-gray-400 text-sm leading-loose mb-8 ${getFontClass()}`}>
                    {t('about.sDesc')}
                </p>
                <ul className={`grid grid-cols-1 gap-3 text-sm font-light text-gray-300 mb-10 ${getFontClass()}`}>
                    <li className="flex items-center gap-3"><span className="w-1 h-1 bg-gold-500 rounded-full"></span> {t('about.s1')}</li>
                    <li className="flex items-center gap-3"><span className="w-1 h-1 bg-gold-500 rounded-full"></span> {t('about.s2')}</li>
                    <li className="flex items-center gap-3"><span className="w-1 h-1 bg-gold-500 rounded-full"></span> {t('about.s3')}</li>
                    <li className="flex items-center gap-3"><span className="w-1 h-1 bg-gold-500 rounded-full"></span> {t('about.s4')}</li>
                </ul>
                <Link to="/events">
                    <button className={`border border-gold-500 text-gold-500 px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gold-500 hover:text-white transition-all ${getFontClass()}`}>
                        {t('about.bookEvent')}
                    </button>
                </Link>
            </motion.div>
         </div>
         <div className="h-64 md:h-auto overflow-hidden order-1 md:order-2">
            <img src={diningImg} alt="Dining Hall" className="w-full h-full object-cover" />
         </div>
      </div>

    </div>
  );
};

export default AboutPage;