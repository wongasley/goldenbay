import React, { useState, useEffect } from 'react';
import { Package, MapPin } from 'lucide-react';
import axiosInstance from '../../../utils/axiosInstance';

const InventoryDashboard = () => {
  const [locations, setLocations] = useState([]);
  const [stock, setStock] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locRes = await axiosInstance.get('/api/inventory/locations/');
        setLocations(locRes.data);
        if (locRes.data.length > 0) setSelectedLoc(locRes.data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedLoc) return;
    const fetchStock = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/inventory/stock/?location=${selectedLoc}`);
        setStock(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [selectedLoc]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100"><Package size={24} className="text-blue-600"/></div>
            Live Inventory Stock
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-medium">Real-time room quantities</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <MapPin size={16} className="text-gray-400" />
          <select 
            className="bg-transparent font-bold text-sm outline-none text-gray-700"
            value={selectedLoc}
            onChange={(e) => setSelectedLoc(e.target.value)}
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
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
    </div>
  );
};

export default InventoryDashboard;