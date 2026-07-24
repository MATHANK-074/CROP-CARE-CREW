import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCloudSun, FaWind, FaTint } from 'react-icons/fa';

// Format hour helper
const formatHour = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true
  });
};

// Get weather icon helper
const getWeatherIcon = (code) => {
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
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode,precipitation&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&current_weather=true`
    );

    if (!res.ok) {
      throw new Error('Weather API error');
    }

    const data = await res.json();

    // Process hourly data (next 6 hours for compact view)
    const hourly = data.hourly.time.slice(0, 6).map((time, index) => ({
      time,
      values: {
        temperature: data.hourly.temperature_2m[index],
        weatherCode: data.hourly.weathercode[index],
        precipitation: data.hourly.precipitation[index]
      }
    }));

    // Process daily data (next 3 days for compact view)
    const daily = data.daily.time.slice(0, 3).map((time, index) => ({
      time,
      values: {
        temperatureMax: data.daily.temperature_2m_max[index],
        temperatureMin: data.daily.temperature_2m_min[index],
        weatherCodeMax: data.daily.weathercode[index],
        precipitation: data.daily.precipitation_sum[index]
      }
    }));

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

const CompactWeatherWidget = ({
  className = "",
  showCurrent = true,
  showHourly = true,
  showDaily = true
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

  if (weatherLoading) {
    return (
      <div className={`bg-white rounded-lg p-4 shadow-sm ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading weather...</div>
        </div>
      </div>
    );
  }

  if (weatherError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600 text-sm">{weatherError}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm ${className}`}>
      {/* Current Weather */}
      {showCurrent && weather && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img
              src={`https://openweathermap.org/img/wn/${getWeatherIcon(weather.weathercode)}.png`}
              alt={getWeatherDesc(weather.weathercode)}
              className="w-10 h-10"
            />
            <div>
              <div className="text-2xl font-bold">{Math.round(weather.temperature)}°C</div>
              <div className="text-sm text-gray-600">{getWeatherDesc(weather.weathercode)}</div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FaTint className="text-blue-500 mr-1" />
                <span>Humidity</span>
              </div>
              <div className="flex items-center">
                <FaWind className="text-gray-500 mr-1" />
                <span>Wind</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      {showHourly && hourly.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-600 mb-2">Next 6 Hours</div>
          <div className="flex space-x-2 overflow-x-auto">
            {hourly.map((h, idx) => (
              <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 min-w-[60px] text-center">
                <span className="text-xs text-gray-600">{formatHour(h.time)}</span>
                <img
                  src={`https://openweathermap.org/img/wn/${getWeatherIcon(h.values.weatherCode)}.png`}
                  alt=""
                  className="w-6 h-6 my-1"
                />
                <span className="text-sm font-medium">{Math.round(h.values.temperature)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Forecast */}
      {showDaily && daily.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-gray-600 mb-2">Next 3 Days</div>
          <div className="space-y-2">
            {daily.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <img
                    src={`https://openweathermap.org/img/wn/${getWeatherIcon(d.values.weatherCodeMax)}.png`}
                    alt=""
                    className="w-6 h-6"
                  />
                  <span className="text-sm font-medium">
                    {new Date(d.time).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">{Math.round(d.values.temperatureMax)}°</span>
                  <span className="text-gray-400">{Math.round(d.values.temperatureMin)}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactWeatherWidget;
