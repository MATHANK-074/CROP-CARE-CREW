import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPaw, FaSyringe, FaPlus, FaRupeeSign, FaExclamationTriangle } from 'react-icons/fa';

const buildApiUrl = (path) => {
  return `http://localhost:5002/api${path}`;
};

export default function FarmDataCenter() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [dcRes, mlRes] = await Promise.all([
          fetch(buildApiUrl('/intelligence/data-center'), { headers }),
          fetch(buildApiUrl('/ml/readiness'), { headers })
        ]);
        
        if (!dcRes.ok || !mlRes.ok) throw new Error('Failed to fetch dashboard data');
        
        const dcJson = await dcRes.json();
        const mlJson = await mlRes.json();
        
        setData(dcJson);
        setMlData(mlJson);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Farm Data Center...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data || data.animals.total === 0) return (
    <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-xl text-center">
      <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-yellow-800">INSUFFICIENT DATA</h3>
      <p className="text-yellow-600 mt-2">No animals found in the database. Add livestock to begin generating farm intelligence.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Animals KPI */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FaPaw className="text-6xl text-blue-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">{t('intelligence.data_center.total_animals', 'Total Animals')}</p>
          <h3 className="text-3xl font-bold text-gray-800">{data.animals.total}</h3>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded">{data.animals.milking} Milking</span>
            <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">{data.animals.dry} Dry</span>
          </div>
        </div>

        {/* Milk Production */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          <p className="text-sm font-medium text-gray-500 mb-1">30-Day Milk Yield</p>
          <h3 className="text-3xl font-bold text-gray-800">{data.production30d.totalMilkLiters} L</h3>
          <div className="mt-4 text-xs font-medium">
            <span className="text-green-600">Revenue: {formatCurrency(data.production30d.totalMilkRevenue)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          <p className="text-sm font-medium text-gray-500 mb-1">30-Day Operating Cost</p>
          <h3 className="text-3xl font-bold text-red-600">{formatCurrency(data.expenses30d.totalOperatingCost)}</h3>
          <div className="mt-4 flex gap-2 text-xs flex-wrap">
            <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">Feed: {formatCurrency(data.expenses30d.totalFeedCost)}</span>
            <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded">Med: {formatCurrency(data.expenses30d.totalMedicalCost)}</span>
          </div>
        </div>

        {/* Profitability */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          <p className="text-sm font-medium text-gray-500 mb-1">30-Day Net Profit</p>
          <h3 className={`text-3xl font-bold ${data.profitability30d.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.profitability30d.netProfit)}
          </h3>
          <div className="mt-4 text-xs font-medium">
            <span className={`${data.profitability30d.netProfit >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded`}>
              Margin: {data.profitability30d.profitMarginPercentage}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Detail breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4">Event Tracking (Last 30 Days)</h4>
          <ul className="space-y-3">
            <li className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="flex items-center text-gray-600"><FaSyringe className="mr-2 text-purple-500"/> Health Interventions</span>
              <span className="font-semibold text-gray-800">{data.events30d.healthEvents}</span>
            </li>
            <li className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="flex items-center text-gray-600"><FaPlus className="mr-2 text-pink-500"/> Pregnancy/Breeding Events</span>
              <span className="font-semibold text-gray-800">{data.events30d.pregnancyEvents}</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4">Feed Inventory Utilization</h4>
          <ul className="space-y-3">
            <li className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-600">Total Feed Consumed (30 Days)</span>
              <span className="font-semibold text-gray-800">{data.expenses30d.totalFeedKg} kg</span>
            </li>
            <li className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-600">Average Feed Cost / Kg</span>
              <span className="font-semibold text-gray-800">
                {data.expenses30d.totalFeedKg > 0 ? formatCurrency(data.expenses30d.totalFeedCost / data.expenses30d.totalFeedKg) : 'N/A'}
              </span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* ML Data Readiness Dashboard */}
      {mlData && (
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-100">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-indigo-900">Machine Learning Data Readiness</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              mlData.ml_status === 'NOT READY' ? 'bg-red-100 text-red-800' :
              mlData.ml_status === 'EXPERIMENTAL ML' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              ML STATUS: {mlData.ml_status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700"><strong>Reason:</strong> {mlData.reason}</p>
              {mlData.required_for_next_gate > 0 && (
                <p className="text-sm font-medium text-indigo-700 mt-2"><strong>Required for Next Gate:</strong> {mlData.required_for_next_gate} observations</p>
              )}
            </div>
            <div className="bg-white/80 p-4 rounded-lg">
              <ul className="text-sm space-y-2">
                <li className="flex justify-between"><span className="text-gray-600">Current Animals:</span> <strong>{mlData.animals}</strong></li>
                <li className="flex justify-between"><span className="text-gray-600">Milk Records:</span> <strong>{mlData.milk_records}</strong></li>
                <li className="flex justify-between"><span className="text-gray-600">Usable Sequential Observations:</span> <strong>{mlData.usable_observations}</strong></li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-indigo-500 mt-4 italic">
            * The system requires continuous data collection to train production ML models. Currently using Fallback Rule-Based Estimator.
          </p>
        </div>
      )}
    </div>
  );
}
