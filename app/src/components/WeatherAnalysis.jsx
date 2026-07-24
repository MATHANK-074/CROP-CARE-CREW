import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'


// Inject styles if not already added
if (typeof document !== 'undefined' && !document.getElementById('weather-analysis-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'weather-analysis-styles';
  document.head.appendChild(styleSheet);
}

// Get API key from environment variables
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY;

const WeatherAnalysis = ({ weather, daily, formatDay, getWeatherDesc }) => {
  const [weatherAnalysis, setWeatherAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animation effect
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Weather Analysis Function
  const { t } = useTranslation()

  const analyzeWeather = async () => {
    if (!weather) return;

    setAnalysisLoading(true);
    setAnalysisError(null);

    // Ask AI to respond using the user's current language
    const langCode = (localStorage.getItem('i18nextLng') || 'en');
    const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode;
    const prompt = `Respond in ${userLang}. You are a great and knowledgeable farming assistant. 
    Given the following weather data. Return ONLY a JSON object with these fields: "advice",
    "irrigation_tips". Keep each field to maximum 2 sentences.

    Weather data: ${JSON.stringify({
      temperature: weather.temp,
      description: weather.desc,
      humidity: weather.humidity,
      time: weather.time,
      daily_forecast: daily.slice(0, 3).map(d => ({
        day: formatDay(d.time),
        temp_max: d.values.temperatureMax,
        temp_min: d.values.temperatureMin,
        weather: getWeatherDesc(d.values.weatherCodeMax),
        precipitation: d.values.precipitationSum || 0
      }))
    })}

    Provide brief advice on: wheather to irrigate or not and watering needs only.`;

    try {
      const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let result = null;
      try {
        result = JSON.parse(geminiText);
      } catch {
        // fallback: try to extract JSON from the response
        const match = geminiText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            result = JSON.parse(match[0]);
          } catch {
            throw new Error('Invalid response format');
          }
        } else {
          throw new Error('No valid JSON found in response');
        }
      }

      if (result && result.advice) {
        setWeatherAnalysis(result);
      } else {
        throw new Error('Invalid analysis format');
      }
    } catch (err) {
      setAnalysisError(err.message || 'Failed to analyze weather');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Helper function to render complex field values
  const renderField = (value) => {
    if (typeof value === 'string') {
      return <p className="text-gray-600">{value}</p>;
    } else if (typeof value === 'object' && value !== null) {
      return (
        <div className="ml-4 space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key}>
              <span className="font-medium text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}:
              </span>
              <p className="text-gray-600 ml-2">{String(val)}</p>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-gray-600">{String(value)}</p>;
  };

  const buttonStyle = "bg-black text-white rounded hover:bg-gray-800 transition font-semibold flex items-center gap-2";

  return (
    <div>
      {/* Weather Analysis Button */}
      <div className="mt-4">
        <button
          onClick={analyzeWeather}
          disabled={analysisLoading}
          className={`bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition flex items-center gap-2 w-full justify-center ${analysisLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          {analysisLoading ? t('analyzing') : t('get_weather_analysis')}
        </button>
      </div>

      {/* Weather Analysis Results */}
      {weatherAnalysis && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            {t('weather_analysis')}
          </h3>
          <div className="space-y-4 text-sm">
            {weatherAnalysis.advice && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                <span className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                  {t('current_conditions')}:
                </span>
                {renderField(weatherAnalysis.advice)}
              </div>
            )}
            {weatherAnalysis.irrigation_tips && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                <span className="font-semibold text-black flex items-center gap-2 mb-2">
                  {t('watering_advice')}:
                </span>
                {renderField(weatherAnalysis.irrigation_tips)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-600">{analysisError}</span>
        </div>
      )}
    </div>
  );
};

export default WeatherAnalysis;
