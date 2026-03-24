import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Barcode, Package, Box, X, Save, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

const InventoryManager = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [scanMode, setScanMode] = useState(false);
  const [scanAction, setScanAction] = useState('IN');
  const [barcodeInput, setBarcodeInput] = useState('');
  const scannerInputRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemForm, setItemForm] = useState({ id: null, name: '', brand: '', description: '', barcode: '', box_barcode: '', base_unit: 'Bottle', units_per_box: 1, cost_price: '' });
  const [uoms, setUoms] = useState([]);

  const fetchInventory = async () => {
    try {
      // FIX: Changed /api/inventory/ to /api/inventory/products/
      const res = await axiosInstance.get(`/api/inventory/products/?search=${search}`);
      setItems(res.data);
      
      const uomRes = await axiosInstance.get('/api/inventory/uom/'); // <--- ADD THIS
      setUoms(uomRes.data); // <--- ADD THIS
    } catch (err) {
      toast.error("Failed to load inventory.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchInventory(); }, [search]);
  useEffect(() => { if (scanMode && scannerInputRef.current) scannerInputRef.current.focus(); }, [scanMode]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    try {
      const res = await axiosInstance.post('/api/inventory/scan/', { barcode: barcodeInput.trim(), action: scanAction });
      toast.success(res.data.message);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.error || "Scan failed.");
      new Audio('/audio/error.mp3').play().catch(()=> {});
    } finally {
      setBarcodeInput('');
      if (scannerInputRef.current) scannerInputRef.current.focus();
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        if (itemForm.id) {
            await axiosInstance.patch(`/api/inventory/products/${itemForm.id}/update/`, itemForm);
            toast.success("Product Updated!");
        } else {
            await axiosInstance.post('/api/inventory/products/create/', itemForm);
            toast.success("Product Created!");
        }
        setShowAddModal(false);
        fetchInventory();
    } catch (err) {
        toast.error("Failed to save product.");
    } finally { setIsSaving(false); }
  };

  const openModal = (item = null) => {
      if (item) {
          setItemForm({ 
              id: item.product, name: item.product_name, brand: item.brand, description: item.description || '', 
              barcode: item.product_barcode, box_barcode: item.box_barcode || '', 
              base_unit: item.base_unit, units_per_box: item.units_per_box, cost_price: item.price 
          });
      } else {
          setItemForm({ id: null, name: '', brand: '', description: '', barcode: '', box_barcode: '', base_unit: 'Bottle', units_per_box: 1, cost_price: '' });
      }
      setShowAddModal(true);
  };

  const inputClass = "w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 outline-none rounded-sm shadow-sm";
  const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5";

  return (
    <div className="space-y-6 pb-20">
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-3">
            <div className="p-2 bg-gold-50 rounded-lg border border-gold-100"><Package size={24} className="text-gold-600"/></div>
            Inventory Manager
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-medium">Track stock and edit product details</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScanMode(true)} className="bg-gray-900 text-white px-5 py-2.5 font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-md hover:bg-black transition-all flex items-center gap-2"><Barcode size={16} /> Quick Scan</button>
          <button onClick={() => openModal()} className="bg-gold-600 text-white px-5 py-2.5 font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-md hover:bg-gold-700 transition-all flex items-center gap-2"><Plus size={16} /> New Product</button>
        </div>
      </div>

      {/* --- ADD / EDIT ITEM MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                 <h2 className="text-lg font-serif text-gray-900 font-bold flex items-center gap-2"><Package size={18} className="text-gold-600"/> {itemForm.id ? 'Edit Product' : 'Add New Product'}</h2>
                 <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Central Catalog</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={18}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                <form id="addProductForm" onSubmit={handleSaveItem} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
                            <input required type="text" className={inputClass} value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Brand</label>
                            <input type="text" className={inputClass} value={itemForm.brand} onChange={e => setItemForm({...itemForm, brand: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-100">
                        <div>
                            <label className={labelClass}>Primary Barcode (UPC) <span className="text-red-500">*</span></label>
                            <input required type="text" className={inputClass} value={itemForm.barcode} onChange={e => setItemForm({...itemForm, barcode: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Box Barcode (Optional)</label>
                            <input type="text" className={inputClass} value={itemForm.box_barcode} onChange={e => setItemForm({...itemForm, box_barcode: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Base Unit</label>
                            <select required className={inputClass} value={itemForm.base_unit} onChange={e => setItemForm({...itemForm, base_unit: e.target.value})}>
                                <option value="" disabled>-- Select Unit --</option>
                                {uoms.map(uom => (
                                    <option key={uom.id} value={uom.name}>{uom.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Units per Box</label>
                            <input required type="number" min="1" className={inputClass} value={itemForm.units_per_box} onChange={e => setItemForm({...itemForm, units_per_box: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Cost Price (₱)</label>
                            <input required type="number" step="0.01" min="0" className={inputClass} value={itemForm.cost_price} onChange={e => setItemForm({...itemForm, cost_price: e.target.value})} />
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

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Search inventory by name, brand, or barcode..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gold-500 outline-none transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{item.product_name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">UPC: {item.product_barcode}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                      <span className="font-bold block">{item.location_name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{item.rack_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{item.quantity} {item.base_unit}s</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button onClick={() => openModal(item)} className="p-2 bg-gray-50 text-gray-600 hover:text-gold-600 hover:bg-gold-50 rounded border border-gray-200 transition-colors"><Edit2 size={14}/></button>
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