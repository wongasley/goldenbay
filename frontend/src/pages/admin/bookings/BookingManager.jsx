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

  const handleOpenEdit = (booking) => {
    setEditingBooking({
        ...booking,
        original_dining_area: booking.dining_area
    });
    checkEditRooms(booking.date, booking.session);
  };

  const updateStatus = async (id, payload, successMsg) => {
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
          case 'PENDING': return 'text-amber-800 bg-amber-50 border-amber-200';
          case 'CONFIRMED': return 'text-blue-800 bg-blue-50 border-blue-200';
          case 'SEATED': return 'text-indigo-800 bg-indigo-50 border-indigo-200';
          case 'COMPLETED': return 'text-emerald-800 bg-emerald-50 border-emerald-200';
          case 'NO_SHOW': return 'text-orange-800 bg-orange-50 border-orange-200';
          case 'CANCELLED': return 'text-rose-800 bg-rose-50 border-rose-200';
          default: return 'text-gray-800 bg-gray-50 border-gray-200';
      }
  };

  return (
    <div className="space-y-4">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-3 gap-4">
        <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Booking Management</h1>
            <p className="text-gray-600 text-xs mt-0.5">Manage, confirm, and track reservations.</p>
        </div>
        <button onClick={() => setShowManualForm(true)} className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-all flex items-center gap-1.5 w-full md:w-auto justify-center">
            <Plus size={14} /> Manual Booking
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded transition-all border 
                    ${filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                  {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-gray-300 rounded text-[11px] text-gray-900 focus:border-gold-500 outline-none transition-all shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Date:</span>
                  <div className="relative">
                      <input 
                          type="date" 
                          value={dateFilter} 
                          onChange={(e) => setDateFilter(e.target.value)} 
                          className="px-2 py-1.5 bg-white border border-gray-300 rounded text-[11px] text-gray-900 focus:border-gold-500 outline-none transition-all shadow-sm" 
                      />
                      {dateFilter && (
                          <button onClick={() => setDateFilter('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 bg-white px-1">
                              <X size={12}/>
                          </button>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* 2. DESKTOP TABLE */}
      <div className="hidden md:block bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 uppercase tracking-widest text-[10px] font-bold">
            <tr>
              <th className="px-4 py-2.5">ID</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Date / Time</th>
              <th className="px-4 py-2.5">Room & Pax</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredBookings.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No bookings found.</td></tr>
            ) : (
                filteredBookings.map((b) => (
                <tr key={b.id} className={`transition-colors hover:bg-gray-50 ${isStale(b.created_at, b.status) ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-2 text-gray-500 font-mono">#{b.id}</td>
                    <td className="px-4 py-2">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                            {b.customer_name}
                            {b.customer_no_show_count > 0 && (
                                <span className="text-rose-600 bg-rose-50 px-1.5 rounded flex items-center gap-1 text-[9px] uppercase tracking-widest border border-rose-200" title={`${b.customer_no_show_count} previous No-Shows`}>
                                    <Flag size={10} /> {b.customer_no_show_count} No-Show
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-600 flex gap-1 mt-0.5 font-mono items-center"><Phone size={10}/> {b.customer_contact}</div>
                    </td>
                    <td className="px-4 py-2">
                        <div className="text-gold-700 font-bold">{b.date}</div>
                        <div className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wide">{b.time} ({b.session})</div>
                    </td>
                    <td className="px-4 py-2">
                        <div className="font-bold text-gray-900">{b.room_name || 'Main Dining Hall'}</div>
                        <div className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                            <Users size={10} className="text-gray-400"/> {b.pax} Guests
                        </div>
                    </td>
                    <td className="px-4 py-2 align-top pt-3">
                        <div className="flex flex-col items-start gap-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${getStatusBadge(b.status)}`}>
                                {b.status.replace('_', '-')}
                            </span>
                            <div className="text-[9px] text-gray-400 font-mono mt-0.5" title={`Created: ${new Date(b.created_at).toLocaleString()}`}>
                                Enc: <span className="font-medium text-gray-600">{b.encoded_by_name || 'Web'}</span>
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                            {b.status === 'PENDING' && (
                                <button onClick={() => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!")} className="bg-blue-50 text-blue-600 p-1.5 rounded border border-blue-200 hover:bg-blue-100" title="Confirm"><Check size={14} /></button>
                            )}
                            {b.status === 'CONFIRMED' && (
                                <>
                                    <button onClick={() => updateStatus(b.id, {status: 'SEATED'}, "Guest Seated")} className="bg-indigo-50 text-indigo-600 p-1.5 rounded border border-indigo-200 hover:bg-indigo-100" title="Seated"><UserCheck size={14} /></button>
                                    <button onClick={() => updateStatus(b.id, {status: 'NO_SHOW'}, "Marked as No-Show")} className="bg-orange-50 text-orange-600 p-1.5 rounded border border-orange-200 hover:bg-orange-100" title="No Show"><Flag size={14} /></button>
                                </>
                            )}
                            {b.status === 'SEATED' && (
                                <button onClick={() => updateStatus(b.id, {status: 'COMPLETED'}, "Booking Completed")} className="bg-green-50 text-green-600 p-1.5 rounded border border-green-200 hover:bg-green-100" title="Completed"><CheckCircle2 size={14} /></button>
                            )}
                            {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) && (
                                <button onClick={() => handleOpenEdit(b)} className="bg-gray-100 text-gray-700 p-1.5 rounded border border-gray-300 hover:bg-gray-200" title="Edit"><Edit size={14} /></button>
                            )}
                            {['PENDING', 'CONFIRMED'].includes(b.status) && hasCancelPermission && (
                                <button onClick={() => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!")} className="bg-rose-50 text-rose-600 p-1.5 rounded border border-rose-200 hover:bg-rose-100" title="Cancel"><X size={14} /></button>
                            )}
                        </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. MOBILE CARDS */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredBookings.map((b) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-gray-900 text-base">{b.customer_name}</h3>
                            {b.customer_no_show_count > 0 && (
                                <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border border-rose-200">
                                    <Flag size={10} /> {b.customer_no_show_count}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-600 font-mono flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {b.customer_contact}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border shrink-0 ${getStatusBadge(b.status)}`}>
                        {b.status.replace('_', '-')}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Schedule</p>
                        <p className="font-bold text-gray-900 text-xs">{b.date}</p>
                        <p className="text-[11px] text-gold-700">{b.time}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Details</p>
                        <p className="font-bold text-gray-900 text-xs line-clamp-1">{b.room_name || 'Main Hall'}</p>
                        <p className="text-[11px] text-gray-600">{b.pax} Guests</p>
                    </div>
                </div>

                <div className="text-[9px] text-gray-400 font-mono flex justify-between px-1 pt-1">
                    <span>Enc: <span className="font-medium text-gray-600">{b.encoded_by_name || 'Web'}</span></span>
                    {b.last_modified_by_name && <span>Mod: <span className="font-medium text-gray-600">{b.last_modified_by_name}</span></span>}
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {b.status === 'PENDING' && (
                        <button onClick={() => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!")} className="flex-1 bg-blue-600 text-white py-2 rounded text-xs font-bold uppercase tracking-widest shadow-sm">Confirm</button>
                    )}
                    {b.status === 'CONFIRMED' && (
                        <>
                            <button onClick={() => updateStatus(b.id, {status: 'SEATED'}, "Guest Seated")} className="flex-1 bg-indigo-600 text-white py-2 rounded text-xs font-bold uppercase tracking-widest shadow-sm">Seated</button>
                            <button onClick={() => updateStatus(b.id, {status: 'NO_SHOW'}, "Marked as No-Show")} className="flex-1 bg-orange-50 text-orange-700 border border-orange-200 py-2 rounded text-xs font-bold uppercase tracking-widest shadow-sm">No Show</button>
                        </>
                    )}
                    {b.status === 'SEATED' && (
                        <button onClick={() => updateStatus(b.id, {status: 'COMPLETED'}, "Booking Completed")} className="w-full bg-green-600 text-white py-2 rounded text-xs font-bold uppercase tracking-widest shadow-sm">Complete</button>
                    )}
                    
                    <div className="w-full flex gap-2 mt-1">
                        {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) && (
                            <button onClick={() => handleOpenEdit(b)} className="flex-1 bg-white text-gray-700 py-2 rounded text-xs font-bold uppercase tracking-widest border border-gray-300 shadow-sm"><Edit size={12} className="inline mr-1 text-gray-400"/> Edit</button>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(b.status) && hasCancelPermission && (
                            <button onClick={() => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!")} className="flex-1 bg-rose-50 text-rose-700 py-2 rounded text-xs font-bold uppercase tracking-widest border border-rose-200 shadow-sm"><X size={12} className="inline mr-1 text-rose-500"/> Cancel</button>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* EDIT MODAL and MANUAL FORM (Kept the same logic as your provided code) */}
      {editingBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
              <div className="bg-white p-0 rounded shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-serif text-gray-900 font-bold">Edit Details</h2>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">Ref: #{editingBooking.id}</p>
                    </div>
                    <button onClick={() => setEditingBooking(null)} className="p-2 text-gray-400 hover:text-red-600 rounded transition-colors"><X size={18}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-4">
                      {/* Form Fields using the refined input styles */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Date</label>
                              <input type="date" className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-gold-500" value={editingBooking.date} onChange={e => { setEditingBooking({...editingBooking, date: e.target.value}); checkEditRooms(e.target.value, editingBooking.session); }} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Session</label>
                              <select className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-gold-500" value={editingBooking.session} onChange={e => { setEditingBooking({...editingBooking, session: e.target.value, time: ''}); checkEditRooms(editingBooking.date, e.target.value); }}>
                                  <option value="LUNCH">Lunch</option>
                                  <option value="DINNER">Dinner</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Status</label>
                          <select className={`w-full border p-2 text-sm rounded font-bold outline-none ${getStatusBadge(editingBooking.status)}`} 
                            value={editingBooking.status} 
                            onChange={e => setEditingBooking({...editingBooking, status: e.target.value})}>
                              <option value="PENDING" className="bg-white text-gray-900">Pending</option>
                              <option value="CONFIRMED" className="bg-white text-gray-900">Confirmed</option>
                              <option value="SEATED" className="bg-white text-gray-900">Seated</option>
                              <option value="COMPLETED" className="bg-white text-gray-900">Completed</option>
                              <option value="NO_SHOW" className="bg-white text-gray-900">No-Show</option>
                              <option value="CANCELLED" className="bg-white text-gray-900">Cancelled</option>
                          </select>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border border-gray-100 text-[10px] text-gray-500 font-mono space-y-1.5 mt-6">
                          <p className="flex justify-between items-center">
                              <span>Created:</span> 
                              <span className="text-gray-900">{new Date(editingBooking.created_at).toLocaleString()} {editingBooking.encoded_by_name ? ` by ${editingBooking.encoded_by_name}` : ' (Web)'}</span>
                          </p>
                          <p className="flex justify-between items-center">
                              <span>Modified:</span> 
                              <span className="text-gray-900">{new Date(editingBooking.updated_at).toLocaleString()} {editingBooking.last_modified_by_name && ` by ${editingBooking.last_modified_by_name}`}</span>
                          </p>
                      </div>
                  </div>
                  
                  <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                      <button onClick={() => setEditingBooking(null)} className="flex-1 py-2 text-gray-500 hover:bg-gray-100 font-bold uppercase tracking-widest text-xs rounded transition-colors">Cancel</button>
                      <button onClick={() => updateStatus(editingBooking.id, editingBooking, "Updated!")} className="flex-1 bg-gold-600 text-white py-2 rounded text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-gold-700">Save Changes</button>
                  </div>
              </div>
          </div>
      )}

      {showManualForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-lg font-serif text-gray-900 font-bold">Manual Booking</h2>
                      <button onClick={() => setShowManualForm(false)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><X size={18}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto bg-gray-50/50">
                      <ReservationForm isManualEntry={true} onSuccess={() => { setShowManualForm(false); fetchBookings(); toast.success("Manual booking created!"); }} onCancel={() => setShowManualForm(false)} />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BookingManager;