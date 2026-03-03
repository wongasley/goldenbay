import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, Star, Gift, Utensils, LogOut, ArrowRight, Activity, Calendar } from 'lucide-react';
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
  const [fetchingRewards, setFetchingRewards] = useState(true); // <-- Added explicit loading state

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
          console.error("Failed to load rewards catalog.");
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

  const handleLogout = () => {
      localStorage.removeItem('gb_customer_token');
      localStorage.removeItem('gb_customer_data');
      setCustomerData(null);
      setPhone('');
      setOtp('');
      setStep('LOGIN');
      toast("Logged out securely.", { icon: '👋' });
  };

  if (step === 'LOGIN' || step === 'OTP') {
      return (
          <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold-600/10 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold-600/10 blur-[120px] rounded-full pointer-events-none"></div>
              
              <Link to="/" className="absolute top-6 left-6 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                  ← Return to Home
              </Link>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white p-10 rounded-sm shadow-2xl relative z-10"
              >
                  <div className="text-center mb-8">
                      <Gift size={32} className="mx-auto text-gold-600 mb-4" />
                      <h1 className="text-2xl font-serif text-gray-900 font-bold mb-2">Golden Bay Rewards</h1>
                      <p className="text-gray-500 text-xs uppercase tracking-widest">Sign in to view your points</p>
                  </div>

                  {step === 'LOGIN' ? (
                      <form onSubmit={handleRequestOTP} className="space-y-6">
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Mobile Number</label>
                              <div className="relative">
                                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                      required type="tel" 
                                      placeholder="e.g. 0917 123 4567" 
                                      className="w-full bg-gray-50 border border-gray-200 py-3 pl-12 pr-4 text-gray-900 text-sm focus:bg-white focus:border-gold-500 outline-none rounded-sm transition-all"
                                      value={phone} onChange={e => setPhone(e.target.value)}
                                  />
                              </div>
                          </div>
                          <button type="submit" disabled={isLoading || phone.length < 10} className="w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-4 text-xs hover:bg-black transition-colors disabled:opacity-50 rounded-sm shadow-md flex justify-center items-center gap-2">
                              {isLoading ? <span className="animate-pulse">Sending OTP...</span> : 'Continue'}
                          </button>
                      </form>
                  ) : (
                      <form onSubmit={handleVerifyOTP} className="space-y-6">
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Enter 6-Digit Code</label>
                              <p className="text-xs text-gray-400 mb-4">We sent a text message to <span className="font-bold text-gray-700">{phone}</span>.</p>
                              <input 
                                  required type="text" 
                                  maxLength={6}
                                  placeholder="• • • • • •" 
                                  className="w-full bg-gray-50 border border-gray-200 py-4 px-4 text-center tracking-[1em] text-lg font-mono font-bold text-gray-900 focus:bg-white focus:border-gold-500 outline-none rounded-sm transition-all"
                                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                  autoFocus
                              />
                          </div>
                          <button type="submit" disabled={isLoading || otp.length < 6} className="w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-4 text-xs hover:bg-black transition-colors disabled:opacity-50 rounded-sm shadow-md flex justify-center items-center gap-2">
                              {isLoading ? <span className="animate-pulse">Verifying...</span> : 'Access Dashboard'}
                          </button>
                          <div className="text-center mt-4">
                              <button type="button" onClick={() => setStep('LOGIN')} className="text-xs text-gray-400 hover:text-gray-900 uppercase tracking-widest font-bold transition-colors">
                                  Change Number
                              </button>
                          </div>
                      </form>
                  )}
              </motion.div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
        
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2">
                <Gift className="text-gold-600" size={20}/>
                <span className="font-serif font-bold text-lg">My Rewards</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                <LogOut size={14}/> Logout
            </button>
        </header>

        <div className="max-w-3xl mx-auto px-4 mt-8">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg p-8 text-white relative overflow-hidden shadow-2xl mb-8 ${customerData?.is_vip ? 'bg-gradient-to-br from-neutral-900 to-black' : 'bg-gradient-to-br from-gold-500 to-gold-700'}`}>
                {customerData?.is_vip && (
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                        <Star size={120} />
                    </div>
                )}
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {customerData?.is_vip ? <Star size={16} className="text-gold-500 fill-gold-500" /> : <Activity size={16} className="text-white/80" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                                {customerData?.is_vip ? 'VIP Member' : 'Valued Guest'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold break-words">{customerData?.name}</h2>
                        <p className="text-sm font-mono opacity-80 mt-1">{customerData?.phone}</p>
                    </div>

                    <div className="mt-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Available Points</p>
                        <p className="text-5xl font-bold font-mono tracking-tight">{customerData?.points_balance?.toLocaleString() || 0}</p>
                    </div>
                </div>
            </motion.div>

            {!customerData?.is_vip && (
                <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <Utensils size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Unlock VIP Status</h4>
                        <p className="text-xs text-gray-500 mt-1">Dine with us 3 times to unlock exclusive VIP perks and priority booking.</p>
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">Reward Catalog</h3>
                
                {fetchingRewards ? (
                    <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Loading rewards...</div>
                ) : rewards.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm bg-white border border-gray-200 rounded-md">
                        More exciting rewards are coming soon! Please check back later.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {rewards.map(reward => {
                            const canAfford = customerData?.points_balance >= reward.points_required;
                            return (
                                <div key={reward.id} className={`bg-white border p-4 rounded-md shadow-sm flex flex-col ${canAfford ? 'border-gold-300' : 'border-gray-200 opacity-60'}`}>
                                    <div className="flex gap-4 mb-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded shrink-0 overflow-hidden border border-gray-200">
                                            {reward.image ? (
                                                <img src={reward.image.startsWith('http') ? reward.image : `${BACKEND_URL}${reward.image}`} className="w-full h-full object-cover" alt={reward.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Gift size={20} className="text-gray-300"/></div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">
                                                {reward.name} 
                                                {/* Show the size in a small badge next to the name */}
                                                <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {reward.size}
                                                </span>
                                            </h4>
                                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                                                {reward.description}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="font-mono font-bold text-gold-600 text-sm">{reward.points_required} pts</span>
                                        
                                        {canAfford ? (
                                            <button 
                                                onClick={async () => {
                                                    if(!window.confirm(`Redeem ${reward.name} for ${reward.points_required} points?`)) return;
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
                                                }}
                                                className="text-[10px] font-bold text-white uppercase tracking-widest bg-gold-600 hover:bg-black px-3 py-1.5 rounded transition-colors shadow-sm flex items-center gap-1"
                                            >
                                                <CheckCircle size={12}/> Redeem Now
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Not Enough Points</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="mt-12 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">How to redeem?</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">Present this dashboard to your server or cashier during your next visit to redeem your available points for complimentary items.</p>
            </div>
            
        </div>
    </div>
  );
};

export default CustomerRewardsPage;