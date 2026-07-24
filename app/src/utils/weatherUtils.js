// Weather utility functions
export const getWeatherDesc = (code) => {
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
  }
  return map[code] || "Unknown"
}

// Weather code to icon (use openweathermap icons as fallback)
export const getWeatherIcon = (code) => {
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
  }
  return map[code] || "01d"
}

// Format hour
export const formatHour = (iso) => {
  const date = new Date(iso)
  return date.getHours() + ":00"
}

// Format day
export const formatDay = (iso) => {
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

// Fetch weather data based on location
export const fetchWeatherData = async (latitude, longitude, apiKey) => {
  try {
    const response = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&apikey=${apiKey}&timesteps=1h,1d&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Process data
    const current = data.timelines.hourly[0];
    const weather = {
      temp: current.values.temperature,
      desc: getWeatherDesc(current.values.weatherCode),
      icon: getWeatherIcon(current.values.weatherCode),
      time: current.time,
      humidity: current.values.humidity || null,
    };

    const hourly = data.timelines.hourly.slice(0, 6);
    const daily = data.timelines.daily.slice(0, 7);

    return { weather, hourly, daily };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
};