import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, Trash2, ArrowUpDown, X, User, StickyNote, Download } from 'lucide-react';
import { FaWeixin, FaViber, FaWhatsapp, FaTelegram } from 'react-icons/fa';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const PhoneBookPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', wechat: '', viber: '', whatsapp: '', telegram: '', notes: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${BACKEND_URL}/api/reservations/customers/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setCustomers(data);
        }
    } catch (err) {
        console.error("Error loading customers", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('accessToken');
    
    const url = editingCustomer 
        ? `${BACKEND_URL}/api/reservations/customers/${editingCustomer.id}/`
        : `${BACKEND_URL}/api/reservations/customers/`;
    
    const method = editingCustomer ? 'PATCH' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            fetchCustomers();
            closeModal();
        } else {
            const errorData = await res.json();
            if (errorData.phone) {
                alert("This phone number is already registered.");
            } else {
                alert("Failed to save customer.");
            }
        }
    } catch (err) {
        alert("Network error.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
      e.stopPropagation(); // Prevents row click from opening the edit modal
      if(!window.confirm("Are you sure you want to delete this customer?")) return;
      const token = localStorage.getItem('accessToken');
      try {
        await fetch(`${BACKEND_URL}/api/reservations/customers/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchCustomers();
      } catch (err) {
          alert("Error deleting customer.");
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
          notes: customer.notes || ''
      });
      setShowModal(true);
  };

  const openCreate = () => {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', wechat: '', viber: '', whatsapp: '', telegram: '', notes: '' });
      setShowModal(true);
  };

  const closeModal = () => {
      setShowModal(false);
      setEditingCustomer(null);
  };

  const filtered = customers
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    .sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  const exportToCSV = () => {
      const headers = ['Name', 'Phone', 'Email', 'WeChat', 'Viber', 'WhatsApp', 'Telegram', 'Notes', 'Last Visit'];
      const csvData = filtered.map(c => [
          `"${c.name}"`, 
          `"${c.phone}"`, 
          `"${c.email || ''}"`, 
          `"${c.wechat || ''}"`, 
          `"${c.viber || ''}"`, 
          `"${c.whatsapp || ''}"`, 
          `"${c.telegram || ''}"`, 
          `"${(c.notes || '').replace(/"/g, '""')}"`, 
          `"${c.last_visit || ''}"`
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

  return (
    <div className="space-y-4">
      
      {/* 1. COMPACT HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-3">
        <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Clientele</h1>
            <p className="text-gray-500 text-xs">Manage customer profiles and contact details.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
             <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                    type="text" 
                    placeholder="Search name or phone..." 
                    className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs outline-none focus:border-gold-500 w-full md:w-56 shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setSortAsc(!sortAsc)} 
                className="bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-600 shadow-sm shrink-0"
                title={sortAsc ? "Sort Z-A" : "Sort A-Z"}
            >
                <ArrowUpDown size={14}/>
            </button>
            <button 
                onClick={exportToCSV} 
                className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gray-50 transition-all flex items-center gap-1.5 shrink-0"
            >
               <Download size={14} /> Export
            </button>
            <button 
                onClick={openCreate} 
                className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-all flex items-center gap-1.5 shrink-0 ml-auto md:ml-0"
            >
               <Plus size={14} /> Add New
            </button>
        </div>
      </div>

      {/* 2. RESPONSIVE LIST / CARDS */}
      {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse text-xs">Loading contacts...</div>
      ) : (
          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
                <div className="text-center py-10 bg-white border border-gray-200 rounded text-gray-400 text-xs">
                    No customers found matching your criteria.
                </div>
            ) : (
                filtered.map(c => (
                    <div 
                        key={c.id} 
                        onClick={() => openEdit(c)}
                        className="bg-white p-4 md:px-6 rounded-lg border border-gray-200 shadow-sm hover:border-gold-400 transition-all group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        {/* Avatar & Info Container */}
                        <div className="flex items-start md:items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gold-50 border border-gold-100 flex items-center justify-center text-gold-600 font-bold text-lg shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex flex-col gap-1 text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-gray-900 text-base">{c.name}</h3>
                                    {c.notes && c.notes.toLowerCase().includes('vip') && (
                                        <span className="bg-gold-100 text-gold-700 text-[9px] font-bold px-2 py-0.5 rounded border border-gold-200 uppercase tracking-widest">VIP</span>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500 font-mono">
                                    <span className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {c.phone}</span>
                                    {c.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400"/> <span className="truncate max-w-[150px] sm:max-w-none">{c.email}</span></span>}
                                </div>
                            </div>
                        </div>

                        {/* Actions & Socials */}
                        <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 w-full md:w-auto">
                            <div className="flex gap-2">
                                {c.wechat && <FaWeixin className="text-green-600 bg-green-50 p-1.5 rounded-full" size={26} title="WeChat"/>}
                                {c.viber && <FaViber className="text-purple-600 bg-purple-50 p-1.5 rounded-full" size={26} title="Viber"/>}
                                {c.whatsapp && <FaWhatsapp className="text-green-500 bg-green-50 p-1.5 rounded-full" size={26} title="WhatsApp"/>}
                                {c.telegram && <FaTelegram className="text-blue-500 bg-blue-50 p-1.5 rounded-full" size={26} title="Telegram"/>}
                            </div>
                            <button 
                                onClick={(e) => handleDelete(c.id, e)} 
                                className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors md:opacity-0 group-hover:opacity-100"
                                title="Delete Client"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    </div>
                ))
            )}
          </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-lg font-serif text-gray-900 font-bold">{editingCustomer ? 'Edit Profile' : 'New Client'}</h2>
                    </div>
                    <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                        <X size={18}/>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto bg-gray-50/50">
                    <form id="contactForm" onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-1.5 mb-2 flex items-center gap-1.5">
                                <User size={12}/> Primary Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                                    <input required type="text" className={inputClass} placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                                    <input required type="text" className={inputClass} placeholder="e.g. 0917 123 4567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Email Address</label>
                                <input type="email" className={inputClass} placeholder="client@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-1.5 mb-2 flex items-center gap-1.5">
                                <Phone size={12}/> Social IDs
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`${labelClass} flex items-center gap-1.5`}><FaWeixin className="text-green-600"/> WeChat ID</label>
                                    <input type="text" className={inputClass} value={formData.wechat} onChange={e => setFormData({...formData, wechat: e.target.value})} />
                                </div>
                                <div>
                                    <label className={`${labelClass} flex items-center gap-1.5`}><FaViber className="text-purple-600"/> Viber Number</label>
                                    <input type="text" className={inputClass} value={formData.viber} onChange={e => setFormData({...formData, viber: e.target.value})} />
                                </div>
                                <div>
                                    <label className={`${labelClass} flex items-center gap-1.5`}><FaWhatsapp className="text-green-500"/> WhatsApp</label>
                                    <input type="text" className={inputClass} value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                                </div>
                                <div>
                                    <label className={`${labelClass} flex items-center gap-1.5`}><FaTelegram className="text-blue-500"/> Telegram</label>
                                    <input type="text" className={inputClass} value={formData.telegram} onChange={e => setFormData({...formData, telegram: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-1.5 mb-2 flex items-center gap-1.5">
                                <StickyNote size={12}/> Internal Notes
                            </h3>
                            <textarea className={`${inputClass} h-16 resize-none`} placeholder="E.g. VIP, prefers window seat..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                        </div>
                    </form>
                </div>

                <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-2">
                    <button onClick={closeModal} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded transition-colors">
                        Cancel
                    </button>
                    <button form="contactForm" type="submit" disabled={isSubmitting} className="bg-gold-600 text-white px-6 py-2 font-bold uppercase tracking-widest text-xs rounded shadow-sm hover:bg-gold-700 transition-colors disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PhoneBookPage;