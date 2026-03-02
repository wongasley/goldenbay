import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance'; 

const LeadCaptureWidget = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', dob: '' });

  useEffect(() => {
    // Show widget after 15 seconds, but only if they haven't dismissed or submitted it before
    const hasSeenWidget = localStorage.getItem('gb_vip_widget_seen');
    if (!hasSeenWidget) {
      const timer = setTimeout(() => setIsVisible(true), 15000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('gb_vip_widget_seen', 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use public endpoint
      await axiosInstance.post('/api/reservations/lead-capture/', formData);
      setIsSubmitted(true);
      localStorage.setItem('gb_vip_widget_seen', 'true');
      toast.success("Welcome to the VIP list!", { duration: 5000 });
      setTimeout(() => setIsVisible(false), 3000);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 left-4 md:left-6 z-[999] w-[90%] max-w-[340px] bg-white rounded-sm shadow-2xl border border-gold-400/30 overflow-hidden"
        >
          <div className="bg-black text-gold-500 p-4 relative">
            <button onClick={handleClose} className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              <Gift size={20} />
              <h3 className="font-serif font-bold uppercase tracking-widest text-sm">Unlock a VIP Perk</h3>
            </div>
          </div>
          
          <div className="p-5">
            {isSubmitted ? (
              <div className="text-center py-4">
                <p className="text-sm font-bold text-gray-900 mb-1">You're on the list!</p>
                <p className="text-xs text-gray-500">We've saved your details. See you at Golden Bay soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  Join our guest list and receive a complimentary dessert on your next visit, plus exclusive birthday rewards.
                </p>
                <input required type="text" placeholder="Full Name" className="w-full bg-gray-50 border border-gray-200 p-2.5 text-xs focus:border-gold-500 outline-none rounded-sm transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="tel" placeholder="Mobile Number" className="w-full bg-gray-50 border border-gray-200 p-2.5 text-xs focus:border-gold-500 outline-none rounded-sm transition-colors" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input type="email" placeholder="Email Address" className="w-full bg-gray-50 border border-gray-200 p-2.5 text-xs focus:border-gold-500 outline-none rounded-sm transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-1">Birthday (For special treats)</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 p-2.5 text-xs text-gray-600 focus:border-gold-500 outline-none rounded-sm transition-colors" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-3 text-[10px] mt-2 hover:bg-black transition-colors rounded-sm shadow-md">
                  Claim My Perk
                </button>
              </form>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeadCaptureWidget;