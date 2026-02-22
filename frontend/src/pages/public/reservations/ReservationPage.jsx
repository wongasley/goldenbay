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
  
  // --- WIZARD STATE ---
  const [step, setStep] = useState(1); // 1: Date/Type, 2: Room, 3: Details
  
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

  // Variants for smooth step transitions
  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (isWeChat) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-8 text-center pt-32">
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
        <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-8 pt-24 text-center">
            <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white border border-gold-400/50 p-12 max-w-lg shadow-2xl">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
                <h1 className={`text-3xl font-serif text-gold-600 mb-4 ${getFontClass()}`}>{t('reservation.reqPend')}</h1>
                <p className="text-gray-500 mb-8 leading-relaxed">{t('reservation.allow')}</p>
                <Link to="/" className="inline-block bg-gold-600 text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-black transition-colors">{t('reservation.retHome')}</Link>
            </motion.div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans pb-20">
      {/* Hero Header */}
      <div className="relative h-[35vh] w-full flex items-center justify-center bg-black">
        <div className="absolute inset-0 opacity-50"><img src={heroimage} className="w-full h-full object-cover" /></div>
        <div className="relative z-10 text-center">
          <h1 className={`text-4xl md:text-5xl font-serif tracking-widest uppercase text-white ${getFontClass()}`}>{t('reservation.title')}</h1>
          <div className="flex items-center justify-center gap-4 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${step >= i ? 'bg-gold-500' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-100">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: DATE & TYPE */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-serif text-gold-600">Choose Date</h2>
                    <div className="calendar-custom border-none"><Calendar onChange={setDate} value={date} minDate={new Date()} /></div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-gold-600">Experience</h2>
                        <div className="flex bg-gray-50 p-1 rounded-sm border border-gray-200">
                            {['LUNCH', 'DINNER'].map(s => (
                                <button key={s} onClick={() => setSession(s)} className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-all ${session === s ? 'bg-gold-500 text-white shadow-md' : 'text-gray-400'}`}>
                                    {s === 'LUNCH' ? 'Lunch' : 'Dinner'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-gold-600">Seating</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {['VIP', 'HALL'].map(t => (
                                <button key={t} onClick={() => setBookingType(t)} className={`p-4 text-left border rounded-sm transition-all flex items-center justify-between ${bookingType === t ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}>
                                    <span className="font-bold uppercase tracking-widest text-xs">{t === 'VIP' ? 'VIP Private Room' : 'Main Dining Hall'}</span>
                                    {bookingType === t && <CheckCircle size={18} className="text-gold-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setStep(2)} className="w-full bg-gold-600 text-white py-4 font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group">
                        Next: Browse Tables <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => setIsWeChat(true)} className="w-full text-green-600 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest py-2 border border-green-600/20 hover:bg-green-50 transition-colors">
                        <MessageSquare size={14}/> Book via WhatsApp / WeChat
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: ROOM SELECTION */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="p-8 md:p-12">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 hover:text-gold-600 mb-6 uppercase tracking-widest text-[10px] font-bold"><ArrowLeft size={14}/> Back</button>
                <div className="mb-8">
                    <h2 className="text-3xl font-serif text-gray-900">Select Available {bookingType === 'VIP' ? 'Room' : 'Table'}</h2>
                    <p className="text-gold-600 text-sm mt-1">{format(date, 'MMMM dd, yyyy')} • {session === 'LUNCH' ? 'Lunch Session' : 'Dinner Session'}</p>
                </div>

                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-400"><div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>Checking availability...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        {rooms.filter(r => r.area_type === bookingType).map(room => (
                            <div key={room.id} onClick={() => room.is_available && setSelectedRoom(room.id)} className={`p-6 border rounded-sm cursor-pointer transition-all flex justify-between items-center ${selectedRoom === room.id ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : room.is_available ? 'border-gray-200 hover:border-gold-400/50 bg-white' : 'bg-gray-100 opacity-50 cursor-not-allowed'}`}>
                                <div>
                                    <h4 className="font-serif text-lg text-gray-900">{room.name}</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Capacity: {room.capacity} Guests</p>
                                </div>
                                {selectedRoom === room.id ? <CheckCircle className="text-gold-600" size={24}/> : !room.is_available && <span className="text-[10px] font-bold text-red-500 border border-red-200 px-2 py-1 bg-red-50">BOOKED</span>}
                            </div>
                        ))}
                    </div>
                )}
                
                <button disabled={!selectedRoom} onClick={() => setStep(3)} className="w-full bg-gold-600 text-white py-4 font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:bg-gold-600">
                    Next: Finalize Booking <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {/* STEP 3: CONTACT DETAILS */}
            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="p-8 md:p-12">
                 <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-400 hover:text-gold-600 mb-6 uppercase tracking-widest text-[10px] font-bold"><ArrowLeft size={14}/> Back</button>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-serif text-gray-900 mb-8">Reservation Details</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Full Name</label>
                                    <input required className="w-full bg-gray-50 border-b border-gray-200 p-3 focus:border-gold-500 outline-none transition-colors" type="text" onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">WhatsApp / Phone</label>
                                    <input required className="w-full bg-gray-50 border-b border-gray-200 p-3 focus:border-gold-500 outline-none transition-colors" type="text" onChange={e => setFormData({...formData, contact: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Arrival Time ({session})</label>
                                    <select required className="w-full bg-gray-50 border-b border-gray-200 p-3 focus:border-gold-500 outline-none transition-colors" value={selectedTime} onChange={e => setSelectedTime(e.target.value)}>
                                        <option value="">Select Time</option>
                                        {generateTimeSlots(session).map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Number of Guests</label>
                                    <input required className="w-full bg-gray-50 border-b border-gray-200 p-3 focus:border-gold-500 outline-none transition-colors" type="number" min="1" onChange={e => setFormData({...formData, pax: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Special Requests / Occasions</label>
                                <textarea className="w-full bg-gray-50 border-b border-gray-200 p-3 focus:border-gold-500 outline-none transition-colors h-24 resize-none" onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                            </div>
                            <button type="submit" disabled={submitStatus === 'loading'} className="w-full bg-gold-600 text-white py-5 font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl disabled:opacity-50">
                                {submitStatus === 'loading' ? 'Confirming...' : 'Request Reservation'}
                            </button>
                        </form>
                    </div>

                    {/* Booking Summary Sidebar */}
                    <div className="bg-gray-50 p-8 rounded-sm space-y-6 self-start">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gold-600 border-b border-gold-200 pb-2">Booking Summary</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3"><CalendarIcon size={16} className="text-gold-500"/><span className="text-sm font-bold">{format(date, 'MMM dd, yyyy')}</span></div>
                            <div className="flex gap-3"><Clock size={16} className="text-gold-500"/><span className="text-sm font-bold capitalize">{session.toLowerCase()}</span></div>
                            <div className="flex gap-3"><MapPin size={16} className="text-gold-500"/><span className="text-sm font-bold">{rooms.find(r => r.id === selectedRoom)?.name}</span></div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                             <p className="text-[10px] text-gray-400 italic">Please note: Your reservation is subject to final confirmation by our staff.</p>
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