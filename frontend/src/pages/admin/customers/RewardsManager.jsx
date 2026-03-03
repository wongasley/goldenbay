import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, Clock } from 'lucide-react';
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
        <div className="space-y-4 pb-20">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-6">
                <h1 className="text-xl font-bold text-gray-900 font-serif flex items-center gap-2">
                    <Gift size={20} className="text-gold-600"/> Reward Fulfillment
                </h1>
                <p className="text-gray-500 text-xs mt-0.5">Manage live customer redemptions here.</p>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-400 animate-pulse text-xs">Loading tickets...</div>
            ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 rounded text-xs">No redemption tickets found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className={`bg-white border rounded-lg p-5 shadow-sm flex flex-col gap-3 transition-colors ${ticket.status === 'PENDING' ? 'border-gold-400 bg-gold-50/10' : 'border-gray-200'}`}>
                            
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{ticket.customer_name}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">{ticket.customer_phone}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border shrink-0
                                    ${ticket.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                      ticket.status === 'CLAIMED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                      'bg-red-50 text-red-700 border-red-200'}`}>
                                    {ticket.status}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-3 rounded border border-gray-100 my-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Item to Serve</p>
                                <p className="font-bold text-gold-700">{ticket.reward_name}</p>
                                <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1"><Clock size={10}/> {new Date(ticket.created_at).toLocaleTimeString()}</p>
                            </div>

                            {ticket.status === 'PENDING' ? (
                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => updateTicketStatus(ticket.id, 'CLAIMED', ticket.reward_name)} className="flex-1 bg-green-600 text-white py-2.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5 hover:bg-green-700">
                                        <CheckCircle size={14}/> Mark Claimed
                                    </button>
                                    <button onClick={() => updateTicketStatus(ticket.id, 'CANCELLED', ticket.reward_name)} className="px-3 bg-white text-rose-600 border border-rose-200 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-rose-50 flex items-center justify-center">
                                        Refund
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-auto text-[10px] text-gray-400 uppercase tracking-widest text-right">
                                    Handled by {ticket.fulfilled_by_name || 'System'}
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