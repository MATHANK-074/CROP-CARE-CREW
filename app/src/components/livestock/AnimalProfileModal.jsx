import React, { useState } from 'react';
import { FaTimes, FaHeartbeat, FaLeaf, FaChartLine, FaInfoCircle, FaCheckCircle, FaMoneyBillWave, FaBalanceScale, FaDatabase } from 'react-icons/fa';

const AnimalProfileModal = ({ asset, onClose }) => {
  const { animal, metrics } = asset;
  const [showExplanation, setShowExplanation] = useState(null); // 'health' or 'lifecycle'
  const [keepTimeframe, setKeepTimeframe] = useState('12'); // '6' or '12'
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  React.useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/intelligence/animal/${animal._id}/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setHistory(json.timeline);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingHistory(false);
      }
    };
    if (animal && animal._id) {
      fetchHistory();
    }
  }, [animal]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const { isEstimatedValue, usedDefaultFeed, usedDefaultMedical, keepVsSell, dataConfidence, milkForecast } = metrics;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center z-10 relative">
            {animal.profile_img ? (
              <img src={animal.profile_img} alt={animal.tagId} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mr-4" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-2 border-white shadow-sm mr-4 text-2xl font-bold">
                {animal.tagId.substring(0, 2)}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black text-gray-800">{animal.tagId}</h2>
              <p className="text-gray-500 font-medium">{animal.category} • {animal.breed} • {(metrics.ageYears || 0).toFixed(1)} Years Old</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 z-10 relative">
             <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center"><FaDatabase className="mr-1"/> Data Confidence</span>
                <span className={`text-sm font-bold ${dataConfidence.confidence === 'High' ? 'text-green-600' : dataConfidence.confidence === 'Medium' ? 'text-yellow-600' : 'text-red-500'}`} title={dataConfidence.reason}>
                   {dataConfidence.score}% ({dataConfidence.confidence})
                </span>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
               <FaTimes size={20} />
             </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1 bg-gray-50 space-y-6">
          
          {/* Top Recommendation Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            metrics.recommendation === 'RETAIN' ? 'bg-green-100 border-green-200 text-green-800' :
            metrics.recommendation === 'MONITOR' ? 'bg-yellow-100 border-yellow-200 text-yellow-800' :
            metrics.recommendation === 'CONSIDER SALE' ? 'bg-orange-100 border-orange-200 text-orange-800' :
            'bg-red-100 border-red-200 text-red-800'
          }`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Decision Support Score</p>
              <h3 className="text-2xl font-black">{metrics.recommendation}</h3>
            </div>
            <div className="text-right flex space-x-6">
              <div>
                <p className="text-sm font-medium opacity-90 text-right">Performance Trend</p>
                <p className="text-xl font-bold">{metrics.trend}</p>
              </div>
              <div className="border-l border-black border-opacity-10 pl-6 hidden sm:block text-right">
                <p className="text-sm font-medium opacity-90">30-Day Avg</p>
                <p className="text-xl font-bold">{(metrics.thirtyDayAvgYield || 0).toFixed(1)} L/day</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Health & Lifecycle Scores */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Health Score */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Health Risk Score</h4>
                    <div className="flex items-end mt-1">
                      <span className={`text-4xl font-black ${metrics.riskLevel === 'LOW' ? 'text-green-500' : metrics.riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {Math.round(metrics.healthRiskScore)}
                      </span>
                      <span className="text-gray-400 ml-1 mb-1 font-medium">/ 100</span>
                    </div>
                  </div>
                  <button onClick={() => setShowExplanation(showExplanation === 'health' ? null : 'health')} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-full">
                    <FaInfoCircle />
                  </button>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full ${metrics.riskLevel === 'LOW' ? 'bg-green-500' : metrics.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: metrics.healthRiskScore + '%' }}></div>
                </div>
                <p className="text-xs text-gray-500 font-medium text-right">0 = Best, 100 = Critical</p>
                
                {showExplanation === 'health' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm animate-fade-in">
                    <h5 className="font-bold text-gray-700 mb-2">Why this score?</h5>
                    {metrics.healthReasons.length === 0 ? (
                      <p className="text-gray-600 flex items-center"><FaCheckCircle className="text-green-500 mr-2"/> Animal is healthy with no recent anomalies.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        {metrics.healthReasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Lifecycle Score */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Lifecycle / Sale Score</h4>
                    <div className="flex items-end mt-1">
                      <span className={`text-4xl font-black ${metrics.lifecycleScore < 35 ? 'text-green-500' : metrics.lifecycleScore < 60 ? 'text-yellow-500' : 'text-orange-500'}`}>
                        {Math.round(metrics.lifecycleScore)}
                      </span>
                      <span className="text-gray-400 ml-1 mb-1 font-medium">/ 100</span>
                    </div>
                  </div>
                  <button onClick={() => setShowExplanation(showExplanation === 'lifecycle' ? null : 'lifecycle')} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-full">
                    <FaInfoCircle />
                  </button>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full ${metrics.lifecycleScore < 35 ? 'bg-green-500' : metrics.lifecycleScore < 60 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: metrics.lifecycleScore + '%' }}></div>
                </div>
                
                {showExplanation === 'lifecycle' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm animate-fade-in">
                    <h5 className="font-bold text-gray-700 mb-2">Why this score?</h5>
                    {metrics.lifecycleReasons.length === 0 ? (
                      <p className="text-gray-600 flex items-center"><FaCheckCircle className="text-green-500 mr-2"/> Excellent productive and economic performance.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        {metrics.lifecycleReasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Middle Column: Milk Forecasting */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col lg:col-span-1 relative overflow-hidden">
               <h4 className="text-gray-800 font-bold mb-4 flex items-center"><FaChartLine className="mr-2 text-blue-500"/> Milk Yield Forecast</h4>
               
               <div className="flex-1 space-y-5">
                  <div className="flex justify-between items-end border-b pb-4">
                     <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Current 30-Day Avg</p>
                        <p className="text-2xl font-bold text-gray-800">{(milkForecast.current || 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">L/day</span></p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-[10px] text-blue-800 font-bold uppercase mb-1">7-Day Forecast</p>
                        <p className="text-xl font-bold text-blue-900">{(milkForecast.predicted7Day || 0).toFixed(1)} <span className="text-xs font-normal">L/day</span></p>
                     </div>
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-[10px] text-blue-800 font-bold uppercase mb-1">30-Day Forecast</p>
                        <p className="text-xl font-bold text-blue-900">{(milkForecast.predicted30Day || 0).toFixed(1)} <span className="text-xs font-normal">L/day</span></p>
                     </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <p className="text-xs font-bold text-gray-500 uppercase mb-1">Forecast Reasoning</p>
                     <p className="text-sm text-gray-700 italic">"{milkForecast.reason}"</p>
                     <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="text-gray-500">Expected 30-Day Decline:</span>
                        <span className={`font-bold ${milkForecast.declinePercent > 15 ? 'text-red-500' : 'text-green-500'}`}>{(milkForecast.declinePercent || 0).toFixed(1)}%</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Keep vs Sell Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col lg:col-span-1">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-gray-800 font-bold flex items-center"><FaBalanceScale className="mr-2 text-indigo-600"/> Keep vs Sell</h4>
                 <div className="bg-gray-100 rounded px-2 py-1 text-xs font-bold text-gray-600">12 MONTHS</div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                  <h5 className="font-bold text-indigo-900 mb-2 uppercase text-[10px] tracking-wider">KEEP: 12-Month Economics</h5>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Expected Milk Revenue</span>
                    <span className="font-medium text-gray-800">{formatCurrency(keepVsSell.est12MonthRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Est. Feed {usedDefaultFeed && <span className="text-[8px] text-gray-400 italic">(Default)</span>}</span>
                    <span className="font-medium text-red-500">-{formatCurrency(keepVsSell.est12MonthFeed)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Est. Med/Breeding {usedDefaultMedical && <span className="text-[8px] text-gray-400 italic">(Default)</span>}</span>
                    <span className="font-medium text-red-500">-{formatCurrency(keepVsSell.est12MonthMedical)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2 border-b border-indigo-200 pb-2">
                     <span className="text-gray-600">Projected Asset Value (-15%)</span>
                     <span className="font-medium text-gray-800">{formatCurrency(keepVsSell.projectedAssetValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1">
                    <span className="text-indigo-900">Total Keep Value</span>
                    <span className="text-indigo-700">{formatCurrency(keepVsSell.keepEconomicValue)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h5 className="font-bold text-gray-800 mb-2 uppercase text-[10px] tracking-wider">SELL: Immediate Economics</h5>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{isEstimatedValue ? 'Est. Market Value' : 'Market Value'}</span>
                    <span className="font-bold text-gray-800">{formatCurrency(keepVsSell.sellEconomicValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t mt-2">
                    <span className="text-gray-800">Total Sell Value</span>
                    <span className="text-gray-800">{formatCurrency(keepVsSell.sellEconomicValue)}</span>
                  </div>
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t flex flex-col items-center ${keepVsSell.difference > 0 ? 'border-green-100' : 'border-orange-100'}`}>
                <span className="text-xs text-gray-500 mb-1">Economic Difference</span>
                <span className={`text-xl font-black ${keepVsSell.difference > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                   {keepVsSell.difference > 0 ? '+' : ''}{formatCurrency(keepVsSell.difference)}
                </span>
                <p className="text-[10px] text-center mt-2 text-gray-500">{keepVsSell.recommendation}</p>
              </div>

            </div>
          </div>
          
          {/* Performance & Event Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h4 className="text-gray-800 font-bold mb-4 flex items-center">
              <FaDatabase className="mr-2 text-purple-600" /> Animal Performance & Event History
            </h4>
            {loadingHistory ? (
              <p className="text-gray-500 text-center py-4">Loading history...</p>
            ) : !history || history.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No historical records found for this animal.</p>
            ) : (
              <div className="relative border-l-2 border-gray-200 ml-3 pl-6 space-y-6">
                {history.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-9 mt-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow
                      ${item.type === 'MILK_LOG' ? 'bg-blue-500' : 
                        item.type === 'HEALTH' ? 'bg-red-500' : 
                        item.type === 'REPRODUCTIVE' ? 'bg-pink-500' : 'bg-green-500'}`}
                    >
                      {item.type === 'MILK_LOG' ? <FaChartLine /> :
                       item.type === 'HEALTH' ? <FaHeartbeat /> :
                       item.type === 'REPRODUCTIVE' ? <FaPlus /> : <FaLeaf />}
                    </div>
                    <div>
                      <div className="flex items-baseline mb-1">
                        <span className="font-bold text-gray-800 mr-2">{item.type.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalProfileModal;
