import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Calendar, 
    Clock, 
    Contact, 
    Megaphone, // Added for Marketing
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = "http://127.0.0.1:8000";

// --- PROFESSIONAL STAT CARD COMPONENT ---
const StatCard = ({ title, value, icon: Icon, colorClass, linkTo, subText }) => (
  <Link to={linkTo} className="group block h-full">
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gold-300 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${colorClass}-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>

        <div className="relative z-10 flex justify-between items-start mb-4">
            <div className={`p-3 rounded-md ${colorClass === 'gold' ? 'bg-amber-100 text-amber-700' : `bg-${colorClass}-100 text-${colorClass}-700`}`}>
                <Icon size={24} />
            </div>
            {subText && <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">{subText}</span>}
        </div>

        <div className="relative z-10">
            <h3 className="text-3xl font-bold text-gray-900 font-sans tracking-tight mb-1 group-hover:text-gold-600 transition-colors">{value}</h3>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        </div>
    </div>
  </Link>
);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({ 
    today_count: 0, 
    pending_count: 0, 
    vip_pax: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch(`${BACKEND_URL}/api/reservations/dashboard/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            setStats(data.stats);
            setRecentBookings(data.recent_bookings);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      
      {/* 1. UNIFIED HEADER */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
         <div>
            <h1 className="text-3xl font-bold text-gray-900 font-serif">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1 text-sm">Real-time insights for {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
         </div>
      </div>

      {/* 2. KEY METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* STAT 1: RESERVATIONS */}
          <StatCard 
             title="Today's Guests" 
             value={loading ? "..." : stats.today_count} 
             icon={Users} 
             colorClass="blue" 
             linkTo="/admin/bookings"
             subText="Reservations"
          />

          {/* STAT 2: PENDING */}
          <StatCard 
             title="Pending Actions" 
             value={loading ? "..." : stats.pending_count} 
             icon={AlertCircle} 
             colorClass="red" 
             linkTo="/admin/bookings"
             subText="Urgent"
          />
          
          {/* LINK 1: PHONE BOOK */}
          <Link to="/admin/customers" className="group block h-full">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gold-300 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="p-3 rounded-md bg-orange-100 text-orange-700">
                        <Contact size={24} />
                    </div>
                </div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-bold text-gray-900 font-sans tracking-tight mb-1 group-hover:text-gold-600 transition-colors">CRM</h3>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Phone Book</p>
                </div>
            </div>
          </Link>

          {/* LINK 2: MARKETING (Replaced Revenue) */}
          <Link to="/admin/marketing" className="group block h-full">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gold-300 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="p-3 rounded-md bg-purple-100 text-purple-700">
                        <Megaphone size={24} />
                    </div>
                </div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-bold text-gray-900 font-sans tracking-tight mb-1 group-hover:text-gold-600 transition-colors">Content</h3>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">News & Promos</p>
                </div>
            </div>
          </Link>
      </div>

      {/* 3. RECENT ACTIVITY TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <h3 className="font-bold text-gray-900 text-lg">Recent Reservations</h3>
             <Link to="/admin/bookings" className="text-sm font-medium text-gold-600 hover:text-gold-700 flex items-center gap-1">
                View All <ArrowRight size={14} />
             </Link>
          </div>
          
          <div className="divide-y divide-gray-100">
             {loading ? (
                <div className="p-8 text-center text-gray-400 animate-pulse text-sm">Loading data...</div>
             ) : recentBookings.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No new bookings today.</div>
             ) : (
                recentBookings.map((booking) => (
                   <div key={booking.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center">
                      
                      {/* Customer */}
                      <div className="col-span-4">
                         <p className="font-bold text-gray-900 text-sm">{booking.customer_name}</p>
                         <p className="text-xs text-gray-500 font-medium">{booking.customer_contact}</p>
                      </div>

                      {/* Details */}
                      <div className="col-span-4">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded uppercase tracking-wide">{booking.time}</span>
                            <span className="text-xs text-gray-600 font-medium">{booking.pax} Pax</span>
                         </div>
                         <p className="text-xs text-gray-500 mt-1 font-medium">{booking.room_name || 'Main Hall'}</p>
                      </div>

                      {/* Status */}
                      <div className="col-span-3">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border
                            ${booking.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                              booking.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' : 
                              'bg-red-50 text-red-700 border-red-200'}`}>
                            {booking.status}
                         </span>
                      </div>

                      {/* Action */}
                      <div className="col-span-1 text-right">
                         <Link to="/admin/bookings" className="text-gray-300 hover:text-gold-600">
                            <ArrowRight size={18} />
                         </Link>
                      </div>
                   </div>
                ))
             )}
          </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;