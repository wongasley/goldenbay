import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Mic2, Tv, Armchair, Star } from 'lucide-react'; 
import heroimage from '../../../assets/images/heroimage4.webp'; 
import { useLanguage } from '../../../context/LanguageContext';
import SEO from '../../../components/seo/SEO';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const VIPRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, getFontClass } = useLanguage();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/reservations/rooms/`);
        if (res.ok) {
          const data = await res.json();
          const sortedData = data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
          setRooms(sortedData);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchRooms();
  }, []);

  if (loading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center text-gold-600 font-serif tracking-widest uppercase animate-pulse">Loading Private Rooms...</div>;

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 overflow-x-hidden font-sans">
      <SEO 
        title="Private VIP Rooms" 
        description="Exclusive VIP rooms featuring KTV, private lounges, and customized dining spaces. Ideal for private parties up to 70 guests."
      />
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={heroimage} className="w-full h-full object-cover" alt="Interior" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center">
          <Link to="/" className={`text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block ${getFontClass()}`}>{t('home.back')}</Link>
          <h1 className={`text-5xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md ${getFontClass()}`}>{t('vip.title')}</h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
        </div>
      </div>

      <div className="px-6 py-12 md:px-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group bg-white border border-gray-200 hover:border-gold-400/50 transition-all duration-500 rounded-sm overflow-hidden flex flex-col shadow-sm hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden relative bg-gray-100 border-b border-gray-100">
                {room.image ? (
                    <img src={room.image.startsWith('http') ? room.image : `${BACKEND_URL}${room.image}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={room.name} />
                ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center opacity-20 text-gray-400 uppercase text-xs tracking-widest ${getFontClass()}`}>{t('vip.noImage')}</div>
                )}
                <div className={`absolute top-0 right-0 bg-white/95 px-4 py-2 text-xs font-bold text-gray-900 border-l border-b border-gray-100 shadow-sm z-10 tracking-widest flex items-center gap-2 ${getFontClass()}`}>
                    <Users size={12} className="text-gold-600"/> {room.capacity} {t('vip.pax')}
                </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    {/* Note: If you want room names translated, you must update backend model similar to Post */}
                    <h3 className={`text-xl font-bold text-gray-900 uppercase tracking-wider group-hover:text-gold-600 transition-colors leading-tight ${getFontClass()}`}>
                        {room.name}
                    </h3>
                    <p className={`text-xs text-gray-400 mt-1 uppercase tracking-widest ${getFontClass()}`}>{room.area_type === 'VIP' ? t('vip.roomType1') : t('vip.roomType2')}</p>
                </div>

                <p className={`text-sm text-gray-500 font-light mb-6 line-clamp-3 leading-relaxed ${getFontClass()}`}>
                    {room.description || "An elegant space designed for privacy and comfort."}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
                    {room.has_ktv && <span className="flex items-center gap-1" title="KTV Available"><Mic2 size={14} className="text-gold-600"/> KTV</span>}
                    {room.has_restroom && <span className="flex items-center gap-1" title="Private Restroom"><Star size={14} className="text-gold-600"/> CR</span>}
                    {room.has_tv && <span className="flex items-center gap-1" title="Smart TV"><Tv size={14} className="text-gold-600"/> TV</span>}
                    {room.has_couch && <span className="flex items-center gap-1" title="Lounge Area"><Armchair size={14} className="text-gold-600"/> Lounge</span>}
                    {!room.has_ktv && !room.has_restroom && !room.has_tv && !room.has_couch && (
                        <span className={`italic opacity-50 ${getFontClass()}`}>{t('vip.stdSetup')}</span>
                    )}
                </div>
                </div>
            </motion.div>
            ))}
        </div>
      </div>

      <div className="py-20 text-center bg-white border-t border-gray-100">
          <h2 className={`text-2xl font-serif text-gray-900 mb-6 ${getFontClass()}`}>{t('vip.ready')}</h2>
          <Link to="/reservations">
             <button className={`bg-gold-600 text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-all rounded-sm shadow-md ${getFontClass()}`}>
                {t('vip.book')}
             </button>
          </Link>
      </div>

    </div>
  );
};
export default VIPRoomsPage;