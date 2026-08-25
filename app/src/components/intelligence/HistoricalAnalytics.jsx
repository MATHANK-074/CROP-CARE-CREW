import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

const buildApiUrl = (path) => {
  return `http://localhost:5005/api${path}`;
};

export default function HistoricalAnalytics() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('monthly'); // 'daily', 'weekly', 'monthly'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(buildApiUrl(`/intelligence/analytics?period=${period}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        // The API sorts descending, we want ascending for charts
        json.milkTrends = (json.milkTrends || []).reverse();
        json.feedTrends = (json.feedTrends || []).reverse();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading && !data) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const hasData = data && (data.milkTrends.length > 0 || data.feedTrends.length > 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center">
          <FaChartLine className="text-blue-500 mr-2" />
          {t('intelligence.analytics.title', 'Historical Farm Analytics')}
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                period === p ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t(`intelligence.analytics.${p}`, p.charAt(0).toUpperCase() + p.slice(1))}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="bg-yellow-50 border border-yellow-200 p-12 rounded-xl text-center">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-yellow-800">{t('intelligence.analytics.insufficient_data', 'INSUFFICIENT DATA')}</h3>
          <p className="text-yellow-600 mt-2">{t('intelligence.analytics.not_enough_data', 'There is not enough historical data to generate trends for the selected period.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milk Trend Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-6">{t('intelligence.analytics.milk_trend', 'Milk Production Trend')}</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.milkTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" name={t('intelligence.analytics.total_yield', 'Total Yield (L)')} dataKey="totalYield" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feed Cost Trend Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-6">{t('intelligence.analytics.feed_cost_trend', 'Feed Cost & Consumption Trend')}</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.feedTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    formatter={(value, name) => name === t('intelligence.analytics.total_cost', 'Total Cost (₹)') ? formatCurrency(value) : `${value} kg`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" name={t('intelligence.analytics.total_cost', 'Total Cost (₹)')} dataKey="totalCost" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" name={t('intelligence.analytics.total_feed', 'Total Feed (kg)')} dataKey="totalFeedKg" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
