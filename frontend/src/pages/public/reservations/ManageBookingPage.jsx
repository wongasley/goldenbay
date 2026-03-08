import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Users, XCircle, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const ManageBookingPage = () => {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/reservations/manage-link/${token}/`);
        setBooking(res.data);
      } catch (err) {
        toast.error("Invalid or expired booking link.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [token]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this reservation? This cannot be undone.")) return;
    
    setIsCancelling(true);
    try {
      await axios.patch(`${BACKEND_URL}/api/reservations/manage-link/${token}/`, { action: 'CANCEL' });
      toast.success("Reservation cancelled successfully.");
      setBooking({ ...booking, status: 'CANCELLED' });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to cancel reservation.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 pt-32 pb-20 px-6 font-sans flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto bg-white p-8 shadow-xl border border-gray-200">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-100 animate-pulse rounded w-1/4 mx-auto mb-10"></div>
            <div className="h-32 bg-gray-50 animate-pulse rounded w-full mb-8"></div>
            <div className="h-12 bg-gray-200 animate-pulse rounded w-full mb-4"></div>
        </div>
      </div>
    );
  }
  
  if (!booking) return <div className="min-h-screen flex flex-col items-center justify-center pt-24 font-serif text-2xl text-gray-900">Reservation not found.</div>;

  return (
    <div className="min-h-screen bg-cream-50 pt-32 pb-20 px-6 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 shadow-xl border border-gray-200 text-center">
        <h1 className="text-3xl font-serif text-gray-900 mb-2">Manage Reservation</h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-8">Ref: #{booking.id}</p>

        <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border
          ${booking.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
            booking.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
            'bg-amber-50 text-amber-700 border-amber-200'}`}
        >
          {booking.status}
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 space-y-4 mb-8 text-left max-w-md mx-auto">
          <div className="flex items-center gap-4 text-gray-700">
            <Calendar size={18} className="text-gold-600" />
            <span className="font-medium">{booking.date} at {booking.time}</span>
          </div>
          <div className="flex items-center gap-4 text-gray-700">
            <Users size={18} className="text-gold-600" />
            <span className="font-medium">{booking.pax} Guests</span>
          </div>
          <div className="flex items-center gap-4 text-gray-700">
            <MapPin size={18} className="text-gold-600" />
            <span className="font-medium">{booking.room_name || 'Main Dining Hall'}</span>
          </div>
        </div>

        {['PENDING', 'CONFIRMED'].includes(booking.status) ? (
          <div className="flex flex-col gap-4 max-w-md mx-auto mt-8">
            <p className="text-xs text-gray-500 mb-2">Need to change the date, time, or guest count? Please call our concierge directly at (02) 8804-0332.</p>
            <button onClick={handleCancel} disabled={isCancelling} className="w-full py-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <XCircle size={16} /> {isCancelling ? 'Cancelling...' : 'Cancel Reservation'}
            </button>
            <Link to="/" className="w-full py-4 bg-gray-900 text-white hover:bg-black font-bold uppercase tracking-widest text-xs transition-colors block">
              Keep Reservation
            </Link>
          </div>
        ) : (
          <Link to="/reservations" className="inline-block border-b border-gold-600 text-gold-600 pb-1 text-xs uppercase tracking-widest font-bold hover:text-black transition-colors">
            Book a new table
          </Link>
        )}
      </div>
    </div>
  );
};

export default ManageBookingPage;