import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, Phone } from 'lucide-react';
import ReservationForm from '../../../components/reservations/ReservationForm';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [dateFilter, setDateFilter] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

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
      console.error("Failed to fetch bookings", err);
      toast.error("Failed to load reservations.");
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(() => { fetchBookings(); }, 30000);
    return () => clearInterval(interval); 
  }, []);

  const updateStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;
    const token = localStorage.getItem('accessToken'); 
    const updatePromise = fetch(`${BACKEND_URL}/api/reservations/manage/${id}/`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
    }).then(async (res) => {
        if (res.status === 401) { 
            window.location.href = '/login';
            throw new Error("Unauthorized");
        }
        if (!res.ok) throw new Error("Failed to update");
        fetchBookings(); 
        return res.json();
    });

    toast.promise(updatePromise, {
        loading: 'Updating...',
        success: `Marked as ${newStatus}!`,
        error: 'Failed to update.',
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

  return (
    <div className="space-y-4">
      
      {/* 1. COMPACT HEADER */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-3">
        <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Booking Management</h1>
            <p className="text-gray-500 text-xs">Manage, confirm, and track all reservations.</p>
        </div>
        <button 
          onClick={() => setShowManualForm(true)}
          className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-all flex items-center gap-1.5"
        >
          <Plus size={14} /> Manual Booking
        </button>
      </div>

      {/* 2. FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-all border ${
                  filter === f ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          {/* NEW DATE FILTER */}
          <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Date:</span>
              <input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-gold-500 text-gray-700"
              />
              {dateFilter && (
                  <button onClick={() => setDateFilter('')} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase">Clear</button>
              )}
          </div>
      </div>

      {/* 3. RESPONSIVE DATA DISPLAY */}
      
      {/* --- DESKTOP VIEW (TABLE) --- */}
      <div className="hidden md:block bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase tracking-widest text-[10px] font-bold">
            <tr>
              <th className="px-4 py-2.5">ID</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Date / Time</th>
              <th className="px-4 py-2.5">Details</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredBookings.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">No bookings found in this category.</td></tr>
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
                            b.status === 'CONFIRMED' ? 'text-green-700 bg-green-50 border-green-200' :
                            'text-red-700 bg-red-50 border-red-200'
                        }`}>
                            {b.status}
                        </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                    {b.status !== 'CANCELLED' && (
                        <div className="flex justify-end gap-1.5">
                        {b.status === 'PENDING' && (
                            <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="bg-green-50 text-green-600 p-1.5 rounded border border-green-200 hover:bg-green-100" title="Confirm">
                                <Check size={14} />
                            </button>
                        )}
                        <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="bg-red-50 text-red-600 p-1.5 rounded border border-red-200 hover:bg-red-100" title="Cancel">
                            <X size={14} />
                        </button>
                        </div>
                    )}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE VIEW (CARDS) --- */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 rounded">No bookings found.</div>
        ) : (
            filteredBookings.map((b) => (
                <div key={b.id} className={`bg-white border rounded-lg p-5 shadow-sm relative overflow-hidden ${isStale(b.created_at, b.status) ? 'border-red-300' : 'border-gray-200'}`}>
                    {/* Left Red Indicator for Stale Bookings */}
                    {isStale(b.created_at, b.status) && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                    
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{b.customer_name}</h3>
                            <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5 mt-1"><Phone size={12}/> {b.customer_contact}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border inline-block ${
                            b.status === 'PENDING' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
                            b.status === 'CONFIRMED' ? 'text-green-700 bg-green-50 border-green-200' :
                            'text-red-700 bg-red-50 border-red-200'
                        }`}>
                            {b.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4 text-sm bg-gray-50 p-3 rounded border border-gray-100">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Date & Time</p>
                            <p className="font-bold text-gray-900">{b.date}</p>
                            <p className="text-xs text-gray-600">{b.time} ({b.session})</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Details</p>
                            <p className="font-bold text-gray-900 line-clamp-1">{b.room_name || 'Main Hall'}</p>
                            <p className="text-xs text-gray-600">{b.pax} Guests</p>
                        </div>
                    </div>

                    {b.status !== 'CANCELLED' && (
                        <div className="flex gap-2 mt-4">
                            {b.status === 'PENDING' && (
                                <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="flex-1 bg-green-600 text-white py-3 rounded-md text-xs font-bold uppercase tracking-widest hover:bg-green-700 flex justify-center items-center gap-2 shadow-sm transition-colors">
                                    <Check size={16} /> Confirm
                                </button>
                            )}
                            <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="flex-1 bg-red-50 text-red-700 py-3 rounded-md text-xs font-bold uppercase tracking-widest border border-red-200 hover:bg-red-100 flex justify-center items-center gap-2 transition-colors">
                                <X size={16} /> Cancel
                            </button>
                        </div>
                    )}
                </div>
            ))
        )}
      </div>

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