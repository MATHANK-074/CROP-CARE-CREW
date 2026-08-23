import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaBoxOpen, FaSyncAlt } from 'react-icons/fa';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const FeedInventoryModal = ({ onClose, onUpdate }) => {
  const { t } = useTranslation();
  const [feedStocks, setFeedStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new feed type
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeed, setNewFeed] = useState({ feedType: 'Green Fodder', feedName: '', quantity: 0, unit: 'kg', lowStockThreshold: 100 });

  // Form state for restocking
  const [restockStockId, setRestockStockId] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');

  useEffect(() => {
    fetchFeedStocks();
  }, []);

  const fetchFeedStocks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/feed'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFeedStocks(await res.json());
      }
    } catch (err) {
      console.error('Error fetching feed stocks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewFeed = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/feed'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newFeed)
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewFeed({ feedType: 'Green Fodder', feedName: '', quantity: 0, unit: 'kg', lowStockThreshold: 100 });
        await fetchFeedStocks();
        onUpdate();
      } else {
        alert(t('feed_optimization.error_add_feed', 'Failed to add feed.'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockQuantity || Number(restockQuantity) <= 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/feed/${restockStockId}/log`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'Restocked', quantity: Number(restockQuantity) })
      });
      if (res.ok) {
        setRestockStockId(null);
        setRestockQuantity('');
        await fetchFeedStocks();
        onUpdate(); // refresh the dashboard behind it
      } else {
        alert(t('feed_optimization.error_restock', 'Failed to restock.'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaBoxOpen className="mr-3 text-green-600" />
            {t('feed_optimization.manage_inventory', 'Manage Feed Inventory')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Current Inventory Table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-800">{t('feed_optimization.current_stock', 'Current Stock')}</h3>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center hover:bg-green-700 transition"
                >
                  <FaPlus className="mr-1" /> {t('feed_optimization.add_new_feed', 'Add New Feed Type')}
                </button>
              </div>

              {feedStocks.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <p className="text-gray-500 mb-2">{t('feed_optimization.no_inventory_tracked', 'No inventory tracked yet.')}</p>
                  <p className="text-sm text-gray-400">{t('feed_optimization.no_inventory_desc', 'Add your feed types here to see automatic reorder predictions.')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left bg-white">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b">
                      <tr>
                        <th className="p-3">{t('feed_optimization.table_feed_type', 'Feed Type')}</th>
                        <th className="p-3">{t('feed_optimization.feed_name', 'Feed Name')}</th>
                        <th className="p-3">{t('feed_optimization.total_quantity', 'Total Quantity')}</th>
                        <th className="p-3 text-right">{t('feed_optimization.actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {feedStocks.map(stock => (
                        <tr key={stock._id} className="hover:bg-gray-50">
                          <td className="p-3">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">{t(`feed_optimization.feed_${stock.feedType.replace(/\s+/g, '_').toLowerCase()}`, stock.feedType)}</span>
                          </td>
                          <td className="p-3 text-gray-800 font-medium">{stock.feedName || stock.feedType}</td>
                          <td className="p-3">
                            <span className="text-lg font-bold text-gray-800">{stock.quantity}</span> 
                            <span className="text-gray-500 text-xs ml-1">{stock.unit}</span>
                          </td>
                          <td className="p-3 text-right">
                            {restockStockId === stock._id ? (
                              <form onSubmit={handleRestock} className="flex items-center justify-end space-x-2">
                                <input 
                                  type="number" 
                                  className="w-20 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" 
                                  placeholder="+ Qty"
                                  value={restockQuantity}
                                  onChange={e => setRestockQuantity(e.target.value)}
                                  autoFocus
                                />
                                <button type="submit" className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700"><FaSyncAlt /></button>
                                <button type="button" onClick={() => setRestockStockId(null)} className="bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300">&times;</button>
                              </form>
                            ) : (
                              <button 
                                onClick={() => setRestockStockId(stock._id)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end w-full"
                              >
                                <FaPlus className="mr-1" /> {t('feed_optimization.restock', 'Restock')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add New Feed Form */}
            {showAddForm && (
              <div className="bg-green-50 border border-green-200 p-5 rounded-xl">
                <h3 className="text-green-800 font-bold mb-4">{t('feed_optimization.add_new_feed', 'Add New Feed Type')}</h3>
                <form onSubmit={handleAddNewFeed} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-green-700 mb-1">{t('feed_optimization.table_feed_type', 'Feed Type')}</label>
                    <select 
                      className="w-full border border-green-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                      value={newFeed.feedType}
                      onChange={e => setNewFeed({...newFeed, feedType: e.target.value})}
                    >
                      <option value="Green Fodder">Green Fodder</option>
                      <option value="Napier Grass">Napier Grass</option>
                      <option value="Paddy Straw">Paddy Straw</option>
                      <option value="Dry Fodder">Dry Fodder</option>
                      <option value="Concentrate Feed">Concentrate Feed</option>
                      <option value="Rice Bran">Rice Bran</option>
                      <option value="Wheat Bran">Wheat Bran</option>
                      <option value="Groundnut Cake">Groundnut Cake</option>
                      <option value="Cottonseed Cake">Cottonseed Cake</option>
                      <option value="Coconut Cake">Coconut Cake</option>
                      <option value="Horse Gram">Horse Gram</option>
                      <option value="Bengal Gram (Sundal)">Bengal Gram (Sundal)</option>
                      <option value="Maize">Maize</option>
                      <option value="Broken Rice">Broken Rice</option>
                      <option value="Millets">Millets</option>
                      <option value="Tapioca">Tapioca</option>
                      <option value="Calf Starter">Calf Starter</option>
                      <option value="Mineral Mixture">Mineral Mixture</option>
                      <option value="Common Salt">Common Salt</option>
                      <option value="Special Care Feed">Special Care Feed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-green-700 mb-1">{t('feed_optimization.feed_name', 'Feed Name (Optional)')}</label>
                    <input 
                      type="text" 
                      className="w-full border border-green-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="e.g. Napier Grass"
                      value={newFeed.feedName}
                      onChange={e => setNewFeed({...newFeed, feedName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-green-700 mb-1">{t('feed_optimization.initial_quantity', 'Initial Quantity')}</label>
                    <div className="flex">
                      <input 
                        type="number" 
                        required
                        className="w-full border border-green-300 rounded-l-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                        value={newFeed.quantity}
                        onChange={e => setNewFeed({...newFeed, quantity: e.target.value})}
                      />
                      <span className="bg-green-200 border border-green-300 border-l-0 rounded-r-lg px-4 flex items-center text-green-800 font-bold">kg</span>
                    </div>
                  </div>
                  <div className="flex items-end space-x-3">
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 w-full">
                      {t('feed_optimization.save_feed', 'Save Feed')}
                    </button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-400 w-full">
                      {t('feed_optimization.cancel', 'Cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedInventoryModal;
