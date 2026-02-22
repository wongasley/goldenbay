import React, { useEffect, useState } from 'react';
import { Users, Contact, Megaphone, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const StatCard = ({ title, value, icon: Icon, colorClass, linkTo, subText }) => (
  <Link to={linkTo} className="group block h-full">
    <div className="bg-white p-4 rounded border border-gray-200 shadow-sm hover:shadow hover:border-gold-300 transition-all duration-200 h-full flex flex-col justify-between relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-16 h-16 bg-${colorClass}-50 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110`}></div>
        <div className="relative z-10 flex justify-between items-start mb-2">
            <div className={`p-2 rounded ${colorClass === 'gold' ? 'bg-amber-50 text-amber-600' : `bg-${colorClass}-50 text-${colorClass}-600`}`}>
                <Icon size={18} />
            </div>
            {subText && <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 uppercase tracking-widest">{subText}</span>}
        </div>
        <div className="relative z-10">
            <h3 className="text-2xl font-bold text-gray-900 font-sans tracking-tight mb-0.5 group-hover:text-gold-600 transition-colors">{value}</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        </div>
    </div>
  </Link>
);

const AdminDashboardPage = () => {
  const [data, setData] = useState({ stats: { today_count: 0, pending_count: 0 }, recent_bookings: [], chart_data: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch(`${BACKEND_URL}/api/reservations/dashboard/`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (response.ok) setData(await response.json());
      } catch (error) {
        console.error(error);
      } finally { setLoading(false); }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end border-b border-gray-200 pb-3">
         <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Dashboard Overview</h1>
            <p className="text-gray-500 text-xs">Insights for {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Guests" value={loading ? "-" : data.stats.today_count} icon={Users} colorClass="blue" linkTo="/staff/bookings" subText="Reservations" />
          <StatCard title="Pending Actions" value={loading ? "-" : data.stats.pending_count} icon={AlertCircle} colorClass="red" linkTo="/staff/bookings" subText="Urgent" />
          <StatCard title="CRM" value="Phone Book" icon={Contact} colorClass="orange" linkTo="/staff/customers" />
          <StatCard title="Content" value="Marketing" icon={Megaphone} colorClass="purple" linkTo="/staff/marketing" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CHART SECTION */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-4">7-Day Booking Trend</h3>
            {loading ? <div className="h-64 bg-gray-50 animate-pulse rounded w-full"></div> : (
                <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                            <Tooltip contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="bookings" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

        {/* RECENT BOOKINGS */}
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest">Recent</h3>
                <Link to="/staff/bookings" className="text-[10px] font-bold text-gold-600 hover:text-gold-700 uppercase flex items-center gap-1">View All <ArrowRight size={12} /></Link>
            </div>
            <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
                {loading ? <div className="p-4 text-center text-gray-400 animate-pulse text-xs">Loading...</div> : 
                 data.recent_bookings.map((b) => (
                    <div key={b.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between mb-1">
                            <p className="font-bold text-gray-900 text-xs">{b.customer_name}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border 
                              ${b.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                 b.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                 b.status === 'SEATED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                 b.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                 b.status === 'NO_SHOW' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                 'bg-red-50 text-red-700 border-red-200'}`}>
                              {b.status.replace('_', '-')}
                           </span>
                        </div>
                        <p className="text-[10px] text-gray-500">{b.date} • {b.time} • {b.pax} Pax</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboardPage;