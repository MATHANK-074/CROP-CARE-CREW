import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaLeaf, FaPlus } from 'react-icons/fa';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Widget for selecting crops to display in the CropWidget component
 */
const CropSelector = ({ onSelectCrop }) => {
  const { t } = useTranslation();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user crops
  useEffect(() => {
    const fetchUserCrops = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch crops: ${response.status}`);
        }

        const cropData = await response.json();
        setCrops(cropData);
      } catch (err) {
        console.error('Error fetching crops:', err);
        setError(`Failed to load crops: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCrops();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (crops.length === 0) {
    return (
      <Card className="shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="mb-3 text-gray-600">{t('no_crops_found')}</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/add-crop'}
            className="text-sm"
          >
            <FaPlus className="mr-2" />
            {t('add_crop')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <h3 className="p-1 border-b border-gray-200 font-medium">{t('your_crops')}</h3>
      <div className="max-h-60 overflow-y-auto">
        {crops.map(crop => (
          <div
            key={crop._id}
            className="flex items-center px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
            onClick={() => onSelectCrop(crop._id)}
          >
            <div className="bg-green-50 p-2 rounded-full mr-3">
              <FaLeaf className="text-green-500" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{crop.name}</h4>
              <p className="text-xs text-gray-500">
                {crop.locationArea
                  ? `${crop.locationArea} ${crop.locationAreaUnit || 'units'}`
                  : t('area_not_specified')
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CropSelector;