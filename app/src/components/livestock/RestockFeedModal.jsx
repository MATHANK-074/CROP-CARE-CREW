import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaPlus, FaBoxOpen } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const RestockFeedModal = ({ isOpen, onClose, feed, inventoryPredictions, onSuccess }) => {
  const { t } = useTranslation();
  const [selectedFeedId, setSelectedFeedId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (feed) {
      setSelectedFeedId(feed.feedStock._id);
      if (feed.feedStock.costPerUnit) {
        setCost(feed.feedStock.costPerUnit.toString());
      }
      if (feed.feedStock.supplier) {
        setSupplier(feed.feedStock.supplier);
      }
    } else if (inventoryPredictions.length > 0) {
      setSelectedFeedId(inventoryPredictions[0].feedStock._id);
    }
  }, [feed, inventoryPredictions]);

  if (!isOpen) return null;

  const currentSelection = inventoryPredictions.find(i => i.feedStock._id === selectedFeedId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFeedId || !quantity) {
      toast.error(t('Please fill all required fields.', 'Please fill all required fields.'));
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        buildApiUrl(`/feed/${selectedFeedId}/log`),
        {
          action: 'RESTOCK',
          quantity: Number(quantity),
          cost: cost ? Number(cost) : undefined,
          supplier,
          batchNumber,
          expiryDate: expiryDate || undefined,
          date: purchaseDate,
          notes
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success(t('Stock updated successfully.', 'Stock updated successfully.'));
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to add stock.', 'Failed to add stock.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-xl font-bold flex items-center">
            <FaBoxOpen className="mr-2 text-teal-200" />
            {t('RESTOCK FEED', 'RESTOCK FEED')}
          </h2>
          <button onClick={onClose} className="text-teal-200 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-grow">
          {/* Quick Info Panel */}
          {currentSelection && (
            <div className="bg-teal-50 rounded-lg p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border border-teal-100">
              <div>
                <div className="text-xs text-teal-600 font-bold uppercase">{t('Current Stock', 'Current Stock')}</div>
                <div className="font-bold text-gray-800">{currentSelection.feedStock.quantity || 0} {t(currentSelection.feedStock.unit, currentSelection.feedStock.unit)}</div>
              </div>
              <div>
                <div className="text-xs text-teal-600 font-bold uppercase">{t('Daily Usage', 'Daily Usage')}</div>
                <div className="font-bold text-gray-800">
                  {currentSelection.dailyConsumption > 0 ? `${currentSelection.dailyConsumption.toFixed(1)} ${t(currentSelection.feedStock.unit, currentSelection.feedStock.unit)}/${t('day', 'day')}` : t('No Usage', 'No Usage')}
                </div>
              </div>
              <div>
                <div className="text-xs text-teal-600 font-bold uppercase">{t('Days Remaining', 'Days Remaining')}</div>
                <div className="font-bold text-gray-800">{currentSelection.daysRemaining !== 'N/A' ? `${currentSelection.daysRemaining} ${t('days', 'days')}` : t('N/A', 'N/A')}</div>
              </div>
              <div>
                <div className="text-xs text-teal-600 font-bold uppercase">{t('Recommended Purchase', 'Recommended Purchase')}</div>
                <div className="font-bold text-teal-700">{Math.ceil(currentSelection.recommendedPurchaseQty)} {t(currentSelection.feedStock.unit, currentSelection.feedStock.unit)}</div>
              </div>
            </div>
          )}

          {inventoryPredictions.length === 0 ? (
            <div className="text-center py-8">
              <FaBoxOpen className="mx-auto text-gray-300 text-5xl mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">{t('No feeds available', 'No feeds available to restock')}</h3>
              <p className="text-gray-500">{t('Please add a new feed type first.', 'Please add a new feed type first.')}</p>
            </div>
          ) : (
          <form id="restockForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('Feed Type', 'Feed Type')} *</label>
                <select
                  value={selectedFeedId}
                  onChange={(e) => setSelectedFeedId(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                >
                  {inventoryPredictions.map((i) => (
                    <option key={i.feedStock._id} value={i.feedStock._id}>
                      {t(i.feedStock.feedName, i.feedStock.feedName)} ({t(i.feedStock.feedType, i.feedStock.feedType)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('Quantity Purchased', 'Quantity Purchased')} ({currentSelection ? t(currentSelection.feedStock.unit, currentSelection.feedStock.unit) : ''}) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('Purchase Price', 'Purchase Price')} (₹ / {currentSelection ? t(currentSelection.feedStock.unit, currentSelection.feedStock.unit) : ''})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('Supplier', 'Supplier')}</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('Purchase Date', 'Purchase Date')} *</label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('Batch Number', 'Batch Number')}</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('Expiry Date', 'Expiry Date')}</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('Notes', 'Notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </form>
          )}
        </div>

        <div className="bg-gray-50 p-4 border-t flex justify-end shrink-0 space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-bold text-sm"
          >
            {t('CANCEL', 'CANCEL')}
          </button>
            {inventoryPredictions.length > 0 && (
              <button
                type="submit"
                form="restockForm"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center shadow-md disabled:opacity-70"
              >
                {loading ? <span className="animate-spin mr-2">...</span> : <FaPlus className="mr-2" />}
                {t('SAVE STOCK', 'SAVE STOCK')}
              </button>
            )}
          </div>
        </div>
      </div>
  );
};

export default RestockFeedModal;
