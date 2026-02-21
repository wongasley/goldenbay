import React from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { CalendarDays } from 'lucide-react';

const FloatingWidget = () => {
  // Replace with the restaurant's actual WhatsApp/Viber number
  const whatsappNumber = "639175807166"; 
  const whatsappMessage = "Hi Golden Bay! I would like to inquire about a table reservation.";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      
      {/* WhatsApp Button (Visible on Desktop & Mobile) */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group relative"
        title="Chat with us on WhatsApp"
      >
        <FaWhatsapp size={28} />
        
        {/* Tooltip visible on desktop hover */}
        <span className="absolute right-full mr-4 bg-black/80 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
          Chat on WhatsApp
        </span>
      </a>

      {/* Reservation Button (Visible ONLY on Mobile) */}
      <Link 
        to="/reservations" 
        className="md:hidden flex items-center justify-center w-14 h-14 bg-gold-600 text-white rounded-full shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:scale-110 active:scale-95 transition-all duration-300"
        title="Book a Table"
      >
        <CalendarDays size={24} />
      </Link>

    </div>
  );
};

export default FloatingWidget;