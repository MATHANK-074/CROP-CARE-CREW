import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaChartPie, FaRupeeSign, FaArrowUp, FaArrowDown, 
  FaExclamationTriangle, FaCheckCircle, FaSearch, FaEye, FaStethoscope, FaBrain, FaListOl, FaExclamationCircle, FaInfoCircle
} from 'react-icons/fa';
import AnimalProfileModal from './AnimalProfileModal';

const buildApiUrl = (path) => {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;
};

const FarmAssetDashboard = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRec, setFilterRec] = useState('ALL');
  
  const [selectedAnimalProfile, setSelectedAnimalProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/livestock/asset-dashboard'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching asset dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  if (!data) return <div className="text-center text-gray-500 py-8">Failed to load asset data.</div>;

  const { portfolio, animalAssets, farmForecast, intelligenceSummary, priorityActions, productionLossPredictions } = data;

  const filteredAssets = animalAssets.filter(asset => {
    if (searchQuery && !asset.animal.tagId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterRec !== 'ALL') {
      let assetRec = asset.metrics.recommendation;
      if (assetRec === 'CONSIDER SALE') assetRec = 'LIFECYCLE REVIEW';
      if (assetRec !== filterRec) return false;
    }
    return true;
  });

  const getRecColor = (rec) => {
    switch(rec) {
      case 'RETAIN': return 'bg-green-100 text-green-700 border-green-200';
      case 'MONITOR': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LIFECYCLE REVIEW':
      case 'CONSIDER SALE': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'VETERINARY REVIEW': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSeverityColor = (sev) => {
    if (sev === 'Critical') return 'bg-red-100 text-red-800 border-red-200';
    if (sev === 'High' || sev === 'Warning') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (sev === 'Medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const getHeatmapColor = (score, max, inverse = false) => {
     let ratio = score / max;
     if (inverse) ratio = 1 - ratio;
     if (ratio < 0.33) return 'bg-green-400';
     if (ratio < 0.66) return 'bg-yellow-400';
     if (ratio < 0.85) return 'bg-orange-400';
     return 'bg-red-500';
  };

  const getRiskLevelText = (score) => {
      if (score <= 20) return 'LOW';
      if (score <= 40) return 'MODERATE';
      if (score <= 60) return 'ELEVATED';
      if (score <= 80) return 'HIGH';
      return 'CRITICAL';
  };

  const { retain, monitor, lifecycleReview, vetReview } = portfolio.distribution || {};
  const hasActionsToday = priorityActions && priorityActions.length > 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* DECISION DISTRIBUTION */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <span className="font-bold text-gray-800 mr-2">{portfolio.totalAnimals} {t('Animals', 'Animals')}</span>
        <div className="flex space-x-2 text-sm font-bold">
           <span className="px-3 py-1 rounded bg-green-100 text-green-700 border border-green-200">🟢 {t('RETAIN', 'RETAIN')} — {retain || 0}</span>
           <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">🟡 {t('MONITOR', 'MONITOR')} — {monitor || 0}</span>
           {(lifecycleReview > 0) && <span className="px-3 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200">🟠 {t('LIFECYCLE REVIEW', 'LIFECYCLE REVIEW')} — {lifecycleReview}</span>}
           <span className="px-3 py-1 rounded bg-red-100 text-red-700 border border-red-200">🔴 {t('VETERINARY REVIEW', 'VETERINARY REVIEW')} — {vetReview || 0}</span>
        </div>
      </div>

      {/* FARM INTELLIGENCE SUMMARY */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
           <FaBrain size={200} />
        </div>
        <h2 className="text-xl font-bold mb-3 flex items-center relative z-10 uppercase tracking-wider text-indigo-200 text-sm">{t('Farm Intelligence', 'Farm Intelligence')}</h2>
        <div className="text-indigo-50 text-lg leading-relaxed relative z-10 font-medium">
          {intelligenceSummary && (
             <>
               {portfolio.netProfit > 0 ? t('Your farm is currently operating profitably.', 'Your farm is currently operating profitably.') : t('Your farm is currently operating at a loss.', 'Your farm is currently operating at a loss.')}<br/><br/>
               {intelligenceSummary.includes('declining') ? t('Milk production is declining due to upcoming dry-offs.', 'Milk production is declining due to upcoming dry-offs.') : t('Milk production is stable across the herd.', 'Milk production is stable across the herd.')}<br/>
               {(portfolio.distribution?.monitor || 0) > 0 ? t('{{count}} animal(s) require monitoring.', { count: portfolio.distribution.monitor }) : t('No animals require monitoring.', 'No animals require monitoring.')}<br/>
               {(portfolio.distribution?.vetReview || 0) > 0 ? t('{{count}} critical veterinary alerts are currently active.', { count: portfolio.distribution.vetReview }) : t('No critical veterinary alerts are currently active.', 'No critical veterinary alerts are currently active.')}<br/><br/>
               {t('Estimated 30-day net profit:', 'Estimated 30-day net profit:')}<br/>
               ₹{Math.round(portfolio.netProfit || 0).toLocaleString('en-IN')}
             </>
          )}
        </div>
      </div>

      {/* TODAY'S ACTIONS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50 p-4 border-b flex items-center">
           <FaListOl className="text-blue-600 mr-2" />
           <h3 className="font-bold text-blue-900">{t("TODAY'S FARM ACTIONS", "TODAY'S FARM ACTIONS")}</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
           {hasActionsToday ? priorityActions.map((action, idx) => (
              <div key={idx} className={`p-3 rounded-lg border flex flex-col ${getSeverityColor(action.severity)}`}>
                 <div className="flex justify-between items-start mb-1">
                    <span className="font-bold">{action.severity === 'Critical' ? '🔴' : (action.severity === 'Warning' || action.severity === 'High' ? '🟠' : '🟡')} {action.animal}</span>
                    <span className="text-xs uppercase font-bold px-2 py-1 bg-white bg-opacity-50 rounded">{t(action.action, action.action)}</span>
                 </div>
                 <span className="text-sm opacity-90">{t(action.message, action.message)}</span>
              </div>
           )) : (
              <div className="col-span-1 md:col-span-2 text-center text-green-600 font-bold py-4 flex items-center justify-center bg-green-50 rounded-lg">
                 <FaCheckCircle className="mr-2" /> ✓ {t('No critical actions today', 'No critical actions today')}
              </div>
           )}
        </div>
      </div>

      {/* FARM PROFIT FORECAST & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* KPI Section */}
         <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-1 gap-2">
                 <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{t('Total Asset Value', 'Total Asset Value')}</p>
                 <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{t('Estimated', 'Estimated')}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{formatCurrency(portfolio.totalAssetValue)}</h3>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-1 gap-2">
                 <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{t('Past 30D Revenue', 'Past 30D Revenue')}</p>
                 <span className="bg-green-50 text-green-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{t('Actual', 'Actual')}</span>
              </div>
              <h3 className="text-xl font-bold text-green-600">{formatCurrency(portfolio.monthlyRevenue)}</h3>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-1 gap-2">
                 <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{t('Past 30D Expense', 'Past 30D Expense')}</p>
                 <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{portfolio.financialKPIs?.usedDefaultMedical ? t('Estimated', 'Estimated') : t('Actual', 'Actual')}</span>
              </div>
              <h3 className="text-xl font-bold text-red-500">{formatCurrency(portfolio.monthlyExpenses)}</h3>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                 <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{t('Net Profit', 'Net Profit')}</p>
                 <h3 className="text-xl font-bold text-blue-600">{formatCurrency(portfolio.netProfit)}</h3>
              </div>
              {portfolio.financialKPIs?.profitChangePct !== null ? (
                 <p className={`text-[10px] font-bold mt-1 ${portfolio.financialKPIs.profitChangePct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolio.financialKPIs.profitChangePct >= 0 ? '+' : ''}{(portfolio.financialKPIs.profitChangePct || 0).toFixed(1)}% {t('vs previous 30 days', 'vs previous 30 days')}
                 </p>
              ) : (
                 <p className="text-[9px] text-gray-400 mt-1">{t('Insufficient historical data', 'Insufficient historical data')}</p>
              )}
            </div>
         </div>
         {/* Forecast Section */}
         <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center">{t('Profit Forecast', 'Profit Forecast')} <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('PREDICTED', 'PREDICTED')}</span></h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center border-b pb-2">
                 <span className="text-gray-600 text-sm">{t('Next 7 Days', 'Next 7 Days')}</span>
                 <span className="font-bold text-gray-800">{formatCurrency(farmForecast?.days7?.profit || 0)}</span>
               </div>
               <div className="flex justify-between items-center border-b pb-2">
                 <span className="text-gray-600 text-sm">{t('Next 30 Days', 'Next 30 Days')}</span>
                 <span className="font-bold text-gray-800">{formatCurrency(farmForecast?.days30?.profit || 0)}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-600 text-sm">{t('Next 90 Days', 'Next 90 Days')}</span>
                 <span className="font-bold text-gray-800">{formatCurrency(farmForecast?.days90?.profit || 0)}</span>
               </div>
            </div>
         </div>
         
         {/* Productivity Metrics */}
         <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div className="bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100 group relative">
               <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center">{t('Cost Per Litre', 'Cost Per Litre')} <FaInfoCircle className="ml-1 opacity-50" title={`Total Operating Cost: ${formatCurrency(portfolio.monthlyExpenses)}\nMilk Produced: ${Math.round(portfolio.financialKPIs?.total30DayMilkVolume || 0)} L\nData Period: Last 30 Days`} /></p>
               <h3 className="text-xl font-bold text-indigo-900">{formatCurrency(portfolio.financialKPIs?.costPerLitre || 0)}<span className="text-sm font-normal">/L</span></h3>
               <p className="text-[9px] text-indigo-400 mt-1">{t('Based on last 30 days', 'Based on last 30 days')}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100">
               <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-1">{t('Est. Margin', 'Est. Margin')}</p>
               <h3 className={`text-xl font-bold ${(portfolio.financialKPIs?.estimatedMargin || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(portfolio.financialKPIs?.estimatedMargin || 0) > 0 ? '+' : ''}{formatCurrency(portfolio.financialKPIs?.estimatedMargin || 0)}<span className="text-sm font-normal">/L</span>
               </h3>
               <p className="text-[9px] text-indigo-400 mt-1">{t('Selling price minus CPL', 'Selling price minus CPL')}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100">
               <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center">{t('Farm Break-Even Price', 'Farm Break-Even Price')} <FaInfoCircle className="ml-1 opacity-50" title="Minimum price required to cover operating cost" /></p>
               <h3 className="text-xl font-bold text-gray-800">{formatCurrency(portfolio.financialKPIs?.costPerLitre || 0)}<span className="text-sm font-normal">/L</span></h3>
               <p className="text-[9px] text-indigo-400 mt-1">{t('Min price to cover costs', 'Min price to cover costs')}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100">
               <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center">{t('Farm Break-Even Yield', 'Farm Break-Even Yield')} <FaInfoCircle className="ml-1 opacity-50" title="Total Operating Cost / Milk Selling Price / 30 Days" /></p>
               <h3 className="text-xl font-bold text-gray-800">{(portfolio.financialKPIs?.breakEvenDailyYield || 0).toFixed(1)} <span className="text-sm font-normal">L/day</span></h3>
               <p className="text-[9px] text-indigo-400 mt-1">{t('Farm-level daily req', 'Farm-level daily req')}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Loss Prediction */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:col-span-2">
          <div className="bg-gray-50 p-4 border-b flex items-center">
             <FaExclamationTriangle className="text-orange-500 mr-2" />
             <h3 className="font-bold text-gray-800">{t('Production Loss Prediction (30-Day)', 'Production Loss Prediction (30-Day)')}</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-80">
             {productionLossPredictions && productionLossPredictions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productionLossPredictions.map((loss, idx) => (
                    <div key={idx} className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => {
                        const asset = animalAssets.find(a => a.animal.tagId === loss.animal);
                        if (asset) { setSelectedAnimalProfile(asset); setShowProfileModal(true); }
                    }}>
                       <div className="flex justify-between mb-2 border-b pb-2">
                          <span className="font-bold text-blue-700 text-lg">{loss.animal}</span>
                          <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded">-{(loss.potentialLoss || 0).toFixed(1)} L {t('projected loss', 'projected loss')}</span>
                       </div>
                       <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{t('Estimated revenue impact:', 'Estimated revenue impact:')}</span>
                          <span className="font-bold text-gray-800">-{formatCurrency(loss.revenueImpact)}</span>
                       </div>
                       <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-bold text-gray-700">{t('Reason:', 'Reason:')}</span> {loss.reason}
                       </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center text-green-600 py-8 bg-green-50 rounded-lg">
                   <FaCheckCircle size={32} className="mb-3 opacity-50"/>
                   <span className="font-bold">✓ {t('No significant production losses predicted', 'No significant production losses predicted')}</span>
                   <span className="text-sm opacity-70 mt-1 text-gray-600">{t('Historical production is currently stable.', 'Historical production is currently stable.')}</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Farm Risk Heatmap */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-5">
         <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-gray-800 flex items-center"><FaExclamationCircle className="mr-2 text-gray-500"/> {t('Farm Risk Heatmap', 'Farm Risk Heatmap')}</h3>
            <div className="flex items-center space-x-3 text-[10px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
               <span className="uppercase text-xs mr-2">{t('Legend:', 'Legend:')}</span>
               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-400 mr-1"></span> {t('Good', 'Good')}</div>
               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span> {t('Monitor', 'Monitor')}</div>
               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-400 mr-1"></span> {t('Review', 'Review')}</div>
               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span> {t('High Risk', 'High Risk')}</div>
            </div>
         </div>
         <div className="overflow-x-auto">
            <div className="min-w-[800px]">
               <div className="grid grid-cols-7 gap-2 mb-2 text-[11px] font-bold text-gray-500 uppercase text-center border-b pb-2">
                  <div className="text-left">{t('Animal', 'Animal')}</div>
                  <div>{t('Health', 'Health')}</div>
                  <div>{t('Lifecycle', 'Lifecycle')}</div>
                  <div>{t('Production', 'Production')}</div>
                  <div>{t('Profitability', 'Profitability')}</div>
                  <div>{t('Overall Risk', 'Overall Risk')}</div>
                  <div>{t('Action', 'Action')}</div>
               </div>
               <div className="space-y-2">
                  {animalAssets.map(asset => {
                     const { animal, metrics: m } = asset;
                     let profitRisk = 0;
                     if (m.netContribution <= 0) profitRisk = 100;
                     else if (m.netContribution < 3000) profitRisk = 50;
                     else if (m.netContribution < 6000) profitRisk = 20;

                     const avgRisk = (m.healthRiskScore + m.lifecycleScore + m.milkForecast.declinePercent + profitRisk) / 4;
                     let displayRec = m.recommendation;
                     if (displayRec === 'CONSIDER SALE') displayRec = 'LIFECYCLE REVIEW'; // Frontend mapping

                     return (
                       <div key={animal._id} className="grid grid-cols-7 gap-2 items-center text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors" onClick={() => { setSelectedAnimalProfile(asset); setShowProfileModal(true); }}>
                          <div className="font-bold text-blue-700 text-left">{animal.tagId}</div>
                          <div className="flex justify-center"><div className={`w-full h-8 rounded flex items-center justify-center text-white text-[10px] font-bold tracking-wider ${getHeatmapColor(m.healthRiskScore, 100)}`} title={`Score: ${Math.round(m.healthRiskScore)}`}>{t(getRiskLevelText(m.healthRiskScore))}</div></div>
                          <div className="flex justify-center"><div className={`w-full h-8 rounded flex items-center justify-center text-white text-[10px] font-bold tracking-wider ${getHeatmapColor(m.lifecycleScore, 100)}`} title={`Score: ${Math.round(m.lifecycleScore)}`}>{t(getRiskLevelText(m.lifecycleScore))}</div></div>
                          <div className="flex justify-center"><div className={`w-full h-8 rounded flex items-center justify-center text-white text-[10px] font-bold tracking-wider ${getHeatmapColor(m.milkForecast.declinePercent, 100)}`} title={`Decline: ${Math.round(m.milkForecast.declinePercent)}%`}>{t(getRiskLevelText(m.milkForecast.declinePercent))}</div></div>
                          <div className="flex justify-center"><div className={`w-full h-8 rounded flex items-center justify-center text-white text-[10px] font-bold tracking-wider ${getHeatmapColor(profitRisk, 100)}`} title={`Net Contrib: ${m.netContribution}`}>{t(getRiskLevelText(profitRisk))}</div></div>
                          <div className="flex justify-center"><div className={`w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-[10px] flex-col ${getHeatmapColor(avgRisk, 100)}`}><span>{Math.round(avgRisk)}</span></div></div>
                          <div className="text-center">
                             <span className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase ${getRecColor(displayRec)}`}>{t(displayRec, displayRec)}</span>
                          </div>
                       </div>
                     )
                  })}
               </div>
            </div>
         </div>
      </div>

      {showProfileModal && selectedAnimalProfile && (
        <AnimalProfileModal 
          asset={selectedAnimalProfile} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}

    </div>
  );
};

export default FarmAssetDashboard;
