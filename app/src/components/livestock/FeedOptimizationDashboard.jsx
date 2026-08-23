import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaLeaf, FaExclamationTriangle, FaChartBar, FaSearch, 
  FaCalendarAlt, FaShoppingCart, FaChartPie, FaPaw as FaCow, FaBoxOpen,
  FaRupeeSign, FaInfoCircle, FaShieldAlt, FaCog, FaChartLine
} from 'react-icons/fa';
import FeedProfileModal from './FeedProfileModal';
import FarmSettingsModal from './FarmSettingsModal';
import FeedInventory from './FeedInventory';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const FeedOptimizationDashboard = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchCow, setSearchCow] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedCowProfile, setSelectedCowProfile] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/feed-optimization/dashboard'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div></div>;
  }

  if (!data) return <div>{t('feed_optimization.failed_to_load', 'Failed to load optimization data.')}</div>;

  const { kpi, todaysRequirement, inventoryPredictions, cowProfiles, farmForecast, efficiencyTrend, milkPriceStatus, milkSellingPricePerLitre } = data;

  const filteredCows = cowProfiles.filter(c => {
    const matchSearch = c.cow.tagId.toLowerCase().includes(searchCow.toLowerCase());
    const matchFilter = filterCategory === 'ALL' || c.analysis.profile === filterCategory;
    return matchSearch && matchFilter;
  });

  const getSecurityStatus = (score) => {
    if(score >= 90) return { label: 'SECURE', color: 'text-green-600 bg-green-50' };
    if(score >= 75) return { label: 'STABLE', color: 'text-blue-600 bg-blue-50' };
    if(score >= 50) return { label: 'MONITOR', color: 'text-yellow-600 bg-yellow-50' };
    if(score >= 25) return { label: 'WARNING', color: 'text-orange-600 bg-orange-50' };
    return { label: 'CRITICAL', color: 'text-red-600 bg-red-50' };
  };

  const security = getSecurityStatus(kpi.feedSecurityScore);
  const totalMilk = cowProfiles.reduce((acc, c) => acc + (c.analysis.milkYield || 0), 0);
  const avgCostPerLitre = totalMilk > 0 ? (kpi.totalDailyCost / totalMilk).toFixed(2) : 'N/A';

  return (
    <div className="space-y-8">
      {milkPriceStatus === 'NOT_CONFIGURED' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
           <div className="flex justify-between items-center">
              <div className="flex">
                <FaExclamationTriangle className="text-red-500 mr-3 mt-1" />
                <div>
                  <h3 className="text-sm font-bold text-red-800">{t('Milk selling price not configured', 'Milk selling price not configured')}</h3>
                  <p className="text-sm text-red-700">{t('Feed margin calculations are disabled until a milk price is set.', 'Feed margin calculations are disabled until a milk price is set.')}</p>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold shadow">{t('Configure Price', 'Configure Price')}</button>
           </div>
        </div>
      )}

      {/* 1. Top Farm Feed Intelligence Summary */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4 md:mb-0">
            <FaChartPie className="mr-3 text-green-600" />
            {t('Feed Intelligence & Optimization', 'Feed Intelligence & Optimization')}
          </h2>
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm">
             <FaCog className="mr-2 text-gray-500" />
             {t('Farm Settings', 'Farm Settings')}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
             <span className="absolute top-2 right-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">ESTIMATED</span>
            <span className="text-sm text-gray-500 font-medium text-center">{t('Today\'s Feed Cost', 'Today\'s Feed Cost')}</span>
            <span className="text-2xl font-bold text-gray-800">{Object.keys(todaysRequirement).length === 0 ? <span className="text-sm text-gray-400 font-normal">{t('Not Available', 'Not Available')}</span> : `₹${(kpi.totalDailyCost || 0).toLocaleString('en-IN')}`}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
             <span className="absolute top-2 right-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">ESTIMATED</span>
            <span className="text-sm text-gray-500 font-medium text-center">{t('Feed Cost / Litre', 'Feed Cost / Litre')}</span>
            <span className="text-2xl font-bold text-gray-800">{avgCostPerLitre !== 'N/A' ? `₹${avgCostPerLitre}` : t('Not Available', 'Not Available')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
             <span className="absolute top-2 right-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">ACTUAL</span>
            <span className="text-sm text-gray-500 font-medium text-center">{t('Feed Inventory Value', 'Feed Inventory Value')}</span>
            <span className="text-2xl font-bold text-gray-800">₹{Math.round(kpi.inventoryValue || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
             <span className="absolute top-2 right-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">PREDICTED</span>
            <span className="text-sm text-gray-500 font-medium text-center">{t('Feed Security Score', 'Feed Security Score')}</span>
            <div className="flex items-center gap-2">
               <span className="text-2xl font-bold text-gray-800">{Math.round(kpi.feedSecurityScore || 0)}/100</span>
               <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${security.color}`}>{t(security.label, security.label)}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
             <span className="absolute top-2 right-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">ACTUAL</span>
            <span className="text-sm text-gray-500 font-medium text-center">{t('Requires Special Feeding', 'Requires Special Feeding')}</span>
            <span className="text-2xl font-bold text-red-600">{kpi.specialCare || 0}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
             <span className="absolute top-2 right-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">PREDICTED</span>
            <span className="text-sm text-gray-500 font-medium text-center">{t('Reorder Alerts', 'Reorder Alerts')}</span>
            <span className="text-2xl font-bold text-orange-600">{(inventoryPredictions || []).filter(i => i.urgency > 1).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Feed Breakdown & Alerts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Today's Feed Requirement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                 <h3 className="text-lg font-bold text-gray-800 flex items-center">
                   <FaLeaf className="mr-2 text-green-600"/> {t('Today\'s Feed Requirement', 'Today\'s Feed Requirement')}
                 </h3>
                 <p className="text-sm text-gray-500 mt-1">{t('Calculated dynamically based on active herd profiles.', 'Calculated dynamically based on active herd profiles.')}</p>
              </div>
              <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">PREDICTED</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-4 font-bold">{t('Feed Type', 'Feed Type')}</th>
                    <th className="p-4">{t('Required Today', 'Required Today')}</th>
                    <th className="p-4">{t('Current Stock', 'Current Stock')}</th>
                    <th className="p-4">{t('Days Remaining', 'Days Remaining')}</th>
                    <th className="p-4">{t('Status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.keys(todaysRequirement).length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">{t('Feed configuration required', 'Feed configuration required')}</td></tr>
                  ) : (
                    Object.keys(todaysRequirement).map(feedType => {
                       const inv = inventoryPredictions.find(i => i.feedStock.feedType === feedType);
                       return (
                         <tr key={feedType} className="hover:bg-gray-50">
                           <td className="p-4 font-bold text-gray-800">{t(feedType, feedType)}</td>
                           <td className="p-4 text-green-700 font-bold">{(todaysRequirement[feedType].total || 0).toFixed(1)} {inv?.feedStock.unit || 'kg'}</td>
                           <td className="p-4 text-gray-600">{inv ? `${inv.feedStock.quantity} ${inv.feedStock.unit}` : 'N/A'}</td>
                           <td className="p-4 text-gray-600">{inv ? (inv.daysRemaining === 'N/A' ? 'N/A' : `${inv.daysRemaining} days`) : 'N/A'}</td>
                           <td className="p-4">
                              {inv && <span className={`text-xs px-2 py-1 rounded font-bold ${inv.urgency > 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{t(inv.status, inv.status)}</span>}
                           </td>
                         </tr>
                       )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suggested Feed Plans */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-100 bg-gray-50">
                 <h3 className="text-lg font-bold text-gray-800 flex items-center mb-2">
                   <FaCow className="mr-2 text-indigo-500"/> {t('Suggested Feed Plans', 'Suggested Feed Plans')}
                 </h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                     {['ALL', 'CALF', 'GROWING HEIFER', 'ADULT NON-LACTATING', 'PREGNANT', 'LACTATING', 'PREGNANT + LACTATING', 'DRY COW', 'SPECIAL CARE', 'BULL'].map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${filterCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {t(cat, cat)}
                       </button>
                    ))}
                 </div>
                 <div className="mt-3 relative">
                    <input 
                      type="text" 
                      placeholder={t('Search Tag ID...', 'Search Tag ID...')}
                      value={searchCow}
                      onChange={(e) => setSearchCow(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                 </div>
             </div>
             <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                 {filteredCows.map(profile => (
                    <div 
                       key={profile.cow._id} 
                       className={`border rounded-lg p-4 cursor-pointer transition bg-white ${profile.anomaly ? 'border-orange-300 shadow-md ring-1 ring-orange-200' : 'hover:shadow-md'}`}
                       onClick={() => setSelectedCowProfile(profile)}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg">{profile.cow.tagId}</h4>
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-bold">{t(profile.analysis.profile, profile.analysis.profile)}</span>
                       </div>
                       
                       {profile.anomaly && (
                          <div className="mb-3 bg-orange-50 border-l-2 border-orange-500 p-2 text-xs">
                             <div className="font-bold text-orange-800 flex items-center"><FaExclamationTriangle className="mr-1"/> {t('Feed Cost Anomaly', 'Feed Cost Anomaly')}</div>
                             <div className="text-orange-700 mt-1">{t('Cost increased by', 'Cost increased by')} {profile.anomaly.percentageChange}% {t('compared to 7-day average', 'compared to 7-day average')}.</div>
                          </div>
                       )}

                       <div className="text-sm text-gray-600 mb-2 space-y-1">
                          {profile.analysis.isLactating && <div className="flex justify-between"><span>{t('Milk', 'Milk')}:</span> <span>{profile.analysis.milkYield !== null ? `${profile.analysis.milkYield.toFixed(1)} L/day` : <span className="text-gray-400 italic text-xs">{t('N/A', 'N/A')}</span>}</span></div>}
                          {profile.analysis.pregnancyStage && <div className="flex justify-between"><span>{t('Pregnancy', 'Pregnancy')}:</span> <span>{t(profile.analysis.pregnancyStage, profile.analysis.pregnancyStage)}</span></div>}
                       </div>

                       <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-bold text-gray-500 mb-2">{t('Recommended Feed', 'Recommended Feed')}</div>
                          {profile.feedPlan.length === 0 ? (
                             <div className="text-sm text-red-500 italic">{t('Feed plan not available', 'Feed plan not available')}</div>
                          ) : (
                             profile.feedPlan.map((fp, i) => (
                                <div key={i} className="flex justify-between text-sm mb-1">
                                   <span>{t(fp.feedType, fp.feedType)} {fp.reviewRequired && <span className="text-red-500 ml-1" title={fp.reviewReason}>⚠️</span>}</span>
                                   <span className="font-medium">{fp.suggestedQuantityKg} kg</span>
                                </div>
                             ))
                          )}
                       </div>

                       <div className="mt-3 pt-3 border-t flex justify-between items-end">
                          <div>
                             <div className="text-xs text-gray-500">{t('Daily Cost', 'Daily Cost')} <span className="text-[9px] bg-gray-200 px-1 rounded ml-1">EST</span></div>
                             <div className="font-bold text-indigo-700">{profile.feedPlan.length > 0 ? `₹${(profile.metrics.dailyFeedCost || 0).toFixed(2)}` : t('N/A', 'N/A')}</div>
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] text-gray-500">{t('Confidence', 'Confidence')}</div>
                             <div className={`text-xs font-bold px-2 py-0.5 rounded ${profile.analysis.confidence === 'HIGH' ? 'bg-green-100 text-green-700' : profile.analysis.confidence === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {profile.analysis.confidenceScore}% {t(profile.analysis.confidence, profile.analysis.confidence)}
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
           {/* Smart Reorder Alerts */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-800 flex items-center">
                 <FaShoppingCart className="mr-2 text-blue-500"/> {t('Feed Procurement Alerts', 'Feed Procurement Alerts')}
               </h3>
               <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">PREDICTED</span>
             </div>
             <div className="p-4 space-y-4">
               {inventoryPredictions.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-4">{t('Inventory data is currently unavailable.', 'Inventory data is currently unavailable.')}</div>
               ) : inventoryPredictions.filter(i => i.urgency > 1).length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-4">{t('Inventory is currently sufficient. No alerts at this time.', 'Inventory is currently sufficient. No alerts at this time.')}</div>
               ) : (
                  inventoryPredictions.filter(i => i.urgency > 1).map((inv, idx) => (
                     <div key={idx} className={`border rounded p-3 ${inv.urgency === 3 ? 'border-red-300 bg-red-50' : 'border-orange-300 bg-orange-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                           <span className={`text-xs font-bold px-2 py-1 rounded ${inv.urgency === 3 ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                              {inv.urgency === 3 ? t('CRITICAL', 'CRITICAL') : t('HIGH', 'HIGH')}
                           </span>
                           <span className="font-bold text-sm text-gray-700">{t(inv.feedStock.feedType, inv.feedStock.feedType)}</span>
                        </div>
                        <div className="text-sm mb-1 text-gray-800">
                           {t('Expected stock-out', 'Expected stock-out')}: <span className="font-medium">{inv.stockOutDate && inv.stockOutDate !== 'Lead time not configured' ? new Date(inv.stockOutDate).toLocaleDateString() : t('N/A', 'N/A')}</span>
                        </div>
                        <div className="text-sm mb-2 text-gray-800">
                           {t('Recommended order', 'Recommended order')}: <span className="font-bold">{inv.recommendedPurchaseQty} {inv.feedStock.unit}</span>
                        </div>
                        <div className="text-xs text-gray-600 italic">
                           {t('Reason: Current inventory is below projected lead-time demand.', 'Reason: Current inventory is below projected lead-time demand.')}
                        </div>
                     </div>
                  ))
               )}
             </div>
           </div>

           {/* Feed Efficiency Trend */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-800 flex items-center">
                 <FaChartLine className="mr-2 text-green-500"/> {t('Feed Efficiency Trend', 'Feed Efficiency Trend')}
               </h3>
               <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">ACTUAL</span>
             </div>
             <div className="p-5">
               {efficiencyTrend && efficiencyTrend.status === 'AVAILABLE' ? (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                       <span className="text-sm text-gray-600">{t('Trend', 'Trend')}</span>
                       <span className={`text-xs font-bold px-2 py-1 rounded ${efficiencyTrend.trend === 'IMPROVING' ? 'bg-green-100 text-green-700' : efficiencyTrend.trend === 'DECLINING' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                         {t(efficiencyTrend.trend, efficiencyTrend.trend)}
                       </span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                       <span className="text-sm text-gray-600">{t('Prev 7 Days Cost/Litre', 'Prev 7 Days Cost/Litre')}</span>
                       <span className="font-bold text-sm text-gray-800">₹{efficiencyTrend.prev7CostPerLitre}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                       <span className="text-sm text-gray-600">{t('Cur 7 Days Cost/Litre', 'Cur 7 Days Cost/Litre')}</span>
                       <span className="font-bold text-sm text-gray-800">₹{efficiencyTrend.cur7CostPerLitre}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">{t('Change', 'Change')}</span>
                       <span className={`font-bold text-sm ${efficiencyTrend.changePercentage < 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {efficiencyTrend.changePercentage > 0 ? '+' : ''}{efficiencyTrend.changePercentage}%
                       </span>
                    </div>
                 </div>
               ) : (
                 <div className="text-sm text-gray-500 text-center py-4 uppercase font-bold">{t('Trend data not yet available', 'Trend data not yet available')}</div>
               )}
             </div>
           </div>

           {/* Cost Intelligence */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-800 flex items-center">
                 <FaRupeeSign className="mr-2 text-indigo-500"/> {t('Farm Feed Cost', 'Farm Feed Cost')}
               </h3>
               <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">PREDICTED</span>
             </div>
             <div className="p-5 space-y-4 text-sm text-gray-700">
                <div className="flex justify-between border-b pb-2">
                   <span>{t('Total Daily Feed Cost', 'Total Daily Feed Cost')}</span>
                   <span className="font-bold">{Object.keys(todaysRequirement).length === 0 ? <span className="text-sm text-gray-400 font-normal">{t('Not Available', 'Not Available')}</span> : `₹${(kpi.totalDailyCost || 0).toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                   <span>{t('7-Day Feed Cost', '7-Day Feed Cost')}</span>
                   <span className="font-bold">{Object.keys(todaysRequirement).length === 0 ? <span className="text-sm text-gray-400 font-normal">{t('Not Available', 'Not Available')}</span> : `₹${((kpi.totalDailyCost || 0) * 7).toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                   <span>{t('30-Day Feed Cost', '30-Day Feed Cost')}</span>
                   <span className="font-bold">{Object.keys(todaysRequirement).length === 0 ? <span className="text-sm text-gray-400 font-normal">{t('Not Available', 'Not Available')}</span> : `₹${((kpi.totalDailyCost || 0) * 30).toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between">
                   <span>{t('Feed Cost / Litre', 'Feed Cost / Litre')}</span>
                   <span className="font-bold">{avgCostPerLitre !== 'N/A' ? `₹${avgCostPerLitre}` : t('Not Available', 'Not Available')}</span>
                </div>
             </div>
           </div>

        </div>
      </div>
      
      {/* Feed Inventory Section */}
      <FeedInventory 
        inventoryPredictions={inventoryPredictions} 
        inventoryValue={kpi.inventoryValue}
        onRefresh={fetchDashboardData}
      />

      {selectedCowProfile && (
        <FeedProfileModal 
           profile={selectedCowProfile} 
           onClose={() => setSelectedCowProfile(null)}
           onOverrideSaved={fetchDashboardData}
           milkPriceStatus={milkPriceStatus}
           inventoryPredictions={inventoryPredictions}
        />
      )}
      
      <FarmSettingsModal 
         isOpen={isSettingsOpen} 
         onClose={() => setIsSettingsOpen(false)} 
         onSaved={fetchDashboardData} 
      />
    </div>
    </div>
  );
};

export default FeedOptimizationDashboard;
