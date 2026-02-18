import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Phone } from 'lucide-react';
import ReservationForm from '../../../components/reservations/ReservationForm';

const BACKEND_URL = "http://127.0.0.1:8000";

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [showManualForm, setShowManualForm] = useState(false);

  const fetchBookings = async () => {
    const token = localStorage.getItem('accessToken'); 
    try {
      const res = await fetch(`${BACKEND_URL}/api/reservations/manage/`, {
        headers: {
            'Authorization': `Bearer ${token}` 
        }
      });
      if (res.status === 401) window.location.href = '/login'; 
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
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

    try {
      const res = await fetch(`${BACKEND_URL}/api/reservations/manage/${id}/`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.status === 401) { 
          window.location.href = '/login';
          return;
      }
      if (res.ok) fetchBookings(); 
    } catch (err) {
      alert("Error updating status");
    }
  };

  const filteredBookings = bookings.filter(b => 
    filter === 'ALL' ? true : b.status === filter
  );

  const isStale = (bookingDate, status) => {
    if (status !== 'PENDING') return false;
    const created = new Date(bookingDate); 
    const now = new Date();
    const diffInHours = (now - created) / 1000 / 60 / 60;
    return diffInHours > 2; 
  };

  return (
    <div className="space-y-8">
      
      {/* 1. UNIFIED HEADER */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 font-serif">Booking Management</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage, confirm, and track all reservations.</p>
        </div>
        <button 
          onClick={() => setShowManualForm(true)}
          className="bg-gold-600 text-white px-6 py-2.5 font-bold uppercase tracking-widest text-xs rounded shadow-md hover:bg-gold-700 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Manual Booking
        </button>
      </div>

      {/* 2. FILTERS */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm transition-all border ${
              filter === f 
              ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 3. TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest text-xs font-semibold">
            <tr>
              <th className="p-5 font-bold">ID</th>
              <th className="p-5 font-bold">Customer</th>
              <th className="p-5 font-bold">Date / Time</th>
              <th className="p-5 font-bold">Details</th>
              <th className="p-5 font-bold">Status</th>
              <th className="p-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBookings.map((b) => (
              <tr 
                key={b.id} 
                className={`transition-colors ${
                    isStale(b.created_at, b.status) 
                    ? 'bg-red-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="p-5 text-gray-400 font-mono text-sm">#{b.id}</td>
                
                <td className="p-5">
                  <div className="font-bold text-gray-900 text-sm">{b.customer_name}</div>
                  <div className="text-xs text-gray-500 flex gap-2 mt-1 font-medium items-center">
                    <Phone size={12} className="text-gray-400"/> {b.customer_contact}
                  </div>
                </td>

                <td className="p-5">
                  <div className="text-gold-700 font-bold text-sm">{b.date}</div>
                  <div className="text-xs font-medium text-gray-600 mt-1">{b.time} <span className="text-gray-400 font-normal">({b.session})</span></div>
                </td>

                <td className="p-5">
                  <div className="text-gray-900 font-bold text-sm">
                    {b.room_name || 'Main Dining Hall'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">{b.pax} Guests</div>
                </td>

                <td className="p-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                    b.status === 'PENDING' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
                    b.status === 'CONFIRMED' ? 'text-green-700 bg-green-50 border-green-200' :
                    'text-red-700 bg-red-50 border-red-200'
                  }`}>
                    {b.status}
                  </span>
                  {isStale(b.created_at, b.status) && (
                      <div className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-wide flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Needs Action
                      </div>
                  )}
                </td>

                <td className="p-5 text-right">
                  {b.status !== 'CANCELLED' && (
                    <div className="flex justify-end gap-2">
                      {b.status === 'PENDING' && (
                        <button 
                          onClick={() => updateStatus(b.id, 'CONFIRMED')}
                          className="bg-green-50 text-green-600 p-2 rounded border border-green-200 hover:bg-green-100 transition-colors"
                          title="Confirm Booking"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => updateStatus(b.id, 'CANCELLED')}
                        className="bg-red-50 text-red-600 p-2 rounded border border-red-200 hover:bg-red-100 transition-colors"
                        title="Cancel Booking"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredBookings.length === 0 && (
            <div className="p-12 text-center text-gray-400 text-sm">No bookings found in this category.</div>
        )}
      </div>

      {/* Manual Booking Form Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg w-full max-w-lg relative shadow-2xl">
                <h2 className="text-2xl font-serif text-gray-900 mb-6 font-bold">Manual Staff Entry</h2>
                
                <ReservationForm 
                    isManualEntry={true}
                    date={new Date()} 
                    session="DINNER"  
                    selectedRoom={null} 
                    onSuccess={() => {
                        alert("Booking Created!");
                        setShowManualForm(false);
                        fetchBookings(); 
                    }}
                    onCancel={() => setShowManualForm(false)}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;