import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      <Helmet>
        <title>Page Not Found | Golden Bay</title>
      </Helmet>
      
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-600 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-600 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10">
        <h1 className="text-9xl font-serif text-gold-600 mb-4 opacity-50">404</h1>
        <h2 className="text-3xl font-serif text-white mb-6 tracking-widest uppercase">Lost at Sea</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-10 font-light leading-relaxed">
          The page you are looking for has drifted away or does not exist. Let us guide you back to our shores.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/">
                <button className="w-full sm:w-auto px-8 py-3 bg-gold-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors rounded-sm shadow-lg">
                    Return Home
                </button>
            </Link>
            <Link to="/menu">
                <button className="w-full sm:w-auto px-8 py-3 border border-gold-600/50 text-gold-500 text-xs font-bold uppercase tracking-widest hover:bg-gold-600/10 transition-colors rounded-sm">
                    View Menu
                </button>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;