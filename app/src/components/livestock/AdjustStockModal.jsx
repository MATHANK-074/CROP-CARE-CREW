import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaTools, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const AdjustStockModal = ({ isOpen, onClose, feed, inventoryPredictions, onSuccess }) => {
  const { t } = useTranslation();
  const [selectedFeedId, setSelectedFeedId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('REMOVE'); // 'ADD' or 'REMOVE'
  const [reason, setReason] = useState('Spoilage');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (feed) {
      setSelectedFeedId(feed.feedStock._id);
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
    
    if (adjustmentType === 'REMOVE' && currentSelection && Number(quantity) > currentSelection.feedStock.quantity) {
      toast.error(t('Cannot remove more stock than currently available.', 'Cannot remove more stock than currently available.'));
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const actionMap = {
        'ADD': 'ADJUSTMENT_ADD',
        'REMOVE': reason === 'Spoilage' ? 'SPOILAGE' : (reason === 'Wastage' ? 'WASTAGE' : 'ADJUSTMENT_REMOVE')
      };
      
      await axios.post(
        buildApiUrl(`/feed/${selectedFeedId}/log`),
        {
          action: actionMap[adjustmentType],
          quantity: Number(quantity),
          date,
          notes: notes || reason
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success(t('Stock adjustment successful.', 'Stock adjustment successful.'));
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to adjust stock.', 'Failed to adjust stock.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-gray-100 border-b p-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center text-gray-800">
            <FaTools className="mr-2 text-gray-500" />
            {t('Adjust Stock', 'Adjust Stock')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-grow">
          {currentSelection && (
             <div className="mb-4 text-sm text-gray-600">
               {t('Current Stock', 'Current Stock')}: <span className="font-bold text-gray-900">{currentSelection.feedStock.quantity || 0} {t(currentSelection.feedStock.unit, currentSelection.feedStock.unit)}</span>
             </div>
          )}
          
          <form id="adjustForm" onSubmit={handleSubmit} className="space-y-4">
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
                    {t(i.feedStock.feedName, i.feedStock.feedName)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('Adjustment Type', 'Adjustment Type')} *</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => {
                       setAdjustmentType(e.target.value);
                       if (e.target.value === 'ADD') setReason('Physical Stock Correction');
                       else setReason('Spoilage');
                    }}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="REMOVE">{t('REMOVE', 'REMOVE')}</option>
                    <option value="ADD">{t('ADD', 'ADD')}</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t('Adjustment Quantity', 'Adjustment Quantity')} ({currentSelection ? t(currentSelection.feedStock.unit, currentSelection.feedStock.unit) : ''}) *
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
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('Reason', 'Reason')} *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
              >
                {adjustmentType === 'REMOVE' ? (
                   <>
                     <option value="Spoilage">{t('Spoilage', 'Spoilage')}</option>
                     <option value="Wastage">{t('Wastage', 'Wastage')}</option>
                     <option value="Measurement Error">{t('Measurement Error', 'Measurement Error')}</option>
                     <option value="Other">{t('Other', 'Other')}</option>
                   </>
                ) : (
                   <>
                     <option value="Physical Stock Correction">{t('Physical Stock Correction', 'Physical Stock Correction')}</option>
                     <option value="Measurement Error">{t('Measurement Error', 'Measurement Error')}</option>
                     <option value="Other">{t('Other', 'Other')}</option>
                   </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('Date', 'Date')} *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                  />
               </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('Notes', 'Notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </form>
        </div>

        <div className="bg-gray-50 p-4 border-t flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-bold text-sm"
          >
            {t('CANCEL', 'CANCEL')}
          </button>
          <button
            type="submit"
            form="adjustForm"
            disabled={loading}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors font-bold text-sm flex items-center"
          >
            {loading ? t('Processing...', 'Processing...') : (
              <>
                <FaCheck className="mr-2" /> {t('SAVE ADJUSTMENT', 'SAVE ADJUSTMENT')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdjustStockModal;
