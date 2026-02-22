import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import { format } from 'date-fns';
import { Users, CheckCircle, MessageSquare, X, ArrowRight, ArrowLeft, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import wechatQr from '../../../assets/images/qrcode.svg'; 
import whatsappQr from '../../../assets/images/qr-code-whatsapp.svg'; 
import heroimage from '../../../assets/images/heroimage4.webp';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const ReservationPage = () => {
  const { t, getFontClass } = useLanguage();
  
  // WIZARD STEPS: 1: Date/Experience, 2: Room, 3: Details
  const [step, setStep] = useState(1); 
  
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

  const generateTimeSlots = (sessionType) => {
    const slots = [];
    const startHour = sessionType === 'LUNCH' ? 11 : 17; 
    const endHour = sessionType === 'LUNCH' ? 14 : 21;    
    for (let hour = startHour; hour <= endHour; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      slots.push({ value: `${hour}:00:00`, label: `${displayHour}:00 ${ampm}` });
      if (hour !== endHour) slots.push({ value: `${hour}:30:00`, label: `${displayHour}:30 ${ampm}` });
    }
    return slots;
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const response = await fetch(`${BACKEND_URL}/api/reservations/check/?date=${formattedDate}&session=${session}`);
        const data = await response.json();
        const sortedData = data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        setRooms(sortedData);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (step === 2) fetchAvailability();
  }, [date, session, step]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          if (window.fbq) window.fbq('track', 'Lead');
        } else { setSubmitStatus('error'); }
    } catch (error) { setSubmitStatus('error'); }
  };

  const stepVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  if (isWeChat) {
    return (
      <div className="min-h-screen bg-cream-50 text-gray-900 flex flex-col items-center justify-center p-8 text-center pt-32">
        <h2 className={`text-3xl font-serif text-gray-900 mb-2 ${getFontClass()}`}>{t('reservation.wechatTitle')}</h2>
        <div className="flex flex-col md:flex-row gap-8 mt-8">
            <div className="bg-white p-6 rounded-sm shadow-xl border-t-4 border-[#07c160]"><img src={wechatQr} className="w-48 h-48 mb-2"/><p className="font-bold text-[#07c160]">WeChat</p></div>
            <div className="bg-white p-6 rounded-sm shadow-xl border-t-4 border-[#25D366]"><img src={whatsappQr} className="w-48 h-48 mb-2"/><p className="font-bold text-[#25D366]">WhatsApp</p></div>
        </div>
        <button onClick={() => setIsWeChat(false)} className="mt-12 uppercase tracking-widest text-xs font-bold border-b border-gold-600 pb-1">{t('reservation.retWeb')}</button>
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
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans transition-all duration-500">
      
      {/* RESTORED HERO BANNER DESIGN */}
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={heroimage} className="w-full h-full object-cover" alt="Reservations" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center">
          <Link to="/" className={`text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block ${getFontClass()}`}>{t('home.back')}</Link>
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md ${getFontClass()}`}>{t('reservation.title')}</h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
          
          {/* STEP INDICATOR */}
          <div className="flex items-center justify-center gap-3 mt-10">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 w-8 rounded-full transition-all duration-700 ${step >= i ? 'bg-gold-500' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 py-12">
        <div className="bg-white shadow-xl rounded-sm border border-gray-200 overflow-hidden min-h-[500px]">
          
          <AnimatePresence mode="wait">
            {/* STEP 1: DATE & EXPERIENCE */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5 p-8 bg-gray-50 border-r border-gray-100">
                    <h2 className={`text-2xl font-serif text-gold-600 mb-6 ${getFontClass()}`}>{t('reservation.details')}</h2>
                    <div className="calendar-luxury"><Calendar onChange={setDate} value={date} minDate={new Date()} /></div>
                </div>
                <div className="lg:col-span-7 p-8 md:p-12 space-y-10">
                    <div className="space-y-4">
                        <label className={`block text-xs uppercase tracking-widest text-gray-400 font-bold ${getFontClass()}`}>1. {t('footer.hours')}</label>
                        <div className="flex bg-white p-1 rounded-md border border-gray-200 shadow-sm">
                            {['LUNCH', 'DINNER'].map((s) => (
                                <button key={s} onClick={() => setSession(s)} className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase rounded-sm transition-all ${session === s ? 'bg-gold-500 text-white shadow-lg' : 'text-gray-400 hover:text-gold-600'} ${getFontClass()}`}>
                                    {s === 'LUNCH' ? t('footer.lunch') : t('footer.dinner')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className={`block text-xs uppercase tracking-widest text-gray-400 font-bold ${getFontClass()}`}>2. {t('reservation.selectPref')}</label>
                        <div className="grid grid-cols-1 gap-3">
                            {['VIP', 'HALL'].map((type) => (
                                <button key={type} onClick={() => setBookingType(type)} className={`p-5 text-left border rounded-sm transition-all flex items-center justify-between ${bookingType === type ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-400'}`}>
                                    <span className={`text-sm tracking-widest uppercase font-bold ${bookingType === type ? 'text-gold-700' : 'text-gray-500'}`}>{type === 'VIP' ? t('reservation.vipRooms') : t('reservation.alaCarte')}</span>
                                    {bookingType === type && <CheckCircle className="text-gold-600" size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="pt-6 space-y-4">
                        <button onClick={() => setStep(2)} className="w-full bg-gold-600 text-white py-5 font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg group">
                            Next: Select Table <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => setIsWeChat(true)} className="w-full text-green-600 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest py-3 border border-green-600/10 hover:bg-green-50 transition-colors">
                            <MessageSquare size={16} /> {t('reservation.bookWechat')}
                        </button>
                    </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: TABLE/ROOM SELECTION */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="p-8 md:p-12">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 hover:text-gold-600 mb-8 uppercase tracking-widest text-[10px] font-bold"><ArrowLeft size={14}/> Back</button>
                <div className="mb-10 text-center">
                    <h2 className={`text-3xl font-serif text-gray-900 ${getFontClass()}`}>{bookingType === 'VIP' ? t('reservation.vipRooms') : t('reservation.alaCarte')}</h2>
                    <p className="text-gold-600 text-sm mt-2 font-bold uppercase tracking-widest">{format(date, 'MMMM dd, yyyy')} — {session}</p>
                </div>

                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-400"><div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>{t('reservation.checking')}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                        {rooms.filter(r => r.area_type === bookingType).map(room => (
                            <div key={room.id} onClick={() => room.is_available && setSelectedRoom(room.id)} className={`p-6 border rounded-sm cursor-pointer transition-all flex justify-between items-center ${selectedRoom === room.id ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : room.is_available ? 'border-gray-200 hover:border-gold-400/50 bg-white shadow-sm' : 'bg-gray-100 opacity-40 cursor-not-allowed grayscale'}`}>
                                <div>
                                    <h4 className="font-serif text-lg text-gray-900">{room.name}</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{t('vip.maxCap')} {room.capacity}</p>
                                </div>
                                {selectedRoom === room.id ? <CheckCircle className="text-gold-600" size={24}/> : !room.is_available && <span className="text-[9px] font-bold text-red-500 border border-red-200 px-2 py-1 bg-red-50 rounded-sm">BOOKED</span>}
                            </div>
                        ))}
                    </div>
                )}
                
                <button disabled={!selectedRoom} onClick={() => setStep(3)} className="w-full max-w-md mx-auto block bg-gold-600 text-white py-5 font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-30">
                    Next: Final Details <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 3: CONTACT FORM */}
            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="p-8 md:p-12">
                 <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-400 hover:text-gold-600 mb-8 uppercase tracking-widest text-[10px] font-bold"><ArrowLeft size={14}/> Back to Floor Plan</button>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8">
                        <h2 className={`text-3xl font-serif text-gray-900 mb-8 ${getFontClass()}`}>{t('reservation.confirmTitle')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t('reservation.fName')}</label>
                                    <input required className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 focus:border-gold-500 outline-none transition-colors" type="text" onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t('reservation.fContact')}</label>
                                    <input required className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 focus:border-gold-500 outline-none transition-colors" type="text" onChange={e => setFormData({...formData, contact: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t('reservation.fTime')} ({session})</label>
                                    <select required className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 focus:border-gold-500 outline-none transition-colors appearance-none" value={selectedTime} onChange={e => setSelectedTime(e.target.value)}>
                                        <option value="">{t('reservation.selTime')}</option>
                                        {generateTimeSlots(session).map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t('reservation.fGuests')}</label>
                                    <input required className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 focus:border-gold-500 outline-none transition-colors" type="number" min="1" onChange={e => setFormData({...formData, pax: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t('reservation.fNotes')}</label>
                                <textarea className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 focus:border-gold-500 outline-none transition-colors h-24 resize-none" onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                            </div>
                            <button type="submit" disabled={submitStatus === 'loading'} className="w-full bg-gold-600 text-white py-6 font-bold uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl disabled:opacity-50">
                                {submitStatus === 'loading' ? t('reservation.proc') : t('reservation.reqRes')}
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-4 bg-cream-50 p-8 rounded-sm space-y-6 self-start border border-gold-400/20">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gold-600 border-b border-gold-200 pb-2">Booking Summary</h3>
                        <div className="space-y-5">
                            <div className="flex gap-4 items-center text-gray-600"><CalendarIcon size={18} className="text-gold-500 shrink-0"/><span className="text-sm font-bold">{format(date, 'MMMM dd, yyyy')}</span></div>
                            <div className="flex gap-4 items-center text-gray-600"><Clock size={18} className="text-gold-500 shrink-0"/><span className="text-sm font-bold capitalize">{session.toLowerCase()} Session</span></div>
                            <div className="flex gap-4 items-center text-gray-600"><MapPin size={18} className="text-gold-500 shrink-0"/><span className="text-sm font-bold">{rooms.find(r => r.id === selectedRoom)?.name}</span></div>
                        </div>
                        <div className="pt-6 border-t border-gold-200">
                             <p className="text-[10px] text-gray-400 leading-relaxed italic">{t('reservation.rev')}. {t('reservation.allow')}</p>
                        </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default ReservationPage;