import React from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { CalendarDays } from 'lucide-react';

const FloatingWidget = () => {
  const whatsappNumber = "639175807166"; 
  const whatsappMessage = "Hi Golden Bay! I would like to inquire about a table reservation.";

  return (
    // Changed z-50 to z-[999] to ensure it shows on top of the Homepage video/footer
    <div className="fixed bottom-6 right-4 md:right-6 z-[999] flex flex-col gap-4 items-end pointer-events-none">
      
      {/* WhatsApp Button (Visible on Desktop & Mobile) */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center justify-center w-[52px] h-[52px] md:w-14 md:h-14 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group relative"
        title="Chat with us on WhatsApp"
      >
        <FaWhatsapp className="text-[26px] md:text-[28px]" />
        
        {/* Tooltip visible on desktop hover */}
        <span className="absolute right-full mr-4 bg-black/80 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
          Chat on WhatsApp
        </span>
      </a>

      {/* Reservation Button (Visible ONLY on Mobile) */}
      <Link 
        to="/reservations" 
        className="pointer-events-auto md:hidden flex items-center justify-center w-[52px] h-[52px] bg-gold-600 text-white rounded-full shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:scale-110 active:scale-95 transition-all duration-300"
        title="Book a Table"
      >
        <CalendarDays size={22} />
      </Link>

    </div>
  );
};

export default FloatingWidget;