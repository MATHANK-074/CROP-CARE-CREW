import React, { useState, useEffect } from 'react';
import { FaLeaf, FaPlus, FaMinus, FaEdit, FaTrash, FaHistory } from 'react-icons/fa';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const FeedManagement = () => {
  const [feedStocks, setFeedStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showLogsHistory, setShowLogsHistory] = useState(false);
  
  // Selected items
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [feedLogs, setFeedLogs] = useState([]);
  
  // Form States
  const [formData, setFormData] = useState({
    feedType: 'Silage', feedName: '', quantity: '', unit: 'kg', lowStockThreshold: 50
  });
  const [logData, setLogData] = useState({
    action: 'Consumed', quantity: '', cost: '', notes: ''
  });

  useEffect(() => {
    fetchFeedStocks();
  }, []);

  const fetchFeedStocks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/feed'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setFeedStocks(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (feedId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/feed/${feedId}/logs`), { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setFeedLogs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/feed'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddFeed(false);
        setFormData({ feedType: 'Silage', feedName: '', quantity: '', unit: 'kg', lowStockThreshold: 50 });
        fetchFeedStocks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogAction = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/feed/${selectedFeed._id}/log`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(logData)
      });
      if (res.ok) {
        setShowLogModal(false);
        setLogData({ action: 'Consumed', quantity: '', cost: '', notes: '' });
        fetchFeedStocks();
      } else {
        alert("Action failed. Check quantity.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feed stock?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/feed/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFeedStocks();
    } catch (err) {
      console.error(err);
    }
  };

  const openLogModal = (feed, actionType) => {
    setSelectedFeed(feed);
    setLogData({ ...logData, action: actionType });
    setShowLogModal(true);
  };

  const openHistory = (feed) => {
    setSelectedFeed(feed);
    fetchLogs(feed._id);
    setShowLogsHistory(true);
  };

  if (loading) return <div>Loading Feed Stock...</div>;

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center"><FaLeaf className="mr-2 text-green-600"/> Feed Inventory</h2>
          <p className="text-gray-500 text-sm">Track your silage, fodder, and concentrates.</p>
        </div>
        <button 
          onClick={() => setShowAddFeed(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center"
        >
          <FaPlus className="mr-2"/> Add New Feed
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedStocks.map(feed => {
          const isLow = feed.quantity <= feed.lowStockThreshold;
          return (
            <div key={feed._id} className={`bg-white rounded-xl shadow-sm border ${isLow ? 'border-red-300' : 'border-gray-200'} overflow-hidden relative`}>
              {isLow && <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">Low Stock</div>}
              
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">{feed.feedType}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feed.feedName}</h3>
                
                <div className="flex items-end mb-4">
                  <span className={`text-4xl font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                    {feed.quantity}
                  </span>
                  <span className="text-gray-500 ml-1 mb-1 font-medium">{feed.unit}</span>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                  <div className={`h-2 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (feed.quantity / (feed.lowStockThreshold * 3)) * 100)}%` }}></div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button onClick={() => openLogModal(feed, 'Consumed')} className="flex justify-center items-center py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition font-medium">
                    <FaMinus className="mr-1 text-sm"/> Use
                  </button>
                  <button onClick={() => openLogModal(feed, 'Restocked')} className="flex justify-center items-center py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium">
                    <FaPlus className="mr-1 text-sm"/> Restock
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-4 border-t border-gray-100 pt-3">
                  <button onClick={() => openHistory(feed)} className="text-gray-500 hover:text-gray-700 flex items-center text-sm"><FaHistory className="mr-1"/> History</button>
                  <button onClick={() => handleDelete(feed._id)} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ADD FEED MODAL */}
      {showAddFeed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Feed Stock</h2>
            <form onSubmit={handleAddFeed} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feed Type</label>
                <select required value={formData.feedType} onChange={e => setFormData({...formData, feedType: e.target.value})} className="w-full border rounded-lg p-2">
                  <option value="Silage">Silage</option>
                  <option value="Dry Fodder">Dry Fodder</option>
                  <option value="Concentrates">Concentrates</option>
                  <option value="Mineral Mixture">Mineral Mixture</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feed Name</label>
                <input required type="text" placeholder="e.g. Corn Silage" value={formData.feedName} onChange={e => setFormData({...formData, feedName: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Qty</label>
                  <input required type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full border rounded-lg p-2" />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border rounded-lg p-2">
                    <option value="kg">kg</option>
                    <option value="tons">tons</option>
                    <option value="bags">bags</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Warning Level</label>
                <input required type="number" min="0" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddFeed(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Add Feed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG MODAL (Use / Restock) */}
      {showLogModal && selectedFeed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{logData.action === 'Consumed' ? 'Log Feed Usage' : 'Restock Feed'} - {selectedFeed.feedName}</h2>
            <form onSubmit={handleLogAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity {logData.action === 'Consumed' ? 'Used' : 'Added'} ({selectedFeed.unit})</label>
                <input required type="number" min="1" step="0.1" value={logData.quantity} onChange={e => setLogData({...logData, quantity: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              {logData.action === 'Restocked' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                  <input type="number" min="0" value={logData.cost} onChange={e => setLogData({...logData, cost: e.target.value})} className="w-full border rounded-lg p-2" placeholder="Optional" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={logData.notes} onChange={e => setLogData({...logData, notes: e.target.value})} className="w-full border rounded-lg p-2" placeholder="Optional notes..." />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowLogModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className={`px-4 py-2 text-white rounded-lg ${logData.action === 'Consumed' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                  {logData.action === 'Consumed' ? 'Deduct Stock' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showLogsHistory && selectedFeed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col m-auto">
            <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">{selectedFeed.feedName} - History</h2>
              <button onClick={() => setShowLogsHistory(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div className="p-0 overflow-y-auto max-h-[70vh]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-600 text-sm sticky top-0">
                  <tr>
                    <th className="p-3 border-b">Date</th>
                    <th className="p-3 border-b">Action</th>
                    <th className="p-3 border-b">Qty</th>
                    <th className="p-3 border-b">Notes/Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {feedLogs.length === 0 ? (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No history found.</td></tr>
                  ) : (
                    feedLogs.map(log => (
                      <tr key={log._id} className="border-b border-gray-100">
                        <td className="p-3 text-sm text-gray-600">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            log.action === 'Consumed' ? 'bg-orange-100 text-orange-800' :
                            log.action === 'Restocked' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>{log.action}</span>
                        </td>
                        <td className="p-3 font-bold text-gray-800">{log.action === 'Consumed' ? '-' : '+'}{log.quantity} {selectedFeed.unit}</td>
                        <td className="p-3 text-sm text-gray-500">
                          {log.cost ? <span className="block text-green-600 font-medium">₹{log.cost}</span> : null}
                          {log.notes}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeedManagement;
