import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBrain, FaDatabase, FaCogs, FaCheckCircle, FaDownload, FaSpinner, FaEye } from 'react-icons/fa';

const buildApiUrl = (path) => {
  return `http://localhost:5002/api${path}`;
};

export default function MLDataReadiness() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState('farmer'); // 'farmer' or 'admin'
  const [building, setBuilding] = useState(false);
  const [datasetResult, setDatasetResult] = useState(null);
  const [error, setError] = useState(null);

  const buildDataset = async () => {
    setBuilding(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/intelligence/dataset/build'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate dataset');
      const json = await res.json();
      setDatasetResult(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('farmer')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center ${
              viewMode === 'farmer' ? 'bg-white shadow-sm font-bold text-purple-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaEye className="mr-2" /> Farmer View
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center ${
              viewMode === 'admin' ? 'bg-white shadow-sm font-bold text-gray-800' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaCogs className="mr-2" /> Admin / Technical View
          </button>
        </div>
      </div>

      {viewMode === 'farmer' ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaBrain className="text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Smart Farm Capabilities</h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Your farm is collecting high-quality data every day. By consistently logging milk, feed, and health records, you are building a powerful history. Soon, our advanced system will be able to use this history to provide highly accurate, personalized predictions for your animals to help you maximize profit and reduce costs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <FaCheckCircle className="text-green-500 mb-2 text-xl" />
              <h4 className="font-bold text-gray-800">Milk Forecasting</h4>
              <p className="text-sm text-gray-600 mt-1">Predict yield drops before they happen.</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <FaCheckCircle className="text-blue-500 mb-2 text-xl" />
              <h4 className="font-bold text-gray-800">Feed Efficiency</h4>
              <p className="text-sm text-gray-600 mt-1">Optimize rations for maximum margin.</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <FaCheckCircle className="text-orange-500 mb-2 text-xl" />
              <h4 className="font-bold text-gray-800">Health Alerts</h4>
              <p className="text-sm text-gray-600 mt-1">Early warnings for disease risks.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FaDatabase className="mr-2 text-gray-600" /> ML Dataset Preparation
              </h3>
              <p className="text-gray-500 text-sm mt-1">Generate structured feature matrices from historical farm records. Do NOT claim that a trained ML model exists yet.</p>
            </div>
            <button 
              onClick={buildDataset}
              disabled={building}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors flex items-center disabled:opacity-50"
            >
              {building ? <FaSpinner className="animate-spin mr-2" /> : <FaCogs className="mr-2" />}
              {building ? 'Building Dataset...' : 'Build ML Dataset'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
              {error}
            </div>
          )}

          {datasetResult ? (
            <div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6 flex items-center text-green-800">
                <FaCheckCircle className="text-green-500 mr-3 text-xl" />
                <div>
                  <p className="font-bold">{datasetResult.message}</p>
                  <p className="text-sm">Processed {datasetResult.size} animal feature vectors.</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                      <th className="p-3 border-b">Animal ID</th>
                      <th className="p-3 border-b">Category</th>
                      <th className="p-3 border-b">Status</th>
                      <th className="p-3 border-b">Milk 30D Avg (L)</th>
                      <th className="p-3 border-b">Feed Records</th>
                      <th className="p-3 border-b">Health Events</th>
                      <th className="p-3 border-b">Is Valid</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {datasetResult.dataset.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-gray-500">{row.animal_id}</td>
                        <td className="p-3">{row.category}</td>
                        <td className="p-3">{row.status}</td>
                        <td className="p-3 font-semibold">{row.milk_yield_30d_avg}</td>
                        <td className="p-3">{row.total_feed_records}</td>
                        <td className="p-3">{row.health_events}</td>
                        <td className="p-3">
                          {row.is_valid ? 
                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">TRUE</span> : 
                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold">FALSE</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-500">
              <FaDatabase className="text-4xl text-gray-300 mx-auto mb-3" />
              <p>Click 'Build ML Dataset' to extract features and prepare the timeline data.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
