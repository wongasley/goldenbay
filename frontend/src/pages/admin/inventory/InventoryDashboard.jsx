import React, { useState, useEffect } from 'react';
import { Package, MapPin, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, Check, ArrowRight } from 'lucide-react';
import axiosInstance from '../../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { getUserRole } from '../../../utils/auth';

const InventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState('STOCK'); // 'STOCK' | 'DOCUMENTS'
  const [locations, setLocations] = useState([]);
  const [stock, setStock] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  const [selectedLoc, setSelectedLoc] = useState('');
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState(null);

  const role = getUserRole();
  const canApprove = ['Admin', 'Inventory Manager'].includes(role);

  // Fetch Locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locRes = await axiosInstance.get('/api/inventory/locations/');
        setLocations(locRes.data);
        if (locRes.data.length > 0) setSelectedLoc(locRes.data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLocations();
  }, []);

  // Fetch Stock when location changes
  useEffect(() => {
    if (!selectedLoc || activeTab !== 'STOCK') return;
    const fetchStock = async () => {
      setLoadingStock(true);
      try {
        const res = await axiosInstance.get(`/api/inventory/stock/?location=${selectedLoc}`);
        setStock(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStock(false);
      }
    };
    fetchStock();
  }, [selectedLoc, activeTab]);

  // Fetch Documents when tab changes
  useEffect(() => {
    if (activeTab !== 'DOCUMENTS') return;
    fetchDocs();
  }, [activeTab]);

  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await axiosInstance.get('/api/inventory/documents/');
      setDocuments(res.data);
    } catch (err) {
      toast.error("Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApprove = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Approve this movement? Stock will be officially updated.")) return;
    
    try {
        await axiosInstance.post(`/api/inventory/documents/${id}/approve/`);
        toast.success("Document Approved! Stock levels updated.");
        fetchDocs(); // Refresh the list
    } catch (err) {
        toast.error(err.response?.data?.error || "Failed to approve document.");
    }
  };

  const getDocBadge = (status) => {
      switch(status) {
          case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-300';
          case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
          default: return 'bg-gray-100 text-gray-800 border-gray-300';
      }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100"><Package size={24} className="text-blue-600"/></div>
            Inventory Overview
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-medium">Track stock and manage approvals</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden px-2">
        <button 
            onClick={() => setActiveTab('STOCK')} 
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'STOCK' ? 'border-gold-600 text-gold-600 bg-gold-50/30' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
            <MapPin size={16}/> Live Stock
        </button>
        <button 
            onClick={() => setActiveTab('DOCUMENTS')} 
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'DOCUMENTS' ? 'border-gold-600 text-gold-600 bg-gold-50/30' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
            <FileText size={16}/> Movements & Approvals
            {/* Show a red dot if there are pending docs */}
            {documents.filter(d => d.status === 'PENDING').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1"></span>
            )}
        </button>
      </div>

      {/* --- TAB 1: LIVE STOCK --- */}
      {activeTab === 'STOCK' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filter by Room</span>
                <div className="flex items-center gap-3 bg-white p-2 rounded border border-gray-200 shadow-sm">
                    <MapPin size={14} className="text-gold-500" />
                    <select 
                        className="bg-transparent font-bold text-sm outline-none text-gray-700 w-48"
                        value={selectedLoc}
                        onChange={(e) => setSelectedLoc(e.target.value)}
                    >
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loadingStock ? (
            <div className="p-10 text-center text-gray-400 animate-pulse text-sm">Loading Stock...</div>
            ) : (
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                <tr>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Barcode</th>
                    <th className="px-6 py-4">Rack / Shelf</th>
                    <th className="px-6 py-4 text-right">Current Quantity</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                {stock.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No items stored here.</td></tr>
                ) : stock.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{s.product_name}</p>
                        {s.product_brand && <p className="text-[10px] text-gray-500 uppercase font-bold">{s.product_brand}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{s.product_barcode}</td>

                    <td className="px-6 py-4 text-gray-600 font-medium">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{s.rack_name || 'Unassigned'}</span>
                    </td>
                    
                    <td className="px-6 py-4 text-right font-bold">
                        <span className={s.quantity < 10 ? 'text-red-500' : 'text-green-600'}>
                            {s.quantity} {s.base_unit}s
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            )}
        </div>
      )}

      {/* --- TAB 2: MOVEMENTS & APPROVALS --- */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {loadingDocs ? (
                <div className="p-10 text-center text-gray-400 animate-pulse text-sm">Loading Documents...</div>
            ) : documents.length === 0 ? (
                <div className="p-10 text-center text-gray-400 text-sm">No movement history found.</div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                    <tr>
                        <th className="px-6 py-4">Ref & Type</th>
                        <th className="px-6 py-4">Routing</th>
                        <th className="px-6 py-4">Date / Requested By</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {documents.map(doc => (
                            <React.Fragment key={doc.id}>
                                <tr className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-mono font-bold text-gray-500 mb-1">#{doc.id}</p>
                                        <p className="font-bold text-gray-900 text-xs uppercase tracking-widest">{doc.doc_type}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {doc.doc_type === 'INBOUND' ? (
                                            <span className="text-blue-600 font-bold flex items-center gap-1"><ArrowRight size={14}/> {doc.dest_name}</span>
                                        ) : doc.doc_type === 'OUTBOUND' ? (
                                            <span className="text-rose-600 font-bold flex items-center gap-1"><ArrowRight size={14}/> Consumed from {doc.source_name}</span>
                                        ) : (
                                            <div className="flex flex-col text-xs font-bold text-gray-600">
                                                <span>From: {doc.source_name}</span>
                                                <span className="text-gold-600">To: {doc.dest_name}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <p className="text-gray-900 font-bold">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        <p className="text-gray-500">by {doc.created_by_name}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border shadow-sm ${getDocBadge(doc.status)}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3 h-full">
                                        {doc.status === 'PENDING' && canApprove && (
                                            <button 
                                                onClick={(e) => handleApprove(doc.id, e)} 
                                                className="bg-emerald-600 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1"
                                            >
                                                <Check size={14}/> Approve
                                            </button>
                                        )}
                                        {expandedDoc === doc.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                    </td>
                                </tr>
                                
                                {/* EXPANDED LINE ITEMS ROW */}
                                {expandedDoc === doc.id && (
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <td colSpan="5" className="p-0">
                                            <div className="px-12 py-6 bg-cream-50/50 border-t border-dashed border-gray-200 shadow-inner">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold-600 mb-3 border-b border-gray-200 pb-2">Line Items Requested</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {doc.items.map(item => (
                                                        <div key={item.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex justify-between items-center">
                                                            <span className="font-bold text-gray-900 text-xs">{item.product_name}</span>
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                                                                {item.quantity} {item.base_unit}s
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {doc.notes && (
                                                    <div className="mt-4 text-xs text-gray-500 italic bg-white p-3 rounded border border-gray-200">
                                                        <span className="font-bold not-italic text-gray-900 uppercase tracking-widest text-[9px] mr-2">Notes:</span>
                                                        {doc.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      )}

    </div>
  );
};

export default InventoryDashboard;