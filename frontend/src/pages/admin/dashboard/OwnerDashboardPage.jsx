import React, { useEffect, useState } from 'react';
import { Users, Crown, CalendarCheck, DoorOpen, BarChart3, TrendingUp, DollarSign, Gift } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden h-full">
    <div className={`absolute top-0 right-0 w-20 h-20 bg-${colorClass}-50 rounded-bl-full -mr-4 -mt-4`}></div>
    <div className="relative z-10 flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg bg-${colorClass}-50 text-${colorClass}-600`}>
        <Icon size={22} />
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-3xl font-bold text-gray-900 font-sans tracking-tight mb-1">{value}</h3>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mt-2">{subtitle}</p>}
    </div>
  </div>
);

const OwnerDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axiosInstance.get('/api/reservations/reports/');
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load owner reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
        <div className="space-y-6 pb-20">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-24 animate-pulse"></div>
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mt-8 mb-2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1,2,3,4].map(i => <div key={i} className="bg-white h-32 rounded-xl border border-gray-200 shadow-sm animate-pulse"></div>)}
            </div>
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mt-8 mb-2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1,2,3].map(i => <div key={i} className="bg-white h-32 rounded-xl border border-gray-200 shadow-sm animate-pulse"></div>)}
            </div>
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mt-8 mb-2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1,2].map(i => <div key={i} className="bg-white h-96 rounded-xl border border-gray-200 shadow-sm animate-pulse"></div>)}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header (No Action Buttons) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-3">
          <div className="p-2 bg-gold-50 rounded-lg border border-gold-100">
            <BarChart3 size={24} className="text-gold-600"/> 
          </div>
          Executive Analytics
        </h1>
        <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-medium">Read-Only Performance Overview</p>
      </div>

      {/* TODAY'S METRICS */}
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mt-8 border-b border-gray-200 pb-2">Today's Operations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Est. Revenue" value={data.today.estimated_revenue} icon={DollarSign} colorClass="green" subtitle="Based on ₱1,500/head avg" />
        <StatCard title="Total Pax" value={data.today.pax} icon={Users} colorClass="blue" subtitle="Guests expected today" />
        <StatCard title="VIP Rooms Active" value={data.today.vip_rooms_occupied} icon={DoorOpen} colorClass="purple" subtitle="Occupied VIP Suites" />
        <StatCard title="Bookings Today" value={data.today.bookings} icon={CalendarCheck} colorClass="orange" subtitle="Active reservations" />
      </div>

      {/* ALL-TIME CRM METRICS */}
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mt-8 border-b border-gray-200 pb-2">CRM & Lifetime Value</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Total Customers" value={data.all_time.total_customers.toLocaleString()} icon={Users} colorClass="gray" subtitle="Registered in Phone Book" />
        <StatCard title="Elite VIPs" value={data.all_time.total_vip_customers.toLocaleString()} icon={Crown} colorClass="gold" subtitle="High-value returning guests" />
        <StatCard title="Points Liability" value={data.all_time.points_liability.toLocaleString()} icon={Gift} colorClass="rose" subtitle="Total unredeemed points in economy" />
      </div>

      {/* 30-DAY TREND CHARTS */}
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mt-8 border-b border-gray-200 pb-2">30-Day Trajectory</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue/Pax Chart */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-gold-600"/> Guest Footfall (Last 30 Days)
            </h3>
            <div className="h-72 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPax" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} minTickGap={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" name="Total Pax" dataKey="pax" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorPax)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Bookings Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <CalendarCheck size={16} className="text-blue-500"/> Reservation Volume (Last 30 Days)
            </h3>
            <div className="h-72 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} minTickGap={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} cursor={{fill: '#f3f4f6'}} />
                        <Bar name="Reservations" dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
};

export default OwnerDashboardPage;