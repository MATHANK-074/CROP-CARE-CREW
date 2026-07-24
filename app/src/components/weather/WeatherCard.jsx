import React from 'react';
import { useTranslation } from 'react-i18next'
import Card from '../ui/Card';
import IconBox from '../ui/IconBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudSun } from '@fortawesome/free-solid-svg-icons';

const WeatherCard = ({ weather, hourly, daily, loading, error, formatHour, formatDay, getWeatherIcon }) => {
  const { t } = useTranslation()
  if (loading) {
    return (
      <Card variant="gradient">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="gradient">
        <div className="flex items-center gap-4 mb-6">
          <IconBox variant="danger">
            <FontAwesomeIcon icon={faCloudSun} />
          </IconBox>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('weather')}</h2>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="gradient">
      <div className="flex items-center gap-4 mb-6">
        <IconBox variant="warning">
          <FontAwesomeIcon icon={faCloudSun} />
        </IconBox>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('weather')}</h2>
          <p className="text-gray-500 text-sm">{t('local_forecast')}</p>
        </div>
      </div>

      {weather && (
        <div className="flex items-center gap-4 mb-6">
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt="weather"
            className="w-14 h-14"
          />
          <div>
            <div className="text-3xl font-bold text-gray-800">{Math.round(weather.temp)}°C</div>
            <div className="text-gray-600 text-lg">{weather.desc}</div>
            <div className="text-xs text-gray-400">
              {new Date(weather.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      {hourly && hourly.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('next_hours')}</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {hourly.map((h, idx) => (
              <div key={idx} className="flex flex-col items-center bg-white/70 rounded-lg p-2 shadow min-w-[64px]">
                <span className="font-semibold text-gray-700">{formatHour(h.time)}</span>
                <img
                  src={`https://openweathermap.org/img/wn/${getWeatherIcon(h.values.weatherCode)}.png`}
                  alt=""
                  className="w-8 h-8"
                />
                <span className="text-base font-bold text-gray-800">{Math.round(h.values.temperature)}°C</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Forecast */}
      {daily && daily.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('next_7_days')}</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {daily.map((d, idx) => (
              <div key={idx} className="flex flex-col items-center bg-white/70 rounded-lg p-2 shadow min-w-[64px]">
                <span className="font-semibold text-gray-700">{formatDay(d.time)}</span>
                <img
                  src={`https://openweathermap.org/img/wn/${getWeatherIcon(d.values.weatherCodeMax)}.png`}
                  alt=""
                  className="w-8 h-8"
                />
                <span className="text-base font-bold text-gray-800">{Math.round(d.values.temperatureMax)}°C</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default WeatherCard;