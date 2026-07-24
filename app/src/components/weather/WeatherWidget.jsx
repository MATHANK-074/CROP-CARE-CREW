import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudSun } from '@fortawesome/free-solid-svg-icons';
import { FaCloudSun } from 'react-icons/fa';
import WeatherAnalysis from '../WeatherAnalysis';

// Format date helper
const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Format hour helper
const formatHour = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    hour12: true 
  });
};

// Format day helper
const formatDay = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', { 
    weekday: 'short' 
  });
};

// Get weather icon helper
const getWeatherIcon = (code) => {
  // Default mapping of weather codes to OpenWeatherMap icon codes
  const iconMap = {
    0: '01d', // Clear sky
    1: '02d', // Partly cloudy
    2: '03d', // Cloudy
    3: '04d', // Overcast
    45: '50d', // Fog
    48: '50d', // Depositing rime fog
    51: '09d', // Light drizzle
    53: '09d', // Moderate drizzle
    55: '09d', // Dense drizzle
    56: '09d', // Light freezing drizzle
    57: '09d', // Dense freezing drizzle
    61: '10d', // Slight rain
    63: '10d', // Moderate rain
    65: '10d', // Heavy rain
    66: '13d', // Light freezing rain
    67: '13d', // Heavy freezing rain
    71: '13d', // Slight snow fall
    73: '13d', // Moderate snow fall
    75: '13d', // Heavy snow fall
    77: '13d', // Snow grains
    80: '09d', // Slight rain showers
    81: '09d', // Moderate rain showers
    82: '09d', // Violent rain showers
    85: '13d', // Slight snow showers
    86: '13d', // Heavy snow showers
    95: '11d', // Thunderstorm
    96: '11d', // Thunderstorm with slight hail
    95: '11d', // Thunderstorm with heavy hail
    99: '11d', // Thunderstorm with heavy hail
  };
  return iconMap[code] || '01d';
};

// Get weather description helper
const getWeatherDesc = (code) => {
  const descMap = {
    0: 'Clear sky',
    1: 'Partly cloudy',
    2: 'Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descMap[code] || 'Unknown';
};

// Fetch weather data from API
const fetchWeatherData = async (latitude, longitude, apiKey) => {
  try {
    // Using OpenMeteo free weather API as an example
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode,precipitation&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&current_weather=true`
    );

    if (!res.ok) {
      throw new Error('Weather API error');
    }

    const data = await res.json();

    // Process hourly data (next 24 hours)
    const hourly = data.hourly.time.slice(0, 24).map((time, index) => ({
      time,
      values: {
        temperature: data.hourly.temperature_2m[index],
        weatherCode: data.hourly.weathercode[index],
        precipitation: data.hourly.precipitation[index]
      }
    }));

    // Process daily data (next 7 days)
    const daily = data.daily.time.map((time, index) => ({
      time,
      values: {
        temperatureMax: data.daily.temperature_2m_max[index],
        temperatureMin: data.daily.temperature_2m_min[index],
        weatherCodeMax: data.daily.weathercode[index],
        precipitation: data.daily.precipitation_sum[index]
      }
    }));

    // Return processed data
    return {
      weather: data.current_weather,
      hourly,
      daily
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw error;
  }
};

const WeatherWidget = ({ 
  className = "", 
  showAnalysis = true, 
  compact = false,
  title = null,
  subtitle = null 
}) => {
  const { t } = useTranslation(['translation', 'tasks']);

  // Weather state
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

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
        fetchWeatherData(latitude, longitude, import.meta.env.VITE_WEATHER_API_KEY)
          .then(({ weather, hourly, daily }) => {
            setWeather(weather);
            setHourly(hourly);
            setDaily(daily);
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

  // UI Styles
  const card = "bg-white sm:p-1 md:py-5 xl:py-6 rounded-md sm:px-1 md:px-3 xl:px-6 shadow shadow-sm shadow-gray-200 p-4 m-0";
  const sectionTitle = "text-xl font-bold text-gray-800 mb-2 tracking-tight";
  const subTitle = "text-md font-semibold text-gray-600 mb-2";
  const iconBox = "flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow text-green-600 text-2xl";

  return (
    <div className={`${card} w-full ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={iconBox}>
          <FaCloudSun />
        </div>
        <div>
          <h2 className={sectionTitle}>{title || t('weather')}</h2>
          <p className="text-gray-500 text-sm">{subtitle || t('local_forecast')}</p>
        </div>
      </div>

      {/* Weather Loading/Error States */}
      {weatherLoading && (
        <div className="flex justify-center items-center p-6">
          <div className="animate-pulse text-gray-400">Loading weather data...</div>
        </div>
      )}

      {weatherError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          <p>{weatherError}</p>
          <p className="text-sm mt-1">Please check your location settings and try again.</p>
        </div>
      )}

      {/* Hourly Forecast */}
      {!weatherLoading && !weatherError && !compact && (
        <div className="mb-4">
          <div className={subTitle}>{t('next_hours')}</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {hourly.map((h, idx) => (
              <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow-sm border border-gray-100 min-w-[64px] hover:shadow transition">
                <span className="font-medium text-gray-700 text-sm">{formatHour(h.time)}</span>
                <img src={`https://openweathermap.org/img/wn/${getWeatherIcon(h.values.weatherCode)}.png`} alt="" className="w-8 h-8" />
                <span className="text-sm font-bold text-gray-800">{Math.round(h.values.temperature)}°C</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Forecast */}
      {!weatherLoading && !weatherError && (
        <div>
          <div className={subTitle}>{t('next_7_days')}</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {daily.map((d, idx) => (
              <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow-sm border border-gray-100 min-w-[64px] hover:shadow transition">
                <span className="font-medium text-gray-700 text-sm">{formatDay(d.time)}</span>
                <img src={`https://openweathermap.org/img/wn/${getWeatherIcon(d.values.weatherCodeMax)}.png`} alt="" className="w-8 h-8" />
                <span className="text-sm font-bold text-gray-800">{Math.round(d.values.temperatureMax)}°C</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Analysis */}
      {showAnalysis && (
        <div className="mt-8">
          {!weatherLoading && !weatherError && weather && (
            <WeatherAnalysis
              weather={weather}
              daily={daily}
              formatDay={formatDay}
              getWeatherDesc={getWeatherDesc}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
