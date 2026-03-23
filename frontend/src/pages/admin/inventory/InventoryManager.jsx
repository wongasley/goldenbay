// frontend/src/pages/admin/inventory/InventoryManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Barcode, Package, ArrowRightLeft, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

const InventoryManager = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Scanner State
  const [scanMode, setScanMode] = useState(false);
  const [scanAction, setScanAction] = useState('IN'); // 'IN' or 'OUT'
  const [barcodeInput, setBarcodeInput] = useState('');
  const scannerInputRef = useRef(null);

  const fetchInventory = async () => {
    try {
      const res = await axiosInstance.get(`/api/inventory/?search=${search}`);
      setItems(res.data);
    } catch (err) {
      toast.error("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search]);

  // Keep scanner input focused when in Scan Mode
  useEffect(() => {
    if (scanMode && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [scanMode]);

  // Triggered when the USB Scanner hits "Enter"
  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const res = await axiosInstance.post('/api/inventory/scan/', {
        barcode: barcodeInput.trim(),
        action: scanAction
      });
      toast.success(res.data.message);
      fetchInventory(); // Refresh table
    } catch (err) {
      toast.error(err.response?.data?.error || "Scan failed.");
      const errorAudio = new Audio('/audio/error.mp3'); // Optional: beep on fail
      errorAudio.play().catch(()=> {});
    } finally {
      setBarcodeInput(''); // Clear for next scan
      if (scannerInputRef.current) scannerInputRef.current.focus();
    }
  };

  // Helper to calculate Display Logic (Mother Boxes vs Loose)
  const formatQuantity = (totalBase, unitsPerBox, unitName) => {
    if (unitsPerBox <= 1) return `${totalBase} ${unitName}s`;
    const boxes = Math.floor(totalBase / unitsPerBox);
    const loose = totalBase % unitsPerBox;
    return `${boxes} Boxes + ${loose} ${unitName}s`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-3">
            <div className="p-2 bg-gold-50 rounded-lg border border-gold-100">
              <Package size={24} className="text-gold-600"/> 
            </div>
            Inventory Manager
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-medium">Track stock via Barcode & QR</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setScanMode(true)} 
            className="bg-gray-900 text-white px-5 py-2.5 font-bold uppercase tracking-widest text-xs rounded-lg shadow-md hover:bg-black transition-all flex items-center gap-2"
          >
            <Barcode size={16} /> Scan Mode
          </button>
          <button className="bg-gold-600 text-white px-5 py-2.5 font-bold uppercase tracking-widest text-xs rounded-lg shadow-md hover:bg-gold-700 transition-all flex items-center gap-2">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* SCANNER MODAL */}
      {scanMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setScanMode(false)}>
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center relative" onClick={e => e.stopPropagation()}>
             <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Live Scanner Active</h2>
             <p className="text-sm text-gray-500 mb-6">Point your USB/Bluetooth scanner at a barcode.</p>
             
             {/* Toggle IN / OUT */}
             <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
               <button onClick={() => setScanAction('IN')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${scanAction === 'IN' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500'}`}>Stock IN</button>
               <button onClick={() => setScanAction('OUT')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${scanAction === 'OUT' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'}`}>Stock OUT</button>
             </div>

             {/* The hidden input field catching the scanner data */}
             <form onSubmit={handleScanSubmit}>
               <input 
                 ref={scannerInputRef}
                 type="text" 
                 value={barcodeInput}
                 onChange={(e) => setBarcodeInput(e.target.value)}
                 className="absolute opacity-0 w-0 h-0" 
                 autoFocus
                 onBlur={() => scannerInputRef.current?.focus()} // Force focus back if they click away
               />
               <div className="w-full h-32 border-4 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                 <Barcode size={48} className="text-gray-300 animate-pulse" />
               </div>
               <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-4">Waiting for scanner input...</p>
             </form>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search inventory by name, brand, or location..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gold-500 outline-none transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Total Quantity (Calculated)</th>
                <th className="px-6 py-4">Mother Box Setup</th>
                <th className="px-6 py-4 text-right">Price (Unit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{item.brand} • UPC: {item.barcode}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.location}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{item.quantity} {item.base_unit}s</span>
                    <p className="text-[10px] text-gold-600 font-bold uppercase mt-1 flex items-center gap-1">
                      <Box size={10} /> {formatQuantity(item.quantity, item.units_per_box, item.base_unit)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    1 Box = {item.units_per_box} {item.base_unit}s
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                    ₱{Number(item.price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;