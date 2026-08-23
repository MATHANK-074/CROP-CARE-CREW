import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaShieldAlt, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const FeedProfileModal = ({ profile, onClose, onOverrideSaved, milkPriceStatus }) => {
  const { t } = useTranslation();
  const [showOverride, setShowOverride] = useState(false);
  const [overrideFeed, setOverrideFeed] = useState(null);
  const [overrideQty, setOverrideQty] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideQty || !overrideReason) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/feed-optimization/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          livestockId: profile.cow._id,
          feedType: overrideFeed.feedType,
          originalAIQty: overrideFeed.originalAIQty || overrideFeed.suggestedQuantityKg,
          modifiedQty: parseFloat(overrideQty),
          reason: overrideReason
        })
      });
      if (res.ok) {
        setShowOverride(false);
        setOverrideQty('');
        setOverrideReason('');
        onOverrideSaved();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const revenueDisplay = milkPriceStatus === 'NOT_CONFIGURED' ? 'NOT AVAILABLE' : `₹${(profile.metrics.estimatedMilkRevenue || 0).toFixed(2)}`;
  const marginDisplay = milkPriceStatus === 'NOT_CONFIGURED' ? 'NOT AVAILABLE' : `₹${(profile.metrics.estimatedFeedMargin || 0).toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('Animal Feed Profile', 'Animal Feed Profile')}: {profile.cow.tagId}</h2>
            <div className="flex items-center mt-1">
               <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-bold mr-2">{t(profile.analysis.profile, profile.analysis.profile)}</span>
               {profile.analysis.specialCare && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">{t('SPECIAL CARE', 'SPECIAL CARE')}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2"><FaTimes size={24} /></button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Summary & Biological Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-gray-50 p-3 rounded-lg border">
                <span className="text-xs text-gray-500 font-bold block mb-1">{t('Age', 'Age')}</span>
                <span className="font-medium">{profile.cow.ageString || t('Unknown', 'Unknown')}</span>
             </div>
             <div className="bg-gray-50 p-3 rounded-lg border">
                <span className="text-xs text-gray-500 font-bold block mb-1">{t('Milk Production', 'Milk Production')}</span>
                <span className="font-medium">{profile.analysis.milkYield > 0 ? `${(profile.analysis.milkYield || 0).toFixed(1)} L/day` : 'N/A'}</span>
             </div>
             <div className="bg-gray-50 p-3 rounded-lg border">
                <span className="text-xs text-gray-500 font-bold block mb-1">{t('Pregnancy Stage', 'Pregnancy Stage')}</span>
                <span className="font-medium">{profile.analysis.pregnancyStage ? t(profile.analysis.pregnancyStage, profile.analysis.pregnancyStage) : 'N/A'}</span>
             </div>
             <div className="bg-gray-50 p-3 rounded-lg border">
                <span className="text-xs text-gray-500 font-bold block mb-1">{t('Days to Delivery', 'Days to Delivery')}</span>
                <span className="font-medium">{profile.analysis.daysToDelivery ? profile.analysis.daysToDelivery : 'N/A'}</span>
             </div>
          </div>

          {/* Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="flex items-center text-blue-800 font-bold mb-2"><FaInfoCircle className="mr-2" /> {t('Why this recommendation?', 'Why this recommendation?')}</h4>
            <p className="text-blue-900 text-sm leading-relaxed">{t(profile.analysis.explanation, profile.analysis.explanation)}</p>
            <div className="mt-3 flex items-center">
               <span className="text-xs text-blue-700 mr-2">{t('Data Confidence', 'Data Confidence')}:</span>
               <span className={`text-xs font-bold px-2 py-0.5 rounded ${profile.analysis.confidence === 'HIGH' ? 'bg-green-100 text-green-700' : profile.analysis.confidence === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {profile.analysis.confidenceScore}% {t(profile.analysis.confidence, profile.analysis.confidence)}
               </span>
            </div>
          </div>

          {/* Special Care Alert */}
          {profile.analysis.specialCare && (
             <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
               <FaExclamationTriangle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
               <div>
                 <h4 className="font-bold text-red-800 text-sm mb-1">{t('Professional Review Recommended', 'Professional Review Recommended')}</h4>
                 <p className="text-red-700 text-xs">{t('Special feeding review recommended due to recent health events. The system is decision support, not veterinary diagnosis.', 'Special feeding review recommended due to recent health events. The system is decision support, not veterinary diagnosis.')}</p>
               </div>
             </div>
          )}

          {/* Suggested Feed Plan */}
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-4">{t('Suggested Feed Plan', 'Suggested Feed Plan')}</h3>
            <div className="bg-white border rounded-xl overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                     <tr>
                        <th className="p-3">{t('Feed Type', 'Feed Type')}</th>
                        <th className="p-3">{t('Quantity', 'Quantity')}</th>
                        <th className="p-3">{t('Daily Cost', 'Daily Cost')}</th>
                        <th className="p-3">{t('Source', 'Source')}</th>
                        <th className="p-3">{t('Actions', 'Actions')}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {profile.feedPlan.map((fp, i) => (
                        <tr key={i}>
                           <td className="p-3 font-medium text-gray-800">
                              {t(fp.feedType, fp.feedType)}
                              {fp.isOverridden && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded uppercase font-bold">{t('FARMER OVERRIDE', 'FARMER OVERRIDE')}</span>}
                              {fp.reviewRequired && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded uppercase font-bold" title={t(fp.reviewReason, fp.reviewReason)}>{t('REVIEW REQUIRED', 'REVIEW REQUIRED')}</span>}
                           </td>
                           <td className="p-3">
                              {fp.isOverridden ? (
                                 <div>
                                    <div className="font-bold text-gray-800">{fp.suggestedQuantityKg} kg</div>
                                    <div className="text-xs text-gray-400 line-through">Sys: {fp.originalAIQty || 'N/A'} kg</div>
                                    {fp.overrideReason && <div className="text-[10px] text-purple-600 mt-1" title={fp.overrideReason}>{t('Reason', 'Reason')}: {fp.overrideReason}</div>}
                                 </div>
                              ) : (
                                 <span className="font-bold text-gray-800">{fp.suggestedQuantityKg} kg</span>
                              )}
                           </td>
                           <td className="p-3">
                              <span className="text-gray-800">₹{(fp.estimatedDailyCost || 0).toFixed(2)}</span>
                              <div className="text-[10px] text-gray-500">{t(fp.priceStatus, fp.priceStatus)} PRICE</div>
                           </td>
                           <td className="p-3 text-xs text-gray-600">
                              {t(fp.source, fp.source)}
                           </td>
                           <td className="p-3">
                              <button 
                                onClick={() => { setOverrideFeed(fp); setShowOverride(true); }}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition font-medium"
                              >
                                 {t('Override', 'Override')}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>

          {/* Economics */}
          <div className="bg-gray-50 rounded-xl p-5 border">
             <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center"><FaShieldAlt className="mr-2 text-gray-500"/> {t('Economics', 'Economics')}</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                   <div className="text-xs text-gray-500">{t('Daily Feed Cost', 'Daily Feed Cost')}</div>
                   <div className="font-bold text-lg text-indigo-700">₹{(profile.metrics.dailyFeedCost || 0).toFixed(2)}</div>
                </div>
                <div>
                   <div className="text-xs text-gray-500">{t('Feed Cost/Litre', 'Feed Cost/Litre')}</div>
                   <div className="font-bold text-lg text-indigo-700">
                     {profile.metrics.feedCostPerLitre === 'N/A' ? 'N/A' : `₹${profile.metrics.feedCostPerLitre}`}
                   </div>
                </div>
                <div>
                   <div className="text-xs text-gray-500">{t('Milk Revenue', 'Milk Revenue')} <span className="text-[10px] bg-gray-200 px-1 rounded">EST</span></div>
                   <div className="font-bold text-lg text-green-700">{revenueDisplay}</div>
                </div>
                <div>
                   <div className="text-xs text-gray-500">{t('Feed Margin', 'Feed Margin')} <span className="text-[10px] bg-gray-200 px-1 rounded">EST</span></div>
                   <div className="font-bold text-lg text-blue-700">{marginDisplay}</div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Override Modal */}
      {showOverride && overrideFeed && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
               <h3 className="text-lg font-bold mb-4">{t('Override Feed Plan', 'Override Feed Plan')} - {t(overrideFeed.feedType, overrideFeed.feedType)}</h3>
               <p className="text-sm text-gray-600 mb-4">{t('System Suggestion', 'System Suggestion')}: <span className="font-bold">{overrideFeed.suggestedQuantityKg} kg</span></p>
               
               <form onSubmit={handleOverrideSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">{t('New Quantity (kg)', 'New Quantity (kg)')}</label>
                     <input 
                       type="number" 
                       step="0.1" 
                       required
                       value={overrideQty}
                       onChange={e => setOverrideQty(e.target.value)}
                       className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-200 focus:outline-none"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">{t('Reason for Change', 'Reason for Change')}</label>
                     <input 
                       type="text" 
                       required
                       placeholder={t('E.g. Local fodder availability', 'E.g. Local fodder availability')}
                       value={overrideReason}
                       onChange={e => setOverrideReason(e.target.value)}
                       className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-200 focus:outline-none"
                     />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                     <button type="button" onClick={() => setShowOverride(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('Cancel', 'Cancel')}</button>
                     <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold">
                        {submitting ? t('Saving...', 'Saving...') : t('Save Override', 'Save Override')}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default FeedProfileModal;
