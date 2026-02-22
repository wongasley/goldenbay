import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, Phone, Edit, UserCheck, Flag, CheckCircle2 } from 'lucide-react';
import ReservationForm from '../../../components/reservations/ReservationForm'; // <-- ADD THIS LINE
import { canCancelBooking } from '../../../utils/auth';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [dateFilter, setDateFilter] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const hasCancelPermission = canCancelBooking();
  
  // Edit Modal State
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
      return matchesStatus && matchesDate;
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

  // Helper for status badge colors
  const getStatusBadge = (status) => {
      switch(status) {
          case 'PENDING': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
          case 'CONFIRMED': return 'text-blue-700 bg-blue-50 border-blue-200';
          case 'SEATED': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
          case 'COMPLETED': return 'text-green-700 bg-green-50 border-green-200';
          case 'NO_SHOW': return 'text-orange-700 bg-orange-50 border-orange-200';
          case 'CANCELLED': return 'text-red-700 bg-red-50 border-red-200';
          default: return 'text-gray-700 bg-gray-50 border-gray-200';
      }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-3">
        <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Booking Management</h1>
            <p className="text-gray-500 text-xs">Manage, confirm, and track reservations.</p>
        </div>
        <button onClick={() => setShowManualForm(true)} className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-all flex items-center gap-1.5">
          <Plus size={14} /> Manual Booking
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded transition-all border ${filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{f.replace('_', ' ')}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Date:</span>
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-gold-500 text-gray-700" />
              {dateFilter && <button onClick={() => setDateFilter('')} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase">Clear</button>}
          </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase tracking-widest text-[10px] font-bold">
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
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">No bookings found.</td></tr>
            ) : (
                filteredBookings.map((b) => (
                <tr key={b.id} className={`transition-colors ${isStale(b.created_at, b.status) ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-2 text-gray-400 font-mono">#{b.id}</td>
                    <td className="px-4 py-2">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                            {b.customer_name}
                            {/* --- NEW FLAG LOGIC --- */}
                            {b.customer_no_show_count > 0 && (
                                <span className="text-red-500 bg-red-50 px-1.5 rounded flex items-center gap-1 text-[9px] uppercase tracking-widest border border-red-200" title={`${b.customer_no_show_count} previous No-Shows`}>
                                    <Flag size={10} /> {b.customer_no_show_count} No-Show
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-500 flex gap-1 mt-0.5 font-mono items-center"><Phone size={10}/> {b.customer_contact}</div>
                    </td>
                    <td className="px-4 py-2">
                        <div className="text-gold-700 font-bold">{b.date}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">{b.time} ({b.session})</div>
                    </td>
                    <td className="px-4 py-2">
                        <div className="font-bold text-gray-900">{b.room_name || 'Main Dining Hall'}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{b.pax} Guests</div>
                    </td>
                    <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border inline-block ${getStatusBadge(b.status)}`}>{b.status.replace('_', '-')}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                    {/* Action Buttons based on state progression */}
                    <div className="flex justify-end gap-1.5">
                        {b.status === 'PENDING' && (
                            <button onClick={() => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!")} className="bg-blue-50 text-blue-600 p-1.5 rounded border border-blue-200 hover:bg-blue-100" title="Confirm Booking"><Check size={14} /></button>
                        )}
                        {b.status === 'CONFIRMED' && (
                            <>
                                <button onClick={() => updateStatus(b.id, {status: 'SEATED'}, "Guest Seated")} className="bg-indigo-50 text-indigo-600 p-1.5 rounded border border-indigo-200 hover:bg-indigo-100" title="Mark Seated"><UserCheck size={14} /></button>
                                <button onClick={() => updateStatus(b.id, {status: 'NO_SHOW'}, "Marked as No-Show")} className="bg-orange-50 text-orange-600 p-1.5 rounded border border-orange-200 hover:bg-orange-100" title="No Show"><Flag size={14} /></button>
                            </>
                        )}
                        {b.status === 'SEATED' && (
                            <button onClick={() => updateStatus(b.id, {status: 'COMPLETED'}, "Booking Completed")} className="bg-green-50 text-green-600 p-1.5 rounded border border-green-200 hover:bg-green-100" title="Mark Completed"><CheckCircle2 size={14} /></button>
                        )}
                        
                        {/* Always show Edit unless Cancelled/Completed */}
                        {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) && (
                            <button onClick={() => handleOpenEdit(b)} className="bg-gray-100 text-gray-600 p-1.5 rounded border border-gray-200 hover:bg-gray-200" title="Edit/Transfer"><Edit size={14} /></button>
                        )}
                        
                        {/* Only allow Cancel on active states */}
                        {['PENDING', 'CONFIRMED'].includes(b.status) && hasCancelPermission && (
                            <button onClick={() => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!")} className="bg-red-50 text-red-600 p-1.5 rounded border border-red-200 hover:bg-red-100" title="Cancel"><X size={14} /></button>
                        )}
                    </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredBookings.map((b) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-lg">{b.customer_name}</h3>
                            {/* --- NEW FLAG LOGIC --- */}
                            {b.customer_no_show_count > 0 && (
                                <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase tracking-widest border border-red-200">
                                    <Flag size={10} /> {b.customer_no_show_count}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5 mt-1"><Phone size={12}/> {b.customer_contact}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${getStatusBadge(b.status)}`}>{b.status.replace('_', '-')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 my-4 text-sm bg-gray-50 p-3 rounded border border-gray-100">
                    <div><p className="font-bold text-gray-900">{b.date}</p><p className="text-xs text-gray-600">{b.time}</p></div>
                    <div><p className="font-bold text-gray-900 line-clamp-1">{b.room_name}</p><p className="text-xs text-gray-600">{b.pax} Guests</p></div>
                </div>
                
                {/* Mobile Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {b.status === 'PENDING' && (
                        <button onClick={() => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!")} className="flex-1 bg-blue-600 text-white py-2 rounded-md text-xs font-bold uppercase tracking-widest"><Check size={14} className="inline mr-1"/> Confirm</button>
                    )}
                    {b.status === 'CONFIRMED' && (
                        <>
                            <button onClick={() => updateStatus(b.id, {status: 'SEATED'}, "Guest Seated")} className="flex-1 bg-indigo-600 text-white py-2 rounded-md text-xs font-bold uppercase tracking-widest"><UserCheck size={14} className="inline mr-1"/> Seated</button>
                            <button onClick={() => updateStatus(b.id, {status: 'NO_SHOW'}, "Marked as No-Show")} className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-md text-xs font-bold uppercase tracking-widest"><Flag size={14} className="inline mr-1"/> No Show</button>
                        </>
                    )}
                    {b.status === 'SEATED' && (
                        <button onClick={() => updateStatus(b.id, {status: 'COMPLETED'}, "Booking Completed")} className="w-full bg-green-600 text-white py-2 rounded-md text-xs font-bold uppercase tracking-widest"><CheckCircle2 size={14} className="inline mr-1"/> Mark Completed</button>
                    )}
                    
                    {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) && (
                        <button onClick={() => handleOpenEdit(b)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md text-xs font-bold uppercase tracking-widest border border-gray-200"><Edit size={14} className="inline mr-1"/> Edit</button>
                    )}
                    
                    {['PENDING', 'CONFIRMED'].includes(b.status) && hasCancelPermission && (
                        <button onClick={() => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!")} className="flex-1 bg-red-50 text-red-700 py-2 rounded-md text-xs font-bold uppercase tracking-widest border border-red-200"><X size={14} className="inline mr-1"/> Cancel</button>
                    )}
                </div>
            </div>
        ))}
      </div>

      {/* --- RE-ASSIGNMENT / STATUS MODAL --- */}
      {editingBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded shadow-2xl w-full max-w-lg">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h2 className="text-xl font-serif text-gray-900 font-bold">Transfer / Edit Booking</h2>
                    <button onClick={() => setEditingBooking(null)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      {/* ... (Keep existing Date, Session, Time, Pax, Room selects exactly the same) ... */}
                      {/* ONLY UPDATE THE STATUS SELECT BELOW */}
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Status</label>
                          <select className={`w-full border p-2 text-sm rounded font-bold ${getStatusBadge(editingBooking.status)}`} 
                            value={editingBooking.status} 
                            onChange={e => setEditingBooking({...editingBooking, status: e.target.value})}>
                              <option value="PENDING">Pending (Reviewing)</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="SEATED">Seated (Arrived)</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="NO_SHOW">No-Show</option>
                              <option value="CANCELLED">Cancelled</option>
                          </select>
                      </div>

                      <button 
                        onClick={() => updateStatus(editingBooking.id, {
                            date: editingBooking.date,
                            session: editingBooking.session,
                            time: editingBooking.time,
                            pax: editingBooking.pax,
                            dining_area: editingBooking.dining_area,
                            status: editingBooking.status 
                        }, "Booking Updated!")} 
                        className="w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-3 text-xs rounded shadow hover:bg-black transition-colors mt-4">
                          Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE MANUAL MODAL (unchanged) */}
      {showManualForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                      <div>
                          <h2 className="text-lg font-serif text-gray-900 font-bold">Create Manual Booking</h2>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">Admin Entry</p>
                      </div>
                      <button onClick={() => setShowManualForm(false)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                          <X size={18}/>
                      </button>
                  </div>
                  
                  {/* Modal Body (Scrollable) */}
                  <div className="p-6 overflow-y-auto bg-gray-50/50">
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