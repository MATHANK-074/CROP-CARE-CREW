import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaLeaf, FaExclamationTriangle, FaChartBar, FaSearch, 
  FaCalendarAlt, FaShoppingCart, FaChartPie, FaPaw as FaCow, FaBoxOpen
} from 'react-icons/fa';

import FeedInventoryModal from './FeedInventoryModal';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const FeedOptimizationDashboard = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchCow, setSearchCow] = useState('');
  const [selectedCowProfile, setSelectedCowProfile] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

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

  const { kpi, todaysRequirement, inventoryPredictions, cowProfiles } = data;

  const filteredCows = cowProfiles.filter(c => c.cow.tagId.toLowerCase().includes(searchCow.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* 1. Header & KPIs */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4 md:mb-0">
            <FaChartPie className="mr-3 text-green-600" />
            {t('feed_optimization.title', 'AI-Based Personalized Cattle Feed Optimization & Inventory Prediction')}
          </h2>
          <button 
            onClick={() => setShowInventoryModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow hover:bg-green-700 transition flex-shrink-0"
          >
            <FaBoxOpen className="mr-2" /> {t('feed_optimization.manage_inventory', 'Manage Inventory')}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500 font-medium">{t('feed_optimization.kpi_total_cows', 'Total Cows')}</span>
            <span className="text-3xl font-bold text-gray-800">{kpi.totalCows}</span>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-100 flex flex-col items-center justify-center">
            <span className="text-sm text-purple-700 font-medium">{t('feed_optimization.kpi_pregnant', 'Pregnant')}</span>
            <span className="text-3xl font-bold text-purple-800">{kpi.pregnant}</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center justify-center">
            <span className="text-sm text-blue-700 font-medium">{t('feed_optimization.kpi_lactating', 'Lactating')}</span>
            <span className="text-3xl font-bold text-blue-800">{kpi.lactating}</span>
          </div>
          <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 flex flex-col items-center justify-center">
            <span className="text-sm text-red-700 font-medium">{t('feed_optimization.kpi_special_care', 'Special Care')}</span>
            <span className="text-3xl font-bold text-red-800">{kpi.specialCare}</span>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center justify-center">
            <span className="text-sm text-green-700 font-medium">{t('feed_optimization.kpi_tracked_feeds', 'Tracked Feeds')}</span>
            <span className="text-3xl font-bold text-green-800">{inventoryPredictions.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Feed Matrix & Restock Alerts */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Today's Requirement Matrix */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <FaLeaf className="mr-2 text-green-600"/> {t('feed_optimization.matrix_title', "Today's Feed Requirement")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{t('feed_optimization.matrix_subtitle', 'Calculated dynamically based on active cow profiles.')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-4 font-bold">{t('feed_optimization.table_feed_type', 'Feed Type')}</th>
                    <th className="p-4">{t('feed_optimization.table_normal', 'Normal Cows')}</th>
                    <th className="p-4 text-purple-600">{t('feed_optimization.table_pregnant', 'Pregnant Cows')}</th>
                    <th className="p-4 text-blue-600">{t('feed_optimization.table_lactating', 'Lactating Cows')}</th>
                    <th className="p-4 text-red-600">{t('feed_optimization.table_special', 'Special Care')}</th>
                    <th className="p-4 font-bold text-gray-800">{t('feed_optimization.table_total', 'TOTAL (kg)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.keys(todaysRequirement).length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">{t('feed_optimization.no_rules', 'No feed rules configured.')}</td></tr>
                  ) : (
                    Object.keys(todaysRequirement).map(feedType => (
                      <tr key={feedType} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-800">{t(`feed_optimization.feed_${feedType.replace(/\s+/g, '_').toLowerCase()}`, feedType)}</td>
                        <td className="p-4 text-gray-600">{todaysRequirement[feedType]['Normal']?.toFixed(1) || '0.0'}</td>
                        <td className="p-4 font-medium text-purple-700">{todaysRequirement[feedType]['Pregnant']?.toFixed(1) || '0.0'}</td>
                        <td className="p-4 font-medium text-blue-700">{todaysRequirement[feedType]['Lactating']?.toFixed(1) || '0.0'}</td>
                        <td className="p-4 font-medium text-red-700">{todaysRequirement[feedType]['Special-Care']?.toFixed(1) || '0.0'}</td>
                        <td className="p-4 font-bold text-green-600 text-lg bg-green-50">{todaysRequirement[feedType].total.toFixed(1)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Predictive Inventory & Alerts */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FaShoppingCart className="mr-2 text-blue-500"/> {t('feed_optimization.predictions_title', 'Automatic Reorder Predictions')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryPredictions.length === 0 ? (
                <div className="col-span-2 text-gray-500 p-4 border rounded-xl bg-white text-center">{t('feed_optimization.no_inventory', 'No inventory tracked.')}</div>
              ) : (
                inventoryPredictions.map((inv, idx) => {
                  let bgClass = 'bg-white border-gray-200';
                  let statusColor = 'text-green-600';
                  
                  if (inv.urgency === 3) { bgClass = 'bg-red-50 border-red-200'; statusColor = 'text-red-700'; }
                  else if (inv.urgency === 2) { bgClass = 'bg-orange-50 border-orange-200'; statusColor = 'text-orange-700'; }
                  else if (inv.urgency === 1) { bgClass = 'bg-yellow-50 border-yellow-200'; statusColor = 'text-yellow-700'; }

                  return (
                    <div key={idx} className={`${bgClass} rounded-xl shadow-sm border p-5`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">{inv.feedStock.feedName}</h4>
                          <div className="text-sm text-gray-500">{t('feed_optimization.current_stock', 'Current Stock')}: {inv.feedStock.quantity} {inv.feedStock.unit}</div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold border ${inv.urgency > 1 ? 'border-red-200 bg-white' : 'border-gray-200 bg-white'} ${statusColor}`}>
                          {t(`feed_optimization.status_${inv.urgency}`, inv.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div className="bg-white bg-opacity-60 p-2 rounded">
                          <span className="block text-gray-500 text-xs">{t('feed_optimization.daily_burn', 'Daily Burn')}</span>
                          <span className="font-bold">{inv.dailyConsumption} {inv.feedStock.unit}/day</span>
                        </div>
                        <div className="bg-white bg-opacity-60 p-2 rounded">
                          <span className="block text-gray-500 text-xs">{t('feed_optimization.remaining', 'Remaining')}</span>
                          <span className="font-bold">{inv.daysRemaining} {t('feed_optimization.days', 'Days')}</span>
                        </div>
                      </div>

                      {inv.urgency > 1 && (
                        <div className="mt-3 pt-3 border-t border-red-200 border-opacity-50">
                          <div className="flex items-center text-red-700 text-sm font-bold mb-1">
                            <FaExclamationTriangle className="mr-1"/> {t('feed_optimization.action_required', 'ACTION REQUIRED')}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{t('feed_optimization.stockout_predicted', 'Stock-out predicted by')} {new Date(inv.stockOutDate).toLocaleDateString()}.</p>
                          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
                            {t('feed_optimization.order_now', 'Order {{qty}} {{unit}} Now', { qty: inv.recommendedPurchaseQty, unit: inv.feedStock.unit })}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Cow-Wise Feed Recommendation */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <FaCow className="mr-2 text-indigo-500"/> {t('feed_optimization.profiler_title', 'Cow-Wise Profiler')}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{t('feed_optimization.profiler_subtitle', 'Check individual AI feed allocations.')}</p>
              <div className="mt-4 relative">
                <input 
                  type="text" 
                  placeholder={t('feed_optimization.search_ph', 'Search Tag ID...')}
                  value={searchCow}
                  onChange={(e) => setSearchCow(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div className="p-0 overflow-y-auto max-h-[600px] flex-1">
              <ul className="divide-y divide-gray-100">
                {filteredCows.map((profile, idx) => {
                  
                  let badgeColor = 'bg-gray-100 text-gray-700';
                  if(profile.analysis.priority === 'High Priority') badgeColor = 'bg-red-100 text-red-700';
                  else if(profile.analysis.priority === 'Attention') badgeColor = 'bg-orange-100 text-orange-700';

                  return (
                    <li 
                      key={idx} 
                      className={`p-4 hover:bg-indigo-50 cursor-pointer transition ${selectedCowProfile?.cow._id === profile.cow._id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                      onClick={() => setSelectedCowProfile(profile)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-800">{t('feed_optimization.cow', 'Cow')} {profile.cow.tagId}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeColor}`}>
                          {t(`feed_optimization.cat_${profile.analysis.category.replace(/[^a-zA-Z]/g, '')}`, profile.analysis.category)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2 truncate">
                        {t(`feed_optimization.rec_${profile.analysis.recommendedAction.replace(/[^a-zA-Z]/g, '')}`, profile.analysis.recommendedAction)}
                      </div>
                      
                      {/* Show feed breakdown if selected */}
                      {selectedCowProfile?.cow._id === profile.cow._id && (
                        <div className="mt-3 pt-3 border-t border-indigo-100 animate-fade-in">
                          <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">{t('feed_optimization.today_allocation', "Today's Allocation")}</h4>
                          <div className="space-y-1 bg-white p-3 rounded border border-indigo-100 shadow-inner">
                            {profile.dailyFeed.length === 0 ? (
                              <div className="text-xs text-gray-500">{t('feed_optimization.no_rules', 'No feed rules apply.')}</div>
                            ) : (
                              profile.dailyFeed.map((fd, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{fd.feedType}</span>
                                  <span className="font-bold text-gray-800">{fd.kgRequired} kg</span>
                                </div>
                              ))
                            )}
                          </div>
                          
                          {/* Why this allocation? Box */}
                          <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-600 mb-1">{t('feed_optimization.ai_reasoning', 'AI Reasoning')}</h4>
                            <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                              {profile.analysis.category === 'Pregnant' && <li>{t('feed_optimization.reason_pregnant', 'Late pregnancy stage (+multiplier)')}</li>}
                              {profile.analysis.category.includes('Lactating') && <li>{t('feed_optimization.reason_milk', 'Milk Yield: {{yield}} L/day (+multiplier)', { yield: profile.cow.dailyMilkYield })}</li>}
                              <li>{t('feed_optimization.reason_base', 'Base maintenance requirement')}</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showInventoryModal && (
        <FeedInventoryModal 
          onClose={() => setShowInventoryModal(false)} 
          onUpdate={fetchDashboardData} 
        />
      )}
    </div>
  );
};

export default FeedOptimizationDashboard;
