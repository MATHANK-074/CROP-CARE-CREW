import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { FaPlus, FaSeedling, FaChevronLeft, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import TaskList from './TaskList';
import { translateCropName } from '../../utils/dbTranslations';
import useTaskGeneration from '../../hooks/useTaskGeneration';
import i18n from '../../i18n';

/**
 * Skeleton loader for crops section
 */
const CropSelectionSkeleton = () => (
  <div className="animate-pulse mb-6">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-3"></div>
    <div className="flex space-x-4 overflow-hidden">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-14 w-36 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
  </div>
);

/**
 * Optimized TaskDashboard component with performance improvements
 * - Uses React.memo for child components
 * - Implements useCallback and useMemo to prevent unnecessary renders
 * - Batches state updates
 * - Optimizes API calls
 * - Better URL handling and navigation
 */
const TaskDashboard = () => {
  const { t } = useTranslation(['translation', 'tasks']);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [crops, setCrops] = useState([]);
  const [activeCropIndex, setActiveCropIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);

  // Task generation hook to watch for new task generation
  const { generationResult } = useTaskGeneration();

  // Get the cropId from URL params
  const cropIdFromUrl = params.cropId;

  // Get active crop ID - used for task filtering and memoized for performance
  const activeCropId = useMemo(() => {
    if (crops.length === 0) return null;
    return crops[activeCropIndex]?._id;
  }, [crops, activeCropIndex]);

  // Optimized fetch crops function with better error handling
  const fetchCrops = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch crops: ${res.status}`);
      }

      const data = await res.json();
      setCrops(data);

      // If there's a crop ID in the URL, select that crop
      if (cropIdFromUrl) {
        const cropIndex = data.findIndex(crop => crop._id === cropIdFromUrl);
        if (cropIndex !== -1) {
          setActiveCropIndex(cropIndex);
        }
      }
    } catch (err) {
      console.error('Error fetching crops:', err);
      setError(t('failed_to_fetch_crops', { ns: 'tasks' }));
    } finally {
      setLoading(false);
    }
  }, [navigate, t, cropIdFromUrl]);

  // Load crops on component mount
  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  // Watch for task generation results and refresh task list
  useEffect(() => {
    if (generationResult && generationResult.generated) {
      console.log('New tasks generated in dashboard, refreshing task list');
      setTaskRefreshTrigger(prev => prev + 1);
    }
  }, [generationResult]);

  // Navigate to previous crop
  const handlePrevCrop = () => {
    if (activeCropIndex > 0) {
      setActiveCropIndex(activeCropIndex - 1);

      // Update URL without full page reload
      const newCropId = crops[activeCropIndex - 1]?._id;
      if (newCropId) {
        navigate(`/tasks/${newCropId}`, { replace: true });
      }
    }
  };

  // Navigate to next crop
  const handleNextCrop = () => {
    if (activeCropIndex < crops.length - 1) {
      setActiveCropIndex(activeCropIndex + 1);

      // Update URL without full page reload
      const newCropId = crops[activeCropIndex + 1]?._id;
      if (newCropId) {
        navigate(`/tasks/${newCropId}`, { replace: true });
      }
    }
  };

  // Navigate to specific crop
  const handleCropSelect = (index) => {
    setActiveCropIndex(index);

    // Update URL without full page reload
    const newCropId = crops[index]?._id;
    if (newCropId) {
      navigate(`/tasks/${newCropId}`, { replace: true });
    }
  };

  // Render crop selection section
  const renderCropSelection = () => {
    if (loading) {
      return <CropSelectionSkeleton />;
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-md mb-6 flex items-start">
          <FaInfoCircle className="text-red-600 mr-2 mt-1 flex-shrink-0" />
          <div>
            <p>{error}</p>
            <button
              onClick={fetchCrops}
              className="text-red-600 underline mt-1"
            >
              {t('try_again', { ns: 'tasks' })}
            </button>
          </div>
        </div>
      );
    }

    if (crops.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 rounded-md mb-6 flex items-start">
          <FaInfoCircle className="text-yellow-600 mr-2 mt-1 flex-shrink-0" />
          <div>
            <p>{t('no_crops_message', { ns: 'tasks' })}</p>
            <Link
              to="/crops/add"
              className="text-green-600 underline mt-1 block"
            >
              {t('add_your_first_crop', { ns: 'tasks' })}
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">{t('select_crop', { ns: 'tasks' })}</h2>

        <div className="flex items-center">
          {/* Prev button */}
          <button
            onClick={handlePrevCrop}
            disabled={activeCropIndex === 0}
            className={`p-2 rounded-full mr-2 ${activeCropIndex === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
            aria-label="Previous crop"
          >
            <FaChevronLeft />
          </button>

          {/* Scrollable crop list */}
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar flex-grow">
            {crops.map((crop, index) => {
              // Translate crop name for better UX
              const translatedName = translateCropName(crop.name, 'translation');

              return (
                <button
                  key={crop._id}
                  onClick={() => handleCropSelect(index)}
                  className={`px-4 py-3 rounded-lg flex items-center whitespace-nowrap transition-all ${index === activeCropIndex
                    ? 'bg-green-600 text-white font-medium shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <FaSeedling className="mr-2" />
                  {translatedName}
                </button>
              );
            })}
          </div>

          {/* Next button */}
          <button
            onClick={handleNextCrop}
            disabled={activeCropIndex === crops.length - 1}
            className={`p-2 rounded-full ml-2 ${activeCropIndex === crops.length - 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
            aria-label="Next crop"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('tasks', { ns: 'tasks' })}</h1>
      </div>

      {renderCropSelection()}

      {/* Only render TaskList if we have crops and the loading/error states are handled */}
      {crops.length > 0 && !error && (
        <TaskList cropId={activeCropId} refreshTrigger={taskRefreshTrigger} />
      )}
    </div>
  );
};

export default TaskDashboard;