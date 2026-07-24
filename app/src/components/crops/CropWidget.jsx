import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  FaLeaf, FaCalendarAlt, FaMapMarkerAlt, FaLayerGroup, FaCloudSun, FaWater,
  FaTint, FaBug, FaRuler, FaBalanceScale, FaRupeeSign,
  FaClock, FaStickyNote, FaClipboardCheck, FaPlus, FaTimes
} from 'react-icons/fa';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { EventFormSelector } from './CropEventForms';
import { saveEventAsTask } from '../../utils/eventTaskUtils';

/**
 * A widget component for displaying crop information directly on the home page
 */
const CropWidget = ({ cropId, onClose }) => {
  const { t } = useTranslation(['translation', 'tasks']);
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [activeEventForm, setActiveEventForm] = useState(null);
  const [eventSuccess, setEventSuccess] = useState(null);

  // Fetch crop data
  useEffect(() => {
    const fetchCropData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${cropId}`, {
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
    };

    if (cropId) {
      fetchCropData();
    }
  }, [cropId]);

  // Compact view - shows basic crop info
  const renderCompactView = () => {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-full">
            <FaLeaf className="text-green-600 text-xl" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{crop.name}</h3>
            <p className="text-sm text-gray-500">
              {crop.locationArea
                ? `${crop.locationArea} ${crop.locationAreaUnit || 'units'}`
                : t('area_not_specified')
              }
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="text"
            onClick={() => setExpanded(true)}
            className="text-sm"
          >
            {t('view_details')}
          </Button>
        </div>
      </div>
    );
  };

  // Handle event form submission
  const handleSubmitEvent = async (eventType, formData) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not available');
      }

      // Validate and sanitize data before saving
      let processedData = { ...formData };

      // Special handling for cost events
      if (eventType === 'cost') {
        // Ensure category value is in lowercase to match server expectations
        if (processedData.category) {
          // Map common cost categories to the server's expected enum values
          const categoryMapping = {
            'Seeds': 'seeds',
            'Fertilizer': 'fertilizer',
            'Pesticide': 'pesticide',
            'Labor': 'labor',
            'Equipment': 'equipment',
            'Irrigation': 'other',
            'General': 'other'
          };

          processedData.category = categoryMapping[processedData.category] || 'other';
        } else {
          processedData.category = 'other'; // Default
        }

        // Ensure amount is a valid number
        if (processedData.amount !== undefined) {
          const amount = parseFloat(processedData.amount);
          processedData.amount = isNaN(amount) ? 0 : amount;
        } else {
          processedData.amount = 0;
        }
      }

      await saveEventAsTask(cropId, userId, eventType, processedData);
      setActiveEventForm(null);
      setEventSuccess(`${t(eventType)} ${t('added_successfully')}`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setEventSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving event:', err);

      // Extract more detailed error information if available
      let errorMessage = err.message;
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        if (err.response.data.errors && err.response.data.errors.length > 0) {
          errorMessage += `: ${err.response.data.errors.join(', ')}`;
        }
      }

      setError(`Failed to save event: ${errorMessage}`);

      // Clear error message after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Event type definitions
  const eventTypes = [
    { id: 'irrigation', label: t('irrigation'), icon: FaTint },
    { id: 'fertilization', label: t('fertilization'), icon: FaLeaf },
    { id: 'pestDisease', label: t('pests_diseases'), icon: FaBug },
    { id: 'growth', label: t('growth'), icon: FaRuler },
    { id: 'harvest', label: t('harvest'), icon: FaBalanceScale },

    { id: 'cost', label: t('costs'), icon: FaRupeeSign },
    { id: 'labor', label: t('labor'), icon: FaClock },
    { id: 'note', label: t('notes'), icon: FaStickyNote },
    { id: 'activity', label: t('activity'), icon: FaClipboardCheck }
  ];

  // Expanded view - shows more details
  const renderExpandedView = () => {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{crop.name}</h3>
          <Button
            variant="text"
            onClick={() => setExpanded(false)}
            className="text-sm"
          >
            {t('collapse')}
          </Button>
        </div>

        {/* Tabs for different sections */}
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto pb-px">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'details'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('details')}
          >
            {t('details')}
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'events'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('events')}
          >
            {t('events')}
          </button>
        </div>

        {activeTab === 'details' ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('planted_on')}</p>
                  <p className="text-sm">{format(new Date(crop.plantingDate), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FaMapMarkerAlt className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('location')}</p>
                  <p className="text-sm">{crop.location || t('not_specified')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FaLayerGroup className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('soil_type')}</p>
                  <p className="text-sm">{crop.soilType || t('not_specified')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FaWater className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">{t('water_source')}</p>
                  <p className="text-sm">{crop.waterSource || t('not_specified')}</p>
                </div>
              </div>
            </div>

            {crop.status && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('current_status')}</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">{crop.status}</p>
                  {crop.statusDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(crop.statusDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-2">
            {/* Events tab content */}
            {activeEventForm ? (
              <>
                {eventSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md mb-4">
                    {eventSuccess}
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
                    {error}
                  </div>
                )}
                <EventFormSelector
                  eventType={activeEventForm}
                  onSubmit={(formData) => handleSubmitEvent(activeEventForm, formData)}
                  onCancel={() => setActiveEventForm(null)}
                />
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">{t('select_event_type')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {eventTypes.map(eventType => (
                    <button
                      key={eventType.id}
                      onClick={() => setActiveEventForm(eventType.id)}
                      className="bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center"
                    >
                      <eventType.icon className="text-green-600 text-xl mb-2" />
                      <span className="text-sm text-gray-800">{eventType.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="text-sm"
            >
              {t('close')}
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <div className="flex justify-center items-center p-6">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <div className="p-4 text-red-600">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!crop) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <div className="p-4 text-gray-600">
          <p>{t('no_crop_selected')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      {expanded ? renderExpandedView() : renderCompactView()}
    </Card>
  );
};

export default CropWidget;