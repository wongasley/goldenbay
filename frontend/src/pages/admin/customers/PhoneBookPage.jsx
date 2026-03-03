import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, Trash2, ArrowUpDown, X, User, StickyNote, Download, Calendar as CalendarIcon, Gift } from 'lucide-react';
import { FaWeixin, FaViber, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import axiosInstance from '../../../utils/axiosInstance';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const PhoneBookPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeLetter, setActiveLetter] = useState('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NEW: Award Points Modal State ---
  const [pointsCustomer, setPointsCustomer] = useState(null);
  const [pointsAmount, setPointsAmount] = useState('');
  const [isAwarding, setIsAwarding] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', wechat: '', viber: '', whatsapp: '', telegram: '', notes: '', date_of_birth: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
        const res = await axiosInstance.get('/api/reservations/customers/');
        setCustomers(res.data);
    } catch (err) {
        toast.error("Error loading customers");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = editingCustomer ? `/api/reservations/customers/${editingCustomer.id}/` : `/api/reservations/customers/`;
    const method = editingCustomer ? 'patch' : 'post';

    try {
        await axiosInstance({ method, url, data: formData });
        fetchCustomers();
        closeModal();
        toast.success(`Customer ${editingCustomer ? 'updated' : 'added'} successfully!`);
    } catch (err) {
        const errorData = err.response?.data;
        if (errorData?.phone) {
            toast.error("This phone number is already registered.");
        } else {
            toast.error("Failed to save customer.");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAwardPoints = async (e) => {
      e.preventDefault();
      setIsAwarding(true);
      try {
          const res = await axiosInstance.post('/api/reservations/award-points/', {
              phone: pointsCustomer.phone,
              name: pointsCustomer.name,
              amount_spent: pointsAmount
          });
          
          if (res.data.points_earned > 0) {
              toast.success(`Success! ${res.data.customer_name} earned ${res.data.points_earned} points.`);
              fetchCustomers(); // Refresh to show new total
          } else {
              toast('Amount too low to earn points.', { icon: 'ℹ️' });
          }
          
          setPointsCustomer(null);
          setPointsAmount('');
      } catch (err) {
          toast.error("Failed to award points.");
      } finally {
          setIsAwarding(false);
      }
  };

  const handleDelete = async (id, e) => {
      e.stopPropagation();
      if(!window.confirm("Are you sure you want to delete this customer?")) return;
      try {
        await axiosInstance.delete(`/api/reservations/customers/${id}/`);
        fetchCustomers();
        toast.success("Customer deleted.");
      } catch (err) {
          toast.error("Error deleting customer.");
      }
  };

  const openEdit = (customer) => {
      setEditingCustomer(customer);
      setFormData({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          wechat: customer.wechat || '',
          viber: customer.viber || '',
          whatsapp: customer.whatsapp || '',
          telegram: customer.telegram || '',
          notes: customer.notes || '',
          date_of_birth: customer.date_of_birth || ''
      });
      setShowModal(true);
  };

  const openCreate = () => {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', wechat: '', viber: '', whatsapp: '', telegram: '', notes: '', date_of_birth: '' });
      setShowModal(true);
  };

  const closeModal = () => {
      setShowModal(false);
      setEditingCustomer(null);
  };

  const filtered = customers
    .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
        const matchesLetter = activeLetter === 'ALL' || c.name.toUpperCase().startsWith(activeLetter);
        return matchesSearch && matchesLetter;
    })
    .sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  const exportToCSV = () => {
      const headers = ['Name', 'Phone', 'Email', 'WeChat', 'Viber', 'WhatsApp', 'Telegram', 'Notes', 'DOB', 'Last Visit', 'Points Balance'];
      const csvData = filtered.map(c => [
          `"${c.name}"`, 
          `"${c.phone}"`, 
          `"${c.email || ''}"`, 
          `"${c.wechat || ''}"`, 
          `"${c.viber || ''}"`, 
          `"${c.whatsapp || ''}"`, 
          `"${c.telegram || ''}"`, 
          `"${(c.notes || '').replace(/"/g, '""')}"`, 
          `"${c.date_of_birth || ''}"`,
          `"${c.last_visit || ''}"`,
          `"${c.points_balance || 0}"`
      ].join(','));
      
      const csvContent = [headers.join(','), ...csvData].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `GoldenBay_Clients_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const inputClass = "w-full bg-white border border-gray-300 p-2 text-gray-900 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none rounded-sm transition-all shadow-sm";
  const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1";

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="space-y-4 pb-20">
      
      {/* 1. COMPACT HEADER */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-3 mb-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900 font-serif">Phone Book CRM</h1>
                <p className="text-gray-500 text-xs mt-0.5">Manage customer profiles, contact details, and birthdays.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={exportToCSV} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm">
                    <Download size={14} /> Export
                </button>
                <button onClick={openCreate} className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-all flex items-center gap-1.5">
                    <Plus size={14} /> Add New
                </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative w-full md:w-96 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                      type="text" 
                      placeholder="Search name or phone..." 
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 focus:bg-white focus:border-gold-500 outline-none transition-all"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                  />
              </div>

              {/* A-Z Quick Jump */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar flex-1 justify-end">
                 <button onClick={() => setActiveLetter('ALL')} className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-colors shrink-0 ${activeLetter === 'ALL' ? 'bg-gold-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>All</button>
                 {alphabet.map(letter => (
                     <button 
                        key={letter} 
                        onClick={() => setActiveLetter(letter)} 
                        className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded transition-colors shrink-0 ${activeLetter === letter ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                     >
                         {letter}
                     </button>
                 ))}
              </div>
          </div>
      </div>

      {/* 2. COMPACT LIST VIEW */}
      {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse text-xs">Loading contacts...</div>
      ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs flex flex-col items-center">
                    <User size={32} className="mb-2 text-gray-200" />
                    No customers found matching your criteria.
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">
                        <div className="col-span-4 flex items-center gap-1 cursor-pointer hover:text-gray-900 transition-colors" onClick={() => setSortAsc(!sortAsc)}>Customer Name <ArrowUpDown size={12}/></div>
                        <div className="col-span-3">Contact Details</div>
                        <div className="col-span-2">Last Visit</div>
                        <div className="col-span-2">Points Balance</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {filtered.map(c => (
                        <div key={c.id} onClick={() => openEdit(c)} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-3 hover:bg-gold-50/30 transition-colors cursor-pointer items-center group">
                            
                            <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{c.name}</h3>
                                        {c.is_vip && <span className="bg-gold-100 text-gold-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-gold-200 uppercase tracking-widest shrink-0">VIP</span>}
                                        {c.has_claimed_vip_perk && <span className="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-widest shrink-0" title="Has claimed website welcome perk">Perk Claimed</span>}
                                    </div>
                                    <div className="md:hidden text-xs text-gray-500 font-mono mt-0.5">{c.phone}</div>
                                </div>
                            </div>

                            <div className="hidden md:block col-span-3 text-xs text-gray-600 font-mono space-y-0.5">
                                <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {c.phone}</div>
                                {c.email && <div className="flex items-center gap-1.5 truncate"><Mail size={12} className="text-gray-400"/> {c.email}</div>}
                            </div>

                            <div className="hidden md:block col-span-2 text-[10px] text-gray-500 uppercase tracking-widest">
                                <div>{c.last_visit || 'Never'}</div>
                                <div className="text-gray-400 normal-case tracking-normal">{c.visit_count} total visits</div>
                            </div>

                            <div className="hidden md:block col-span-2 text-[11px] font-bold text-gold-600 font-mono">
                                {c.points_balance || 0} pts
                            </div>

                            <div className="hidden md:flex col-span-1 justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setPointsCustomer(c); }} className="p-1.5 text-white bg-gold-600 hover:bg-black rounded shadow-sm transition-colors" title="Award Points">
                                    <Gift size={14}/>
                                </button>
                                <button onClick={(e) => handleDelete(c.id, e)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h2 className="text-lg font-serif text-gray-900 font-bold">{editingCustomer ? 'Edit Profile' : 'New Client'}</h2>
                    </div>
                    <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                        <X size={18}/>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto bg-white">
                    <form id="contactForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="md:col-span-2"><h3 className="text-[10px] font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-1 flex items-center gap-1.5"><User size={12}/> Primary Info</h3></div>
                            
                            <div>
                                <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                                <input required type="text" className={inputClass} placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                                <input required type="text" className={inputClass} placeholder="e.g. 0917 123 4567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className={labelClass}>Email Address</label>
                                <input type="email" className={inputClass} placeholder="client@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div>
                                <label className={labelClass}>Date of Birth</label>
                                <input type="date" className={`${inputClass} text-gray-600`} value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="md:col-span-2"><h3 className="text-[10px] font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-1 flex items-center gap-1.5"><Phone size={12}/> Connected Apps</h3></div>
                            
                            <div>
                                <label className={`${labelClass} flex items-center gap-1.5`}><FaWeixin className="text-[#07c160]"/> WeChat ID</label>
                                <input type="text" className={inputClass} value={formData.wechat} onChange={e => setFormData({...formData, wechat: e.target.value})} />
                            </div>
                            <div>
                                <label className={`${labelClass} flex items-center gap-1.5`}><FaViber className="text-[#7360f2]"/> Viber Number</label>
                                <input type="text" className={inputClass} value={formData.viber} onChange={e => setFormData({...formData, viber: e.target.value})} />
                            </div>
                            <div>
                                <label className={`${labelClass} flex items-center gap-1.5`}><FaWhatsapp className="text-[#25D366]"/> WhatsApp</label>
                                <input type="text" className={inputClass} value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                            </div>
                            <div>
                                <label className={`${labelClass} flex items-center gap-1.5`}><FaTelegram className="text-[#0088cc]"/> Telegram</label>
                                <input type="text" className={inputClass} value={formData.telegram} onChange={e => setFormData({...formData, telegram: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-1 flex items-center gap-1.5 mb-3"><StickyNote size={12}/> Internal Notes</h3>
                            <textarea className={`${inputClass} h-20 resize-none`} placeholder="E.g. VIP, prefers window seat, allergic to shrimp..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                        </div>
                    </form>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                    <button onClick={closeModal} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                        Cancel
                    </button>
                    <button form="contactForm" type="submit" disabled={isSubmitting} className="bg-gold-600 text-white px-8 py-2.5 font-bold uppercase tracking-widest text-xs rounded shadow-md hover:bg-black transition-colors disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- AWARD POINTS MODAL (Phone Book Target) --- */}
      {pointsCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-serif text-gray-900 font-bold flex items-center gap-2"><Gift size={18} className="text-gold-600"/> Award Points</h2>
                    <button onClick={() => setPointsCustomer(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={18}/></button>
                </div>
                
                <form onSubmit={handleAwardPoints} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Customer</label>
                        <div className="w-full bg-gray-50 border border-gray-200 p-2.5 text-sm text-gray-900 rounded-sm">
                            <span className="font-bold">{pointsCustomer.name}</span><br/>
                            <span className="text-xs text-gray-500 font-mono">{pointsCustomer.phone}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total Bill Amount (₱) <span className="text-red-500">*</span></label>
                        <input required type="number" min="0" step="0.01" placeholder="e.g. 15500.00" className="w-full bg-white border border-gray-300 p-2.5 text-sm focus:border-gold-500 outline-none rounded-sm transition-all"
                            value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} autoFocus
                        />
                    </div>

                    <button type="submit" disabled={isAwarding || !pointsAmount} className="w-full bg-gold-600 text-white font-bold uppercase tracking-widest py-3 text-xs hover:bg-black transition-colors disabled:opacity-50 rounded-sm shadow-md mt-4">
                        {isAwarding ? 'Processing...' : 'Confirm Points'}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default PhoneBookPage;