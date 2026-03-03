import React, { useState, useEffect, useMemo } from 'react';
import { Phone, CheckCircle, Star, Gift, Utensils, LogOut, ArrowRight, Activity, Clock, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Backend configuration
const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const CustomerRewardsPage = () => {
  const [step, setStep] = useState('LOGIN'); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [fetchingRewards, setFetchingRewards] = useState(true);

  // --- Logic: Group Rewards by Name ---
  // Consolidates different sizes/portions of the same dish into one UI card
  const groupedRewards = useMemo(() => {
    return rewards.reduce((acc, reward) => {
      if (!acc[reward.name]) {
        acc[reward.name] = {
          name: reward.name,
          image: reward.image,
          description: reward.description,
          options: []
        };
      }
      acc[reward.name].options.push(reward);
      // Sort portions by point cost (Cheapest/Smallest first)
      acc[reward.name].options.sort((a, b) => a.points_required - b.points_required);
      return acc;
    }, {});
  }, [rewards]);

  // Check for existing session on mount
  useEffect(() => {
    const storedCustomer = localStorage.getItem('gb_customer_data');
    const token = localStorage.getItem('gb_customer_token');
    
    if (token && storedCustomer) {
      setCustomerData(JSON.parse(storedCustomer));
      setStep('DASHBOARD');
      fetchRewards();
    }
  }, []);

  const fetchRewards = async () => {
    setFetchingRewards(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/reservations/rewards/`);
      setRewards(res.data);
    } catch (err) {
      console.error("Failed to load rewards.");
      toast.error("Could not load reward catalog.");
    } finally {
      setFetchingRewards(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/users/request-otp/`, { phone });
      toast.success("Login code sent via SMS.");
      setStep('OTP');
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/users/verify-otp/`, { phone, otp });
      // Persist Session
      localStorage.setItem('gb_customer_token', res.data.access);
      localStorage.setItem('gb_customer_data', JSON.stringify(res.data.customer));
      
      setCustomerData(res.data.customer);
      setStep('DASHBOARD');
      fetchRewards();
      toast.success(`Welcome back, ${res.data.customer.name}!`);
    } catch (err) {
      toast.error("Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    if(!window.confirm(`Redeem ${reward.name} (${reward.size}) for ${reward.points_required} points?`)) return;
    
    try {
      const token = localStorage.getItem('gb_customer_token');
      const res = await axios.post(`${BACKEND_URL}/api/reservations/rewards/redeem/`, 
        { reward_id: reward.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update balance locally without a full page refresh
      setCustomerData(prev => ({ ...prev, points_balance: res.data.new_balance }));
      
      toast.success(res.data.message, { duration: 8000 });
      
      // Play success audio
      const audio = new Audio('/audio/success.mp3');
      audio.play().catch(() => {}); 

    } catch(err) {
      toast.error(err.response?.data?.error || "Insufficient points or server error.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gb_customer_token');
    localStorage.removeItem('gb_customer_data');
    setCustomerData(null);
    setPhone('');
    setOtp('');
    setStep('LOGIN');
  };

  // --- Auth View (Login / OTP) ---
  if (step === 'LOGIN' || step === 'OTP') {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative">
        <Link to="/" className="absolute top-8 left-8 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gold-500 transition-colors flex items-center gap-2">
          <ChevronLeft size={16} /> Back to Home
        </Link>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white p-10 rounded-sm shadow-2xl border-t-4 border-gold-600">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift size={32} className="text-gold-600" />
            </div>
            <h1 className="text-2xl font-serif text-gray-900 font-bold">Golden Bay Rewards</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Member Access Portal</p>
          </div>

          {step === 'LOGIN' ? (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-2">Mobile Number</label>
                <input 
                  required 
                  type="tel" 
                  placeholder="e.g. 0917 123 4567" 
                  className="w-full bg-gray-50 border border-gray-200 py-3 px-4 rounded-sm outline-none focus:border-gold-500 transition-all text-gray-900" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-gold-600 text-white font-bold py-4 uppercase tracking-widest text-xs hover:bg-black transition-all disabled:opacity-50 shadow-lg">
                {isLoading ? 'Sending...' : 'Request Login Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-2">Enter 6-Digit Code</label>
                <input 
                  required 
                  type="text" 
                  maxLength={6} 
                  placeholder="000000" 
                  className="w-full bg-gray-50 border border-gray-200 py-4 text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-gold-500 text-gray-900" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-black text-white font-bold py-4 uppercase tracking-widest text-xs hover:bg-gold-600 transition-all disabled:opacity-50">
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button type="button" onClick={() => setStep('LOGIN')} className="w-full text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600">
                Wrong number? Go back
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  // --- Main Dashboard View ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <header className="bg-white border-b border-gray-200 px-6 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 font-serif font-bold text-lg">
          <Gift className="text-gold-600" size={22}/> 
          Golden Bay Rewards
        </div>
        <button onClick={handleLogout} className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-2 transition-colors">
          <LogOut size={14}/> Sign Out
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-10">
        
        {/* User Statistics Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className={`relative rounded-sm p-8 text-white shadow-2xl mb-12 overflow-hidden ${customerData?.is_vip ? 'bg-neutral-900' : 'bg-gold-600'}`}
        >
          {/* Subtle Background Icon */}
          <Gift className="absolute -right-4 -bottom-4 w-40 h-40 text-white/5 rotate-12 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              {customerData?.is_vip ? (
                <div className="flex items-center gap-1.5 bg-gold-500/20 px-2 py-0.5 rounded border border-gold-500/30">
                  <Star size={12} className="text-gold-400 fill-gold-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gold-400">Elite VIP Member</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded">
                  <Activity size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Active Member</span>
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-serif font-bold tracking-tight">{customerData?.name}</h2>
            
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Points</p>
                <p className="text-4xl font-bold font-mono tracking-tighter">
                  {customerData?.points_balance?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-right flex flex-col justify-end">
                <Link to="/menu" className="text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white flex items-center justify-end gap-1 transition-colors">
                  Earn more points <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reward Catalog Section */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em]">Exquisite Rewards</h3>
          <span className="text-[10px] text-gray-400 uppercase font-medium">{Object.keys(groupedRewards).length} items available</span>
        </div>
        
        {fetchingRewards ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.values(groupedRewards).map((group) => (
              <motion.div 
                layout 
                key={group.name} 
                className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden flex flex-col group hover:border-gold-500/50 transition-all duration-300"
                >
                {/* FIXED ASPECT RATIO IMAGE CONTAINER (4:3) */}
                <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden border-b border-gray-100 flex items-center justify-center">
                    {group.image ? (
                    <img 
                        src={group.image.startsWith('http') ? group.image : `${BACKEND_URL}${group.image}`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={group.name}
                        // Hint for the browser to prefer these dimensions if available
                        width="800"
                        height="600"
                    />
                    ) : (
                    <div className="flex flex-col items-center justify-center text-gray-300">
                        <Utensils size={48} strokeWidth={1} />
                        <span className="text-[10px] uppercase tracking-widest mt-2">Golden Bay</span>
                    </div>
                    )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    <h4 className="font-serif font-bold text-gray-900 text-xl mb-2 group-hover:text-gold-600 transition-colors">
                    {group.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-8 line-clamp-2 leading-relaxed font-light">
                    {group.description || "A signature Golden Bay delight, prepared fresh by our master chefs."}
                    </p>
                    
                    {/* Sizes / Portions List - Stays consistent below the fixed image */}
                    <div className="space-y-2 mt-auto">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 border-b border-gray-50 pb-1">
                        Select Portion
                    </p>
                    {group.options.map((option) => {
                        const canAfford = (customerData?.points_balance || 0) >= option.points_required;
                        return (
                        <div key={option.id} className="flex items-center justify-between p-3 rounded-sm bg-gray-50 border border-transparent hover:border-gold-200 transition-all group/opt">
                            <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-800 uppercase tracking-tight">{option.size || 'Regular'} Portion</span>
                            <span className="font-mono font-bold text-gold-600 text-xs">{option.points_required} PTS</span>
                            </div>
                            
                            <button 
                            disabled={!canAfford}
                            onClick={() => handleRedeem(option)}
                            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-sm transition-all
                                ${canAfford 
                                ? 'bg-gold-600 text-white hover:bg-black active:scale-95' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                            {canAfford ? 'Redeem' : 'Need More'}
                            </button>
                        </div>
                        );
                    })}
                    </div>
                </div>
                </motion.div>
            ))}
          </div>
        )}
        
        {/* Footer info box */}
        <div className="mt-20 p-10 bg-white border border-gray-200 text-center rounded-sm shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gold-600"></div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
              <Clock size={14} className="text-gold-600" /> Fulfillment Policy
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto font-light">
              To claim your reward, present this screen to your waiter upon ordering. 
              Redemptions are processed instantly and are valid for dine-in only. 
              Points are deducted at the moment of request.
            </p>
        </div>

      </div>
    </div>
  );
};

export default CustomerRewardsPage;