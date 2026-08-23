import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBoxOpen, FaSearch, FaPlus, FaTools, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import RestockFeedModal from './RestockFeedModal';
import AdjustStockModal from './AdjustStockModal';
import StockHistoryModal from './StockHistoryModal';
import AddFeedModal from './AddFeedModal';

const FeedInventory = ({ inventoryPredictions, onRefresh, inventoryValue }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');
  
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);

  const getStatusColor = (status) => {
    if (status.includes('GOOD')) return 'text-green-600 bg-green-50';
    if (status.includes('MONITOR')) return 'text-yellow-600 bg-yellow-50';
    if (status.includes('REORDER')) return 'text-orange-600 bg-orange-50';
    if (status.includes('CRITICAL')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusDotColor = (status) => {
    if (status.includes('GOOD')) return 'bg-green-500';
    if (status.includes('MONITOR')) return 'bg-yellow-500';
    if (status.includes('REORDER')) return 'bg-orange-500';
    if (status.includes('CRITICAL')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const filteredInventory = inventoryPredictions.filter((item) => {
    const matchesSearch = item.feedStock.feedName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.feedStock.feedType.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'ALL') return true;
    if (filter === 'SECURE' && item.status.includes('GOOD')) return true;
    if (filter === 'LOW STOCK' && item.status.includes('MONITOR')) return true;
    if (filter === 'REORDER REQUIRED' && item.status.includes('REORDER')) return true;
    if (filter === 'CRITICAL' && item.status.includes('CRITICAL')) return true;
    
    return false;
  });

  const reorderCount = inventoryPredictions.filter(i => i.status.includes('REORDER')).length;
  const criticalCount = inventoryPredictions.filter(i => i.status.includes('CRITICAL')).length;
  
  const validDays = inventoryPredictions.filter(i => i.daysRemaining !== 'N/A' && i.daysRemaining > 0).map(i => i.daysRemaining);
  const avgDays = validDays.length > 0 ? (validDays.reduce((a,b) => a+b, 0) / validDays.length).toFixed(1) : 'N/A';

  const handleRestock = (feed = null) => {
    setSelectedFeed(feed);
    setIsRestockOpen(true);
  };

  const handleAdjust = (feed = null) => {
    setSelectedFeed(feed);
    setIsAdjustOpen(true);
  };

  const handleHistory = (feed) => {
    setSelectedFeed(feed);
    setIsHistoryOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-4 flex justify-between items-center text-white">
        <h2 className="text-xl font-bold flex items-center">
          <FaBoxOpen className="mr-3 text-teal-200" />
          {t('Feed Inventory', 'Feed Inventory')}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsAddFeedOpen(true)}
            className="bg-teal-600 text-white hover:bg-teal-500 px-4 py-2 rounded-lg font-bold text-sm flex items-center transition-colors shadow-sm"
          >
            <FaPlus className="mr-2" /> {t('Add New Feed Type', 'Add New Feed Type')}
          </button>
          <button 
            onClick={() => handleRestock()}
            className="bg-white text-teal-800 hover:bg-teal-50 px-4 py-2 rounded-lg font-bold text-sm flex items-center transition-colors shadow-sm"
          >
            <FaBoxOpen className="mr-2" /> {t('Restock', 'Restock')}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-4 flex flex-col items-center justify-center bg-gray-50/50">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 text-center">{t('Total Feed Types', 'Total Feed Types')}</span>
          <span className="text-2xl font-black text-gray-800">{inventoryPredictions.length}</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center bg-gray-50/50">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 text-center">{t('Inventory Value', 'Inventory Value')}</span>
          <span className="text-2xl font-black text-teal-700">₹{inventoryValue ? inventoryValue.toLocaleString('en-IN') : 0}</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center bg-orange-50/30">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1 text-center">{t('Reorder Required', 'Reorder Required')}</span>
          <span className="text-2xl font-black text-orange-700">{reorderCount}</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center bg-red-50/30">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1 text-center">{t('Critical', 'Critical')}</span>
          <span className="text-2xl font-black text-red-700">{criticalCount}</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center bg-gray-50/50">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 text-center">{t('Average Days', 'Average Days')}</span>
          <span className="text-2xl font-black text-gray-800">{avgDays}</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-hide">
          {['ALL', 'SECURE', 'LOW STOCK', 'REORDER REQUIRED', 'CRITICAL'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filter === f ? 'bg-teal-100 text-teal-800 border-teal-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              } border`}
            >
              {t(f, f)}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('Search Feed', 'Search Feed') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full rounded-lg border-gray-300 border py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold">{t('Feed Name', 'Feed Name')}</th>
              <th className="p-4 font-bold">{t('Current Stock', 'Current Stock')}</th>
              <th className="p-4 font-bold">{t('Daily Usage', 'Daily Usage')}</th>
              <th className="p-4 font-bold">{t('Days Remaining', 'Days Remaining')}</th>
              <th className="p-4 font-bold">{t('Reorder Level', 'Reorder Level')}</th>
              <th className="p-4 font-bold">{t('Status', 'Status')}</th>
              <th className="p-4 font-bold text-right">{t('Actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  {t('No feed inventory found.', 'No feed inventory found.')}
                </td>
              </tr>
            ) : (
              filteredInventory.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{t(item.feedStock.feedName, item.feedStock.feedName)}</div>
                    <div className="text-xs text-gray-500">{t(item.feedStock.feedType, item.feedStock.feedType)}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-gray-900">{item.feedStock.quantity || 0}</span>
                    <span className="text-gray-500 ml-1 text-sm">{t(item.feedStock.unit, item.feedStock.unit)}</span>
                  </td>
                  <td className="p-4">
                    {item.dailyConsumption > 0 ? (
                      <div>
                        <span className="font-medium text-gray-700">{item.dailyConsumption.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1 text-sm">{t(item.feedStock.unit, item.feedStock.unit)}/{t('day', 'day')}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 uppercase">{t('No Usage', 'No Usage')}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {item.daysRemaining !== 'N/A' ? (
                      <div className="font-bold text-gray-700">{item.daysRemaining} {t('days', 'days')}</div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">{t('N/A', 'N/A')}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">{Math.ceil(item.requiredStock)} {t(item.feedStock.unit, item.feedStock.unit)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotColor(item.status)}`}></span>
                      {t(item.status.replace(/[^a-zA-Z\s]/g, '').trim(), item.status.replace(/[^a-zA-Z\s]/g, '').trim())}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleRestock(item)}
                        title={t('Restock', 'Restock')}
                        className="p-2 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                      >
                        <FaPlus />
                      </button>
                      <button 
                        onClick={() => handleAdjust(item)}
                        title={t('Adjust Stock', 'Adjust Stock')}
                        className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <FaTools />
                      </button>
                      <button 
                        onClick={() => handleHistory(item)}
                        title={t('Stock History', 'Stock History')}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <FaHistory />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isRestockOpen && (
        <RestockFeedModal 
          isOpen={isRestockOpen} 
          onClose={() => setIsRestockOpen(false)} 
          feed={selectedFeed}
          inventoryPredictions={inventoryPredictions}
          onSuccess={() => {
            setIsRestockOpen(false);
            onRefresh();
          }}
        />
      )}

      {isAdjustOpen && (
        <AdjustStockModal 
          isOpen={isAdjustOpen} 
          onClose={() => setIsAdjustOpen(false)} 
          feed={selectedFeed}
          inventoryPredictions={inventoryPredictions}
          onSuccess={() => {
            setIsAdjustOpen(false);
            onRefresh();
          }}
        />
      )}

      {isHistoryOpen && (
        <StockHistoryModal 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
          feed={selectedFeed}
        />
      )}

      {isAddFeedOpen && (
        <AddFeedModal
          isOpen={isAddFeedOpen}
          onClose={() => setIsAddFeedOpen(false)}
          onSuccess={() => {
            setIsAddFeedOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default FeedInventory;
