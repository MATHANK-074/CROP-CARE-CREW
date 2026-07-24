import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSpinner, FaSeedling, FaTasks, FaHome } from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * CropTaskSelector component
 * 
 * This component displays a grid of all crops and allows users to select one to view tasks
 */
const CropTaskSelector = () => {
  const { t } = useTranslation(['translation', 'tasks']);
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all crops on component mount
  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch crops: ${res.status}`);
        }

        const cropData = await res.json();
        setCrops(cropData);
      } catch (err) {
        console.error('Error fetching crops:', err);
        setError(t('failed_to_load_crops'));
        toast.error(t('failed_to_load_crops'));
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, [navigate, t]);

  // Determine crop status icon and class
  const getCropStatusIcon = (status) => {
    switch (status) {
      case 'Growing':
        return <FaSeedling className="text-green-600" />;
      case 'Harvested':
        return <FaTasks className="text-orange-500" />;
      case 'Planning':
        return <FaSeedling className="text-blue-500" />;
      case 'Failed':
        return <FaSeedling className="text-red-500" />;
      case 'Completed':
        return <FaTasks className="text-purple-500" />;
      default:
        return <FaSeedling className="text-gray-500" />;
    }
  };

  // Handle crop selection to view tasks
  const handleCropSelect = (cropId) => {
    navigate(`/tasks/${cropId}`);
  };

  // Define a consistent container height for all states
  const containerClass = "bg-white rounded-lg shadow-md p-6 min-h-[400px]";

  // Show loading state
  if (loading) {
    return (
      <div className={`${containerClass} flex justify-center items-center`}>
        <FaSpinner className="animate-spin text-green-600 text-3xl w-8 h-8" />
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className={containerClass}>
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  // Show message if no crops are available
  if (crops.length === 0) {
    return (
      <div className={`${containerClass} text-center`}>
        <FaSeedling className="text-green-600 text-4xl mx-auto mb-4 w-16 h-16" />
        <h3 className="text-xl font-semibold mb-2">{t('no_crops_available', { ns: 'tasks' })}</h3>
        <p className="text-gray-600 mb-4">
          {t('add_crops_to_manage_tasks', { ns: 'tasks' })}
        </p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{t('select_crop_for_tasks', { ns: 'tasks' })}</h2>
          <p className="text-gray-600 mt-1">{t('select_crop_to_view_tasks', { ns: 'tasks' })}</p>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="text-green-600 hover:text-green-800 flex items-center font-medium"
        >
          <FaHome className="mr-1 w-4 h-4" /> {t('back_to_dashboard', { ns: 'tasks' })}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {crops.map(crop => (
          <div
            key={crop._id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-green-300 transition-all cursor-pointer bg-white min-h-[160px] flex flex-col"
            onClick={() => handleCropSelect(crop._id)}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-50 mr-3 w-10 h-10 flex items-center justify-center">
                {getCropStatusIcon(crop.status)}
              </div>
              <div className="flex-grow overflow-hidden">
                <h3 className="text-lg font-semibold truncate">{crop.name}</h3>
                {crop.variety && (
                  <span className="text-sm text-gray-500 block truncate">({crop.variety})</span>
                )}
              </div>
              <div className="ml-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${crop.status === 'Growing' ? 'bg-green-100 text-green-800' :
                  crop.status === 'Harvested' ? 'bg-orange-100 text-orange-800' :
                    crop.status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                      crop.status === 'Failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                  }`}>
                  {crop.status}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 mt-3 pt-3 border-t flex-grow">
              {crop.plantingDate && (
                <div className="flex items-center mb-1">
                  <FaSeedling className="text-green-500 mr-2 text-xs w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {t('planted', { ns: 'tasks' })}: {new Date(crop.plantingDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {crop.status === 'Growing' && crop.harvestDate && (
                <div className="flex items-center">
                  <FaTasks className="text-orange-500 mr-2 text-xs w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {t('expected_harvest', { ns: 'tasks' })}: {new Date(crop.harvestDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropTaskSelector;