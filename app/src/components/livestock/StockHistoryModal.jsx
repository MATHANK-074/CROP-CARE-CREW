import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaHistory, FaArrowDown, FaArrowUp, FaMinus } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const StockHistoryModal = ({ isOpen, onClose, feed }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && feed) {
      fetchLogs();
    }
  }, [isOpen, feed]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(buildApiUrl(`/feed/${feed.feedStock._id}/logs`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to load stock history.', 'Failed to load stock history.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !feed) return null;

  const getActionIcon = (action) => {
    const addActions = ['PURCHASE', 'RESTOCK', 'ADJUSTMENT_ADD', 'Restocked', 'Adjustment'];
    const subtractActions = ['CONSUMPTION', 'ADJUSTMENT_REMOVE', 'WASTAGE', 'SPOILAGE', 'Consumed'];
    
    if (addActions.includes(action)) return <FaArrowUp className="text-green-500" />;
    if (subtractActions.includes(action)) return <FaArrowDown className="text-red-500" />;
    return <FaMinus className="text-gray-500" />;
  };

  const getActionColor = (action) => {
    const addActions = ['PURCHASE', 'RESTOCK', 'ADJUSTMENT_ADD', 'Restocked', 'Adjustment'];
    const subtractActions = ['CONSUMPTION', 'ADJUSTMENT_REMOVE', 'WASTAGE', 'SPOILAGE', 'Consumed'];
    
    if (addActions.includes(action)) return 'text-green-600 bg-green-50';
    if (subtractActions.includes(action)) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getQuantityDisplay = (action, qty) => {
    const addActions = ['PURCHASE', 'RESTOCK', 'ADJUSTMENT_ADD', 'Restocked', 'Adjustment'];
    const subtractActions = ['CONSUMPTION', 'ADJUSTMENT_REMOVE', 'WASTAGE', 'SPOILAGE', 'Consumed'];
    
    if (addActions.includes(action)) return `+${qty}`;
    if (subtractActions.includes(action)) return `-${qty}`;
    return qty;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-indigo-700 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-xl font-bold flex items-center">
            <FaHistory className="mr-2 text-indigo-200" />
            {t('Stock History', 'Stock History')} - {t(feed.feedStock.feedName, feed.feedStock.feedName)}
          </h2>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-0 flex-grow bg-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700 mx-auto mb-4"></div>
              {t('Loading history...', 'Loading history...')}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('No transaction history found for this feed.', 'No transaction history found for this feed.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-gray-100 sticky top-0 shadow-sm z-10">
                  <tr className="text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">{t('Date', 'Date')}</th>
                    <th className="p-4 font-bold">{t('Transaction', 'Transaction')}</th>
                    <th className="p-4 font-bold text-right">{t('Quantity', 'Quantity')}</th>
                    <th className="p-4 font-bold text-right">{t('Result Stock', 'Result Stock')}</th>
                    <th className="p-4 font-bold">{t('Details', 'Details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-medium text-gray-800">
                          {new Date(log.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                          <span className="mr-1">{getActionIcon(log.action)}</span>
                          {t(log.action, log.action)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${log.action.includes('ADD') || log.action === 'RESTOCK' || log.action === 'PURCHASE' ? 'text-green-600' : 'text-red-600'}`}>
                          {getQuantityDisplay(log.action, log.quantity)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">{t(feed.feedStock.unit, feed.feedStock.unit)}</span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {log.previousStock !== undefined && log.newStock !== undefined ? (
                          <div className="text-sm">
                            <span className="text-gray-400 line-through mr-2">{log.previousStock}</span>
                            <span className="font-bold text-gray-800">{log.newStock} {t(feed.feedStock.unit, feed.feedStock.unit)}</span>
                          </div>
                        ) : (
                           <span className="text-gray-400 text-xs italic">{t('N/A (Legacy)', 'N/A (Legacy)')}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600 max-w-[200px]">
                        {log.supplier && <div className="truncate"><span className="font-semibold">{t('Supplier', 'Supplier')}:</span> {log.supplier}</div>}
                        {log.cost !== undefined && log.cost !== null && <div className="truncate"><span className="font-semibold">{t('Price', 'Price')}:</span> ₹{log.cost}/{t(feed.feedStock.unit, feed.feedStock.unit)}</div>}
                        {log.notes && <div className="truncate"><span className="font-semibold">{t('Notes', 'Notes')}:</span> {log.notes}</div>}
                        {!log.supplier && log.cost === undefined && !log.notes && <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;
