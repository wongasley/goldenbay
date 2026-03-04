import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Phone, CheckCircle, Star, Gift, Utensils, LogOut, ArrowRight, Activity, Clock, ChevronLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas'; // <-- Added for downloading receipt

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
  
  // State for the Digital Receipt Modal
  const [receiptData, setReceiptData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef(null); // <-- Ref to target the receipt for download

  // --- Logic: Group Rewards by Name ---
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
    document.body.style.overflow = 'unset'; 

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
    if(!window.confirm(`Redeem ${reward.name} (${reward.size || 'Regular'}) for ${reward.points_required} points?`)) return;
    
    try {
      const token = localStorage.getItem('gb_customer_token');
      const res = await axios.post(`${BACKEND_URL}/api/reservations/rewards/redeem/`, 
        { reward_id: reward.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update balance locally without a full page refresh
      setCustomerData(prev => ({ ...prev, points_balance: res.data.new_balance }));
      
      // Play success audio
      const audio = new Audio('/audio/success.mp3');
      audio.play().catch(() => {}); 

      // Show the Digital Receipt
      setReceiptData({
        rewardName: reward.name,
        rewardSize: reward.size || 'Regular',
        points: reward.points_required,
        customerName: customerData.name,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        ticketId: Math.random().toString(36).substr(2, 8).toUpperCase() // Mock ID for visual authenticity
      });

    } catch(err) {
      toast.error(err.response?.data?.error || "Insufficient points or server error.");
    }
  };

  // --- HTML2CANVAS DOWNLOAD LOGIC ---
  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      // Capture the specific DOM element
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // High resolution like GCash
        useCORS: true, 
        backgroundColor: '#ffffff'
      });
      
      // Convert to image and trigger download
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `GoldenBay_Reward_${receiptData.ticketId}.png`;
      link.click();
      
      toast.success("Receipt saved to your device!");
    } catch (err) {
      console.error("Failed to download receipt", err);
      toast.error("Failed to save receipt.");
    } finally {
      setIsDownloading(false);
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
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl border-t-4 border-gold-500">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Gift size={32} className="text-gold-600" />
            </div>
            <h1 className="text-2xl font-serif text-gray-900 font-bold">Golden Bay Rewards</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Member Access Portal</p>
          </div>

          {step === 'LOGIN' ? (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-2">Mobile Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    required 
                    type="tel" 
                    placeholder="e.g. 0917 123 4567" 
                    className="w-full bg-gray-50 border border-gray-200 py-3 pl-10 pr-4 rounded-md outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-gray-900 font-medium" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-white font-bold py-4 rounded-md uppercase tracking-widest text-xs hover:shadow-lg hover:from-black hover:to-black transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
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
                  className="w-full bg-gray-50 border border-gray-200 py-4 rounded-md text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-gray-900" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-gray-900 to-black text-white font-bold py-4 rounded-md uppercase tracking-widest text-xs hover:shadow-lg hover:from-gold-600 hover:to-gold-500 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button type="button" onClick={() => setStep('LOGIN')} className="w-full text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gold-600 transition-colors">
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
      
      {/* ----------------------------- */}
      {/* DIGITAL RECEIPT MODAL OVERLAY */}
      {/* ----------------------------- */}
      <AnimatePresence>
        {receiptData && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-gold-400 relative"
            >
              
              {/* THIS WRAPPER IS WHAT GETS CAPTURED BY HTML2CANVAS */}
              <div ref={receiptRef} className="bg-white">
                {/* Receipt Header */}
                <div className="bg-gradient-to-br from-gray-900 to-black p-6 text-center text-white relative">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h2 className="text-xl font-serif font-bold uppercase tracking-widest text-gold-400 mb-1">Reward Claimed</h2>
                  <p className="text-xs text-gray-400 font-mono">Ref: #{receiptData.ticketId}</p>
                  
                  {/* Torn paper effect bottom edge */}
                  <div className="absolute bottom-0 left-0 w-full h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMTAiIGZpbGw9IiNmOWZhZmIiLz48L3N2Zz4=')] bg-repeat-x bg-[length:12px_12px] translate-y-1/2"></div>
                </div>

                {/* Attention Banner */}
                <div className="bg-gold-50 border-b border-gold-100 py-3 px-6 text-center animate-pulse">
                  <p className="text-xs font-bold text-gold-700 uppercase tracking-widest">
                    ⚠️ Show this screen to your server
                  </p>
                </div>

                {/* Receipt Body */}
                <div className="p-6 space-y-5 bg-[#f9fafb]">
                  <div className="text-center pb-5 border-b border-dashed border-gray-300">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Item to Serve</p>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 leading-tight">{receiptData.rewardName}</h3>
                    <span className="inline-block mt-2 bg-gray-900 text-white text-[10px] px-3 py-1 rounded-sm uppercase tracking-widest">
                      Portion: {receiptData.rewardSize}
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Guest Name</span>
                      <span className="font-bold text-gray-900">{receiptData.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Points Deducted</span>
                      <span className="font-bold text-rose-600">-{receiptData.points} PTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time of Request</span>
                      <span className="font-bold text-gray-900 text-right">{receiptData.timestamp}</span>
                    </div>
                  </div>
                  
                  {/* Branding for the saved image */}
                  <div className="pt-4 mt-2 border-t border-gray-100 text-center opacity-50">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Golden Bay Fresh Seafood</p>
                  </div>
                </div>
              </div>
              {/* END OF CAPTURED AREA */}

              {/* Receipt Footer / Action (Not included in image download) */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <button 
                    onClick={handleDownloadReceipt}
                    disabled={isDownloading}
                    className="flex-1 py-3.5 bg-gold-50 hover:bg-gold-100 text-gold-700 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors flex items-center justify-center gap-2 border border-gold-200"
                  >
                    <Download size={14} /> {isDownloading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setReceiptData(null)}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors"
                  >
                    Close
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 text-center mt-3 uppercase tracking-wider">
                  Valid for current dine-in visit only.
                </p>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ----------------------------- */}


      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 font-serif font-bold text-lg">
          <div className="w-8 h-8 rounded-full bg-gold-50 flex items-center justify-center border border-gold-100">
            <Gift className="text-gold-600" size={16}/> 
          </div>
          Golden Bay Rewards
        </div>
        <button onClick={handleLogout} className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-2 rounded-md uppercase tracking-widest flex items-center gap-2 transition-all">
          <LogOut size={14}/> Sign Out
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* User Statistics Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className={`relative rounded-xl p-8 text-white shadow-lg mb-10 overflow-hidden ${customerData?.is_vip ? 'bg-gradient-to-br from-gray-900 to-black border border-gray-800' : 'bg-gradient-to-br from-gold-500 to-gold-600 border border-gold-400'}`}
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <Gift className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 rotate-12 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              {customerData?.is_vip ? (
                <div className="flex items-center gap-1.5 bg-gold-500/20 px-2.5 py-1 rounded-md border border-gold-500/30 backdrop-blur-sm shadow-sm">
                  <Star size={12} className="text-gold-400 fill-gold-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400">Elite VIP Member</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-md backdrop-blur-sm shadow-sm border border-white/10">
                  <Activity size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Active Member</span>
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-serif font-bold tracking-tight mb-8">{customerData?.name}</h2>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Available Balance</p>
                <p className="text-4xl font-bold font-mono tracking-tighter drop-shadow-md">
                  {customerData?.points_balance?.toLocaleString() || 0} <span className="text-lg font-sans font-medium text-white/60">PTS</span>
                </p>
              </div>
              <div className="text-right flex flex-col justify-end">
                <Link to="/menu" className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-gold-200 flex items-center justify-end gap-1.5 transition-colors group">
                  Earn more points <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reward Catalog Section */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <Star size={16} className="text-gold-500" /> Reward Catalog
          </h3>
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md uppercase font-bold border border-gray-200">
            {Object.keys(groupedRewards).length} Items
          </span>
        </div>
        
        {fetchingRewards ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl border border-gray-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(groupedRewards).map((group) => (
              <motion.div 
                layout 
                key={group.name} 
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-gold-300 transition-all duration-300 group/card"
                >
                {/* FIXED ASPECT RATIO IMAGE CONTAINER (4:3) */}
                <div className="aspect-[4/3] w-full bg-gray-50 relative overflow-hidden border-b border-gray-100 flex items-center justify-center">
                    {group.image ? (
                    <img 
                        src={group.image.startsWith('http') ? group.image : `${BACKEND_URL}${group.image}`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" 
                        alt={group.name}
                        loading="lazy"
                    />
                    ) : (
                    <div className="flex flex-col items-center justify-center text-gray-300">
                        <Utensils size={40} strokeWidth={1.5} />
                        <span className="text-[9px] font-bold uppercase tracking-widest mt-2">Golden Bay</span>
                    </div>
                    )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                    <h4 className="font-serif font-bold text-gray-900 text-lg leading-tight mb-2 group-hover/card:text-gold-600 transition-colors">
                      {group.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-6 line-clamp-2 leading-relaxed font-light">
                      {group.description || "A signature Golden Bay delight, prepared fresh by our master chefs."}
                    </p>
                    
                    {/* Sizes / Portions List */}
                    <div className="space-y-2 mt-auto">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">
                        Select Portion
                    </p>
                    {group.options.map((option) => {
                        const canAfford = (customerData?.points_balance || 0) >= option.points_required;
                        return (
                        <div key={option.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gold-300 transition-all group/opt">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">{option.size || 'Regular'}</span>
                              <span className="font-mono font-bold text-gold-600 text-xs">{option.points_required.toLocaleString()} PTS</span>
                            </div>
                            
                            <button 
                              disabled={!canAfford}
                              onClick={() => handleRedeem(option)}
                              className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all duration-300 shadow-sm
                                  ${canAfford 
                                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white hover:from-black hover:to-black hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0' 
                                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'}`}
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
        <div className="mt-16 p-8 bg-white border border-gray-200 text-center rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gold-400 to-gold-600"></div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-2">
              <Clock size={16} className="text-gold-600" /> Fulfillment Policy
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto font-light">
              To claim your reward, please present the digital receipt to your waiter upon ordering. 
              Redemptions are processed instantly and are valid for dine-in visits only. 
              Points will be deducted at the moment of request.
            </p>
        </div>

      </div>
    </div>
  );
};

export default CustomerRewardsPage;