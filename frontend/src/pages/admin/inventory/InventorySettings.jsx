import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, MapPin, Layers, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

const InventorySettings = () => {
  const [activeTab, setActiveTab] = useState('LOCATIONS');
  const [locations, setLocations] = useState([]);
  const [racks, setRacks] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newLoc, setNewLoc] = useState('');
  const [newRack, setNewRack] = useState('');
  const [selectedLocForRack, setSelectedLocForRack] = useState('');
  const [newUom, setNewUom] = useState('');

  const fetchData = async () => {
    try {
      const [locRes, rackRes, uomRes] = await Promise.all([
        axiosInstance.get('/api/inventory/locations/'),
        axiosInstance.get('/api/inventory/racks/'),
        axiosInstance.get('/api/inventory/uom/')
      ]);
      setLocations(locRes.data);
      setRacks(rackRes.data);
      setUoms(uomRes.data);
    } catch (err) {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLoc.trim()) return;
    try {
      await axiosInstance.post('/api/inventory/locations/', { name: newLoc });
      toast.success("Location added");
      setNewLoc(''); fetchData();
    } catch (err) { toast.error("Failed to add location."); }
  };

  const handleAddRack = async (e) => {
    e.preventDefault();
    if (!newRack.trim() || !selectedLocForRack) return toast.error("Select a location and enter a rack name.");
    try {
      await axiosInstance.post('/api/inventory/racks/', { name: newRack, location: selectedLocForRack });
      toast.success("Rack added");
      setNewRack(''); fetchData();
    } catch (err) { toast.error("Failed to add rack."); }
  };

  const handleAddUom = async (e) => {
    e.preventDefault();
    if (!newUom.trim()) return;
    try {
      await axiosInstance.post('/api/inventory/uom/', { name: newUom });
      toast.success("Unit of Measure added");
      setNewUom(''); fetchData();
    } catch (err) { toast.error("Failed to add UOM."); }
  };

  const handleDelete = async (endpoint, id) => {
    if(!window.confirm("Are you sure you want to delete this?")) return;
    try {
      await axiosInstance.delete(`/api/inventory/${endpoint}/${id}/`);
      toast.success("Deleted successfully.");
      fetchData();
    } catch (err) { toast.error("Cannot delete. It may be in use."); }
  };

  const tabClass = (tab) => `flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-gold-600 text-gold-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`;

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Loading Settings...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg border border-gray-200"><Settings size={24} className="text-gray-600"/></div>
          Inventory Settings
        </h1>
        <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">Manage your warehouse infrastructure</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button onClick={() => setActiveTab('LOCATIONS')} className={tabClass('LOCATIONS')}><MapPin size={16}/> Locations</button>
          <button onClick={() => setActiveTab('RACKS')} className={tabClass('RACKS')}><Layers size={16}/> Racks & Shelves</button>
          <button onClick={() => setActiveTab('UOM')} className={tabClass('UOM')}><Scale size={16}/> Units of Measure</button>
        </div>

        <div className="p-6">
          {activeTab === 'LOCATIONS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Current Locations</h3>
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                  {locations.map(loc => (
                    <li key={loc.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                      <span className="font-bold text-sm text-gray-900">{loc.name}</span>
                      <button onClick={() => handleDelete('locations', loc.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Add New Location</h3>
                <form onSubmit={handleAddLocation} className="flex gap-2">
                  <input type="text" placeholder="e.g. Ground Floor Freezer" className="flex-1 p-2 border border-gray-300 rounded outline-none focus:border-gold-500 text-sm" value={newLoc} onChange={e => setNewLoc(e.target.value)} />
                  <button type="submit" className="bg-gold-600 text-white px-4 rounded hover:bg-black transition-colors"><Plus size={18}/></button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'RACKS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Current Racks</h3>
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                  {racks.map(rack => (
                    <li key={rack.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <span className="font-bold text-sm text-gray-900 block">{rack.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase">In: {locations.find(l => l.id === rack.location)?.name}</span>
                      </div>
                      <button onClick={() => handleDelete('racks', rack.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Add New Rack</h3>
                <form onSubmit={handleAddRack} className="space-y-3">
                  <select className="w-full p-2 border border-gray-300 rounded outline-none focus:border-gold-500 text-sm" value={selectedLocForRack} onChange={e => setSelectedLocForRack(e.target.value)}>
                    <option value="">-- Select Parent Location --</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. Shelf A2" className="flex-1 p-2 border border-gray-300 rounded outline-none focus:border-gold-500 text-sm" value={newRack} onChange={e => setNewRack(e.target.value)} />
                    <button type="submit" className="bg-gold-600 text-white px-4 rounded hover:bg-black transition-colors"><Plus size={18}/></button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'UOM' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Units of Measure</h3>
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                  {uoms.map(uom => (
                    <li key={uom.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                      <span className="font-bold text-sm text-gray-900">{uom.name}</span>
                      <button onClick={() => handleDelete('uom', uom.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Add Unit of Measure</h3>
                <form onSubmit={handleAddUom} className="flex gap-2">
                  <input type="text" placeholder="e.g. Kilogram, Liter, Case" className="flex-1 p-2 border border-gray-300 rounded outline-none focus:border-gold-500 text-sm" value={newUom} onChange={e => setNewUom(e.target.value)} />
                  <button type="submit" className="bg-gold-600 text-white px-4 rounded hover:bg-black transition-colors"><Plus size={18}/></button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventorySettings;