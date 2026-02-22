import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, Phone, Edit, UserCheck, Flag, CheckCircle2, Search, Filter, Users } from 'lucide-react';
import ReservationForm from '../../../components/reservations/ReservationForm';
import { canCancelBooking } from '../../../utils/auth';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const hasCancelPermission = canCancelBooking();
  
  const [editingBooking, setEditingBooking] = useState(null);
  const [editRooms, setEditRooms] = useState([]);
  const [isCheckingRooms, setIsCheckingRooms] = useState(false);

  const fetchBookings = async () => {
    const token = localStorage.getItem('accessToken'); 
    try {
      const res = await fetch(`${BACKEND_URL}/api/reservations/manage/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) window.location.href = '/login'; 
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      toast.error("Failed to load reservations.");
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
      const res = await fetch(`${BACKEND_URL}/api/reservations/check/?date=${date}&session=${session}`);
      const data = await res.json();
      setEditRooms(data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
    } catch (err) {}
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

    const token = localStorage.getItem('accessToken'); 
    const updatePromise = fetch(`${BACKEND_URL}/api/reservations/manage/${id}/`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
    }).then(async (res) => {
        if (res.status === 401) throw new Error("Unauthorized");
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.non_field_errors ? errData.non_field_errors[0] : "Failed to update");
        }
        fetchBookings(); 
        setEditingBooking(null);
        return res.json();
    });

    toast.promise(updatePromise, {
        loading: 'Updating...',
        success: successMsg,
        error: (err) => err.message,
    });
  };

  const filteredBookings = bookings.filter(b => {
      const matchesStatus = filter === 'ALL' ? true : b.status === filter;
      const matchesDate = dateFilter === '' ? true : b.date === dateFilter;
      const matchesSearch = searchQuery === '' ? true : 
          b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          b.customer_contact.includes(searchQuery) ||
          b.id.toString() === searchQuery;
      return matchesStatus && matchesDate && matchesSearch;
  });

  const isStale = (bookingDate, status) => {
    if (status !== 'PENDING') return false;
    const diffInHours = (new Date() - new Date(bookingDate)) / 1000 / 60 / 60;
    return diffInHours > 2; 
  };

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

  return (
    <div className="space-y-4 pb-20">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-3">
              <div>
                  <h1 className="text-xl font-bold text-gray-900 font-serif">Booking Management</h1>
                  <p className="text-gray-500 text-xs mt-0.5">Manage, confirm, and track reservations.</p>
              </div>
              <button onClick={() => setShowManualForm(true)} className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-all flex items-center gap-1.5 w-full md:w-auto justify-center">
                  <Plus size={14} /> Manual Booking
              </button>
          </div>

          <div className="flex flex-col lg:flex-row justify-between gap-3">
              {/* Status Filters */}
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setFilter(f)} 
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-all border 
                        ${filter === f 
                            ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                      {f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Search & Date */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  <div className="relative flex-grow sm:w-56">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                          type="text" 
                          placeholder="Search name, phone, ID..." 
                          className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
                  <div className="relative shrink-0">
                      <input 
                          type="date" 
                          value={dateFilter} 
                          onChange={(e) => setDateFilter(e.target.value)} 
                          className="w-full sm:w-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 focus:bg-white focus:border-gold-500 outline-none transition-all" 
                      />
                      {dateFilter && (
                          <button onClick={() => setDateFilter('')} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 bg-gray-50 px-1">
                              <X size={12}/>
                          </button>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* 2. DESKTOP TABLE */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-visible shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer Info</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredBookings.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                                <Filter size={24} className="mb-2 opacity-50" />
                                <p className="text-sm font-medium text-gray-600">No bookings found</p>
                                <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    filteredBookings.map((b) => (
                    <tr key={b.id} className={`transition-colors hover:bg-gray-50 ${isStale(b.created_at, b.status) ? 'bg-rose-50/30' : ''}`}>
                        
                        <td className="px-4 py-3 align-top">
                            <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">#{b.id}</span>
                        </td>
                        
                        <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 text-sm">{b.customer_name}</span>
                                    {b.customer_no_show_count > 0 && (
                                        <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border border-rose-200" title={`${b.customer_no_show_count} previous No-Shows`}>
                                            <Flag size={10} /> {b.customer_no_show_count}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                                    <Phone size={12} className="text-gray-400"/> {b.customer_contact}
                                </div>
                            </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-bold text-gray-800">{b.date}</span>
                                <span className="text-xs font-medium text-gold-700 w-max">
                                    {b.time} ({b.session})
                                </span>
                            </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-gray-800">{b.room_name || 'Main Dining Hall'}</span>
                                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                    <Users size={12} className="text-gray-400"/> {b.pax} Guests
                                </span>
                            </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1.5 items-start">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusBadge(b.status)}`}>
                                    {b.status.replace('_', '-')}
                                </span>
                                
                                {/* AUDIT LOG IN TABLE */}
                                <div className="text-[9px] text-gray-400 font-mono flex flex-col leading-tight border-t border-gray-100 pt-1 w-full max-w-[120px]">
                                    <span className="truncate" title={`Created: ${new Date(b.created_at).toLocaleString()}`}>
                                        <span className="font-bold">E:</span> {b.encoded_by_name || 'Web'}
                                    </span>
                                    {b.last_modified_by_name && (
                                        <span className="truncate" title={`Modified: ${new Date(b.updated_at).toLocaleString()}`}>
                                            <span className="font-bold">M:</span> {b.last_modified_by_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </td>

                        <td className="px-4 py-3 align-top text-right">
                            {/* ACTION BUTTONS */}
                            <div className="flex justify-end gap-1.5 flex-wrap max-w-[160px] ml-auto">
                                
                                {b.status === 'PENDING' && (
                                    <button onClick={(e) => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!", e)} className="bg-blue-600 text-white px-2 py-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider w-full justify-center">
                                        <Check size={14} /> Confirm
                                    </button>
                                )}

                                {b.status === 'CONFIRMED' && (
                                    <>
                                        <button onClick={(e) => updateStatus(b.id, {status: 'SEATED'}, "Guest Seated", e)} className="flex-1 bg-indigo-600 text-white px-2 py-1.5 rounded hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                            <UserCheck size={12} /> Seat
                                        </button>
                                        <button onClick={(e) => updateStatus(b.id, {status: 'NO_SHOW'}, "Marked as No-Show", e)} className="flex-1 bg-orange-100 text-orange-800 border border-orange-300 px-2 py-1.5 rounded hover:bg-orange-200 transition-colors shadow-sm flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                            <Flag size={12} /> NS
                                        </button>
                                    </>
                                )}

                                {b.status === 'SEATED' && (
                                    <button onClick={(e) => updateStatus(b.id, {status: 'COMPLETED'}, "Booking Completed", e)} className="w-full bg-emerald-600 text-white px-2 py-1.5 rounded hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        <CheckCircle2 size={14} /> Complete
                                    </button>
                                )}

                                {/* Always show Edit unless Cancelled/Completed */}
                                {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) && (
                                    <button onClick={(e) => handleOpenEdit(b, e)} className="bg-white text-gray-600 p-1.5 rounded border border-gray-300 hover:bg-gray-100 shadow-sm transition-colors" title="Edit Booking">
                                        <Edit size={14} />
                                    </button>
                                )}
                                
                                {/* Only allow Cancel on active states */}
                                {['PENDING', 'CONFIRMED'].includes(b.status) && hasCancelPermission && (
                                    <button onClick={(e) => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!", e)} className="bg-rose-50 text-rose-600 p-1.5 rounded border border-rose-200 hover:bg-rose-100 shadow-sm transition-colors" title="Cancel Booking">
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

      {/* 3. MOBILE CARDS */}
      <div className="lg:hidden flex flex-col gap-3">
        {filteredBookings.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center text-gray-500 text-xs shadow-sm">
                No bookings found matching your criteria.
            </div>
        ) : (
            filteredBookings.map((b) => (
                <div key={b.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
                    
                    {/* Header: Name & Status */}
                    <div className="flex justify-between items-start gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-gray-900 text-base">{b.customer_name}</h3>
                                {b.customer_no_show_count > 0 && (
                                    <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border border-rose-200">
                                        <Flag size={10} /> {b.customer_no_show_count}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {b.customer_contact}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border shrink-0 ${getStatusBadge(b.status)}`}>
                            {b.status.replace('_', '-')}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md border border-gray-100">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Schedule</p>
                            <p className="font-bold text-gray-800 text-sm">{b.date}</p>
                            <p className="text-xs text-gold-700 font-medium">{b.time}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Details</p>
                            <p className="font-bold text-gray-800 text-xs line-clamp-1">{b.room_name || 'Main Hall'}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Users size={10} /> {b.pax}</p>
                        </div>
                    </div>

                    {/* Mobile Audit Log */}
                    <div className="text-[9px] text-gray-400 font-mono flex justify-between px-1">
                        <span>Enc: <span className="font-medium text-gray-600">{b.encoded_by_name || 'Web'}</span></span>
                        {b.last_modified_by_name && <span>Mod: <span className="font-medium text-gray-600">{b.last_modified_by_name}</span></span>}
                    </div>
                    
                    {/* Mobile Action Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                        {b.status === 'PENDING' && (
                            <button onClick={(e) => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!", e)} className="flex-1 bg-blue-600 text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm"><Check size={14} className="inline mr-1"/> Confirm</button>
                        )}
                        {b.status === 'CONFIRMED' && (
                            <>
                                <button onClick={(e) => updateStatus(b.id, {status: 'SEATED'}, "Guest Seated", e)} className="flex-1 bg-indigo-600 text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm"><UserCheck size={14} className="inline mr-1"/> Seated</button>
                                <button onClick={(e) => updateStatus(b.id, {status: 'NO_SHOW'}, "Marked as No-Show", e)} className="flex-1 bg-orange-100 text-orange-800 border border-orange-200 py-2 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm"><Flag size={12} className="inline mr-1"/> No Show</button>
                            </>
                        )}
                        {b.status === 'SEATED' && (
                            <button onClick={(e) => updateStatus(b.id, {status: 'COMPLETED'}, "Booking Completed", e)} className="w-full bg-emerald-600 text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm"><CheckCircle2 size={14} className="inline mr-1"/> Complete</button>
                        )}
                        
                        <div className="w-full flex gap-1.5 mt-0.5">
                            {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) && (
                                <button onClick={(e) => handleOpenEdit(b, e)} className="flex-1 bg-white text-gray-700 py-2 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-300 shadow-sm hover:bg-gray-50"><Edit size={12} className="inline mr-1 text-gray-400"/> Edit</button>
                            )}
                            
                            {['PENDING', 'CONFIRMED'].includes(b.status) && hasCancelPermission && (
                                <button onClick={(e) => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!", e)} className="flex-1 bg-rose-50 text-rose-700 py-2 rounded text-[10px] font-bold uppercase tracking-wider border border-rose-200 shadow-sm hover:bg-rose-100"><X size={12} className="inline mr-1 text-rose-500"/> Cancel</button>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      {editingBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
              <div className="bg-white p-0 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-serif text-gray-900 font-bold">Edit Details</h2>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">Ref: #{editingBooking.id} — <span className="font-bold text-gray-700">{editingBooking.customer_name}</span></p>
                    </div>
                    <button onClick={() => setEditingBooking(null)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><X size={18}/></button>
                  </div>
                  
                  <div className="p-5 overflow-y-auto space-y-5">
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Date</label>
                              <input type="date" required className="w-full bg-white border border-gray-300 p-2 text-gray-900 text-xs focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.date} onChange={e => { setEditingBooking({...editingBooking, date: e.target.value}); checkEditRooms(e.target.value, editingBooking.session); }} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Session</label>
                              <select className="w-full bg-white border border-gray-300 p-2 text-gray-900 text-xs focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.session} onChange={e => { setEditingBooking({...editingBooking, session: e.target.value, time: ''}); checkEditRooms(editingBooking.date, e.target.value); }}>
                                  <option value="LUNCH">Lunch</option>
                                  <option value="DINNER">Dinner</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Time</label>
                              <select required className="w-full bg-white border border-gray-300 p-2 text-gray-900 text-xs focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.time} onChange={e => setEditingBooking({...editingBooking, time: e.target.value})}>
                                  <option value="" disabled>Select Time</option>
                                  {generateTimeSlots(editingBooking.session).map((slot, i) => (
                                      <option key={i} value={slot.value}>{slot.label}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Guests (Pax)</label>
                              <input type="number" min="1" required className="w-full bg-white border border-gray-300 p-2 text-gray-900 text-xs focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.pax} onChange={e => setEditingBooking({...editingBooking, pax: e.target.value})} />
                          </div>
                      </div>

                      <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 flex items-center justify-between">
                              <span>Dining Area</span>
                              {isCheckingRooms && <span className="text-gold-600 text-[9px] normal-case animate-pulse">Checking...</span>}
                          </label>
                          <select required className="w-full bg-white border border-gray-300 p-2 text-gray-900 text-xs focus:border-gold-500 outline-none rounded transition-all shadow-sm" value={editingBooking.dining_area} onChange={e => setEditingBooking({...editingBooking, dining_area: e.target.value})}>
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

                      <div className="pt-2 border-t border-gray-100 mt-2">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Status</label>
                          <select className={`w-full border-2 p-2.5 text-xs rounded font-bold outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all ${getStatusBadge(editingBooking.status)}`} 
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

                      {/* --- AUDIT LOG BLOCK --- */}
                      <div className="bg-gray-50 p-3 rounded border border-gray-100 text-[10px] text-gray-500 font-mono space-y-1.5 mt-4">
                          <p className="flex justify-between items-center">
                              <span className="uppercase tracking-widest font-bold text-gray-400 text-[9px]">Created</span> 
                              <span className="text-gray-900">
                                  {new Date(editingBooking.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                  {editingBooking.encoded_by_name ? ` by ${editingBooking.encoded_by_name}` : ' via Web'}
                              </span>
                          </p>
                          <p className="flex justify-between items-center">
                              <span className="uppercase tracking-widest font-bold text-gray-400 text-[9px]">Last Update</span> 
                              <span className="text-gray-900">
                                  {new Date(editingBooking.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                  {editingBooking.last_modified_by_name && ` by ${editingBooking.last_modified_by_name}`}
                              </span>
                          </p>
                      </div>

                  </div>
                  
                  <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-10 flex gap-3">
                      <button onClick={() => setEditingBooking(null)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 font-bold uppercase tracking-widest text-xs rounded transition-colors border border-gray-200 shadow-sm">
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
                        className="flex-[2] bg-gold-600 text-white font-bold uppercase tracking-widest py-2 text-xs rounded shadow-md hover:bg-gold-700 transition-colors">
                          Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- CREATE MANUAL MODAL --- */}
      {showManualForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                      <div>
                          <h2 className="text-lg font-serif text-gray-900 font-bold">Create Manual Booking</h2>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Admin Entry</p>
                      </div>
                      <button onClick={() => setShowManualForm(false)} className="p-1.5 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                          <X size={18}/>
                      </button>
                  </div>
                  
                  {/* Modal Body (Scrollable) */}
                  <div className="p-5 overflow-y-auto bg-white">
                      <ReservationForm 
                          isManualEntry={true} 
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