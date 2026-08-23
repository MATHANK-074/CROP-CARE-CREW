import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const FarmSettingsModal = ({ isOpen, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    milkSellingPricePerLitre: '',
    currency: 'INR'
  });
  const [history, setHistory] = useState([]);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

  useEffect(() => {
    if (isOpen) fetchSettings();
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/farm-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.data) {
        setSettings({
          milkSellingPricePerLitre: res.data.milkSellingPricePerLitre || '',
          currency: res.data.currency || 'INR'
        });
        setHistory(res.data.priceHistory || []);
      }
    } catch (err) {
      console.error('Error fetching settings', err);
    }
  };

  const handleSaveInit = (e) => {
    e.preventDefault();
    if (settings.milkSellingPricePerLitre !== '') {
      setConfirmUpdate(true);
    } else {
      handleSaveConfirmed();
    }
  };

  const handleSaveConfirmed = async () => {
    setLoading(true);
    try {
      const payload = { ...settings };
      if (payload.milkSellingPricePerLitre === '') delete payload.milkSellingPricePerLitre;
      else payload.milkSellingPricePerLitre = parseFloat(payload.milkSellingPricePerLitre);
      
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/farm-settings`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setConfirmUpdate(false);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving settings', err);
      alert('Error saving settings');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden mx-4 my-8 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">⚙️</span> {t('Farm Settings', 'Farm Settings')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl font-bold px-2 py-1 leading-none">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto grow bg-gray-50">
          
          <form onSubmit={handleSaveInit}>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
               <h3 className="text-lg font-bold text-gray-700 mb-4 pb-2 border-b">{t('Financial Settings', 'Financial Settings')}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Milk Selling Price', 'Milk Selling Price')} ({t('per Litre', 'per Litre')})</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-bold">
                        {settings.currency === 'INR' ? '₹' : settings.currency}
                      </span>
                      <input 
                        type="number" 
                        min="0"
                        step="0.1"
                        value={settings.milkSellingPricePerLitre} 
                        onChange={(e) => setSettings({...settings, milkSellingPricePerLitre: e.target.value})}
                        className="pl-8 block w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 48.5"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t('Leave empty if not configured', 'Leave empty if not configured')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Currency', 'Currency')}</label>
                    <select 
                      value={settings.currency}
                      onChange={(e) => setSettings({...settings, currency: e.target.value})}
                      className="block w-full p-2 border rounded-md"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
               </div>
            </div>

            {confirmUpdate && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">Review Required</h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>
                        Changing the milk price will affect future revenue and feed-margin calculations. Historical calculations will be preserved where price history exists. Are you sure you want to proceed?
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button type="button" onClick={handleSaveConfirmed} className="bg-orange-100 px-3 py-2 rounded-md text-sm font-medium text-orange-800 hover:bg-orange-200 focus:outline-none">Yes, Change Price</button>
                        <button type="button" onClick={() => setConfirmUpdate(false)} className="ml-3 bg-white px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!confirmUpdate && (
              <div className="flex justify-end pt-4">
                <button type="button" onClick={onClose} className="mr-3 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">{t('Cancel', 'Cancel')}</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded font-bold shadow hover:bg-blue-700 disabled:opacity-50">
                   {loading ? 'Saving...' : t('Save Price', 'Save Price')}
                </button>
              </div>
            )}
          </form>

          {history.length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-700 mb-4 pb-2 border-b flex items-center justify-between">
                 <span>{t('Price History', 'Price History')}</span>
                 <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">IMMUTABLE</span>
               </h3>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200 text-sm">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('Price', 'Price')}</th>
                       <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('Effective From', 'Effective Date')}</th>
                       <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('Effective To', 'Effective To')}</th>
                       <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('Updated By', 'Updated By')}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {history.map((h, i) => (
                       <tr key={i} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-bold text-gray-800">{settings.currency === 'INR' ? '₹' : ''}{h.price}</td>
                         <td className="px-4 py-3 text-gray-600">{new Date(h.effectiveFrom).toLocaleDateString()}</td>
                         <td className="px-4 py-3 text-gray-600">{h.effectiveTo ? new Date(h.effectiveTo).toLocaleDateString() : <span className="text-green-600 font-semibold italic text-xs">Current</span>}</td>
                         <td className="px-4 py-3 text-gray-500">{h.updatedBy}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FarmSettingsModal;
