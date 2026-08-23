import React, { useState, useEffect } from 'react';
import { FaChartBar, FaSun, FaMoon, FaTrophy, FaCalendarAlt, FaExclamationCircle } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line 
} from 'recharts';

const buildApiUrl = (path) => {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;
};

const MilkAnalyticsDashboard = () => {
  const [data, setData] = useState({
    today: { total: 0, morning: 0, evening: 0 },
    trend: [],
    leaderboard: [],
    forecast: { next7Days: 0, next30Days: 0, dryingOffSoon: [] }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/livestock/milk/analytics'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        // Format dates for charts (e.g. '2026-08-22' -> 'Aug 22')
        const formattedTrend = json.trend.map(item => {
          const d = new Date(item.date);
          return {
            ...item,
            shortDate: `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
          };
        });
        setData({ ...json, trend: formattedTrend });
      }
    } catch (err) {
      console.error('Error fetching milk analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 rounded-xl p-6 shadow-md text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold opacity-90">Today's Total Yield</h3>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FaChartBar size={24} />
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">{(data.today?.total || 0).toFixed(1)} <span className="text-xl font-normal opacity-80">Liters</span></div>
          <p className="text-sm opacity-80">Farm-wide production</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <FaSun size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Morning Session</p>
            <h3 className="text-2xl font-bold text-gray-800">{(data.today?.morning || 0).toFixed(1)} L</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <FaMoon size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Evening Session</p>
            <h3 className="text-2xl font-bold text-gray-800">{(data.today?.evening || 0).toFixed(1)} L</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">7-Day Production Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortDate" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="morning" name="Morning" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="evening" name="Evening" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <FaTrophy className="text-yellow-500 mr-2" /> Top Performers
          </h3>
          {data.leaderboard.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Not enough data to rank cows.</p>
          ) : (
            <div className="space-y-4">
              {data.leaderboard.map((cow, index) => (
                <div key={cow.tagId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{cow.tagId}</div>
                      <div className="text-xs text-gray-500">Today: {(cow.todayYield || 0).toFixed(1)} L</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{(cow.totalYield || 0).toFixed(1)} L</div>
                    <div className="text-xs text-gray-500">All-Time</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Forecasting Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <FaCalendarAlt className="text-purple-600 mr-2" /> AI Yield Forecast (Pregnancy-Aware)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
            <p className="text-purple-800 text-sm font-medium mb-1">Estimated Next 7 Days</p>
            <h4 className="text-3xl font-bold text-purple-900">{(data.forecast?.next7Days || 0).toFixed(0)} <span className="text-lg font-normal opacity-80">L</span></h4>
            <p className="text-xs text-purple-600 mt-2">Adjusted for natural decay</p>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
            <p className="text-indigo-800 text-sm font-medium mb-1">Estimated Next 30 Days</p>
            <h4 className="text-3xl font-bold text-indigo-900">{(data.forecast?.next30Days || 0).toFixed(0)} <span className="text-lg font-normal opacity-80">L</span></h4>
            <p className="text-xs text-indigo-600 mt-2">Accounts for dry-off periods</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-5 border border-orange-100 lg:col-span-1 md:col-span-2">
            <h4 className="font-bold text-orange-800 flex items-center mb-3">
              <FaExclamationCircle className="mr-2" /> Drying Off Alerts
            </h4>
            {!data.forecast?.dryingOffSoon || data.forecast.dryingOffSoon.length === 0 ? (
              <p className="text-sm text-orange-700">No cows entering dry period in the next 30 days.</p>
            ) : (
              <ul className="space-y-2">
                {data.forecast.dryingOffSoon.map(cow => (
                  <li key={cow.tagId} className="text-sm text-orange-800 bg-white p-2 rounded shadow-sm">
                    <strong>{cow.tagId}</strong> stops milk in <strong>{cow.daysToDry} days</strong>
                    <div className="text-xs text-orange-600 mt-1">Dry Date: {new Date(cow.dryDate).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default MilkAnalyticsDashboard;
