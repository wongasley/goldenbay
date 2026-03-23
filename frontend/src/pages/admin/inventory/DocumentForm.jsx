import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { Barcode, Trash2, Send, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DocumentForm = ({ docType }) => { 
  const navigate = useNavigate();
  
  // FIX: Map App.jsx routes to Database Choices safely
  const getActualDocType = () => {
      if (docType === 'DELIVERY') return 'INBOUND';
      if (docType === 'REQUISITION') return 'OUTBOUND';
      return 'TRANSFER'; // TRANSFER matches perfectly
  };
  const actualDocType = getActualDocType();

  const [locations, setLocations] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // For manual entry
  
  const [source, setSource] = useState('');
  const [sourceRack, setSourceRack] = useState('');
  
  const [dest, setDest] = useState('');
  const [destRack, setDestRack] = useState('');
  
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const [selectedManualProduct, setSelectedManualProduct] = useState('');

  const scannerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const locRes = await axiosInstance.get('/api/inventory/locations/');
      setLocations(locRes.data);
      const prodRes = await axiosInstance.get('/api/inventory/'); // Fetch all products for manual dropdown
      setAllProducts(prodRes.data);
    };
    fetchData();
    
    setSource(''); setSourceRack('');
    setDest(''); setDestRack('');
    setLineItems([]);
  }, [docType]);

  // Handle Barcode Scanner
  const handleScan = async (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      const res = await axiosInstance.get(`/api/inventory/products/lookup/?barcode=${code}`);
      const product = res.data.product;
      const isBox = res.data.is_box;
      const qtyToAdd = isBox ? product.units_per_box : 1;

      addItemToTable(product, qtyToAdd);
      new Audio('/audio/success.mp3').play().catch(()=>{});
    } catch (err) {
      toast.error("Barcode not recognized.");
    } finally {
      setBarcodeInput('');
    }
  };

  // Handle Manual Dropdown Selection
  const handleManualAdd = () => {
      if (!selectedManualProduct) return;
      const product = allProducts.find(p => p.product.toString() === selectedManualProduct || p.id.toString() === selectedManualProduct);
      if (product) {
          // Normalize the product object to match scanner lookup format
          const formattedProduct = {
              id: product.product || product.id,
              name: product.product_name || product.name,
              base_unit: product.base_unit
          };
          addItemToTable(formattedProduct, 1);
          setSelectedManualProduct(''); // Reset dropdown
      }
  };

  const addItemToTable = (product, qtyToAdd) => {
    setLineItems(prev => {
        const existing = prev.find(item => item.product_id === product.id);
        if (existing) {
          return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item);
        }
        return [...prev, { product_id: product.id, name: product.name || product.product_name, unit: product.base_unit, quantity: qtyToAdd }];
      });
  };

  const removeRow = (productId) => setLineItems(prev => prev.filter(item => item.product_id !== productId));

  const handleSubmit = async () => {
    if (lineItems.length === 0) return toast.error("Scan or add at least one item.");
    if (actualDocType === 'INBOUND' && (!dest || !destRack)) return toast.error("Select destination location and rack.");
    if (actualDocType === 'OUTBOUND' && (!source || !sourceRack)) return toast.error("Select source location and rack.");
    if (actualDocType === 'TRANSFER' && (!source || !sourceRack || !dest || !destRack)) return toast.error("Select source and destination locations and racks.");

    try {
      await axiosInstance.post('/api/inventory/documents/create/', {
        doc_type: actualDocType,
        source_location: actualDocType === 'INBOUND' ? null : source,
        source_rack: actualDocType === 'INBOUND' ? null : sourceRack,
        destination_location: actualDocType === 'OUTBOUND' ? null : dest,
        destination_rack: actualDocType === 'OUTBOUND' ? null : destRack,
        notes: notes,
        items: lineItems
      });
      toast.success("Document Submitted!");
      navigate('/staff/inventory'); 
    } catch (err) {
      toast.error("Failed to submit document.");
    }
  };

  const sourceLocObj = locations.find(l => l.id.toString() === source);
  const destLocObj = locations.find(l => l.id.toString() === dest);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-6">
        <div>
            <h1 className="text-2xl font-bold font-serif text-gray-900">
                {actualDocType === 'INBOUND' ? 'Inbound Delivery' : actualDocType === 'OUTBOUND' ? 'Outbound Consumption' : 'Internal Transfer'}
            </h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Select movement locations below</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            
            {/* SOURCE (Hidden for Inbound) */}
            {actualDocType !== 'INBOUND' && (
                <div className="space-y-3 p-3 bg-white rounded border border-gray-200 shadow-sm">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gold-600">Take From (Source)</label>
                    <select className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-gold-500" value={source} onChange={e => {setSource(e.target.value); setSourceRack('');}}>
                        <option value="">-- Select Room --</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <select className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-gold-500" value={sourceRack} onChange={e => setSourceRack(e.target.value)} disabled={!source}>
                        <option value="">-- Select Rack/Shelf --</option>
                        {sourceLocObj?.racks?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            )}
            
            {/* DESTINATION (Hidden for Outbound) */}
            {actualDocType !== 'OUTBOUND' && (
                <div className="space-y-3 p-3 bg-white rounded border border-gray-200 shadow-sm">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-600">Store In (Destination)</label>
                    <select className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-gold-500" value={dest} onChange={e => {setDest(e.target.value); setDestRack('');}}>
                        <option value="">-- Select Room --</option>
                        {locations.map(l => <option key={l.id} value={l.id} disabled={actualDocType === 'TRANSFER' && l.id.toString() === source}>{l.name}</option>)}
                    </select>
                    <select className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-gold-500" value={destRack} onChange={e => setDestRack(e.target.value)} disabled={!dest}>
                        <option value="">-- Select Rack/Shelf --</option>
                        {destLocObj?.racks?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            )}
            
            <div className="md:col-span-2 mt-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Notes / Invoice #</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-gold-500 shadow-sm" placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
        </div>

        {/* ADD ITEMS CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* INVISIBLE SCANNER INPUT */}
            <form onSubmit={handleScan} className="relative">
              <input ref={scannerRef} autoFocus onBlur={() => setTimeout(() => scannerRef.current?.focus(), 10)} className="absolute opacity-0 w-0 h-0" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} />
              <div className="w-full h-full bg-blue-50/50 text-blue-700 py-6 rounded-lg text-center border-2 border-blue-200 border-dashed cursor-pointer" onClick={() => scannerRef.current?.focus()}>
                <Barcode size={32} className="mx-auto mb-2 text-blue-400" />
                <p className="font-bold text-sm">Scanner Ready</p>
                <p className="text-xs opacity-70">Click here if scanner loses focus</p>
              </div>
            </form>

            {/* MANUAL SELECTOR (For testing without barcode) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col justify-center">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">No Scanner? Select Manually</label>
                <div className="flex gap-2">
                    <select className="flex-1 p-2 border border-gray-300 rounded text-sm outline-none focus:border-gold-500" value={selectedManualProduct} onChange={e => setSelectedManualProduct(e.target.value)}>
                        <option value="">-- Choose Product --</option>
                        {allProducts.map(p => (
                            <option key={p.id || p.product} value={p.product || p.id}>{p.product_name || p.name}</option>
                        ))}
                    </select>
                    <button onClick={handleManualAdd} className="bg-gold-600 text-white px-4 rounded hover:bg-black transition-colors"><Plus size={18}/></button>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs text-gray-500 uppercase tracking-widest">Selected Product</th>
              <th className="p-4 text-xs text-gray-500 uppercase tracking-widest text-center">Total Quantity</th>
              <th className="p-4 text-xs text-gray-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.length === 0 ? (
                <tr><td colSpan="3" className="p-8 text-center text-gray-400 italic">No items added yet.</td></tr>
            ) : lineItems.map((line) => (
              <tr key={line.product_id} className="hover:bg-gray-50">
                <td className="p-4 font-bold">{line.name}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                      <input type="number" min="1" value={line.quantity} onChange={(e) => setLineItems(prev => prev.map(item => item.product_id === line.product_id ? { ...item, quantity: parseInt(e.target.value)||1 } : item))} className="border border-gray-300 p-1.5 w-24 rounded text-center font-mono font-bold outline-none focus:border-gold-500" />
                      <span className="text-xs text-gray-500 uppercase">{line.unit}s</span>
                  </div>
                </td>
                <td className="p-4 text-right"><button onClick={() => removeRow(line.product_id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {lineItems.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button onClick={handleSubmit} className="bg-gold-600 text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-widest shadow-md hover:bg-black transition-colors flex items-center gap-2"><Send size={14}/> Submit for Approval</button>
            </div>
        )}
      </div>
    </div>
  );
};
export default DocumentForm;