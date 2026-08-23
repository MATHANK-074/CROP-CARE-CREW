import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaFileExport, FaFileCsv, FaFileExcel, FaDownload } from 'react-icons/fa';

const buildApiUrl = (path) => {
  return `http://localhost:5002/api${path}`;
};

export default function ExportCenter() {
  const { t } = useTranslation();

  const handleExport = (format) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Use a direct download link approach with fetch to handle auth header
    fetch(buildApiUrl('/intelligence/export'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `farm_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    })
    .catch(err => {
      console.error('Export error:', err);
      alert('Failed to export data');
    });
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
      <div className="mb-8 border-b border-gray-100 pb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaFileExport className="mr-3 text-blue-600" /> Farm Reports & Export
        </h3>
        <p className="text-gray-500 mt-2">Download your farm's historical data for external accounting, veterinary analysis, or personal backup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export */}
        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col items-start relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4">
            <FaFileCsv className="text-8xl text-gray-800" />
          </div>
          
          <div className="bg-gray-100 text-gray-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <FaFileCsv className="text-2xl" />
          </div>
          <h4 className="text-lg font-bold text-gray-800 mb-2">Raw Data Export (CSV)</h4>
          <p className="text-gray-500 text-sm mb-6 flex-1">
            Export raw milk logs, feed records, and animal profiles in a standard comma-separated format. Best for importing into custom spreadsheets or databases.
          </p>
          <button 
            onClick={() => handleExport('csv')}
            className="w-full bg-white border-2 border-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <FaDownload className="mr-2" /> Download CSV
          </button>
        </div>

        {/* Excel Export (Visual Placeholder) */}
        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col items-start relative overflow-hidden group opacity-70">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4">
            <FaFileExcel className="text-8xl text-green-600" />
          </div>
          
          <div className="bg-green-100 text-green-700 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <FaFileExcel className="text-2xl" />
          </div>
          <h4 className="text-lg font-bold text-gray-800 mb-2">Formatted Report (Excel)</h4>
          <p className="text-gray-500 text-sm mb-6 flex-1">
            Export a highly formatted, multi-tab Excel spreadsheet containing executive summaries, KPI charts, and color-coded data quality indicators.
          </p>
          <button 
            disabled
            className="w-full bg-gray-100 text-gray-400 cursor-not-allowed font-bold py-3 rounded-lg flex items-center justify-center"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
