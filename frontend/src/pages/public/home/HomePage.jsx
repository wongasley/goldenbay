import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import logo from '../../../assets/images/goldenbaylogo2.svg';
import { useLanguage } from '../../../context/LanguageContext';
import SEO from '../../../components/seo/SEO';

const HomePage = () => {
  const { t, getFontClass } = useLanguage();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.3, delayChildren: 0.2 } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  const footerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 1.5, duration: 1.5 } },
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Golden Bay Fresh Seafood Restaurant",
    "image": "https://goldenbay.com.ph/assets/images/golden_bay_cover.webp",
    "url": "https://goldenbay.com.ph",
    "telephone": "+63288040332",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Lot 3&4 Block A2, Diosdado Macapagal Blvd, CBP",
      "addressLocality": "Pasay City",
      "addressRegion": "Metro Manila",
      "addressCountry": "PH"
    },
    "servesCuisine": "Chinese, Seafood",
    "priceRange": "$$$"
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-black overflow-hidden font-sans">
      {/* --- ADD SEO & SCHEMA --- */}
      <SEO 
        title="Premium Seafood & Chinese Restaurant" 
        description="Experience luxury Chinese dining and live seafood at Golden Bay Restaurant. Located at Diosdado Macapagal Blvd, Pasay City. Book your VIP room today!" 
      />
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>

      <Helmet>
        <title>Golden Bay | Premium Seafood & Chinese Restaurant</title>
        <meta name="description" content="Experience luxury Chinese dining and live seafood at Golden Bay Restaurant. Located at Diosdado Macapagal Blvd, Pasay City. Book your VIP room today!" />
      </Helmet>

      {/* Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000"
      >
        <source src="/videos/hero-background.mp4" type="video/mp4" />
      </video>

      {/* Overlays for better readability */}
      <div className="absolute inset-0 z-10 bg-black/40"></div>
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/20 to-black/60"></div>
      
      {/* Main Content */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="relative z-20 flex flex-col items-center justify-center w-full max-w-4xl px-6 text-center"
      >
        <motion.div variants={itemVariants} className="mb-10 w-full flex justify-center">
          <Link to="/menu" className="transition-transform duration-700 hover:scale-105 block group">
            <img 
              src={logo} 
              alt="Golden Bay Logo" 
              className="w-64 md:w-96 lg:w-[26rem] h-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] filter brightness-110 contrast-125" 
            />
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/menu">
            <button className={`
              group relative overflow-hidden px-10 py-4 
              border border-gold-400/50 text-gold-400 
              transition-all duration-500 rounded-sm 
              uppercase tracking-[0.3em] text-xs font-medium 
              bg-black/30 backdrop-blur-md hover:border-gold-400 hover:text-white
              shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)]
              ${getFontClass()}
            `}>
              <span className="relative z-10">{t('home.enter')}</span>
              <div className="absolute inset-0 bg-gold-400/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"></div>

      {/* Footer / Links */}
      <motion.footer 
        variants={footerVariants} 
        initial="hidden" 
        animate="visible" 
        className={`absolute bottom-6 w-full z-20 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between text-gray-400 text-[10px] md:text-xs tracking-[0.2em] uppercase font-light gap-6 ${getFontClass()}`}
      >
        <div className="md:w-1/3 text-center md:text-left order-2 md:order-1 opacity-60">
          <p className="leading-relaxed max-w-[250px] mx-auto md:mx-0">
            {t('home.loc')}
          </p>
        </div>

        <div className="md:w-1/3 flex justify-center gap-8 order-1 md:order-2">
          <a href="https://www.instagram.com/goldenbayseafoods/" target="_blank" rel="noopener noreferrer" className="hover:text-gold-400 hover:scale-105 transition-all duration-300">Instagram</a>
          <Link to="/vip-rooms" className="hover:text-gold-400 hover:scale-105 transition-all duration-300">{t('nav.rooms')}</Link>
          <Link to="/contact" className="hover:text-gold-400 hover:scale-105 transition-all duration-300">{t('nav.contact')}</Link>
        </div>

        <div className="md:w-1/3 text-center md:text-right order-3 opacity-60">
          <p>© {new Date().getFullYear()} Golden Bay</p>
        </div>
      </motion.footer>
      
    </div>
  );
};

export default HomePage;