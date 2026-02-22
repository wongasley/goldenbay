import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, Phone, Edit } from 'lucide-react';
import ReservationForm from '../../../components/reservations/ReservationForm';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [dateFilter, setDateFilter] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  
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

  // Check rooms for the Edit Modal
  const checkEditRooms = async (date, session) => {
    setIsCheckingRooms(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reservations/check/?date=${date}&session=${session}`);
      const data = await res.json();
      setEditRooms(data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
    } catch (err) {}
    setIsCheckingRooms(false);
  };

  // Triggered when Admin clicks the "Edit" button
  const handleOpenEdit = (booking) => {
    setEditingBooking({
        ...booking,
        original_dining_area: booking.dining_area // Save original to prevent it from locking itself out
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

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-3">
        <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Booking Management</h1>
            <p className="text-gray-500 text-xs">Manage, confirm, and transfer reservations.</p>
        </div>
        <button onClick={() => setShowManualForm(true)} className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-all flex items-center gap-1.5">
          <Plus size={14} /> Manual Booking
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-all border ${filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>{f}</button>
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
                        <div className="font-bold text-gray-900">{b.customer_name}</div>
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
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border inline-block ${
                            b.status === 'PENDING' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
                            b.status === 'CONFIRMED' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
                        }`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                    {b.status !== 'CANCELLED' && (
                        <div className="flex justify-end gap-1.5">
                            {b.status === 'PENDING' && (
                                <button onClick={() => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!")} className="bg-green-50 text-green-600 p-1.5 rounded border border-green-200 hover:bg-green-100" title="Quick Confirm"><Check size={14} /></button>
                            )}
                            {/* NEW EDIT BUTTON */}
                            <button onClick={() => handleOpenEdit(b)} className="bg-blue-50 text-blue-600 p-1.5 rounded border border-blue-200 hover:bg-blue-100" title="Transfer Room / Edit Status"><Edit size={14} /></button>
                            <button onClick={() => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!")} className="bg-red-50 text-red-600 p-1.5 rounded border border-red-200 hover:bg-red-100" title="Cancel"><X size={14} /></button>
                        </div>
                    )}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS (Also updated with Edit button) */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredBookings.map((b) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{b.customer_name}</h3>
                        <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5 mt-1"><Phone size={12}/> {b.customer_contact}</span>
                    </div>
                    <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border">{b.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 my-4 text-sm bg-gray-50 p-3 rounded border border-gray-100">
                    <div><p className="font-bold text-gray-900">{b.date}</p><p className="text-xs text-gray-600">{b.time}</p></div>
                    <div><p className="font-bold text-gray-900 line-clamp-1">{b.room_name}</p><p className="text-xs text-gray-600">{b.pax} Guests</p></div>
                </div>
                {b.status !== 'CANCELLED' && (
                    <div className="flex gap-2 mt-4">
                        {b.status === 'PENDING' && <button onClick={() => updateStatus(b.id, {status: 'CONFIRMED'}, "Confirmed!")} className="flex-1 bg-green-600 text-white py-2 rounded-md text-xs font-bold uppercase tracking-widest"><Check size={14} className="inline mr-1"/> Confirm</button>}
                        <button onClick={() => handleOpenEdit(b)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-md text-xs font-bold uppercase tracking-widest border border-blue-200"><Edit size={14} className="inline mr-1"/> Edit</button>
                        <button onClick={() => updateStatus(b.id, {status: 'CANCELLED'}, "Cancelled!")} className="flex-1 bg-red-50 text-red-700 py-2 rounded-md text-xs font-bold uppercase tracking-widest border border-red-200"><X size={14} className="inline mr-1"/> Cancel</button>
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* --- RE-ASSIGNMENT MODAL --- */}
      {editingBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded shadow-2xl w-full max-w-lg">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h2 className="text-xl font-serif text-gray-900 font-bold">Transfer / Edit Booking</h2>
                    <button onClick={() => setEditingBooking(null)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Date</label>
                              <input type="date" className="w-full border p-2 text-sm rounded" 
                                value={editingBooking.date} 
                                onChange={e => {
                                    setEditingBooking({...editingBooking, date: e.target.value});
                                    checkEditRooms(e.target.value, editingBooking.session);
                                }} 
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Session</label>
                              <select className="w-full border p-2 text-sm rounded" 
                                value={editingBooking.session} 
                                onChange={e => {
                                    setEditingBooking({...editingBooking, session: e.target.value});
                                    checkEditRooms(editingBooking.date, e.target.value);
                                }}>
                                  <option value="LUNCH">Lunch</option>
                                  <option value="DINNER">Dinner</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Time</label>
                              <select className="w-full border p-2 text-sm rounded" value={editingBooking.time} onChange={e => setEditingBooking({...editingBooking, time: e.target.value})}>
                                  {generateTimeSlots(editingBooking.session).map(slot => (
                                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Guests (Pax)</label>
                              <input type="number" min="1" className="w-full border p-2 text-sm rounded" value={editingBooking.pax} onChange={e => setEditingBooking({...editingBooking, pax: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Assign Room {isCheckingRooms && <span className="text-gold-500 normal-case">(Checking...)</span>}</label>
                              <select className="w-full border p-2 text-sm rounded" value={editingBooking.dining_area} onChange={e => setEditingBooking({...editingBooking, dining_area: e.target.value})}>
                                  {editRooms.map(room => {
                                      // It is disabled if it's not available AND it's not the room they currently have selected
                                      const isDisabled = !room.is_available && room.id !== editingBooking.original_dining_area;
                                      let label = room.name;
                                      if (room.area_type === 'HALL') label += ` (${room.remaining_capacity} seats left)`;
                                      else if (isDisabled) label += " [BOOKED]";
                                      
                                      return (
                                          <option key={room.id} value={room.id} disabled={isDisabled} className={isDisabled ? 'text-gray-300' : ''}>
                                              {label}
                                          </option>
                                      );
                                  })}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Status</label>
                              <select className={`w-full border p-2 text-sm rounded font-bold ${editingBooking.status === 'CONFIRMED' ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50'}`} 
                                value={editingBooking.status} 
                                onChange={e => setEditingBooking({...editingBooking, status: e.target.value})}>
                                  <option value="PENDING">Pending (Reviewing)</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="CANCELLED">Cancelled</option>
                              </select>
                          </div>
                      </div>

                      <button 
                        onClick={() => updateStatus(editingBooking.id, {
                            date: editingBooking.date,
                            session: editingBooking.session,
                            time: editingBooking.time,
                            pax: editingBooking.pax,
                            dining_area: editingBooking.dining_area,
                            status: editingBooking.status // Sends the updated status
                        }, "Booking Updated & Notified!")} 
                        className="w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-3 text-xs rounded shadow hover:bg-black transition-colors mt-4">
                          Save & Notify Customer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE MANUAL MODAL */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded shadow-2xl w-full max-w-lg">
                <h2 className="text-xl font-serif text-gray-900 mb-4 font-bold border-b border-gray-100 pb-2">Manual Staff Entry</h2>
                <ReservationForm isManualEntry={true} date={new Date()} session="DINNER" selectedRoom={null} onSuccess={() => { toast.success("Created!"); setShowManualForm(false); fetchBookings(); }} onCancel={() => setShowManualForm(false)} />
            </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;