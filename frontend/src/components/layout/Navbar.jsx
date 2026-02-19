import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../../assets/images/goldenbaylogo.svg';

const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      // Home = Transparent (Dark overlay underneath)
      // Others = White background with shadow
      isHomePage 
        ? 'bg-black/20 backdrop-blur-sm border-b border-white/5' 
        : 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center">
            <img 
                src={logo} 
                alt="Golden Bay Logo" 
                // On Home: Standard. On others: Might need filter if logo is white-only.
                // Assuming logo is Gold, it works on both Black and White.
                className="h-14 w-auto hover:opacity-80 transition-opacity" 
            />
        </Link>

        {/* NAVIGATION LINKS */}
        <div className={`hidden md:flex items-center space-x-12 text-xs uppercase tracking-[0.2em] font-light
                        ${isHomePage ? 'text-gray-300' : 'text-gray-600'}`}>
          <Link to="/menu" className="hover:text-gold-500 transition-colors">Menu</Link>
          <Link to="/events" className="hover:text-gold-500 transition-colors">Events</Link>
          <Link to="/news" className="hover:text-gold-500 transition-colors">News & Promos</Link>
          <Link to="/about" className="hover:text-gold-500 transition-colors">About Us</Link>
          <Link to="/vip-rooms" className="hover:text-gold-500 transition-colors">Private Rooms</Link> {/* Added */}
          {/* Admin link hidden or kept subtle */}
           {/* <Link to="/admin" className={`${isHomePage ? 'text-white/20' : 'text-gray-300'} hover:text-gold-500 transition-colors`}>Admin</Link> */}
        </div>

        {/* CTA BUTTON */}
        <Link to="/reservations">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`text-[11px] font-bold uppercase tracking-widest px-8 py-3 rounded-sm transition-colors
              ${isHomePage 
                ? 'bg-gold-500 text-white hover:bg-white hover:text-black' 
                : 'bg-gold-600 text-white hover:bg-black hover:text-white'
              }`}
          >
            Book a Table
          </motion.button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;