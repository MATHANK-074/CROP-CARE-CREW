/**
 * Task Recommendation Generator using Gemini API
 * 
 * This utility generates task recommendations based on crop data, previous activities,
 * weather information, and other contextual data using Google's Gemini API.
 */

// Get API key from environment variables
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Generate task recommendations for a specific crop using Gemini AI
 * 
 * @param {Object} cropData - The crop data object including name, variety, planting date, etc.
 * @param {Array} previousActivities - Array of previous activities for this crop
 * @param {Object} weatherData - Current and forecast weather data (optional)
 * @param {Object} options - Additional options for recommendation generation
 * @returns {Promise<Array>} - Array of task recommendations
 */
export async function generateTaskRecommendations(cropData, previousActivities = [], weatherData = null, options = {}) {
  try {
    const prompt = generateTaskPrompt(cropData, previousActivities, weatherData, options);

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!geminiText) {
      throw new Error("No response content from Gemini API");
    }

    // Parse tasks from Gemini response
    return parseTaskRecommendations(geminiText);
  } catch (error) {
    console.error("Error generating task recommendations:", error);
    throw error;
  }
}

/**
 * Generate the prompt for Gemini API based on crop data and context
 * 
 * @param {Object} cropData - The crop data
 * @param {Array} previousActivities - Previous activities for this crop
 * @param {Object} weatherData - Weather data if available
 * @param {Object} options - Additional options
 * @returns {string} - The prompt for Gemini API
 */
function generateTaskPrompt(cropData, previousActivities = [], weatherData = null, options = {}) {
  const langCode = (localStorage.getItem('i18nextLng') || 'en');
  const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode === 'hi' ? 'Hindi' : langCode;

  // Calculate crop age in days
  let cropAge = 0;
  let growthStage = "unknown";

  if (cropData.plantingDate) {
    const plantDate = new Date(cropData.plantingDate);
    const today = new Date();
    cropAge = Math.floor((today - plantDate) / (1000 * 60 * 60 * 24));

    // Determine growth stage based on crop age and growth days
    const growthDays = parseInt(cropData.growthDays) || 90; // Default to 90 days if not specified

    if (cropAge > growthDays * 0.8) {
      growthStage = "mature";
    } else if (cropAge > growthDays * 0.6) {
      growthStage = "fruiting";
    } else if (cropAge > growthDays * 0.3) {
      growthStage = "flowering";
    } else if (cropAge > growthDays * 0.1) {
      growthStage = "vegetative";
    } else {
      growthStage = "seedling";
    }
  }

  // Format previous activities
  const recentActivities = previousActivities
    .slice(0, 5) // Get 5 most recent activities
    .map(activity => `- ${activity.title} (${new Date(activity.date).toLocaleDateString()}) - ${activity.description || 'No details'}`).join('\n');

  // Format weather data if available
  let weatherSection = '';
  if (weatherData) {
    weatherSection = `
CURRENT WEATHER CONDITIONS:
- Current Temperature: ${weatherData.temp}°C
${weatherData.daily ? `- Forecast for upcoming days:
${weatherData.daily.map(day => `  * ${new Date(day.time).toLocaleDateString()}: High ${day.values.temperatureMax}°C, Low ${day.values.temperatureMin}°C, Precipitation ${day.values.precipitation}mm (${day.values.precipitationProbability}% chance)`).join('\n')}` : ''}
`;
  }

  return `You must respond entirely in ${userLang} language. As an agricultural expert, generate task recommendations for a ${cropData.name} (${cropData.variety || 'unknown variety'}) crop based on the following information:

CROP DETAILS:
- Crop: ${cropData.name}
- Variety: ${cropData.variety || 'Unknown'}
- Growth Stage: ${growthStage} (${cropAge} days since planting)
- Planting Date: ${cropData.plantingDate ? new Date(cropData.plantingDate).toLocaleDateString() : 'Unknown'}
- Expected Harvest: ${cropData.harvestDate ? new Date(cropData.harvestDate).toLocaleDateString() : 'Unknown'}
- Current Status: ${cropData.status || 'Growing'}
- Location: ${cropData.location || 'Unknown'}
- Field Size: ${cropData.fieldSize || 'Unknown'} acres

${recentActivities ? `RECENT ACTIVITIES:
${recentActivities}` : ''}

${weatherSection}

Return ONLY a valid JSON array of 5-7 task recommendations in ${userLang}, strictly following this format:

[
  {
    "title": "Short task title in ${userLang}",
    "description": "Detailed explanation in ${userLang} of the task with scientific rationale and expected benefits",
    "category": "One of: irrigation, fertilization, pest_control, disease_treatment, harvesting, planting, pruning, soil_management, weather_response, general",
    "priority": "One of: low, medium, high, urgent",
    "dueDate": "YYYY-MM-DD",
    "recommendedTimeframe": {
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD"
    }
  }
]

IMPORTANT:
- Include tasks based on growth stage, weather conditions, and pest/disease prevention
- Set appropriate priorities and due dates relative to now
- Recommend seasonal and weather-appropriate tasks
- Balance immediate needs with long-term crop health
- Tasks should be actionable and specific
- Due dates should be realistic based on task urgency

You must respond ONLY with a valid JSON array and nothing else. No explanations or text outside the array. Make sure your JSON is properly formatted and parseable.
`;
}

/**
 * Parse the Gemini API response to extract task recommendations
 * 
 * @param {string} geminiText - Raw text response from Gemini API
 * @returns {Array} - Array of parsed task recommendations
 */
function parseTaskRecommendations(geminiText) {
  try {
    // First attempt: direct parsing
    try {
      return JSON.parse(geminiText);
    } catch (e) {
    }

    // Second attempt: extract JSON from text
    const jsonMatch = geminiText.match(/\\[\\s*{.*}\\s*\\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Third attempt: more aggressive extraction
    const strippedText = geminiText.replace(/```json|```/g, '').trim();
    return JSON.parse(strippedText);
  } catch (error) {
    console.error("Failed to parse task recommendations:", error);
    throw new Error("Failed to parse AI response into task format");
  }
}

/**
 * Save a single task recommendation to the backend
 * 
 * @param {string} cropId - The ID of the crop
 * @param {Object} task - Single task recommendation to save
 * @returns {Promise<Object>} - Saved task from the backend
 */
export async function saveTask(cropId, task) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Get user ID from task or localStorage
    const userId = task.user || localStorage.getItem('userId');

    if (!userId) {
      throw new Error("User ID not found. Please log in again.");
    }

    const taskWithCrop = {
      ...task,
      crop: cropId,
      source: 'system_generated', // Using a valid enum value from the Task model
      user: userId // Ensure user ID is included
    };

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskWithCrop)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Failed to save task: ${errorData.message || res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error saving task:", error);
    throw error;
  }
}