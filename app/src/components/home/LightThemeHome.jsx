import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CropSelector from '../crops/CropSelector';
import CropWidget from '../crops/CropWidget';
import ModernCropCard from '../crops/ModernCropCard';
import QuickActionButton from '../ui/QuickActionButton';
import CropFilter from '../ui/CropFilter';
import QuickEventForm from '../ui/QuickEventForm';
import CropDetails from '../crops/CropDetails';
import TodayTasksWidget from '../TodayTasksWidget';
import { toast } from 'react-toastify';

// Get API key from environment variables
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY;

// Format date helper
const formatDate = (date) => {
  if (!date) return 'Not set';
  return format(new Date(date), 'MMM d, yyyy');
};

// Crop status badge with appropriate coloring  
const CropStatusBadge = ({ status }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";

  switch (status) {
    case 'Growing':
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case 'Harvested':
      bgColor = "bg-amber-100";
      textColor = "text-amber-800";
      break;
    case 'Planning':
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
    case 'Failed':
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    case 'Completed':
      bgColor = "bg-purple-100";
      textColor = "text-purple-800";
      break;
  }

  return (
    <span className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium`}>
      {status}
    </span>
  );
};

import {
  faCloudSun,
  faSeedling,
  faPlus,
  faChartLine,
  faCalendarAlt,
  faDroplet,
  faLeaf,
  faSearch,
  faFilter,
  faExclamationTriangle,
  faInfoCircle,
  faMapMarkerAlt,
  faRupeeSign,
  faClipboardList,
  faCheckCircle,
  faArrowRight,
  faTrash,
  faList,
  faSpinner,
  faMagic
} from '@fortawesome/free-solid-svg-icons';
import CropModal from '../CropModal';

const LightThemeHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');
  if (!userId) {
    navigate('/login');
  }

  // Refresh key to prompt TodayTasksWidget to refetch
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);

  // Crop management state
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropId, setSelectedCropId] = useState(location.state?.selectedCropId || null);
  const [filterStatus, setFilterStatus] = useState('all_status');
  const [sortBy, setSortBy] = useState('name');

  // Weather state
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // Quick Event Form state
  const [showQuickEventForm, setShowQuickEventForm] = useState(false);
  const [quickEventType, setQuickEventType] = useState(null);
  const [quickEventCrop, setQuickEventCrop] = useState(null);

  // If we receive a selected crop ID in navigation state, use it
  useEffect(() => {
    if (location.state?.selectedCropId) {
      setSelectedCropId(location.state.selectedCropId);
      // Clear the state from location to avoid persisting selection on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Crop modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  // Removed: isCropDetailsModalOpen, selectedCropData - now using page navigation instead
  const [currentCropId, setCurrentCropId] = useState(null);
  const [expense, setExpense] = useState({ description: '', category: 'Fertilizer', amount: 0 });
  const [cropLoading, setCropLoading] = useState(false);
  const [cropError, setCropError] = useState('');
  const [preloadedCropDetails, setPreloadedCropDetails] = useState(null);
  const [cropNameInput, setCropNameInput] = useState('');

  // Fetch crops from backend
  useEffect(() => {
    const fetchCrops = async () => {
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

        const data = await res.json();

        // Add next actions to crops
        const dataWithNextActions = data.map(crop => {
          const nextActions = generateNextActions(crop);
          return { ...crop, nextActions };
        });

        setCrops(dataWithNextActions);
        setFilteredCrops(dataWithNextActions);
      } catch (err) {
        console.error('Error fetching crops:', err);
      }
    };

    fetchCrops();
  }, []);

  // Ensure today's tasks are generated and fetched only once per day when visiting Home
  useEffect(() => {
    const ensureDailyTasksOnce = async () => {
      if (!userId || crops.length === 0) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const todayKeyDate = new Date();
      todayKeyDate.setHours(0, 0, 0, 0);
      const dayKey = todayKeyDate.toISOString().slice(0, 10); // YYYY-MM-DD
      const lsKey = `dailyTasksEnsured_${userId}_${dayKey}`;
      if (localStorage.getItem(lsKey)) return;

      try {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const res = await fetch(`${base}/api/tasks/daily`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Even if generation already happened, endpoint returns tasks
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(lsKey, '1');
          setTaskRefreshKey(prev => prev + 1);
          if (data?.generated) {
            toast.success('✨ AI tasks generated for today', { autoClose: 2500 });
          }
        }
      } catch (e) {
        // Non-blocking
        console.warn('Failed to ensure daily tasks:', e.message);
      }
    };

    ensureDailyTasksOnce();
  }, [userId, crops.length]);

  // Fetch weather on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation not supported");
      setWeatherLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(
          `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&apikey=${import.meta.env.VITE_WEATHER_API_KEY}&timesteps=1h,1d&units=metric`
        )
          .then((res) => res.json())
          .then((data) => {
            const current = data.timelines.hourly[0];
            setWeather({
              temp: current.values.temperature,
              desc: getWeatherDesc(current.values.weatherCode),
              icon: getWeatherIcon(current.values.weatherCode),
              time: current.time,
              humidity: current.values.humidity || null,
            });
            setHourly(data.timelines.hourly.slice(0, 6));
            setDaily(data.timelines.daily.slice(0, 7));
            setWeatherLoading(false);
          })
          .catch(() => {
            setWeatherError("Failed to fetch weather");
            setWeatherLoading(false);
          });
      },
      () => {
        setWeatherError("Location access denied");
        setWeatherLoading(false);
      }
    );
  }, []);

  // Weather code to description (simplified)
  const getWeatherDesc = (code) => {
    const map = {
      1000: "Clear",
      1100: "Mostly Clear",
      1101: "Partly Cloudy",
      1102: "Mostly Cloudy",
      1001: "Cloudy",
      2000: "Fog",
      2100: "Light Fog",
      4000: "Drizzle",
      4001: "Rain",
      4200: "Light Rain",
      4201: "Heavy Rain",
      5000: "Snow",
      5001: "Flurries",
      5100: "Light Snow",
      5101: "Heavy Snow",
      6000: "Freezing Drizzle",
      6001: "Freezing Rain",
      6200: "Light Freezing Rain",
      6201: "Heavy Freezing Rain",
      7000: "Ice Pellets",
      7101: "Heavy Ice Pellets",
      7102: "Light Ice Pellets",
      8000: "Thunderstorm",
    };
    return map[code] || "Unknown";
  };

  // Weather code to icon
  const getWeatherIcon = (code) => {
    const map = {
      1000: "01d",
      1100: "02d",
      1101: "03d",
      1102: "04d",
      1001: "04d",
      2000: "50d",
      2100: "50d",
      4000: "09d",
      4001: "10d",
      4200: "09d",
      4201: "10d",
      5000: "13d",
      5001: "13d",
      5100: "13d",
      5101: "13d",
      6000: "13d",
      6001: "13d",
      6200: "13d",
      6201: "13d",
      7000: "13d",
      7101: "13d",
      7102: "13d",
      8000: "11d",
    };
    return map[code] || "01d";
  };

  // Format hour
  const formatHour = (iso) => {
    const date = new Date(iso);
    return date.getHours() + ":00";
  };

  // Format day
  const formatDay = (iso) => {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  // Filter and sort crops based on search and filter settings
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...crops];

      // Apply status filter
      if (filterStatus !== 'all_status') {
        filtered = filtered.filter(crop => crop.status === filterStatus);
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(crop =>
          crop.name.toLowerCase().includes(query) ||
          (crop.description && crop.description.toLowerCase().includes(query)) ||
          (crop.variety && crop.variety.toLowerCase().includes(query))
        );
      }

      // Apply sort
      if (sortBy) {
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'date':
              return new Date(b.plantingDate || 0) - new Date(a.plantingDate || 0);
            case 'status':
              return a.status?.localeCompare(b.status);
            default:
              return 0;
          }
        });
      }

      setFilteredCrops(filtered);
    };

    applyFilters();
  }, [searchQuery, filterStatus, crops, sortBy]);

  // Generate next actions for a crop
  const generateNextActions = (crop) => {
    const actions = [];

    if (crop.status === 'Planning') {
      actions.push('Prepare soil', 'Purchase seeds', 'Plan planting schedule');
    } else if (crop.status === 'Growing') {
      // Check if irrigation is needed
      if (!crop.lastIrrigation) {
        actions.push('Water the crop');
      } else {
        const lastIrrigDate = new Date(crop.lastIrrigation);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        if (lastIrrigDate < threeDaysAgo) {
          actions.push('Water the crop');
        }
      }

      // Check if fertilization is needed
      if (!crop.lastFertilization) {
        actions.push('Apply fertilizer');
      } else {
        const lastFertDate = new Date(crop.lastFertilization);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        if (lastFertDate < twoWeeksAgo) {
          actions.push('Apply fertilizer');
        }
      }

      // Check growth stage
      if (!crop.growthStage || crop.growthStage === 'Seedling') {
        actions.push('Update growth stage', 'Monitor for pests');
      } else if (crop.growthStage === 'Vegetative') {
        actions.push('Check for diseases', 'Consider adding supports');
      } else if (crop.growthStage === 'Reproductive') {
        actions.push('Monitor fruit development', 'Prepare for harvest');
      }
    } else if (crop.status === 'Harvested') {
      actions.push('Record yield data', 'Plan for next season', 'Analyze crop performance');
    }

    return actions;
  };

  // Open crop modal
  const openCropModal = () => {
    setIsCropModalOpen(true);
  };

  // Get crop details and open modal with pre-filled data
  const getDetailsAndOpenCropModal = async (cropName) => {
    try {
      setCropLoading(true);
      setCropError('');

      // Clear any previous crop details
      setPreloadedCropDetails(null);

      // Use Gemini API to get crop details
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "contents": [{
            "role": "user",
            "parts": [{
              "text": `For a crop called "${cropName}", provide me with basic agricultural information in JSON format only. I need:
              {
                "description": Short 2-3 sentence description of the crop,
                "growthDuration": typical days to maturity (just the number),
                "wateringInterval": suggested days between watering (just the number),
                "irrigationType": one of ["Drip", "Sprinkler", "Flood", "Manual", "Rainwater"] based on optimal watering method for this crop,
                "climate": suitable climate (just a short description like "Tropical" or "Temperate"),
                "soilType": ideal soil type (like "Loamy", "Sandy", "Clay", etc.),
                "spacing": suggested spacing between plants in cm (just the number),
                "sunlightNeeds": one of ["Full Sun", "Partial Shade", "Full Shade"]
              }`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch crop information");
      }

      const data = await response.json();
      const cropInfo = JSON.parse(data.candidates[0].content.parts[0].text);

      // Set the preloaded crop details
      setPreloadedCropDetails({
        name: cropName,
        ...cropInfo,
        status: 'Planning'
      });

      setIsCropModalOpen(true);
    } catch (err) {
      console.error("Error getting crop details:", err);
      setCropError("Couldn't get crop details automatically. You can still add the crop manually.");

      // Still open the modal even if the API call fails
      setIsCropModalOpen(true);
    } finally {
      setCropLoading(false);
    }
  };

  // Close crop modal
  const closeCropModal = () => {
    setIsCropModalOpen(false);
    setPreloadedCropDetails(null);
    setCropError('');
    setCropNameInput('');
  };

  // Handle adding a new crop with detailed information
  const handleAddCrop = async (cropData) => {
    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cropData)
      });

      if (!res.ok) throw new Error('Failed to add crop');

      const newCrop = await res.json();
      const cropWithNextActions = {
        ...newCrop,
        nextActions: generateNextActions(newCrop)
      };

      setCrops([...crops, cropWithNextActions]);
      setFilteredCrops([...filteredCrops, cropWithNextActions]);
      closeCropModal();
    } catch (err) {
      console.error('Error adding crop:', err);
      setCropError('Failed to add crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Open quick event form
  const openQuickEventForm = (cropId, eventType) => {
    const crop = crops.find(c => c._id === cropId);
    if (crop) {
      setQuickEventCrop(crop);
      setQuickEventType(eventType);
      setShowQuickEventForm(true);
    }
  };

  // Close quick event form
  const closeQuickEventForm = () => {
    setShowQuickEventForm(false);
    setQuickEventCrop(null);
    setQuickEventType(null);
  };

  // Handle quick event success
  const handleQuickEventSuccess = async (eventType, eventData) => {
    // Refresh crops data to show updated info
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

      if (!res.ok) throw new Error('Failed to refresh crop data');

      const data = await res.json();
      const dataWithNextActions = data.map(crop => {
        const nextActions = generateNextActions(crop);
        return { ...crop, nextActions };
      });

      setCrops(dataWithNextActions);
      setFilteredCrops(dataWithNextActions);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  // Open expense modal for a specific crop
  const openExpenseModal = (cropId, e) => {
    e.stopPropagation(); // Prevent navigation to crop details
    setCurrentCropId(cropId);
    setExpense({ description: '', category: 'Fertilizer', amount: 0 });
    setIsExpenseModalOpen(true);
  };

  // Close expense modal
  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setCurrentCropId(null);
    setExpense({ description: '', category: 'Fertilizer', amount: 0 });
  };

  // Handle adding expense to a crop
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!currentCropId) return;

    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${currentCropId}/costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expense)
      });

      if (!res.ok) throw new Error('Failed to add expense');

      const updatedCrop = await res.json();
      const updatedCropWithActions = {
        ...updatedCrop,
        nextActions: generateNextActions(updatedCrop)
      };

      // Update crops state with the updated crop
      setCrops(crops.map(crop => crop._id === currentCropId ? updatedCropWithActions : crop));
      setFilteredCrops(filteredCrops.map(crop =>
        crop._id === currentCropId ? updatedCropWithActions : crop
      ));

      closeExpenseModal();
    } catch (err) {
      console.error('Error adding expense:', err);
      setCropError('Failed to add expense');
    } finally {
      setCropLoading(false);
    }
  };

  // Navigate to crop details page
  const openCropDetailsModal = (cropId) => {
    navigate(`/crops/${cropId}`);
  };

  // Close crop details modal (kept for backward compatibility, but not used)
  const closeCropDetailsModal = () => {
    // No longer needed since we navigate to a page
  };

  // Remove crop from backend
  const handleRemoveCrop = async (cropId) => {
    if (!confirm(t('confirm_delete_crop'))) {
      return;
    }

    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${cropId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to remove crop');

      // Update local state
      setCrops(crops.filter(crop => crop._id !== cropId));
      setFilteredCrops(filteredCrops.filter(crop => crop._id !== cropId));
    } catch (err) {
      console.error('Error removing crop:', err);
      setCropError('Failed to remove crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Update crop status
  const handleUpdateCropStatus = async (cropId, newStatus) => {
    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${cropId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update crop status');

      const updatedCrop = await res.json();
      const updatedCropWithActions = {
        ...updatedCrop,
        nextActions: generateNextActions(updatedCrop)
      };

      // Update local state
      setCrops(crops.map(crop => crop._id === cropId ? updatedCropWithActions : crop));
      setFilteredCrops(filteredCrops.map(crop =>
        crop._id === cropId ? updatedCropWithActions : crop
      ));
    } catch (err) {
      console.error('Error updating crop status:', err);
      setCropError('Failed to update crop status');
    } finally {
      setCropLoading(false);
    }
  };

  // Handle search query change
  const handleSearch = (query) => {
    setSearchQuery(query);

    // Filter crops based on search query
    const filtered = crops.filter(crop =>
      crop.name.toLowerCase().includes(query.toLowerCase()) ||
      (crop.description && crop.description.toLowerCase().includes(query.toLowerCase())) ||
      (crop.variety && crop.variety.toLowerCase().includes(query.toLowerCase()))
    );

    setFilteredCrops(filtered);
  };

  // Get total count of specific crop statuses
  const getCropStatusCount = (status) => {
    return crops.filter(crop => crop.status === status).length;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('welcome_to_agritech') || 'Welcome to AgriTech'}</h1>

        {/* Hero Section with Weather and Tasks side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weather widget */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition" >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCloudSun} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-800">{t('weather') || 'Weather'}</h2>
                    <p className="text-gray-500 text-sm">{t('local_forecast') || 'Local Forecast'}</p>
                  </div>
                </div>
              </div>

              {weatherLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-600">{t('loading_weather') || 'Loading weather...'}</span>
                </div>
              )}

              {weatherError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mt-1 mr-2" />
                    <div>
                      <p className="font-medium">{weatherError}</p>
                      <p className="text-sm mt-1">{t('check_location_settings') || 'Check your location settings'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Weather */}
              {!weatherLoading && !weatherError && weather && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-3xl font-bold">{Math.round(weather.temp)}°C</div>
                      <div className="text-gray-600">{weather.desc}</div>
                    </div>
                    <div>
                      <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.desc} className="w-16 h-16" />
                    </div>
                  </div>
                  {weather.humidity !== null && (
                    <div className="text-gray-500 text-sm">
                      {t('humidity') || 'Humidity'}: {weather.humidity}%
                    </div>
                  )}
                </div>
              )}

              {/* Hourly Forecast */}
              {!weatherLoading && !weatherError && hourly && hourly.length > 0 && (
                <div className="mb-4">
                  <div className="text-gray-700 text-sm font-medium mb-2">{t('next_hours') || 'Next Hours'}</div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {hourly.map((h, idx) => (
                      <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow-sm min-w-[64px]">
                        <span className="font-semibold text-gray-700">{formatHour(h.time)}</span>
                        <img src={`https://openweathermap.org/img/wn/${getWeatherIcon(h.values.weatherCode)}.png`} alt="" className="w-8 h-8" />
                        <span className="text-base font-bold text-gray-800">{Math.round(h.values.temperature)}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Forecast */}
              {!weatherLoading && !weatherError && daily && daily.length > 0 && (
                <div>
                  <div className="text-gray-700 text-sm font-medium mb-2">{t('next_7_days') || 'Next 7 Days'}</div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {daily.map((d, idx) => (
                      <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow-sm min-w-[64px]">
                        <span className="font-semibold text-gray-700">{formatDay(d.time)}</span>
                        <img src={`https://openweathermap.org/img/wn/${getWeatherIcon(d.values.weatherCodeMax)}.png`} alt="" className="w-8 h-8" />
                        <span className="text-base font-bold text-gray-800">{Math.round(d.values.temperatureMax)}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Tasks Widget */}
          {crops.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition h-fit">

              <TodayTasksWidget crops={crops} refreshKey={taskRefreshKey} />
            </div>
          )}

          {/* Placeholder for when no crops */}
          {crops.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSeedling} className="text-2xl text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Start Farming?</h3>
                <p className="text-gray-600 mb-4">Add your first crop to see personalized task recommendations</p>
                <button
                  onClick={openCropModal}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg shadow-green-200 transition-all duration-300 hover:scale-105"
                >
                  Add Your First Crop
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats section */}
        {crops.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-3">{t('quick_stats') || 'Quick Stats'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-xs text-gray-500">{t('total_crops') || 'Total Crops'}</div>
                <div className="text-xl font-semibold text-green-700">{crops.length}</div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-xs text-gray-500">{t('growing_crops') || 'Growing Crops'}</div>
                <div className="text-xl font-semibold text-green-700">
                  {getCropStatusCount('Growing')}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-xs text-gray-500">{t('total_expenses') || 'Total Expenses'}</div>
                <div className="text-xl font-semibold text-green-700">
                  ₹{crops.reduce((total, crop) => {
                    return total + (crop.costs ? crop.costs.reduce((cropTotal, cost) => cropTotal + (cost.amount || 0), 0) : 0);
                  }, 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-xs text-gray-500">{t('active_crops') || 'Active Crops'}</div>
                <div className="text-xl font-semibold text-green-700">
                  {crops.filter(crop => crop.status !== 'Completed' && crop.status !== 'Failed').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Crop Management Section */}
        <section className="p-6 mb-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faSeedling} className="text-green-600" />
            </div>
            <span className="ml-3 text-lg font-medium text-gray-800">{t('track_and_manage') || 'Track and Manage'}</span>
            <div className="ml-auto">
              <button
                className="px-4 py-1.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition flex items-center"
                onClick={openCropModal}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" size="sm" />
                {t('add_crop') || 'Add Crop'}
              </button>
            </div>
          </div>

          {/* Filter component */}
          <CropFilter
            searchQuery={searchQuery}
            onSearchChange={(query) => setSearchQuery(query)}
            filterStatus={filterStatus}
            onFilterStatusChange={(status) => setFilterStatus(status)}
            sortBy={sortBy}
            onSortChange={(sort) => setSortBy(sort)}
          />

          {/* Modern Crop Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {filteredCrops.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                {searchQuery || filterStatus !== 'all_status'
                  ? t('no_crops_match_filters') || "No crops match your filters"
                  : t('no_crops_added') || "No crops yet. Add your first crop!"}
              </div>
            ) : (
              filteredCrops.map((crop) => (
                <ModernCropCard
                  key={crop._id}
                  crop={crop}
                  onAddEvent={(cropId, eventType) => {
                    openQuickEventForm(cropId, eventType);
                  }}
                  onViewDetails={(cropId) => {
                    // Open crop details in modal instead of navigation
                    openCropDetailsModal(cropId);
                  }}
                  onDeleteCrop={handleRemoveCrop}
                  onUpdateStatus={handleUpdateCropStatus}
                />
              ))
            )}
          </div>
        </section>

        {/* Crop Modal */}
        <CropModal
          isOpen={isCropModalOpen}
          onClose={closeCropModal}
          onAddCrop={handleAddCrop}
          loading={cropLoading}
          preloadedCropDetails={preloadedCropDetails}
          error={cropError}
        />

        {/* Expense Modal */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">{t('add_expense') || 'Add Expense'}</h2>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  {t('description') || 'Description'}
                </label>
                <input
                  type="text"
                  value={expense.description}
                  onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('expense_description') || 'Expense description'}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  {t('category') || 'Category'}
                </label>
                <select
                  value={expense.category}
                  onChange={(e) => setExpense({ ...expense, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="seeds">{t('seeds') || 'Seeds'}</option>
                  <option value="fertilizer">{t('fertilizer') || 'Fertilizer'}</option>
                  <option value="pesticide">{t('pesticide') || 'Pesticide'}</option>
                  <option value="labor">{t('labor') || 'Labor'}</option>
                  <option value="equipment">{t('equipment') || 'Equipment'}</option>
                  <option value="Irrigation">{t('irrigation') || 'Irrigation'}</option>
                  <option value="General">{t('general') || 'General'}</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  {t('amount') || 'Amount'} (₹)
                </label>
                <input
                  type="number"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeExpenseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleAddExpense}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  disabled={cropLoading}
                >
                  {cropLoading ? (t('saving') || 'Saving...') : (t('save_expense') || 'Save Expense')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Event Form Modal */}
        {showQuickEventForm && quickEventCrop && quickEventType && (
          <QuickEventForm
            crop={quickEventCrop}
            eventType={quickEventType}
            onClose={closeQuickEventForm}
            onSuccess={handleQuickEventSuccess}
          />
        )}

        {/* Crop Details Modal - Removed: Now navigates to /crops/:id page instead */}
      </div>
    </div>
  );
};

export default LightThemeHome;