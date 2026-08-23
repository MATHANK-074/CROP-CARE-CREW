import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaBrain, FaDatabase, FaChartBar, FaCheckDouble, FaFileExport
} from 'react-icons/fa';
import FarmDataCenter from '../components/intelligence/FarmDataCenter';
import DataQualityCenter from '../components/intelligence/DataQualityCenter';
import HistoricalAnalytics from '../components/intelligence/HistoricalAnalytics';
import MLDataReadiness from '../components/intelligence/MLDataReadiness';
import ExportCenter from '../components/intelligence/ExportCenter';

const IntelligenceDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('data-center');

  const tabs = [
    { id: 'data-center', label: t('intelligence.tabs.dataCenter', 'Farm Data Center'), icon: <FaDatabase className="mr-2" /> },
    { id: 'quality', label: t('intelligence.tabs.quality', 'Data Quality'), icon: <FaCheckDouble className="mr-2" /> },
    { id: 'analytics', label: t('intelligence.tabs.analytics', 'Historical Analytics'), icon: <FaChartBar className="mr-2" /> },
    { id: 'ml-ready', label: t('intelligence.tabs.mlReady', 'ML Readiness'), icon: <FaBrain className="mr-2" /> },
    { id: 'export', label: t('intelligence.tabs.export', 'Export'), icon: <FaFileExport className="mr-2" /> }
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaBrain className="text-purple-600 mr-3" />
            {t('intelligence.title', 'Farm Intelligence & ML Data')}
          </h1>
          <p className="text-gray-500 mt-1">
            {t('intelligence.subtitle', 'Real Data Foundation, Data Quality & ML Readiness')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-6 bg-white rounded-t-xl sticky top-0 z-10 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-transparent">
        {activeTab === 'data-center' && <FarmDataCenter />}
        {activeTab === 'quality' && <DataQualityCenter />}
        {activeTab === 'analytics' && <HistoricalAnalytics />}
        {activeTab === 'ml-ready' && <MLDataReadiness />}
        {activeTab === 'export' && <ExportCenter />}
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
