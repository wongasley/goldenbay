import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, Clock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

const RewardsManager = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        try {
            const res = await axiosInstance.get('/api/reservations/manage/redemptions/');
            setTickets(res.data);
        } catch (err) {
            toast.error("Failed to load reward tickets.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 15000); // Auto-refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const updateTicketStatus = async (id, newStatus, rewardName) => {
        if (newStatus === 'CANCELLED' && !window.confirm(`Cancel this ticket? Points will be refunded to the customer.`)) return;
        
        try {
            await axiosInstance.patch(`/api/reservations/manage/redemptions/${id}/`, { status: newStatus });
            toast.success(`Ticket marked as ${newStatus}`);
            fetchTickets();
        } catch (err) {
            toast.error("Failed to update ticket.");
        }
    };

    return (
        <div className="space-y-6 pb-20">
            
            {/* Header Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-3">
                        <div className="p-2 bg-gold-50 rounded-lg border border-gold-100">
                            <Gift size={24} className="text-gold-600"/> 
                        </div>
                        Reward Fulfillment
                    </h1>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-medium">Manage live customer redemptions</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span> Pending</span>
                    <span className="flex items-center gap-1.5 ml-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Claimed</span>
                    <span className="flex items-center gap-1.5 ml-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Cancelled</span>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                   {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="bg-white border rounded-xl p-6 shadow-sm flex flex-col gap-4 animate-pulse border-gray-200">
                          <div className="flex justify-between"><div className="h-6 w-20 bg-gray-200 rounded"></div><div className="h-6 w-16 bg-gray-100 rounded"></div></div>
                          <div className="h-5 w-3/4 bg-gray-200 rounded mt-2"></div>
                          <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                          <div className="h-20 w-full bg-gray-50 rounded my-2"></div>
                          <div className="h-10 w-full bg-gray-200 rounded mt-auto"></div>
                      </div>
                   ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="p-16 text-center text-gray-400 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col items-center">
                    <Gift size={40} className="mb-4 text-gray-300" strokeWidth={1} />
                    <p className="text-sm font-medium text-gray-600">No active redemption tickets.</p>
                    <p className="text-xs mt-1">When customers claim rewards, they will appear here instantly.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {tickets.map(ticket => (
                        <div 
                            key={ticket.id} 
                            className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-md
                                ${ticket.status === 'PENDING' ? 'border-l-4 border-l-amber-400 border-t-gray-200 border-r-gray-200 border-b-gray-200 bg-amber-50/10' : 
                                  ticket.status === 'CLAIMED' ? 'border-l-4 border-l-emerald-500 border-t-gray-200 border-r-gray-200 border-b-gray-200' : 
                                  'border-l-4 border-l-rose-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 bg-gray-50/50 grayscale'}`}
                        >
                            
                            {/* Card Header (Status & Time) */}
                            <div className="flex justify-between items-start">
                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border shrink-0 shadow-sm
                                    ${ticket.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                                      ticket.status === 'CLAIMED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 
                                      'bg-rose-100 text-rose-800 border-rose-300'}`}>
                                    {ticket.status}
                                </span>
                                <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">
                                    <Clock size={12} className="text-gray-400"/> 
                                    {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>

                            {/* Customer Details */}
                            <div>
                                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                    <User size={14} className="text-gray-400"/> {ticket.customer_name}
                                </h3>
                                <p className="text-xs text-gray-500 font-mono mt-1.5 flex items-center gap-2">
                                    <Phone size={12} className="text-gray-400"/> {ticket.customer_phone}
                                </p>
                            </div>

                            {/* Reward Item Box */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 my-2">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Action Required: Serve Item</p>
                                <p className="font-serif font-bold text-gold-600 text-lg leading-tight">{ticket.reward_name}</p>
                            </div>

                            {/* Actions Footer */}
                            {ticket.status === 'PENDING' ? (
                                <div className="flex gap-3 mt-auto pt-2">
                                    <button 
                                        onClick={() => updateTicketStatus(ticket.id, 'CANCELLED', ticket.reward_name)} 
                                        className="px-4 bg-white text-rose-600 border border-rose-200 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-rose-50 hover:border-rose-300 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center"
                                    >
                                        Refund
                                    </button>
                                    <button 
                                        onClick={() => updateTicketStatus(ticket.id, 'CLAIMED', ticket.reward_name)} 
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5 hover:shadow-md hover:from-emerald-700 hover:to-emerald-600 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                                    >
                                        <CheckCircle size={16}/> Mark Claimed
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center text-[10px] uppercase tracking-widest">
                                    <span className="text-gray-400 font-bold">Processed</span>
                                    <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-md">By {ticket.fulfilled_by_name || 'System'}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RewardsManager;