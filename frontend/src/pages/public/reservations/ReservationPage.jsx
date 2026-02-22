import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import { format } from 'date-fns';
import { Users, CheckCircle, MessageSquare, X } from 'lucide-react';
import wechatQr from '../../../assets/images/qrcode.svg'; 
// MAKE SURE YOU ADD A WHATSAPP QR IMAGE TO YOUR FOLDER OR IT WILL BREAK
import whatsappQr from '../../../assets/images/qr-code-whatsapp.svg'; 
import heroimage from '../../../assets/images/heroimage4.webp';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const ReservationPage = () => {
  const { t, getFontClass } = useLanguage();
  const [date, setDate] = useState(new Date());
  const [session, setSession] = useState('LUNCH'); 
  const [bookingType, setBookingType] = useState('VIP'); 
  const [isWeChat, setIsWeChat] = useState(false);
  const [selectedTime, setSelectedTime] = useState(''); 
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', pax: 2, message: '' });
  const [submitStatus, setSubmitStatus] = useState(null); 
  const formRef = useRef(null);

  const generateTimeSlots = (sessionType) => {
    const slots = [];
    const startHour = sessionType === 'LUNCH' ? 11 : 17; 
    const endHour = sessionType === 'LUNCH' ? 14 : 21;    

    for (let hour = startHour; hour <= endHour; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      slots.push({ value: `${hour}:00:00`, label: `${displayHour}:00 ${ampm}` });
      if (hour !== endHour) {
          slots.push({ value: `${hour}:30:00`, label: `${displayHour}:30 ${ampm}` });
      }
    }
    return slots;
  };

  useEffect(() => { setSelectedTime(''); }, [session]);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setSelectedRoom(null); 
      try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const response = await fetch(`${BACKEND_URL}/api/reservations/check/?date=${formattedDate}&session=${session}`);
        const data = await response.json();
        const sortedData = data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        setRooms(sortedData);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchAvailability();
  }, [date, session]);

  useEffect(() => {
    if (selectedRoom) setTimeout(() => { if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); 
  }, [selectedRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.pax) return; 
    setSubmitStatus('loading');

    const payload = {
        customer_name: formData.name, customer_contact: formData.contact, customer_email: formData.email,
        date: format(date, 'yyyy-MM-dd'), session: session, time: selectedTime, pax: formData.pax,
        dining_area: selectedRoom, special_request: formData.message, status: 'PENDING'
    };

    try {
        const res = await fetch(`${BACKEND_URL}/api/reservations/create/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (res.ok) { 
          setSubmitStatus('success'); 
          window.scrollTo({ top: 0, behavior: 'smooth' }); 
          if (window.fbq) window.fbq('track', 'Lead');
        } else { 
          setSubmitStatus('error'); 
        }
    } catch (error) { setSubmitStatus('error'); }
  };

  // --- WECHAT / WHATSAPP VIEW ---
  if (isWeChat) {
    return (
      <div className="min-h-screen bg-cream-50 text-gray-900 flex flex-col items-center justify-center p-8 text-center pt-32">
        <h2 className={`text-3xl font-serif text-gray-900 mb-2 ${getFontClass()}`}>{t('reservation.wechatTitle')}</h2>
        <p className={`text-gray-500 mb-8 max-w-md ${getFontClass()}`}>{t('reservation.scan')}</p>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-[#07c160] text-center">
                <img src={wechatQr} alt="WeChat QR" className="w-48 h-48 object-contain mb-4" />
                <p className="font-bold text-sm text-[#07c160] uppercase tracking-widest">WeChat</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-[#25D366] text-center">
                {/* Use the whatsapp image here once you upload it */}
                <img src={whatsappQr} alt="WhatsApp QR" className="w-48 h-48 object-contain mb-4" />
                <p className="font-bold text-sm text-[#25D366] uppercase tracking-widest">WhatsApp</p>
            </div>
        </div>

        <p className="text-xl font-bold text-gray-900 tracking-wider mt-8">+63 917 580 7166</p>

        {/* FORCED SCROLL TO TOP ON RETURN */}
        <button 
          onClick={() => { 
            setIsWeChat(false); 
            window.scrollTo({ top: 0, behavior: 'instant' }); 
          }} 
          className={`mt-10 text-sm font-bold tracking-widest uppercase border-b border-gold-600 pb-1 hover:text-gold-600 transition-colors ${getFontClass()}`}
        >
          {t('reservation.retWeb')}
        </button>
      </div>
    );
  }
  
  if (submitStatus === 'success') {
      return (
          <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center text-gray-900 text-center p-8 pt-24">
              <div className="bg-white border border-gold-400/50 p-10 max-w-lg w-full shadow-xl">
                  <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/50"><CheckCircle className="w-10 h-10 text-green-600" /></div>
                  </div>
                  <h1 className={`text-3xl font-serif text-gold-600 mb-2 ${getFontClass()}`}>{t('reservation.reqPend')}</h1>
                  <p className={`text-gray-500 mb-8 text-sm uppercase tracking-widest ${getFontClass()}`}>{t('reservation.rev')}</p>
                  <p className={`text-gray-500 text-sm mb-8 leading-relaxed ${getFontClass()}`}>{t('reservation.allow')}</p>
                  <Link to="/" className={`block w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-4 hover:bg-gold-500 transition-colors ${getFontClass()}`}>
                      {t('reservation.retHome')}
                  </Link>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans">
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={heroimage} className="w-full h-full object-cover" alt="Reservations" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center">
          <Link to="/" className={`text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block ${getFontClass()}`}>{t('home.back')}</Link>
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md ${getFontClass()}`}>{t('reservation.title')}</h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
        </div>
      </div>

      <div className="px-4 md:px-12 py-12">
         <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-8">
              <div>
                <h2 className={`text-2xl font-serif text-gold-600 mb-2 ${getFontClass()}`}>{t('reservation.details')}</h2>
                <p className={`text-gray-500 text-sm ${getFontClass()}`}>{t('reservation.selectPref')}</p>
              </div>

              <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
                <style>{`.react-calendar { background: transparent; border: none; font-family: inherit; width: 100%; } .react-calendar__tile--active { background: #D4AF37 !important; color: white !important; } .react-calendar__navigation button { color: #C5A028; font-size: 1.2rem; }`}</style>
                <Calendar onChange={setDate} value={date} minDate={new Date()} className="text-sm" />
              </div>

              <div className="flex bg-white p-1 rounded-md border border-gray-200 shadow-sm">
                {['LUNCH', 'DINNER'].map((s) => (
                    <button key={s} onClick={() => setSession(s)} className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase rounded-sm transition-all ${session === s ? 'bg-gold-500 text-white' : 'text-gray-400 hover:text-gold-600'} ${getFontClass()}`}>
                        {s === 'LUNCH' ? t('footer.lunch') : t('footer.dinner')}
                    </button>
                ))}
              </div>
              
              {/* FORCED SCROLL TO TOP ON CLICK */}
              <button 
                onClick={() => {
                  setIsWeChat(true);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }} 
                className={`w-full flex items-center justify-center gap-3 py-4 border border-green-600/30 text-green-600 hover:bg-green-50 transition-all rounded-sm uppercase tracking-widest text-xs font-bold ${getFontClass()}`}
              >
                <MessageSquare size={16} /> {t('reservation.bookWechat')}
              </button>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8">
                 <div className="flex border-b border-gray-200 mb-8">
                    {['VIP', 'HALL'].map((type) => (
                        <button key={type} onClick={() => { setBookingType(type); setSelectedRoom(null); }} className={`mr-8 pb-4 text-sm tracking-[0.2em] uppercase transition-all ${bookingType === type ? 'text-gold-600 border-b-2 border-gold-600 font-bold' : 'text-gray-400 hover:text-gray-900'} ${getFontClass()}`}>
                            {type === 'VIP' ? t('reservation.vipRooms') : t('reservation.alaCarte')}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className={`h-64 flex items-center justify-center text-gray-500 animate-pulse ${getFontClass()}`}>{t('reservation.checking')}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {rooms.filter(r => bookingType === 'VIP' ? r.area_type === 'VIP' : r.area_type === 'HALL').map((room) => (
                        <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => room.is_available && setSelectedRoom(room.id)} className={`p-6 border rounded-sm cursor-pointer transition-all relative overflow-hidden shadow-sm ${selectedRoom === room.id ? 'border-gold-400 bg-gold-50 shadow-md ring-1 ring-gold-400' : room.is_available ? 'border-gray-200 hover:border-gold-400/50 bg-white' : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`font-serif text-xl ${selectedRoom === room.id ? 'text-gold-600' : 'text-gray-900'}`}>{room.name}</h3>
                                    <div className={`flex items-center gap-2 mt-4 text-xs text-gray-400 uppercase tracking-wider font-sans ${getFontClass()}`}>
                                        <Users size={14} className="text-gold-600" /> 
                                        {room.area_type === 'HALL' 
                                            ? <span>{t('vip.seatsLeft')} <span className="text-gray-900 font-bold">{room.remaining_capacity}</span> / {room.capacity}</span>
                                            : <span>{t('vip.maxCap')} {room.capacity} {t('vip.pax')}</span>
                                        }
                                    </div>
                                </div>
                                {selectedRoom === room.id ? <CheckCircle className="text-gold-600" size={24} /> : !room.is_available ? <span className={`text-red-500 text-[10px] font-bold uppercase border border-red-200 px-2 py-1 rounded bg-red-50 ${getFontClass()}`}>{room.area_type === 'VIP' ? t('vip.booked') : t('vip.full')}</span> : null}
                            </div>
                        </motion.div>
                    ))}
                </div>
                )}

                <AnimatePresence>
                    {selectedRoom && (
                        <motion.div ref={formRef} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-sm border-t-4 border-gold-400 shadow-xl">
                               <h3 className={`text-lg font-serif text-gray-900 mb-6 ${getFontClass()}`}>{t('reservation.confirmTitle')}</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                   <div>
                                       <label className={`block text-xs uppercase tracking-widest text-gray-500 mb-2 ${getFontClass()}`}>{t('reservation.fName')}</label>
                                       <input required type="text" className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 focus:border-gold-400 outline-none transition-colors" onChange={e => setFormData({...formData, name: e.target.value})} />
                                   </div>
                                   <div>
                                       <label className={`block text-xs uppercase tracking-widest text-gray-500 mb-2 ${getFontClass()}`}>{t('reservation.fContact')}</label>
                                       <input required type="text" className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 focus:border-gold-400 outline-none transition-colors" onChange={e => setFormData({...formData, contact: e.target.value})} />
                                   </div>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={`block text-xs uppercase tracking-widest text-gray-500 mb-2 ${getFontClass()}`}>{t('reservation.fEmail')}</label>
                                        <input type="email" className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 focus:border-gold-400 outline-none transition-colors" onChange={e => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs uppercase tracking-widest text-gray-500 mb-2 ${getFontClass()}`}>{t('reservation.fGuests')}</label>
                                        <input required type="number" min="1" className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 focus:border-gold-400 outline-none transition-colors" onChange={e => setFormData({...formData, pax: e.target.value})} />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className={`block text-xs uppercase tracking-widest text-gray-500 mb-2 ${getFontClass()}`}>{t('reservation.fTime')} ({session === 'LUNCH' ? t('footer.lunch') : t('footer.dinner')})</label>
                                    <select required className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 focus:border-gold-400 outline-none transition-colors" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                                        <option value="" disabled>{t('reservation.selTime')}</option>
                                        {generateTimeSlots(session).map((slot, index) => (
                                            <option key={index} value={slot.value}>{slot.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-8">
                                    <label className={`block text-xs uppercase tracking-widest text-gray-500 mb-2 ${getFontClass()}`}>{t('reservation.fNotes')}</label>
                                    <textarea className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 focus:border-gold-400 outline-none transition-colors h-24 resize-none" onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                                </div>

                               <button type="submit" disabled={submitStatus === 'loading'} className={`w-full bg-gold-500 text-white font-bold uppercase tracking-widest py-4 hover:bg-black transition-colors disabled:opacity-50 ${getFontClass()}`}>
                                   {submitStatus === 'loading' ? t('reservation.proc') : t('reservation.reqRes')}
                               </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ReservationPage;