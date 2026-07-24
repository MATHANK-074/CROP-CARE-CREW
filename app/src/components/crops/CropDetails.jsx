import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLeaf,
  faSeedling,
  faCalendarAlt,
  faRulerCombined,
  faLayerGroup,
  faFlask,
  faWater,
  faCloudSun,
  faEdit,
  faCheckCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { format } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import CropStatusHistory from './CropStatusHistory';
import { EventFormSelector } from './CropEventForms';
import { FaTasks } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';

const CropDetails = ({ initialCropData: propInitialCropData, cropId: propCropId }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['translation', 'tasks']);

  // Use the ID either from props or from URL params
  const id = propCropId || paramId;

  // Get initial crop data if available from props or router state
  const initialCropData = propInitialCropData || location.state?.cropInitialData || null;

  const [crop, setCrop] = useState(initialCropData);
  const [loading, setLoading] = useState(!initialCropData);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeEventForm, setActiveEventForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCrop, setEditedCrop] = useState({});

  // Memoize expensive operations - moved to top to avoid conditional hook calls
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  }, []);

  // Memoized message handlers to prevent unnecessary rerenders
  const handleClearSuccess = useCallback(() => setSuccess(null), []);
  const handleClearError = useCallback(() => setError(null), []);

  // Memoized navigation handlers
  const handleBackToDashboard = useCallback(() => navigate('/home'), [navigate]);
  const handleGoToTasks = useCallback(() => navigate(`/tasks/${id}`), [navigate, id]);

  // Cancel form handler
  const handleCancelForm = useCallback(() => setActiveEventForm(null), []);

  // Edit mode handlers
  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditedCrop({
      name: crop.name || '',
      variety: crop.variety || '',
      plantingDate: crop.plantingDate ? crop.plantingDate.split('T')[0] : '',
      harvestDate: crop.harvestDate ? crop.harvestDate.split('T')[0] : '',
      locationArea: crop.locationArea || '',
      locationAreaUnit: crop.locationAreaUnit || 'acres',
      soilType: crop.soilType || '',
      irrigationType: crop.irrigationType || '',
      seedSource: crop.seedSource || '',
      previousCrop: crop.previousCrop || ''
    });
  }, [crop]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedCrop({});
  }, []);

  const handleSaveEdit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/api/crops/${id}`, editedCrop, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setCrop(response.data);
      setIsEditing(false);
      setSuccess('Crop information updated successfully!');
    } catch (err) {
      console.error('Error updating crop:', err);
      setError('Failed to update crop information');
    } finally {
      setLoading(false);
    }
  }, [editedCrop, id]);

  const handleEditChange = useCallback((field, value) => {
    setEditedCrop(prev => ({ ...prev, [field]: value }));
  }, []);

  // Memoize the fetch function to prevent unnecessary recreations
  const fetchCropData = useCallback(async () => {
    if (initialCropData || !id) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/crops/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch crop: ${response.status}`);
      }

      const cropData = await response.json();
      setCrop(cropData);
    } catch (err) {
      console.error('Error fetching crop:', err);
      setError(`Failed to load crop details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, initialCropData, navigate]);

  // Single useEffect for initial data fetching
  useEffect(() => {
    fetchCropData();
  }, [fetchCropData]);

  // Memoize weather fetch to prevent unnecessary API calls
  const fetchWeatherDataLocal = useCallback(async (latitude, longitude) => {
    if (!latitude || !longitude) return;

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const { weather, hourly, daily } = await fetchWeatherData(latitude, longitude, import.meta.env.VITE_WEATHER_API_KEY);
      setWeather(weather);
      setHourly(hourly);
      setDaily(daily);
    } catch (error) {
      console.error("Weather fetch error:", error);
      setWeatherError("Failed to load weather data");
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Fetch weather data for the crop location - optimized with useMemo
  const shouldFetchWeather = useMemo(() => {
    return crop?.fieldLocation?.latitude && crop?.fieldLocation?.longitude;
  }, [crop?.fieldLocation?.latitude, crop?.fieldLocation?.longitude]);

  useEffect(() => {
    if (shouldFetchWeather) {
      fetchWeatherDataLocal(crop.fieldLocation.latitude, crop.fieldLocation.longitude);
    }
  }, [shouldFetchWeather, fetchWeatherDataLocal, crop?.fieldLocation?.latitude, crop?.fieldLocation?.longitude]);

  // Fetch activities separately to avoid race conditions
  const fetchActivities = useCallback(async () => {
    if (!crop || !id) return;

    try {
      const token = localStorage.getItem('token');
      const activitiesResponse = await axios.get(`${API_BASE_URL}/api/activities/crop/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setCrop(prevCrop => ({
        ...prevCrop,
        activities: activitiesResponse.data.activities || []
      }));
    } catch (activitiesError) {
      console.warn('Error fetching activities:', activitiesError);
    }
  }, [crop?.id, id]);

  // Fetch activities after crop data is loaded
  useEffect(() => {
    if (crop && !crop.activities) {
      fetchActivities();
    }
  }, [crop, fetchActivities]);

  const handleAddEvent = useCallback((eventType) => {
    setActiveEventForm(eventType);
  }, []);

  const handleSubmitEvent = useCallback(async (eventType, formData) => {
    try {
      setLoading(true);
      // Clear any existing messages
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');
      // Prepare the request URL and data
      const cropId = id;
      let endpoint;
      let updatedFormData = { ...formData };

      // Handle special cases for different event types
      switch (eventType) {
        case 'activity':
          endpoint = `/api/activities`;
          updatedFormData.cropId = cropId;
          break;
        case 'pestDisease':
          endpoint = `/api/crops/${cropId}/pest-disease`;
          break;
        case 'cost':
          endpoint = `/api/crops/${cropId}/costs`; // Note: plural 'costs'
          break;
        case 'note':
          endpoint = `/api/crops/${cropId}/notes`; // Note: plural 'notes'
          break;
        default:
          // For other types, use the eventType directly (singular)
          endpoint = `/api/crops/${cropId}/${eventType.toLowerCase()}`;
      }
      // Build the full URL with base API URL
      const fullEndpoint = `${API_BASE_URL}${endpoint}`;
      // For costs event, make sure data is formatted correctly
      if (eventType === 'cost') {
        // Ensure required fields are present and correctly formatted for the server
        if (!updatedFormData.date || !updatedFormData.category || updatedFormData.amount === undefined) {
          throw new Error('Missing required fields for cost event: date, category, and amount are required');
        }

        // Check if category is one of the valid enum values
        const validCategories = ['seeds', 'fertilizer', 'pesticide', 'labor', 'equipment', 'other'];
        if (!validCategories.includes(updatedFormData.category)) {
          console.error(`Invalid category value: ${updatedFormData.category}`);
          updatedFormData.category = 'other'; // Default to 'other' if invalid
        }

        // Make sure the data structure exactly matches what the server expects
        updatedFormData = {
          date: updatedFormData.date,
          category: updatedFormData.category,
          amount: parseFloat(updatedFormData.amount) || 0,
          description: updatedFormData.description || 'No description provided'
        };
      }

      // Make the API request with enhanced error handling
      try {

        // For cost events, add extra debugging
        if (eventType === 'cost') {
        }

        const response = await axios.post(fullEndpoint, updatedFormData, {
          headers: { 'Authorization': `Bearer ${token}` }
        }); // Update local state
        setCrop(response.data);
        setActiveEventForm(null);

        // Show success message
        setSuccess(`Successfully added ${eventType} event`);
      } catch (apiError) {
        console.error(`API error for ${eventType} event:`, apiError);

        // Extract and format detailed error information
        let errorMessage;
        let errorDetails = '';

        if (apiError.response) {
          // Server responded with non-2xx status
          console.error('Error response status:', apiError.response.status);
          console.error('Error response data:', apiError.response.data);

          // Special handling for 404 errors - likely due to wrong API URL
          if (apiError.response.status === 404) {
            errorMessage = `API endpoint not found. Ensure the server is running at ${API_BASE_URL}`;
            console.error(`404 Error: Check if server is running or if endpoint ${endpoint} is correct.`);
          } else if (apiError.response.status === 400 && eventType === 'cost') {
            // Special handling for cost validation errors
            errorMessage = `Error saving cost: ${apiError.response.data.message || 'Bad request'}`;
            console.error(`Cost event validation error: ${apiError.response.data.message}`);
            console.error('Request data was:', updatedFormData);
          } else {
            // Extract error message from response data
            errorMessage = apiError.response.data.error ||
              apiError.response.data.message ||
              `Error ${apiError.response.status}: Server error`;
          }

          // Handle validation errors
          if (apiError.response.data.errors) {
            errorDetails = Object.entries(apiError.response.data.errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join('; ');
          }
        } else if (apiError.request) {
          // Request made but no response received
          console.error('No response received:', apiError.request);
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          // Error setting up the request
          errorMessage = apiError.message || 'Unknown error occurred';
        }

        // Show comprehensive error to user
        const fullErrorMessage = errorDetails
          ? `${errorMessage} (${errorDetails})`
          : errorMessage;

        setError(`Failed to add ${eventType}: ${fullErrorMessage}`);
        throw apiError; // Re-throw to be caught by the outer catch
      }
    } catch (err) {
      console.error(`Error in event submission flow for ${eventType}:`, err);
      // This catch handles any errors not caught by the inner try-catch
    } finally {
      setLoading(false);
    }
  }, [id]);

  // All activities are now handled through the standard event system
  // No separate activity handling functions needed

  if (loading && !crop) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={handleBackToDashboard} variant="primary">
          {t('back_to_dashboard')}
        </Button>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 mb-4">{t('crop_not_found')}</div>
        <p className="text-sm text-gray-500 mb-4">
          Crop ID: {id}<br />
          This crop might not exist or there might be a connection issue to the API.
        </p>
        <Button onClick={handleBackToDashboard} variant="primary">
          {t('back_to_dashboard')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* Back button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <Button
          onClick={handleBackToDashboard}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          {t('back_to_dashboard')}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            onClick={handleGoToTasks}
            variant="primary"
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            <FaTasks className="mr-2" />
            <span className="hidden sm:inline">{t('crop_tasks_and_recommendations', { ns: 'tasks' })}</span>
            <span className="sm:hidden">{t('Tasks & Recommendations')}</span>
          </Button>

          <Button
            onClick={isEditing ? handleSaveEdit : handleStartEdit}
            variant={isEditing ? "primary" : "secondary"}
            className={`w-full sm:w-auto ${isEditing ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            disabled={loading}
          >
            {isEditing ? (
              <>
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                {t('save')}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEdit} className="mr-2" />
                {t('edit')}
              </>
            )}
          </Button>

          {isEditing && (
            <Button
              onClick={handleCancelEdit}
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-600 text-white w-full sm:w-auto"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              {t('cancel')}
            </Button>
          )}
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={handleClearSuccess} className="text-green-700">
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={handleClearError} className="text-red-700">
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* Crop header */}
      <div className="bg-white border border-green-200 shadow-md rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-green-100 p-2 sm:p-3 rounded-full text-green-600 self-start">
            <FontAwesomeIcon icon={faSeedling} size="2x" className="sm:text-2xl text-xl" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{crop.name}</h1>
            <div className="text-sm sm:text-base text-gray-600">
              {crop.variety ? `${crop.variety} · ` : ''}
              {t('status')}: <span className="text-green-600 font-medium">{t(crop.status.toLowerCase())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic crop information */}
      <Card className="mb-6 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4">{t('crop_information')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faSeedling} className="mr-2" />
                {t('crop_name')}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedCrop.name}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder={t('crop_name')}
                />
              ) : (
                <div className="text-lg">{crop.name}</div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faLeaf} className="mr-2" />
                {t('variety')}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedCrop.variety}
                  onChange={(e) => handleEditChange('variety', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder={t('variety')}
                />
              ) : (
                <div className="text-lg">{crop.variety || 'N/A'}</div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                {t('planting_date')}
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={editedCrop.plantingDate}
                  onChange={(e) => handleEditChange('plantingDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              ) : (
                <div className="text-lg">{formatDate(crop.plantingDate)}</div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                {t('expected_harvest')}
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={editedCrop.harvestDate}
                  onChange={(e) => handleEditChange('harvestDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              ) : (
                <div className="text-lg">{formatDate(crop.harvestDate)}</div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faWater} className="mr-2" />
                {t('irrigation_type')}
              </div>
              {isEditing ? (
                <select
                  value={editedCrop.irrigationType}
                  onChange={(e) => handleEditChange('irrigationType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">{t('select_irrigation_type')}</option>
                  <option value="drip">{t('drip_irrigation')}</option>
                  <option value="sprinkler">{t('sprinkler_irrigation')}</option>
                  <option value="flood">{t('flood_irrigation')}</option>
                  <option value="manual">{t('manual_irrigation')}</option>
                  <option value="rainwater">{t('rainwater_irrigation')}</option>
                </select>
              ) : (
                <div className="text-lg">
                  {crop.irrigationType
                    ? t(crop.irrigationType.toLowerCase() + '_irrigation')
                    : 'N/A'
                  }
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faRulerCombined} className="mr-2" />
                {t('area')}
              </div>
              {isEditing ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    value={editedCrop.locationArea}
                    onChange={(e) => handleEditChange('locationArea', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder={t('area')}
                    min="0"
                    step="0.01"
                  />
                  <select
                    value={editedCrop.locationAreaUnit}
                    onChange={(e) => handleEditChange('locationAreaUnit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="acres">{t('acres')}</option>
                    <option value="hectares">{t('hectares')}</option>
                    <option value="square meters">{t('square_meters')}</option>
                    <option value="square feet">{t('square_feet')}</option>
                  </select>
                </div>
              ) : (
                <div className="text-lg">
                  {crop.locationArea
                    ? `${crop.locationArea} ${crop.locationAreaUnit || 'units'}`
                    : 'N/A'
                  }
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                {t('soil_type')}
              </div>
              {isEditing ? (
                <select
                  value={editedCrop.soilType}
                  onChange={(e) => handleEditChange('soilType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">{t('select_soil_type')}</option>
                  <option value="clay">{t('clay')}</option>
                  <option value="sandy">{t('sandy')}</option>
                  <option value="loamy">{t('loamy')}</option>
                  <option value="silty">{t('silty')}</option>
                  <option value="peaty">{t('peaty')}</option>
                  <option value="chalky">{t('chalky')}</option>
                </select>
              ) : (
                <div className="text-lg">
                  {crop.soilType
                    ? t(crop.soilType.toLowerCase())
                    : 'N/A'
                  }
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faSeedling} className="mr-2" />
                {t('seed_source')}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedCrop.seedSource}
                  onChange={(e) => handleEditChange('seedSource', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder={t('seed_source')}
                />
              ) : (
                <div className="text-lg">{crop.seedSource || 'N/A'}</div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faLeaf} className="mr-2" />
                {t('previous_crop')}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedCrop.previousCrop}
                  onChange={(e) => handleEditChange('previousCrop', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder={t('previous_crop')}
                />
              ) : (
                <div className="text-lg">{crop.previousCrop || 'N/A'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Additional crop details */}
        <div className="mt-4">
          <div className="flex items-center text-gray-500 mb-1">
            <FontAwesomeIcon icon={faCloudSun} className="mr-2" />
            {t('growing_conditions')}
          </div>
          <div className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-gray-500">{t('previous_crop')}</div>
                <div>{crop.previousCrop || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('seed_source')}</div>
                <div>{crop.seedSource || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>



        <div className="mt-4">
          <div className="flex items-center text-gray-500 mb-1">
            <FontAwesomeIcon icon={faFlask} className="mr-2" />
            {t('growth_summary')}
          </div>
          <div className="mb-4">
            {crop.growthHistory && crop.growthHistory.length > 0 ? (
              <div className="text-lg">
                {t('current_stage')}: {
                  t(crop.growthHistory[crop.growthHistory.length - 1].stage || 'seedling')
                }
              </div>
            ) : (
              <div className="text-gray-500">{t('no_growth_records')}</div>
            )}
          </div>
        </div>


      </Card>

      {/* Crop Status History component */}
      <CropStatusHistory crop={crop} onAddEvent={handleAddEvent} />

      {/* Floating Edit Button for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <Button
          onClick={isEditing ? handleSaveEdit : handleStartEdit}
          variant={isEditing ? "primary" : "secondary"}
          className={`rounded-full w-14 h-14 p-0 shadow-lg ${isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700 text-white"}`}
          disabled={loading}
        >
          {isEditing ? (
            <FontAwesomeIcon icon={faCheckCircle} className="text-xl" />
          ) : (
            <FontAwesomeIcon icon={faEdit} className="text-xl" />
          )}
        </Button>
      </div>

      {/* Floating Cancel Button for Mobile (when editing) */}
      {isEditing && (
        <div className="fixed bottom-6 right-24 sm:hidden z-50">
          <Button
            onClick={handleCancelEdit}
            variant="secondary"
            className="rounded-full w-12 h-12 p-0 shadow-lg bg-red-500 hover:bg-red-600 text-white"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </Button>
        </div>
      )}

      {/* Event form (conditionally rendered) */}
      {activeEventForm && (
        <EventFormSelector
          eventType={activeEventForm}
          onSubmit={(formData) => handleSubmitEvent(activeEventForm, formData)}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};

export default CropDetails;