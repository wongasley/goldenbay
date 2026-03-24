import React, { useState, useEffect } from 'react';
import { Search, Plus, Database, X, Save, Edit2, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

const INVENTORY_CATEGORIES = [
  "Live Seafood", "Frozen Seafood", "Dried Seafood & Delicacies (Abalone, Sea Cucumber, Bird's Nest)",
  "Meat & Poultry", "Fresh Vegetables & Fruits", "Noodles, Rice & Grains",
  "Dimsum Ingredients & Wrappers", "Sauces, Oils & Condiments", "Spices & Seasonings",
  "Premium Tea", "Beverages (Sodas, Juices)", "Liquor, Wine & Beer",
  "Dry Goods (Mushrooms, Beans, Nuts)", "Dairy & Eggs", "Packaging & Disposables",
  "Cleaning & Janitorial Supplies", "Kitchen Equipment & Tools", "Miscellaneous"
];

const InventoryManager = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [itemForm, setItemForm] = useState({ 
    id: null, name: '', brand: '', category: '', description: '', 
    barcode: '', box_barcode: '', base_unit: 'Bottle', units_per_box: 1, cost_price: '' 
  });
  const [uoms, setUoms] = useState([]);
  const [csvFile, setCsvFile] = useState(null);

  const fetchInventory = async () => {
    try {
      const res = await axiosInstance.get(`/api/inventory/products/?search=${search}`);
      setItems(res.data);
      
      const uomRes = await axiosInstance.get('/api/inventory/uom/');
      setUoms(uomRes.data);
    } catch (err) {
      toast.error("Failed to load product catalog.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchInventory(); }, [search]);

  // Handle Single Item Save
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.category) return toast.error("Please select a category.");
    
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
        toast.error("Failed to save product. Barcode might already exist.");
    } finally { setIsSaving(false); }
  };

  // Handle Bulk CSV Upload
  const handleBulkUpload = async (e) => {
      e.preventDefault();
      if (!csvFile) return toast.error("Please select a CSV file first.");

      setIsSaving(true);
      const formData = new FormData();
      formData.append('file', csvFile);

      try {
          const res = await axiosInstance.post('/api/inventory/products/bulk-upload/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.success(res.data.message, { duration: 5000 });
          setShowUploadModal(false);
          setCsvFile(null);
          fetchInventory();
      } catch (err) {
          toast.error(err.response?.data?.error || "Failed to upload CSV.");
      } finally {
          setIsSaving(false);
      }
  };

  // Generate and Download CSV Template
  const downloadTemplate = () => {
      const headers = "Name,Brand,Category,Barcode,Box_Barcode,Base_Unit,Units_Per_Box,Cost_Price,Location,Rack,Quantity\n";
      const sample1 = "Premium Light Soy Sauce,Lee Kum Kee,Sauces,Oils & Condiments,SOY-123-BOT,SOY-123-BOX,Bottle,12,150.00,DRY STORAGE,Rack 1,50\n";
      const sample2 = "Live Suahe,,Live Seafood,LIV-SUAHE-001,,Kilogram,1,850.00,KITCHEN,Aquarium 2,15\n";
      
      const blob = new Blob([headers + sample1 + sample2], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "GoldenBay_Inventory_Template.csv";
      a.click();
      window.URL.revokeObjectURL(url);
  };

  const openModal = (item = null) => {
      if (item) {
          setItemForm({ 
              id: item.id, name: item.name, brand: item.brand || '', category: item.category || '',
              description: item.description || '', barcode: item.barcode, box_barcode: item.box_barcode || '', 
              base_unit: item.base_unit, units_per_box: item.units_per_box, cost_price: item.cost_price 
          });
      } else {
          setItemForm({ id: null, name: '', brand: '', category: '', description: '', barcode: '', box_barcode: '', base_unit: 'Bottle', units_per_box: 1, cost_price: '' });
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
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-100"><Database size={24} className="text-amber-600"/></div>
            Product Database
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-medium">Manage master catalog and barcodes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUploadModal(true)} className="bg-white text-gray-700 border border-gray-200 px-5 py-2.5 font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
              <Upload size={16} /> Bulk CSV
          </button>
          <button onClick={() => openModal()} className="bg-gold-600 text-white px-5 py-2.5 font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-md hover:bg-gold-700 transition-all flex items-center gap-2">
              <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      {/* --- BULK UPLOAD MODAL --- */}
      {showUploadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                      <div>
                          <h2 className="text-lg font-serif text-gray-900 font-bold flex items-center gap-2"><Upload size={18} className="text-gold-600"/> Import via CSV</h2>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Excel / Sheets Upload</p>
                      </div>
                      <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={18}/></button>
                  </div>
                  
                  <div className="p-6">
                      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                          Save time by uploading your inventory via CSV. If a barcode already exists, the system will update the product instead of creating a duplicate. It will also auto-create Locations and Racks if they don't exist yet!
                      </p>
                      
                      <div className="flex justify-center mb-6">
                          <button onClick={downloadTemplate} className="text-gold-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 hover:text-gold-700 hover:underline">
                              <Download size={14}/> Download CSV Template
                          </button>
                      </div>

                      <form onSubmit={handleBulkUpload}>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer">
                              <input 
                                  type="file" 
                                  accept=".csv" 
                                  required 
                                  onChange={(e) => setCsvFile(e.target.files[0])}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                              <p className="text-sm font-bold text-gray-700">
                                  {csvFile ? csvFile.name : "Click to select a CSV file"}
                              </p>
                              {!csvFile && <p className="text-xs text-gray-500 mt-1">or drag and drop here</p>}
                          </div>
                          
                          <div className="mt-6 flex gap-3">
                              <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors">Cancel</button>
                              <button type="submit" disabled={isSaving || !csvFile} className="flex-1 bg-gold-600 text-white py-3 text-xs font-bold uppercase tracking-widest rounded shadow-md hover:bg-black transition-colors disabled:opacity-50">
                                  {isSaving ? 'Processing...' : 'Upload Now'}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* --- ADD / EDIT ITEM MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                 <h2 className="text-lg font-serif text-gray-900 font-bold flex items-center gap-2"><Database size={18} className="text-gold-600"/> {itemForm.id ? 'Edit Product' : 'Add New Product'}</h2>
                 <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Central Catalog</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={18}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                <form id="addProductForm" onSubmit={handleSaveItem} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
                            <input required type="text" className={inputClass} value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Brand</label>
                            <input type="text" className={inputClass} value={itemForm.brand} onChange={e => setItemForm({...itemForm, brand: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                        <select required className={inputClass} value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})}>
                            <option value="" disabled>-- Select a Category --</option>
                            {INVENTORY_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
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
                <input type="text" placeholder="Search catalog by name, category, or barcode..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gold-500 outline-none transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Packaging</th>
                <th className="px-6 py-4">Cost Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-400 animate-pulse">Loading Catalog...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic">No items found in catalog.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    
                    <div className="flex items-center gap-2 mt-1">
                        {item.brand && <span className="text-[10px] text-gray-500 uppercase font-bold">{item.brand}</span>}
                        {item.brand && item.category && <span className="text-gray-300">•</span>}
                        {item.category && <span className="text-[9px] bg-gold-50 text-gold-700 border border-gold-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">{item.category}</span>}
                    </div>

                    <p className="text-[10px] text-gray-400 font-mono mt-1.5">UPC: {item.barcode}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                      <span className="font-bold">{item.units_per_box}</span> {item.base_unit}s / Box
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₱{Number(item.cost_price).toLocaleString()}
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