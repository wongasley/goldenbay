import React, { useState, useEffect } from 'react';
import { Search, Edit2, Image as ImageIcon, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const MenuManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editPrices, setEditPrices] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await axiosInstance.get('/api/menu/manage/all/');
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load menu data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  // Instant Toggle "86 / Available"
  const toggleAvailability = async (item) => {
    const newStatus = !item.is_available;
    try {
      await axiosInstance.patch(`/api/menu/manage/items/${item.id}/`, { is_available: newStatus });
      toast.success(`${item.name} is now ${newStatus ? 'Available' : 'Out of Stock'}`);
      fetchMenu();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditPrices(item.prices.map(p => ({ ...p }))); // Clone prices
    setPreviewImage(item.image ? (item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`) : null);
    setNewImageFile(null);
  };

  // Save Changes from Modal
  const handleSaveItem = async () => {
    setIsSaving(true);
    try {
      // 1. Save Prices (Loop through and PATCH each price if changed)
      for (const price of editPrices) {
        const originalPrice = editingItem.prices.find(p => p.id === price.id);
        if (originalPrice.price !== price.price || originalPrice.is_seasonal !== price.is_seasonal) {
          await axiosInstance.patch(`/api/menu/manage/prices/${price.id}/`, {
            price: price.is_seasonal ? null : price.price,
            is_seasonal: price.is_seasonal
          });
        }
      }

      // 2. Save Image if a new one was selected
      if (newImageFile) {
        const formData = new FormData();
        formData.append('image', newImageFile);
        await axiosInstance.patch(`/api/menu/manage/items/${editingItem.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success(`${editingItem.name} updated successfully!`);
      setEditingItem(null);
      fetchMenu(); // Refresh data
    } catch (err) {
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Logic
  const filteredItems = categories
    .filter(cat => activeCategory === 'All' || cat.name === activeCategory)
    .flatMap(cat => cat.items)
    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || (item.code && item.code.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-4 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Menu & Pricing Manager</h1>
            <p className="text-gray-500 text-xs mt-0.5">Toggle availability (86), update market prices, and manage photos.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-2">
            <button onClick={() => setActiveCategory('All')} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all border shrink-0 ${activeCategory === 'All' ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>All Items</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.name)} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all border shrink-0 ${activeCategory === cat.name ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" placeholder="Search dish name or code..." 
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs focus:bg-white focus:border-gold-500 outline-none transition-all"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ITEM GRID (iPad friendly) */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 animate-pulse text-sm">Loading Menu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col hover:border-gold-300 transition-colors">
              <div className="flex gap-4 mb-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-gray-100 rounded shrink-0 overflow-hidden border border-gray-200">
                  {item.image ? (
                    <img src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`} className="w-full h-full object-cover" alt={item.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={20} opacity={0.5} /></div>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      {item.code && <span className="text-[10px] font-bold text-gray-400 font-mono mb-1 block">{item.code}</span>}
                      <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{item.name}</h3>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-mono text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                    {item.prices.map(p => (
                      <span key={p.id}>
                        {p.size === 'Regular' ? '' : `${p.size}: `} 
                        {p.is_seasonal ? <span className="text-gold-600 italic text-[10px]">Market Price</span> : `₱${Number(p.price).toLocaleString()}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-gray-100">
                <button 
                  onClick={() => toggleAvailability(item)}
                  className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex justify-center items-center gap-1.5 border
                    ${item.is_available ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                >
                  {item.is_available ? <><Check size={14}/> Available</> : <><X size={14}/> Out of Stock</>}
                </button>
                <button onClick={() => openEditModal(item)} className="py-2 text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded transition-colors flex justify-center items-center gap-1.5">
                  <Edit2 size={14} /> Edit Price/Photo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="font-serif font-bold text-lg text-gray-900">Edit Dish</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{editingItem.name}</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={20}/></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Update Photo</label>
                <div className="relative w-full h-48 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:bg-gray-50 transition-colors group cursor-pointer">
                    {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center p-4 text-gray-400">
                            <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                            <span className="text-xs font-medium">Tap to upload</span>
                        </div>
                    )}
                    <input 
                        type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                            if (e.target.files[0]) {
                                setNewImageFile(e.target.files[0]);
                                setPreviewImage(URL.createObjectURL(e.target.files[0]));
                            }
                        }} 
                    />
                </div>
              </div>

              {/* Pricing */}
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Update Pricing</label>
                 <div className="space-y-3">
                    {editPrices.map((price, index) => (
                       <div key={price.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                          <span className="text-xs font-bold uppercase w-16 text-gray-700">{price.size}</span>
                          
                          <div className="flex-1 flex gap-2 items-center">
                            <span className="text-gray-400 text-sm">₱</span>
                            <input 
                              type="number" 
                              className="w-full bg-white border border-gray-300 p-2 text-sm rounded outline-none focus:border-gold-500 disabled:bg-gray-100 disabled:text-gray-400"
                              value={price.price || ''}
                              disabled={price.is_seasonal}
                              onChange={(e) => {
                                const newPrices = [...editPrices];
                                newPrices[index].price = e.target.value;
                                setEditPrices(newPrices);
                              }}
                            />
                          </div>

                          <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase cursor-pointer pl-2 border-l border-gray-300">
                            <input 
                              type="checkbox" 
                              checked={price.is_seasonal}
                              onChange={(e) => {
                                const newPrices = [...editPrices];
                                newPrices[index].is_seasonal = e.target.checked;
                                setEditPrices(newPrices);
                              }}
                            />
                            Seasonal
                          </label>
                       </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditingItem(null)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors">Cancel</button>
              <button onClick={handleSaveItem} disabled={isSaving} className="flex-1 bg-gold-600 text-white py-3 text-xs font-bold uppercase tracking-widest rounded shadow-md hover:bg-black transition-colors disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;