import React, { useEffect, useState } from 'react';
import { Users, Contact, Megaphone, AlertCircle, ArrowRight, Gift, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';
import { canManageMarketing, canManageMenu } from '../../../utils/auth';

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
  const isMarketingAdmin = canManageMarketing();
  const isMenuAdmin = canManageMenu();

  // --- NEW: Points Modal State ---
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [pointsForm, setPointsForm] = useState({ phone: '', amount: '', name: '' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get('/api/reservations/dashboard/');
        setData(response.data);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally { 
        setLoading(false); 
      }
    };
    fetchDashboardData();
  }, []);

  const handleAwardPoints = async (e) => {
      e.preventDefault();
      setIsAwarding(true);
      try {
          const res = await axiosInstance.post('/api/reservations/award-points/', {
              phone: pointsForm.phone,
              name: pointsForm.name,
              amount_spent: pointsForm.amount
          });
          
          if (res.data.points_earned > 0) {
              toast.success(`Success! ${res.data.customer_name} earned ${res.data.points_earned} points.`);
          } else {
              toast('Amount too low to earn points.', { icon: 'ℹ️' });
          }
          
          setShowPointsModal(false);
          setPointsForm({ phone: '', amount: '', name: '' });
      } catch (err) {
          toast.error(err.response?.data?.non_field_errors?.[0] || "Failed to award points.");
      } finally {
          setIsAwarding(false);
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-3">
         <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Dashboard Overview</h1>
            <p className="text-gray-500 text-xs">Insights for {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
         </div>
         {/* Quick Action Button for Cashiers */}
         <button onClick={() => setShowPointsModal(true)} className="w-full md:w-auto bg-gold-600 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2">
            <Gift size={16} /> Award Points
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Guests" value={loading ? "-" : data.stats.today_count} icon={Users} colorClass="blue" linkTo="/staff/bookings" subText="Reservations" />
          <StatCard title="Pending Actions" value={loading ? "-" : data.stats.pending_count} icon={AlertCircle} colorClass="red" linkTo="/staff/bookings" subText="Urgent" />
          <StatCard title="CRM" value="Phone Book" icon={Contact} colorClass="orange" linkTo="/staff/customers" />
          {isMarketingAdmin && (
             <StatCard title="Content" value="Marketing" icon={Megaphone} colorClass="purple" linkTo="/staff/marketing" />
          )}

          {/* OPTIONAL: SHOW MENU MANAGER CARD TO SUPERVISORS/ADMINS */}
          {isMenuAdmin && !isMarketingAdmin && (
             <StatCard title="Menu" value="Menu Manager" icon={Utensils} colorClass="green" linkTo="/staff/menu" />
          )}
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

      {/* --- QUICK AWARD POINTS MODAL --- */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-serif text-gray-900 font-bold flex items-center gap-2"><Gift size={18} className="text-gold-600"/> Award Points</h2>
                    <button onClick={() => setShowPointsModal(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={18}/></button>
                </div>
                
                <form onSubmit={handleAwardPoints} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Customer Phone <span className="text-red-500">*</span></label>
                        <input required type="tel" placeholder="e.g. 0917 123 4567" className="w-full bg-white border border-gray-300 p-2.5 text-sm focus:border-gold-500 outline-none rounded-sm transition-all"
                            value={pointsForm.phone} onChange={e => setPointsForm({...pointsForm, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total Bill Amount (₱) <span className="text-red-500">*</span></label>
                        <input required type="number" min="0" step="0.01" placeholder="e.g. 15500.00" className="w-full bg-white border border-gray-300 p-2.5 text-sm focus:border-gold-500 outline-none rounded-sm transition-all"
                            value={pointsForm.amount} onChange={e => setPointsForm({...pointsForm, amount: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Customer Name <span className="text-gray-400 font-normal lowercase">(Optional for new numbers)</span></label>
                        <input type="text" placeholder="Leave blank if already registered" className="w-full bg-white border border-gray-300 p-2.5 text-sm focus:border-gold-500 outline-none rounded-sm transition-all"
                            value={pointsForm.name} onChange={e => setPointsForm({...pointsForm, name: e.target.value})}
                        />
                    </div>

                    <button type="submit" disabled={isAwarding || !pointsForm.phone || !pointsForm.amount} className="w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-3 text-xs hover:bg-black transition-colors disabled:opacity-50 rounded-sm shadow-md mt-4">
                        {isAwarding ? 'Processing...' : 'Award Points Now'}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};
export default AdminDashboardPage;