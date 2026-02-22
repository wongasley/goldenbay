import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Send, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const CampaignBuilder = () => {
  const [formData, setFormData] = useState({
    audience: 'ALL',
    subject: '',
    content: ''
  });
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to email this to ${formData.audience} customers?`)) return;
    
    setIsSending(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`${BACKEND_URL}/api/marketing/manage/blast/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Email Campaign launched successfully!");
        setFormData({ ...formData, subject: '', content: '' }); // Clear form
      } else {
        toast.error("Failed to launch campaign.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setIsSending(false);
    }
  };

  const btnClass = (active) => `flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all border flex items-center justify-center gap-2 ${active ? 'bg-gold-50 border-gold-400 text-gold-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`;

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <div className="mb-8 border-b border-gray-100 pb-4 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-serif font-bold text-gray-900">Email Campaign Blast</h2>
            <p className="text-xs text-gray-500 mt-1">Send mass emails directly to your clientele.</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-8">
        
        {/* Targeting Setup */}
        <div className="w-full md:w-1/2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Target Audience</label>
            <div className="flex gap-2">
                <button type="button" onClick={() => setFormData({...formData, audience: 'ALL'})} className={btnClass(formData.audience === 'ALL')}>
                    <Users size={14}/> All Clients
                </button>
                <button type="button" onClick={() => setFormData({...formData, audience: 'VIP'})} className={btnClass(formData.audience === 'VIP')}>
                    <Star size={14}/> VIPs Only
                </button>
            </div>
        </div>

        {/* Content Creation */}
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email Subject Line</label>
            <input 
                required 
                type="text" 
                placeholder="e.g. Exclusive Lunar New Year Promo at Golden Bay!"
                className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 text-sm focus:bg-white focus:border-gold-500 outline-none rounded-sm transition-all"
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
            />
        </div>

        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email Body (HTML)</label>
            <div className="border border-gray-200 rounded-sm overflow-hidden">
                <style>{`.ql-toolbar { background: #f9fafb; border-bottom: 1px solid #e5e7eb !important; } .ql-editor { min-height: 250px; font-family: 'Quicksand', sans-serif; }`}</style>
                <ReactQuill 
                    theme="snow" 
                    value={formData.content} 
                    onChange={val => setFormData({...formData, content: val})} 
                    placeholder="Craft your beautiful message here..."
                />
            </div>
        </div>

        <button 
            type="submit" 
            disabled={isSending || !formData.subject || !formData.content}
            className="w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-4 text-sm hover:bg-black transition-colors disabled:opacity-50 rounded-sm flex justify-center items-center gap-2 shadow-md"
        >
            <Send size={16} /> {isSending ? 'Dispatching Campaign...' : 'Send Email Blast'}
        </button>

      </form>
    </div>
  );
};

export default CampaignBuilder;