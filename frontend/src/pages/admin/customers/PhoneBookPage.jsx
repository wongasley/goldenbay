import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Plus, 
    Phone, 
    Mail, 
    Edit2, 
    Trash2, 
    ArrowUpDown, 
    X,
    User,
    StickyNote
} from 'lucide-react';
import { FaWeixin, FaViber, FaWhatsapp, FaTelegram } from 'react-icons/fa';

const BACKEND_URL = "http://127.0.0.1:8000";

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

  const handleDelete = async (id) => {
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

  const inputClass = "w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none rounded-md transition-all shadow-sm";
  const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1";

  return (
    <div className="space-y-8">
      
      {/* 1. UNIFIED HEADER */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 font-serif">Clientele</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage customer profiles and contact details.</p>
        </div>
        <div className="flex gap-2">
             {/* Search */}
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search name or phone..." 
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-gold-500 w-64 shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            {/* Sort */}
            <button 
                onClick={() => setSortAsc(!sortAsc)} 
                className="bg-white border border-gray-200 p-2.5 rounded-md hover:bg-gray-50 text-gray-600 shadow-sm"
                title={sortAsc ? "Sort Z-A" : "Sort A-Z"}
            >
                <ArrowUpDown size={18}/>
            </button>
            {/* Add */}
            <button 
                onClick={openCreate} 
                className="bg-gold-600 text-white px-6 py-2.5 font-bold uppercase tracking-widest text-xs rounded shadow-md hover:bg-gold-700 transition-all flex items-center gap-2"
            >
               <Plus size={16} /> Add New
            </button>
        </div>
      </div>

      {/* 2. CUSTOMER GRID */}
      {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse text-sm">Loading contacts...</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-400 text-sm">
                    No customers found matching your criteria.
                </div>
            ) : (
                filtered.map(c => (
                    <div key={c.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gold-300 transition-all group relative flex flex-col h-full">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{c.name}</h3>
                                    {c.notes && c.notes.toLowerCase().includes('vip') && (
                                        <span className="bg-gold-100 text-gold-700 text-[10px] font-bold px-2 py-0.5 rounded border border-gold-200">VIP</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5 font-medium">Added: {new Date(c.created_at).toLocaleDateString()}</p>
                            </div>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                    <Edit2 size={14}/>
                                </button>
                                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-3 mb-6 flex-grow">
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                                    <Phone size={14} />
                                </div>
                                <span className="font-medium font-mono text-gray-600">{c.phone}</span>
                            </div>
                            
                            {c.email ? (
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                                        <Mail size={14} />
                                    </div>
                                    <span className="truncate text-gray-600">{c.email}</span>
                                </div>
                            ) : null}
                        </div>

                        <div className="h-px bg-gray-100 w-full mb-4"></div>

                        {/* Social Apps */}
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <div className={`p-2 rounded-full transition-colors ${c.wechat ? 'text-green-600 bg-green-50' : 'text-gray-200 bg-gray-50'}`} title={c.wechat || "No WeChat"}>
                                    <FaWeixin size={16}/>
                                </div>
                                <div className={`p-2 rounded-full transition-colors ${c.viber ? 'text-purple-600 bg-purple-50' : 'text-gray-200 bg-gray-50'}`} title={c.viber || "No Viber"}>
                                    <FaViber size={16}/>
                                </div>
                                <div className={`p-2 rounded-full transition-colors ${c.whatsapp ? 'text-green-500 bg-green-50' : 'text-gray-200 bg-gray-50'}`} title={c.whatsapp || "No WhatsApp"}>
                                    <FaWhatsapp size={16}/>
                                </div>
                                <div className={`p-2 rounded-full transition-colors ${c.telegram ? 'text-blue-500 bg-blue-50' : 'text-gray-200 bg-gray-50'}`} title={c.telegram || "No Telegram"}>
                                    <FaTelegram size={16}/>
                                </div>
                            </div>
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
                
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-2xl font-serif text-gray-900 font-bold">{editingCustomer ? 'Edit Profile' : 'New Client'}</h2>
                        <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Customer Database</p>
                    </div>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20}/>
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-8 overflow-y-auto bg-gray-50/50">
                    <form id="contactForm" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Primary Info */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                <User size={14}/> Primary Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                                    <input required type="text" className={inputClass} 
                                        placeholder="e.g. John Doe"
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                                    <input required type="text" className={inputClass} 
                                        placeholder="e.g. 0917 123 4567"
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Email Address</label>
                                <input type="email" className={inputClass} 
                                    placeholder="client@example.com"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                <Phone size={14}/> Social IDs
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={`${labelClass} flex items-center gap-2`}><FaWeixin className="text-green-600"/> WeChat ID</label>
                                    <input type="text" className={inputClass} 
                                        value={formData.wechat} onChange={e => setFormData({...formData, wechat: e.target.value})} />
                                </div>
                                <div>
                                    <label className={`${labelClass} flex items-center gap-2`}><FaViber className="text-purple-600"/> Viber Number</label>
                                    <input type="text" className={inputClass} 
                                        value={formData.viber} onChange={e => setFormData({...formData, viber: e.target.value})} />
                                </div>
                                <div>
                                    <label className={`${labelClass} flex items-center gap-2`}><FaWhatsapp className="text-green-500"/> WhatsApp</label>
                                    <input type="text" className={inputClass} 
                                        value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                                </div>
                                <div>
                                    <label className={`${labelClass} flex items-center gap-2`}><FaTelegram className="text-blue-500"/> Telegram</label>
                                    <input type="text" className={inputClass} 
                                        value={formData.telegram} onChange={e => setFormData({...formData, telegram: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                <StickyNote size={14}/> Internal Notes
                            </h3>
                            <textarea className={`${inputClass} h-24 resize-none`} 
                                placeholder="E.g. VIP, prefers window seat, allergic to shrimp..."
                                value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                        </div>

                    </form>
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={closeModal} className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                        Cancel
                    </button>
                    <button form="contactForm" type="submit" disabled={isSubmitting} className="bg-gold-600 text-white px-8 py-2.5 font-bold uppercase tracking-widest text-xs rounded-md shadow-md hover:bg-gold-700 transition-colors disabled:opacity-50">
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