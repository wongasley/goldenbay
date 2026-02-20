import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import logo from '../../../assets/images/goldenbaylogo2.svg';

const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.4, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } },
  };

  const footerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 1.6, duration: 1.2 } },
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-black overflow-hidden">
      
      <Helmet>
        <title>Golden Bay | Premium Seafood & Chinese Restaurant in Pasay</title>
        <meta name="description" content="Experience luxury Chinese dining and live seafood at Golden Bay Restaurant. Located at Diosdado Macapagal Blvd, Pasay City. Book your VIP room today!" />
        <meta name="keywords" content="seafood restaurant pasay, chinese restaurant manila, VIP dining rooms manila, live seafood, dimsum, golden bay macapagal" />
        
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "Golden Bay Fresh Seafood Restaurant",
              "image": "https://goldenbay.com.ph/static/images/golden_bay_cover.webp",
              "@id": "https://goldenbay.com.ph",
              "url": "https://goldenbay.com.ph",
              "telephone": "+63288040332",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Lot 3&4 Block A2, CBP, Diosdado Macapagal Blvd",
                "addressLocality": "Pasay City",
                "addressRegion": "Metro Manila",
                "postalCode": "1300",
                "addressCountry": "PH"
              },
              "servesCuisine": ["Chinese", "Seafood"],
              "priceRange": "$$$"
            }
          `}
        </script>
      </Helmet>

      {/* UPDATE VIDEO TAG: Removed 'poster' attribute */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover pointer-events-none transition-opacity duration-1000"
      >
        <source src="/videos/hero-background.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay - Always Dark */}
      <div className="absolute z-10 inset-0 bg-black/50"></div>

      {/* Main Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 text-center flex flex-col items-center"
      >
        <motion.div variants={itemVariants}>
          <Link to="/" className="mb-4 transition-transform duration-700 hover:scale-105 block">
            <img 
              src={logo} 
              alt="Golden Bay Logo" 
              className="h-64 md:h-[28rem] w-auto drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]" 
            />
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/menu">
            <button className="px-16 py-4 border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black transition-all duration-500 tracking-[0.4em] text-sm rounded-md uppercase bg-black/20 backdrop-blur-sm">
              Enter Experience
            </button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom Gradient - Always Black */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>

      {/* Footer - Always Light Text */}
      <motion.footer 
        variants={footerVariants}
        initial="hidden"
        animate="visible"
        className="absolute bottom-8 w-full z-20 px-12 flex flex-col md:flex-row items-center text-gold-400 text-xs tracking-[0.3em] uppercase font-light"
      >
        <div className="md:w-1/3 mb-6 md:mb-0 order-2 md:order-1 text-center md:text-left opacity-70">
          <p className="leading-relaxed">
            Lot 3&4 Block A2, CBP, <br className="hidden md:block" /> Diosdado Macapagal Blvd, Pasay
          </p>
        </div>

        <div className="md:w-1/3 flex justify-center gap-8 mb-6 md:mb-0 order-1 md:order-2">
          <a href="https://www.instagram.com/goldenbayseafoods/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition-all duration-300">Instagram</a>
          <a href="/reservations" className="hover:text-white hover:scale-110 transition-all duration-300">Reservations</a>
          <a href="/contact" className="hover:text-white hover:scale-110 transition-all duration-300">Contact</a>
        </div>

        <div className="md:w-1/3 order-3 text-center md:text-right opacity-70">
          <p>© {new Date().getFullYear()} Golden Bay Fresh Seafood</p>
        </div>
      </motion.footer>
    </div>
  );
};

export default HomePage;