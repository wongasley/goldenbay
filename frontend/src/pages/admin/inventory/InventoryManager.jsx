import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Barcode, Package, Box, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

const InventoryManager = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Scanner State
  const [scanMode, setScanMode] = useState(false);
  const [scanAction, setScanAction] = useState('IN');
  const [barcodeInput, setBarcodeInput] = useState('');
  const scannerInputRef = useRef(null);

  // --- NEW: Add Item Modal State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '', brand: '', description: '', barcode: '', 
    box_barcode: '', base_unit: 'Bottle', units_per_box: 1, cost_price: ''
  });

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

  useEffect(() => { fetchInventory(); }, [search]);

  useEffect(() => {
    if (scanMode && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [scanMode]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const res = await axiosInstance.post('/api/inventory/scan/', {
        barcode: barcodeInput.trim(),
        action: scanAction
      });
      toast.success(res.data.message);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.error || "Scan failed.");
      const errorAudio = new Audio('/audio/error.mp3');
      errorAudio.play().catch(()=> {});
    } finally {
      setBarcodeInput('');
      if (scannerInputRef.current) scannerInputRef.current.focus();
    }
  };

  // --- NEW: Handle Form Submission ---
  const handleAddNewItem = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await axiosInstance.post('/api/inventory/products/create/', newItemForm);
        toast.success("Product added to catalog!");
        setShowAddModal(false);
        setNewItemForm({ name: '', brand: '', description: '', barcode: '', box_barcode: '', base_unit: 'Bottle', units_per_box: 1, cost_price: '' });
        fetchInventory();
    } catch (err) {
        toast.error("Failed to add product. Check if barcode already exists.");
    } finally {
        setIsSaving(false);
    }
  };

  const formatQuantity = (totalBase, unitsPerBox, unitName) => {
    if (unitsPerBox <= 1) return `${totalBase} ${unitName}s`;
    const boxes = Math.floor(totalBase / unitsPerBox);
    const loose = totalBase % unitsPerBox;
    return `${boxes} Boxes + ${loose} ${unitName}s`;
  };

  const inputClass = "w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 outline-none rounded-sm shadow-sm";
  const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5";

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
          <button onClick={() => setScanMode(true)} className="bg-gray-900 text-white px-5 py-2.5 font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-md hover:bg-black transition-all flex items-center gap-2">
            <Barcode size={16} /> Scan Mode
          </button>
          {/* --- UPDATED: Button opens modal --- */}
          <button onClick={() => setShowAddModal(true)} className="bg-gold-600 text-white px-5 py-2.5 font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-md hover:bg-gold-700 transition-all flex items-center gap-2">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* --- NEW: ADD ITEM MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                 <h2 className="text-lg font-serif text-gray-900 font-bold flex items-center gap-2"><Package size={18} className="text-gold-600"/> Add New Product</h2>
                 <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Register item to central catalog</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={18}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                <form id="addProductForm" onSubmit={handleAddNewItem} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
                            <input required type="text" placeholder="e.g. Premium Oyster Sauce" className={inputClass} value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Brand</label>
                            <input type="text" placeholder="e.g. Lee Kum Kee" className={inputClass} value={newItemForm.brand} onChange={e => setNewItemForm({...newItemForm, brand: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-100">
                        <div>
                            <label className={labelClass}>Primary Barcode (UPC) <span className="text-red-500">*</span></label>
                            <input required type="text" placeholder="Scan or type barcode" className={inputClass} value={newItemForm.barcode} onChange={e => setNewItemForm({...newItemForm, barcode: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Mother Box Barcode (Optional)</label>
                            <input type="text" placeholder="Scan box barcode" className={inputClass} value={newItemForm.box_barcode} onChange={e => setNewItemForm({...newItemForm, box_barcode: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Base Unit</label>
                            <input required type="text" placeholder="e.g. Bottle, Pack, Kg" className={inputClass} value={newItemForm.base_unit} onChange={e => setNewItemForm({...newItemForm, base_unit: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Units per Box</label>
                            <input required type="number" min="1" className={inputClass} value={newItemForm.units_per_box} onChange={e => setNewItemForm({...newItemForm, units_per_box: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Cost Price (₱)</label>
                            <input required type="number" step="0.01" min="0" placeholder="0.00" className={inputClass} value={newItemForm.cost_price} onChange={e => setNewItemForm({...newItemForm, cost_price: e.target.value})} />
                        </div>
                    </div>
                </form>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">Cancel</button>
                <button form="addProductForm" type="submit" disabled={isSaving} className="bg-gold-600 text-white px-8 py-2.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-md hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2">
                    <Save size={14}/> {isSaving ? 'Saving...' : 'Save Product'}
                </button>
            </div>

          </div>
        </div>
      )}

      {/* SCANNER MODAL */}
      {scanMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setScanMode(false)}>
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center relative" onClick={e => e.stopPropagation()}>
             <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Live Scanner Active</h2>
             <p className="text-sm text-gray-500 mb-6">Point your USB/Bluetooth scanner at a barcode.</p>
             
             <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
               <button onClick={() => setScanAction('IN')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${scanAction === 'IN' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500'}`}>Stock IN</button>
               <button onClick={() => setScanAction('OUT')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${scanAction === 'OUT' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'}`}>Stock OUT</button>
             </div>

             <form onSubmit={handleScanSubmit}>
               <input 
                 ref={scannerInputRef}
                 type="text" 
                 value={barcodeInput}
                 onChange={(e) => setBarcodeInput(e.target.value)}
                 className="absolute opacity-0 w-0 h-0" 
                 autoFocus
                 onBlur={() => scannerInputRef.current?.focus()}
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