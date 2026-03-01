import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, Phone, Edit, UserCheck, Flag, CheckCircle2, Search, Filter, Users, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import ReservationForm from '../../../components/reservations/ReservationForm';
import { canCancelBooking } from '../../../utils/auth';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addDays, subDays, isToday } from 'date-fns';
import axiosInstance from '../../../utils/axiosInstance';

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showManualForm, setShowManualForm] = useState(false);
  
  const hasCancelPermission = canCancelBooking();
  const [editingBooking, setEditingBooking] = useState(null);
  const [editRooms, setEditRooms] = useState([]);
  const [isCheckingRooms, setIsCheckingRooms] = useState(false);
  const [loading, setLoading] = useState(true);
  const latestBookingId = useRef(null);

  const fetchBookings = async () => {
    try {
      const res = await axiosInstance.get('/api/reservations/manage/');
      const fetchedBookings = res.data;
      
      // --- DASHBOARD NOTIFICATION LOGIC ---
      if (fetchedBookings.length > 0) {
        // Find the highest ID in the current fetch
        const maxId = Math.max(...fetchedBookings.map(b => b.id));
        
        // If we already have a recorded maxId, and the new maxId is higher...
        if (latestBookingId.current !== null && maxId > latestBookingId.current) {
            // Play the alert bell
            const bell = new Audio('/audio/bell.mp3');
            bell.play().catch(e => console.log("Audio blocked. Staff must click the page first.", e));
            
            // Show a special toast
            toast('New Booking Arrived!', { icon: '🔔', duration: 5000 });
        }
        
        // Update the ref to the new highest ID
        latestBookingId.current = maxId;
      }
      
      setBookings(fetchedBookings);
    } catch (err) {
      toast.error("Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(() => { fetchBookings(); }, 30000);
    return () => clearInterval(interval); 
  }, []);

  const checkEditRooms = async (date, session) => {
    setIsCheckingRooms(true);
    try {
      const res = await axiosInstance.get(`/api/reservations/check/?date=${date}&session=${session}`);
      setEditRooms(res.data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
    } catch (err) {
      console.error(err);
    }
    setIsCheckingRooms(false);
  };

  const handleOpenEdit = (booking, e) => {
    if (e) e.stopPropagation();
    setEditingBooking({
        ...booking,
        original_dining_area: booking.dining_area
    });
    checkEditRooms(booking.date, booking.session);
  };

  const updateStatus = async (id, payload, successMsg, e) => {
    if (e) e.stopPropagation();
    
    const updatePromise = axiosInstance.patch(`/api/reservations/manage/${id}/`, payload)
    .then((res) => {
        fetchBookings(); 
        setEditingBooking(null);
        return res.data;
    }).catch(err => {
        const errorData = err.response?.data;
        throw new Error(errorData?.non_field_errors ? errorData.non_field_errors[0] : "Failed to update");
    });

    toast.promise(updatePromise, {
        loading: 'Updating...',
        success: successMsg,
        error: (err) => err.message,
    });
  };

  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
  const isSearching = searchQuery.trim() !== '';

  const filteredBookings = bookings.filter(b => {
      const matchesSearch = isSearching ? (
          b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          b.customer_contact.includes(searchQuery) ||
          b.id.toString() === searchQuery
      ) : true;

      const matchesDate = isSearching ? true : b.date === formattedSelectedDate;
      const matchesStatus = filter === 'ALL' ? true : b.status === filter;

      return matchesSearch && matchesDate && matchesStatus;
  });

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

  const getStatusBadge = (status) => {
      switch(status) {
          case 'PENDING': return 'text-amber-800 bg-amber-100 border-amber-300';
          case 'CONFIRMED': return 'text-blue-800 bg-blue-100 border-blue-300';
          case 'SEATED': return 'text-indigo-800 bg-indigo-100 border-indigo-300';
          case 'COMPLETED': return 'text-emerald-800 bg-emerald-100 border-emerald-300';
          case 'NO_SHOW': return 'text-orange-800 bg-orange-100 border-orange-300';
          case 'CANCELLED': return 'text-rose-800 bg-rose-100 border-rose-300';
          default: return 'text-gray-800 bg-gray-100 border-gray-300';
      }
  };

  const getSourceDisplay = (source) => {
      switch(source) {
          case 'WEB': return 'Website';
          case 'WALK_IN': return 'Walk-in';
          case 'PHONE': return 'Phone Call';
          case 'SOCIAL': return 'Social Media';
          default: return source || 'Unknown';
      }
  };

  return (
    <div className="pb-20">
      <style>{`
        .react-calendar { border: none !important; width: 100% !important; font-family: 'Quicksand', sans-serif !important; background: transparent !important; }
        .react-calendar__navigation button { font-weight: bold; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; }
        .react-calendar__navigation button:hover { background-color: #f3f4f6 !important; border-radius: 4px; }
        .react-calendar__month-view__weekdays { text-transform: uppercase; font-size: 10px; color: #9ca3af; font-weight: bold; }
        .react-calendar__month-view__days__day { padding: 12px 0; font-size: 14px; color: #4b5563; }
        .react-calendar__tile--active { background-color: #D4AF37 !important; color: white !important; border-radius: 6px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(212, 175, 55, 0.4); }
        .react-calendar__tile:hover:not(.react-calendar__tile--active) { background-color: #fef3c7 !important; border-radius: 6px; color: #D4AF37; }
        .react-calendar__tile--now { background-color: #f3f4f6 !important; border-radius: 6px; color: #1a1a1a; font-weight: bold; border: 1px solid #e5e7eb; }
        .react-calendar__tile--now.react-calendar__tile--active { background-color: #D4AF37 !important; color: white !important; border: none; }
      `}</style>

      {/* HEADER & CONTROLS */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-3 mb-4">
              <div>
                  <h1 className="text-xl font-bold text-gray-900 font-serif">Booking Management</h1>
                  <p className="text-gray-500 text-xs mt-0.5">Manage, confirm, and track reservations.</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => { setSelectedDate(new Date()); setSearchQuery(''); setFilter('ALL'); }} className="bg-gray-100 text-gray-700 px-4 py-2 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5 flex-1 md:flex-none">
                      <CalendarDays size={14} /> Today
                  </button>
                  <button onClick={() => setShowManualForm(true)} className="bg-gold-600 text-white px-4 py-2 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-all flex items-center justify-center gap-1.5 flex-1 md:flex-none">
                      <Plus size={16} /> Add Booking
                  </button>
              </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setFilter(f)} 
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all border 
                        ${filter === f 
                            ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                      {f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-72 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                      type="text" 
                      placeholder="Global search by name or phone..." 
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1">
                          <X size={12} />
                      </button>
                  )}
              </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDEBAR: DESKTOP CALENDAR */}
        <div className="hidden lg:block w-80 shrink-0">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm sticky top-24">
                <div className="text-center border-b border-gray-100 pb-3 mb-4">
                    <h3 className="text-gray-900 font-bold uppercase tracking-widest text-xs">Select Date</h3>
                </div>
                <Calendar
                    onChange={(date) => {
                        setSelectedDate(date);
                        setSearchQuery('');
                    }}
                    value={selectedDate}
                />
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 space-y-4">
            <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <button onClick={() => { setSelectedDate(subDays(selectedDate, 1)); setSearchQuery(''); }} className="p-2 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                    <ChevronLeft size={20}/>
                </button>
                <div className="text-center flex flex-col items-center cursor-pointer" onClick={() => setSelectedDate(new Date())}>
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{format(selectedDate, 'EEEE')}</span>
                    <span className={`text-sm font-bold ${isToday(selectedDate) ? 'text-gold-600' : 'text-gray-900'}`}>
                        {format(selectedDate, 'MMM dd, yyyy')}
                    </span>
                </div>
                <button onClick={() => { setSelectedDate(addDays(selectedDate, 1)); setSearchQuery(''); }} className="p-2 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                    <ChevronRight size={20}/>
                </button>
            </div>

            <div className="flex justify-between items-end pb-2">
                <h2 className="text-lg font-serif text-gray-900">
                    {isSearching ? 'Search Results' : `Bookings for ${format(selectedDate, 'MMMM dd')}`}
                </h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-white border border-gray-200 px-2 py-1 rounded">
                    {filteredBookings.length} {filteredBookings.length === 1 ? 'Record' : 'Records'}
                </span>
            </div>

            <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-visible shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customer Info</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Schedule</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Details</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-400 animate-pulse">Loading data...</td></tr>
                        ) : filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Filter size={32} strokeWidth={1} className="mb-3 opacity-30 text-gold-600" />
                                        <p className="text-sm font-medium text-gray-600">No reservations found.</p>
                                        <p className="text-xs mt-1">Try selecting a different date or adjusting filters.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((b) => (
                            <tr key={b.id} className={`transition-colors hover:bg-gray-50`}>
                                
                                <td className="px-5 py-4 align-middle">
                                    <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">#{b.id}</span>
                                </td>
                                
                                <td className="px-5 py-4 align-middle">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-gray-900 text-sm">{b.customer_name}</span>
                                            {b.customer_no_show_count > 0 && (
                                                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest border border-rose-200" title={`${b.customer_no_show_count} previous No-Shows`}>
                                                    <Flag size={10} /> {b.customer_no_show_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                                            <Phone size={12} className="text-gray-400"/> {b.customer_contact}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-5 py-4 align-middle">
                                    <div className="flex flex-col gap-1">
                                        {isSearching ? (
                                            <span className="text-sm font-bold text-gray-800">{b.date}</span>
                                        ) : (
                                            <span className="text-sm font-bold text-gray-800">{b.time}</span>
                                        )}
                                        <span className="text-[10px] font-bold text-gold-700 w-max uppercase tracking-wider">
                                            {isSearching ? `${b.time} (${b.session})` : b.session}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-5 py-4 align-middle">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-bold text-gray-800">{b.room_name || 'Main Dining Hall'}</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <Users size={12} className="text-gray-400"/> {b.pax} Guests
                                        </span>
                                    </div>
                                </td>

                                <td className="px-5 py-4 align-middle">
                                    <div className="flex flex-col gap-1.5 items-start">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusBadge(b.status)}`}>
                                            {b.status.replace('_', '-')}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-5 py-4 align-middle text-right">
                                    <div className="flex justify-end items-center gap-2 whitespace-nowrap flex-nowrap">
                                        
                                        {b.status === 'PENDING' && (
                                            <button onClick={(e) => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!", e)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0">
                                                <Check size={14} /> Confirm
                                            </button>
                                        )}

                                        {b.status === 'CONFIRMED' && (
                                            <>
                                                <button onClick={(e) => updateStatus(b.id, {status: 'SEATED'}, "Guest Seated", e)} className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0">
                                                    <UserCheck size={14} /> Seat
                                                </button>
                                                <button onClick={(e) => updateStatus(b.id, {status: 'NO_SHOW'}, "Marked as No-Show", e)} className="bg-orange-100 text-orange-800 border border-orange-300 px-3 py-2 rounded hover:bg-orange-200 transition-colors shadow-sm flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0">
                                                    <Flag size={14} /> NS
                                                </button>
                                            </>
                                        )}

                                        {b.status === 'SEATED' && (
                                            <button onClick={(e) => updateStatus(b.id, {status: 'COMPLETED'}, "Booking Completed", e)} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0">
                                                <CheckCircle2 size={14} /> Complete
                                            </button>
                                        )}

                                        {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) && (
                                            <button onClick={(e) => handleOpenEdit(b, e)} className="bg-white text-gray-600 p-2 rounded border border-gray-300 hover:bg-gray-100 shadow-sm transition-colors shrink-0" title="Edit Booking">
                                                <Edit size={14} />
                                            </button>
                                        )}
                                        
                                        {['PENDING', 'CONFIRMED'].includes(b.status) && hasCancelPermission && (
                                            <button onClick={(e) => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!", e)} className="bg-rose-50 text-rose-600 p-2 rounded border border-rose-200 hover:bg-rose-100 shadow-sm transition-colors shrink-0" title="Cancel Booking">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                    </table>
                </div>
            </div>

            {/* MOBILE CARDS */}
            <div className="lg:hidden flex flex-col gap-4">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 animate-pulse text-xs">Loading data...</div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg border border-gray-200 text-center text-gray-500 text-sm shadow-sm flex flex-col items-center justify-center">
                        <Filter size={32} strokeWidth={1} className="mb-3 opacity-30 text-gold-600" />
                        No reservations found.
                    </div>
                ) : (
                    filteredBookings.map((b) => (
                        <div key={b.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
                            
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-bold text-gray-900 text-base">{b.customer_name}</h3>
                                        {b.customer_no_show_count > 0 && (
                                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest border border-rose-200">
                                                <Flag size={12} /> {b.customer_no_show_count}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {b.customer_contact}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border shrink-0 ${getStatusBadge(b.status)}`}>
                                    {b.status.replace('_', '-')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-md border border-gray-100">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                                    <p className="font-bold text-gray-800 text-sm">{isSearching ? b.date : b.time}</p>
                                    <p className="text-[10px] text-gold-700 font-bold uppercase tracking-widest mt-0.5">{isSearching ? `${b.time} (${b.session})` : b.session}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Details</p>
                                    <p className="font-bold text-gray-800 text-sm line-clamp-1">{b.room_name || 'Main Hall'}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5"><Users size={12} /> {b.pax} Guests</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                {b.status === 'PENDING' && (
                                    <button onClick={(e) => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!", e)} className="flex-1 bg-blue-600 text-white py-2.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5"><Check size={14}/> Confirm</button>
                                )}
                                {b.status === 'CONFIRMED' && (
                                    <>
                                        <button onClick={(e) => updateStatus(b.id, {status: 'SEATED'}, "Guest Seated", e)} className="flex-1 bg-indigo-600 text-white py-2.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5"><UserCheck size={14}/> Seated</button>
                                        <button onClick={(e) => updateStatus(b.id, {status: 'NO_SHOW'}, "Marked as No-Show", e)} className="flex-1 bg-orange-100 text-orange-800 border border-orange-300 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5"><Flag size={12}/> No Show</button>
                                    </>
                                )}
                                {b.status === 'SEATED' && (
                                    <button onClick={(e) => updateStatus(b.id, {status: 'COMPLETED'}, "Booking Completed", e)} className="w-full bg-emerald-600 text-white py-2.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5"><CheckCircle2 size={14}/> Complete</button>
                                )}
                                
                                <div className="w-full flex gap-2 mt-1">
                                    {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) && (
                                        <button onClick={(e) => handleOpenEdit(b, e)} className="flex-1 bg-white text-gray-700 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-300 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-1.5"><Edit size={14} className="text-gray-500"/> Edit</button>
                                    )}
                                    
                                    {['PENDING', 'CONFIRMED'].includes(b.status) && hasCancelPermission && (
                                        <button onClick={(e) => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!", e)} className="flex-1 bg-rose-50 text-rose-700 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest border border-rose-200 shadow-sm hover:bg-rose-100 flex items-center justify-center gap-1.5"><X size={14} className="text-rose-500"/> Cancel</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
              <div className="bg-white p-0 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  
                  <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-serif text-gray-900 font-bold">Edit Details</h2>
                        <p className="text-xs text-gray-500 mt-1 font-mono">Ref: #{editingBooking.id} — <span className="font-bold text-gray-700">{editingBooking.customer_name}</span></p>
                    </div>
                    <button onClick={() => setEditingBooking(null)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-6">
                      
                      <div className="grid grid-cols-2 gap-5">
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Date</label>
                              <input type="date" required className="w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.date} onChange={e => { setEditingBooking({...editingBooking, date: e.target.value}); checkEditRooms(e.target.value, editingBooking.session); }} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Session</label>
                              <select className="w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.session} onChange={e => { setEditingBooking({...editingBooking, session: e.target.value, time: ''}); checkEditRooms(editingBooking.date, e.target.value); }}>
                                  <option value="LUNCH">Lunch</option>
                                  <option value="DINNER">Dinner</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Time</label>
                              <select required className="w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.time} onChange={e => setEditingBooking({...editingBooking, time: e.target.value})}>
                                  <option value="" disabled>Select Time</option>
                                  <option value={editingBooking.time}>{editingBooking.time} (Current)</option>
                                  {generateTimeSlots(editingBooking.session).map((slot, i) => (
                                      <option key={i} value={slot.value}>{slot.label}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Guests (Pax)</label>
                              <input type="number" min="1" required className="w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.pax} onChange={e => setEditingBooking({...editingBooking, pax: e.target.value})} />
                          </div>
                      </div>

                      <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center justify-between">
                              <span>Dining Area</span>
                              {isCheckingRooms && <span className="text-gold-600 text-[10px] normal-case animate-pulse">Checking...</span>}
                          </label>
                          <select required className="w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.dining_area} onChange={e => setEditingBooking({...editingBooking, dining_area: e.target.value})}>
                              <option value="" disabled>Select Room</option>
                              {editRooms.map(room => {
                                  let label = room.name;
                                  let disabled = false;
                                  
                                  if (room.id === editingBooking.original_dining_area) {
                                      label += " (Current)";
                                  } else if (!room.is_available) {
                                      label += " [BOOKED]";
                                      disabled = true;
                                  } else if (room.area_type === 'HALL') {
                                      label += ` (Hall: ${room.remaining_capacity} left)`;
                                  } else {
                                      label += ` (VIP: Max ${room.capacity})`;
                                  }

                                  return <option key={room.id} value={room.id} disabled={disabled} className={disabled ? 'text-gray-400' : 'text-gray-900'}>{label}</option>;
                              })}
                          </select>
                      </div>

                      <div className="pt-4 border-t border-gray-100 mt-4">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Status</label>
                          <select className={`w-full border-2 p-3 text-sm rounded font-bold outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all ${getStatusBadge(editingBooking.status)}`} 
                            value={editingBooking.status} 
                            onChange={e => setEditingBooking({...editingBooking, status: e.target.value})}>
                              <option value="PENDING" className="text-gray-900 bg-white font-medium">Pending (Reviewing)</option>
                              <option value="CONFIRMED" className="text-gray-900 bg-white font-medium">Confirmed</option>
                              <option value="SEATED" className="text-gray-900 bg-white font-medium">Seated (Arrived)</option>
                              <option value="COMPLETED" className="text-gray-900 bg-white font-medium">Completed</option>
                              <option value="NO_SHOW" className="text-gray-900 bg-white font-medium">No-Show</option>
                              <option value="CANCELLED" className="text-gray-900 bg-white font-medium">Cancelled</option>
                          </select>
                      </div>

                      {/* AUDIT LOG BLOCK */}
                      <div className="bg-gray-50 p-4 rounded border border-gray-100 text-xs text-gray-500 font-mono space-y-2 mt-6">
                          <p className="flex justify-between items-center">
                              <span className="uppercase tracking-widest font-bold text-gray-400 text-[10px]">Source</span> 
                              <span className="text-gold-600 font-bold uppercase">
                                  {getSourceDisplay(editingBooking.source)}
                              </span>
                          </p>
                          <p className="flex justify-between items-center">
                              <span className="uppercase tracking-widest font-bold text-gray-400 text-[10px]">Created</span> 
                              <span className="text-gray-900 text-right">
                                  {new Date(editingBooking.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                  {editingBooking.encoded_by_name ? <br/> : ' via Web'}
                                  {editingBooking.encoded_by_name && <span className="text-gray-400"> by {editingBooking.encoded_by_name}</span>}
                              </span>
                          </p>
                          <p className="flex justify-between items-center">
                              <span className="uppercase tracking-widest font-bold text-gray-400 text-[10px]">Last Update</span> 
                              <span className="text-gray-900 text-right">
                                  {new Date(editingBooking.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                  {editingBooking.last_modified_by_name && <><br/><span className="text-gray-400"> by {editingBooking.last_modified_by_name}</span></>}
                              </span>
                          </p>
                      </div>

                  </div>
                  
                  <div className="p-5 bg-white border-t border-gray-100 sticky bottom-0 z-10 flex gap-4">
                      <button onClick={() => setEditingBooking(null)} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 font-bold uppercase tracking-widest text-xs rounded transition-colors border border-gray-200 shadow-sm">
                          Cancel
                      </button>
                      <button 
                        onClick={() => updateStatus(editingBooking.id, {
                            date: editingBooking.date,
                            session: editingBooking.session,
                            time: editingBooking.time,
                            pax: editingBooking.pax,
                            dining_area: editingBooking.dining_area,
                            status: editingBooking.status 
                        }, "Booking Updated!")} 
                        className="flex-[2] bg-gold-600 text-white font-bold uppercase tracking-widest py-3 text-xs rounded shadow-md hover:bg-gold-700 transition-colors">
                          Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE MANUAL MODAL */}
      {showManualForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                      <div>
                          <h2 className="text-xl font-serif text-gray-900 font-bold">Create Manual Booking</h2>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Admin Entry</p>
                      </div>
                      <button onClick={() => setShowManualForm(false)} className="p-2 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                          <X size={20}/>
                      </button>
                  </div>
                  
                  {/* Modal Body (Scrollable) */}
                  <div className="p-6 overflow-y-auto bg-white">
                      <ReservationForm 
                          isManualEntry={true} 
                          date={selectedDate} // Pass selected calendar date automatically
                          onSuccess={() => {
                              setShowManualForm(false);
                              fetchBookings(); // Refresh the list
                              toast.success("Manual booking created successfully!");
                          }}
                          onCancel={() => setShowManualForm(false)}
                      />
                  </div>

              </div>
          </div>
      )}
    </div>
  );
};

export default BookingManager;