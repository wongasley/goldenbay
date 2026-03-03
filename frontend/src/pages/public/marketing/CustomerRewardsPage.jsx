import React, { useState, useEffect, useMemo } from 'react';
import { Phone, CheckCircle, Star, Gift, Utensils, LogOut, ArrowRight, Activity, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const CustomerRewardsPage = () => {
  const [step, setStep] = useState('LOGIN'); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [fetchingRewards, setFetchingRewards] = useState(true);

  // --- NEW: Group Rewards by Name ---
  // This ensures that "Rice (S)" and "Rice (L)" appear in the same card
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
      // Sort sizes by point cost (Smallest first)
      acc[reward.name].options.sort((a, b) => a.points_required - b.points_required);
      return acc;
    }, {});
  }, [rewards]);

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
      } finally {
          setFetchingRewards(false);
      }
  };

  const handleRequestOTP = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          await axios.post(`${BACKEND_URL}/api/users/request-otp/`, { phone });
          toast.success("OTP sent to your phone!");
          setStep('OTP');
      } catch (err) {
          toast.error(err.response?.data?.error || "Failed to send OTP.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerifyOTP = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          const res = await axios.post(`${BACKEND_URL}/api/users/verify-otp/`, { phone, otp });
          localStorage.setItem('gb_customer_token', res.data.access);
          localStorage.setItem('gb_customer_data', JSON.stringify(res.data.customer));
          setCustomerData(res.data.customer);
          setStep('DASHBOARD');
          fetchRewards();
          toast.success("Welcome back!");
      } catch (err) {
          toast.error("Invalid or expired OTP.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleRedeem = async (reward) => {
    if(!window.confirm(`Redeem ${reward.name} (${reward.size}) for ${reward.points_required} points?`)) return;
    
    try {
        const res = await axios.post(`${BACKEND_URL}/api/reservations/rewards/redeem/`, 
            { reward_id: reward.id },
            { headers: { Authorization: `Bearer ${localStorage.getItem('gb_customer_token')}` } }
        );
        
        toast.success(res.data.message, { duration: 6000 });
        setCustomerData(prev => ({ ...prev, points_balance: res.data.new_balance }));
        
        const audio = new Audio('/audio/success.mp3');
        audio.play().catch(e => console.warn(e));
    } catch(err) {
        toast.error(err.response?.data?.error || "Redemption failed.");
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

  if (step === 'LOGIN' || step === 'OTP') {
      return (
          <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative">
              <Link to="/" className="absolute top-6 left-6 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                  ← Home
              </Link>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white p-10 rounded-sm shadow-2xl">
                  <div className="text-center mb-8">
                      <Gift size={32} className="mx-auto text-gold-600 mb-4" />
                      <h1 className="text-2xl font-serif text-gray-900 font-bold mb-2">Rewards Login</h1>
                  </div>
                  {step === 'LOGIN' ? (
                      <form onSubmit={handleRequestOTP} className="space-y-6">
                          <input required type="tel" placeholder="Mobile Number" className="w-full bg-gray-50 border border-gray-200 py-3 px-4 rounded-sm outline-none focus:border-gold-500" value={phone} onChange={e => setPhone(e.target.value)} />
                          <button type="submit" disabled={isLoading} className="w-full bg-gold-600 text-white font-bold py-4 uppercase tracking-widest text-xs hover:bg-black transition-all">Send Code</button>
                      </form>
                  ) : (
                      <form onSubmit={handleVerifyOTP} className="space-y-6">
                          <input required type="text" maxLength={6} placeholder="Enter OTP" className="w-full bg-gray-50 border border-gray-200 py-4 text-center text-lg font-mono tracking-widest outline-none focus:border-gold-500" value={otp} onChange={e => setOtp(e.target.value)} />
                          <button type="submit" disabled={isLoading} className="w-full bg-gold-600 text-white font-bold py-4 uppercase tracking-widest text-xs hover:bg-black transition-all">Verify & Enter</button>
                      </form>
                  )}
              </motion.div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-2 font-serif font-bold text-lg"><Gift className="text-gold-600" size={20}/> Golden Bay Rewards</div>
            <button onClick={handleLogout} className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-2"><LogOut size={14}/> Logout</button>
        </header>

        <div className="max-w-4xl mx-auto px-4 mt-8">
            {/* Points Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg p-8 text-white shadow-2xl mb-12 ${customerData?.is_vip ? 'bg-neutral-900' : 'bg-gold-600'}`}>
                <div className="flex items-center gap-2 mb-2">
                    {customerData?.is_vip ? <Star size={16} className="text-gold-500 fill-gold-500" /> : <Activity size={16} />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">{customerData?.is_vip ? 'VIP Member' : 'Guest'}</span>
                </div>
                <h2 className="text-3xl font-serif font-bold">{customerData?.name}</h2>
                <div className="mt-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Available Balance</p>
                    <p className="text-5xl font-bold font-mono">{customerData?.points_balance?.toLocaleString() || 0} <span className="text-sm font-sans uppercase tracking-widest ml-2">Points</span></p>
                </div>
            </motion.div>

            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">Reward Catalog</h3>
            
            {fetchingRewards ? (
                <div className="text-center py-12 text-gray-400 animate-pulse">Loading menu...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.values(groupedRewards).map((group) => (
                        <motion.div layout key={group.name} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col group">
                            {/* Dish Photo - Now Shared by the group */}
                            <div className="h-52 bg-gray-100 relative overflow-hidden">
                                {group.image ? (
                                    <img 
                                        src={group.image.startsWith('http') ? group.image : `${BACKEND_URL}${group.image}`} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        alt={group.name} 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                        <Utensils size={40} />
                                    </div>
                                )}
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <h4 className="font-bold text-gray-900 text-lg mb-2">{group.name}</h4>
                                <p className="text-xs text-gray-500 mb-6 line-clamp-2 leading-relaxed">{group.description}</p>
                                
                                <div className="space-y-2 mt-auto">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Redeem Portions:</p>
                                    {group.options.map((option) => {
                                        const canAfford = customerData?.points_balance >= option.points_required;
                                        return (
                                            <div key={option.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-100 hover:border-gold-300 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">{option.size} Serving</span>
                                                    <span className="font-mono font-bold text-gold-600 text-sm">{option.points_required} pts</span>
                                                </div>
                                                
                                                <button 
                                                    disabled={!canAfford}
                                                    onClick={() => handleRedeem(option)}
                                                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-sm transition-all
                                                        ${canAfford 
                                                            ? 'bg-gold-600 text-white hover:bg-black' 
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    {canAfford ? 'Redeem' : 'Need Points'}
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
            
            <div className="mt-16 p-8 bg-white border border-gray-200 text-center rounded-lg shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-bold">Fulfillment Policy</p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                    To claim your reward, simply present your digital dashboard to your waiter when ordering. Your points will be deducted immediately upon redemption.
                </p>
            </div>
        </div>
    </div>
  );
};

export default CustomerRewardsPage;