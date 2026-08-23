import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaPlus, FaBoxOpen } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const AddFeedModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [newFeed, setNewFeed] = useState({ 
    feedType: 'Green Fodder', 
    feedName: '', 
    quantity: 0, 
    unit: 'kg', 
    lowStockThreshold: 100 
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        buildApiUrl('/feed'),
        newFeed,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success(t('New feed type added successfully.', 'New feed type added successfully.'));
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to add feed.', 'Failed to add feed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-xl font-bold flex items-center">
            <FaBoxOpen className="mr-2 text-teal-200" />
            {t('Add New Feed Type', 'Add New Feed Type')}
          </h2>
          <button onClick={onClose} className="text-teal-200 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('Feed Type', 'Feed Type')}</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
              value={newFeed.feedType}
              onChange={e => setNewFeed({...newFeed, feedType: e.target.value})}
            >
              <option value="Green Fodder">{t('Green Fodder', 'Green Fodder')}</option>
              <option value="Napier Grass">{t('Napier Grass', 'Napier Grass')}</option>
              <option value="Paddy Straw">{t('Paddy Straw', 'Paddy Straw')}</option>
              <option value="Dry Fodder">{t('Dry Fodder', 'Dry Fodder')}</option>
              <option value="Concentrate Feed">{t('Concentrate Feed', 'Concentrate Feed')}</option>
              <option value="Rice Bran">{t('Rice Bran', 'Rice Bran')}</option>
              <option value="Wheat Bran">{t('Wheat Bran', 'Wheat Bran')}</option>
              <option value="Groundnut Cake">{t('Groundnut Cake', 'Groundnut Cake')}</option>
              <option value="Cottonseed Cake">{t('Cottonseed Cake', 'Cottonseed Cake')}</option>
              <option value="Coconut Cake">{t('Coconut Cake', 'Coconut Cake')}</option>
              <option value="Horse Gram">{t('Horse Gram', 'Horse Gram')}</option>
              <option value="Bengal Gram (Sundal)">{t('Bengal Gram (Sundal)', 'Bengal Gram (Sundal)')}</option>
              <option value="Maize">{t('Maize', 'Maize')}</option>
              <option value="Broken Rice">{t('Broken Rice', 'Broken Rice')}</option>
              <option value="Millets">{t('Millets', 'Millets')}</option>
              <option value="Tapioca">{t('Tapioca', 'Tapioca')}</option>
              <option value="Calf Starter">{t('Calf Starter', 'Calf Starter')}</option>
              <option value="Mineral Mixture">{t('Mineral Mixture', 'Mineral Mixture')}</option>
              <option value="Common Salt">{t('Common Salt', 'Common Salt')}</option>
              <option value="Special Care Feed">{t('Special Care Feed', 'Special Care Feed')}</option>
              <option value="Other">{t('Other', 'Other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('Feed Name (Optional)', 'Feed Name (Optional)')}</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g. Napier Grass"
              value={newFeed.feedName}
              onChange={e => setNewFeed({...newFeed, feedName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('Initial Quantity', 'Initial Quantity')}</label>
            <div className="flex">
              <input 
                type="number" 
                required
                className="w-full border border-gray-300 rounded-l-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
                value={newFeed.quantity}
                onChange={e => setNewFeed({...newFeed, quantity: e.target.value})}
              />
              <span className="bg-gray-100 border border-gray-300 border-l-0 rounded-r-lg px-4 flex items-center text-gray-700 font-bold">kg</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              {t('Cancel', 'Cancel')}
            </button>
            <button 
              type="submit" 
              className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-md flex items-center"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><FaPlus className="mr-2" /> {t('Save Feed', 'Save Feed')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFeedModal;
