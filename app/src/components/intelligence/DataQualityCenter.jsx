import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaCheckDouble, FaExclamationCircle, FaShieldAlt, FaInfoCircle, FaArrowRight } from 'react-icons/fa';

const buildApiUrl = (path) => {
  return `http://localhost:5005/api${path}`;
};

export default function DataQualityCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(buildApiUrl('/intelligence/quality'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch data quality metrics');
        const json = await res.json();
        setQuality(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Scanning Data Quality...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!quality) return null;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">CRITICAL</span>;
      case 'HIGH': return <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">HIGH</span>;
      case 'MEDIUM': return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">MEDIUM</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Score */}
      <div className={`p-6 rounded-xl border ${getScoreColor(quality.overallScore)} flex items-center justify-between`}>
        <div>
          <h3 className="text-xl font-bold mb-1 flex items-center">
            <FaShieldAlt className="mr-2" /> {t('intelligence.quality.overall_score', 'Overall Data Quality Score')}
          </h3>
          <p className="opacity-80">{t('intelligence.quality.score_description', 'This score reflects the completeness and accuracy of your farm data.')}</p>
        </div>
        <div className="text-5xl font-black">{quality.overallScore}<span className="text-2xl font-bold opacity-50">/100</span></div>
      </div>

      {quality.totalIssues === 0 ? (
        <div className="bg-green-50 border border-green-200 p-8 rounded-xl text-center">
          <FaCheckDouble className="text-4xl text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-800">{t('intelligence.quality.exceptional', 'Exceptional Data Quality')}</h3>
          <p className="text-green-600 mt-2">{t('intelligence.quality.no_missing', 'No missing or invalid records found. Your farm is perfectly ready for Machine Learning.')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center">
              <FaExclamationCircle className="text-orange-500 mr-2" />
              {t('intelligence.quality.action_required', 'Action Required ({{count}} Issues)', { count: quality.totalIssues })}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {quality.issues.map((issue, idx) => (
              <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getSeverityBadge(issue.severity)}
                      <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{issue.type}</span>
                      {issue.animalId && <span className="text-sm text-gray-500">Animal ID: {issue.animalId}</span>}
                    </div>
                    <p className="text-gray-800 font-medium text-lg">{issue.explanation}</p>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/livestock')}
                    className="bg-blue-50 border border-blue-100 p-4 rounded-lg md:w-1/3 flex flex-col justify-center hover:bg-blue-100 transition-colors text-left w-full cursor-pointer"
                  >
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1 flex items-center">
                      <FaInfoCircle className="mr-1" /> {t('intelligence.quality.recommended_action', 'Recommended Action')}
                    </p>
                    <p className="text-blue-900 font-medium flex items-center justify-between w-full">
                      <span>{issue.action}</span> <FaArrowRight className="ml-2 text-blue-500" />
                    </p>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
