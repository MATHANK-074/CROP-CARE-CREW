/**
 * Chat Route - Farming Assistant Chatbot with Tamil Translation Support
 * 
 * This route handles chat messages and uses Gemini API for NLU and function calling
 * to convert natural language into backend API calls.
 * 
 * Environment Variables Required:
 * - GEMINI_API_KEY: Google Gemini AI API key
 * - GOOGLE_TRANSLATE_API_KEY: (Optional) Google Translate API key for better translation
 * 
 * Features:
 * - Tamil language input support
 * - Automatic translation to English for backend consistency
 * - Multilingual responses
 * - Function calling for farming operations
 */

const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
// Use dynamic import for fetch since node-fetch v3 is ESM only
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

// All routes require authentication
router.use(auth);



/**
 * Simple system prompt for basic farming assistant with multilingual support
 */
const SYSTEM_PROMPT = `You are a helpful farming assistant that supports multiple languages including Tamil (தமிழ்) and English. Provide practical agricultural advice and help farmers manage their crops. Be friendly, knowledgeable, and give actionable suggestions.

Translation Process:
- Tamil input is automatically translated to English for backend consistency
- All API calls and database operations use English terms
- Responses can be in Tamil or English based on user preference
- Mixed language conversations are supported

When users ask to perform actions and you have all required information, respond in this format:
ACTION: action_name(parameter1, parameter2)
Then provide your response in the user's preferred language.

Available actions (always use English parameters):
- ADD_CROP(actual_crop_name, actual_variety) - Add a new crop (example: ADD_CROP(tomato, cherry))
- REMOVE_CROP(actual_crop_name) - Remove an existing crop (example: REMOVE_CROP(tomato))
- LIST_CROPS() - Show all crops
- GET_WEATHER(actual_location) - Get weather for specific location (example: GET_WEATHER(Mumbai))
- CREATE_TASK(task_title, task_description, crop_name) - Create a farming task (example: CREATE_TASK(Water plants, Check soil moisture, tomato))
- LIST_TASKS(status) - Show tasks (status: today, upcoming, all) (example: LIST_TASKS(today))
- COMPLETE_TASK(task_id) - Mark a task as complete (example: COMPLETE_TASK(12345))
- LIST_ACTIVITIES(crop_name) - Show activities for a crop (example: LIST_ACTIVITIES(tomato))
- ADD_ACTIVITY(crop_name, activity_title, activity_description, activity_type) - Record farming activity (example: ADD_ACTIVITY(tomato, Applied fertilizer, Used NPK 10-10-10, maintenance))
- GET_MARKET_PRICES(crop_name) - Check market prices for crops (example: GET_MARKET_PRICES(tomato))

Tamil Translations for Common Farming Terms (for reference only, use English in ACTIONs):
- Crop = பயிர் (payir)
- Farm = பண்ணை (pannai) 
- Water = நீர் (neer)
- Soil = மண் (man)
- Weather = வானிலை (vaanilai)
- Task = வேலை (velai)
- Plant = செடி (sedi)
- Seed = விதை (vithai)
- Fertilizer = உரம் (uram)
- Harvest = அறுவடை (aruvadai)

IMPORTANT: Only use ACTION format when you have the actual specific information. If users ask to perform actions but don't provide enough details, ask them for the missing information instead of using ACTION format. Always use English terms in ACTION commands for backend consistency, but respond in user's preferred language.`;

/**
 * Detect if text contains Tamil language
 */
function detectTamilLanguage(text) {
  // Tamil Unicode range: U+0B80 to U+0BFF
  const tamilRegex = /[\u0B80-\u0BFF]/;

  // Common Tamil farming words
  const tamilFarmingWords = [
    'பயிர்', 'பண்ணை', 'நீர்', 'மண்', 'வானிலை', 'வேலை', 'செடி', 'விதை', 'உரம்', 'அறுவடை',
    'காய்கறி', 'பழம்', 'நெல்', 'கோதுமை', 'சோளம்', 'பருத்தி', 'கரும்பு', 'தக்காளி', 'வெங்காயம்',
    'காட்டு', 'செய்', 'வேண்டும்', 'எப்படி', 'என்ன', 'எங்கே', 'எப்போது'
  ];

  const hasTamilCharacters = tamilRegex.test(text);
  const hasTamilWords = tamilFarmingWords.some(word => text.includes(word));

  return hasTamilCharacters || hasTamilWords;
}

/**
 * Translate Tamil text to English using Google Translate API
 */
async function translateTamilToEnglish(text) {
  try {
    // Check if translation is needed
    if (!detectTamilLanguage(text)) {
      return text; // Return original if not Tamil
    }

    // Use Google Translate API if available
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`;

      const response = await fetch(translateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'ta',
          target: 'en',
          format: 'text'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const translatedText = result.data?.translations?.[0]?.translatedText;

        if (translatedText) {
          console.log(`Tamil->English: "${text}" -> "${translatedText}"`);
          return translatedText;
        }
      }
    }

    // Fallback: Basic Tamil to English dictionary for common farming terms
    const tamilToEnglishMap = {
      'பயிர்': 'crop',
      'பண்ணை': 'farm',
      'நீர்': 'water',
      'மண்': 'soil',
      'வானிலை': 'weather',
      'வேலை': 'task',
      'செடி': 'plant',
      'விதை': 'seed',
      'உரம்': 'fertilizer',
      'அறுவடை': 'harvest',
      'தக்காளி': 'tomato',
      'வெங்காயம்': 'onion',
      'நெல்': 'rice',
      'கோதுமை': 'wheat',
      'சோளம்': 'corn',
      'காட்டு': 'show',
      'செய்': 'do',
      'வேண்டும்': 'want',
      'எப்படி': 'how',
      'என்ன': 'what',
      'எங்கே': 'where',
      'எப்போது': 'when',
      'என்': 'my',
      'இன்றைய': 'today',
      'சேர்க்க': 'add',
      'பாய்ச்சும்': 'watering'
    };

    // Simple word-by-word replacement for basic translation
    let translatedText = text;
    Object.entries(tamilToEnglishMap).forEach(([tamil, english]) => {
      const regex = new RegExp(tamil, 'g');
      translatedText = translatedText.replace(regex, english);
    });

    // Clean up the translated text
    translatedText = translatedText
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();

    console.log(`Tamil->English (fallback): "${text}" -> "${translatedText}"`);
    return translatedText;

  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

/**
 * Convert coordinates to location name using reverse geocoding
 */
async function getLocationFromCoordinates(latitude, longitude) {
  try {
    // Using OpenStreetMap Nominatim for reverse geocoding (free service)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
    );

    if (response.ok) {
      const data = await response.json();

      // Extract city/town name
      const address = data.address || {};
      const location =
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        address.state ||
        'Unknown location';

      console.log(`Reverse geocoding: ${latitude}, ${longitude} -> ${location}`);
      return location;
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }

  return null;
}

/**
 * Execute backend API calls based on detected actions
 */
async function executeAction(action, userId, authToken, userLocation = null) {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:5000';

  try {

    const actionMatch = action.match(/([A-Z_]+)\(([^)]*)\)/);
    if (!actionMatch) return null;

    const [, actionName, paramsStr] = actionMatch;
    const params = paramsStr.split(',').map(p => p.trim().replace(/["']/g, '')).filter(Boolean);

    switch (actionName) {
      case 'ADD_CROP':
        if (!params[0]) {
          return { success: false, message: '🌱 Please specify which crop you want to add. For example: "Add tomato crop" or "Add rice variety basmati"', requiresInput: true };
        }
        return await addCropAPI(params[0], params[1], userId, authToken, baseURL);
      case 'REMOVE_CROP':
        if (!params[0]) {
          return { success: false, message: '🗑️ Please specify which crop you want to remove. For example: "Remove tomato crop"', requiresInput: true };
        }
        return await removeCropAPI(params[0], userId, authToken, baseURL);
      case 'LIST_CROPS':
        return await listCropsAPI(userId, authToken, baseURL);
      case 'GET_WEATHER':
        return await getWeatherAPI(params[0], userId, authToken, baseURL, userLocation);
      case 'CREATE_TASK':
        if (!params[0]) {
          return { success: false, message: '📝 Please specify what task you want to create. For example: "Create task to water tomatoes"', requiresInput: true };
        }
        return await createTaskAPI(params[0], params[1], params[2], userId, authToken, baseURL);
      case 'LIST_TASKS':
        return await listTasksAPI(params[0] || 'all', userId, authToken, baseURL);
      case 'COMPLETE_TASK':
        if (!params[0]) {
          return { success: false, message: '✅ Please specify which task you want to complete. For example: "Complete task 1"', requiresInput: true };
        }
        return await completeTaskAPI(params[0], userId, authToken, baseURL);
      case 'LIST_ACTIVITIES':
        return await listActivitiesAPI(params[0], userId, authToken, baseURL);
      case 'ADD_ACTIVITY':
        if (!params[0] || !params[1]) {
          return { success: false, message: '📊 Please specify crop name and activity details. For example: "Record fertilizer activity for tomatoes"', requiresInput: true };
        }
        return await addActivityAPI(params[0], params[1], params[2], params[3], userId, authToken, baseURL);
      case 'GET_MARKET_PRICES':
        if (!params[0]) {
          return { success: false, message: '💰 Please specify which crop prices you want to check. For example: "Check tomato prices"', requiresInput: true };
        }
        return await getMarketPricesAPI(params[0], userId, authToken, baseURL);
      default:
        return null;
    }
  } catch (error) {
    console.error('Action execution error:', error);
    return { success: false, message: 'Failed to execute action: ' + error.message };
  }
}

/**
 * API call functions
 */
async function addCropAPI(cropName, variety, userId, authToken, baseURL) {
  if (!cropName || cropName.trim() === '') {
    return { success: false, message: '🌱 Please specify which crop you want to add. For example: "Add tomato" or "Add rice variety basmati"', requiresInput: true };
  }

  // Capitalize first letter of crop name and variety
  const formattedCropName = cropName.trim().charAt(0).toUpperCase() + cropName.trim().slice(1).toLowerCase();
  const formattedVariety = variety && variety.trim() ?
    variety.trim().charAt(0).toUpperCase() + variety.trim().slice(1).toLowerCase() : null;

  const cropData = {
    name: formattedCropName,
    ...(formattedVariety && { variety: formattedVariety }),
    plantingDate: new Date().toISOString().split('T')[0],
    status: 'Growing'
  };

  const response = await fetch(`${baseURL}/api/crops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(cropData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Add crop API error:', errorData);
    throw new Error(`Failed to add crop: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    success: true,
    message: `✅ 
    
    Successfully added ${formattedCropName}${formattedVariety ? ` (${formattedVariety})` : ''} to your farm! Planted on ${new Date().toLocaleDateString()}.\n\n🌱 Remember to water regularly and monitor for pests.`,
    data: result
  };
}

async function removeCropAPI(cropName, userId, authToken, baseURL) {
  if (!cropName) return { success: false, message: 'Crop name is required' };

  // Get crops to find the one to delete
  const cropsResponse = await fetch(`${baseURL}/api/crops`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!cropsResponse.ok) {
    throw new Error('Failed to fetch crops');
  }

  const crops = await cropsResponse.json();
  const cropToDelete = crops.find(crop =>
    crop.name.toLowerCase().includes(cropName.toLowerCase())
  );

  if (!cropToDelete) {
    return {
      success: false,
      message: `❌ Could not find a crop named "${cropName}" in your farm.\nAvailable crops: ${crops.map(c => c.name).join(', ') || 'None'}`
    };
  }

  const deleteResponse = await fetch(`${baseURL}/api/crops/${cropToDelete._id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!deleteResponse.ok) {
    throw new Error(`Failed to remove crop: ${deleteResponse.statusText}`);
  }

  return {
    success: true,
    message: `✅ Successfully removed ${cropToDelete.name} from your farm.`
  };
}

async function listCropsAPI(userId, authToken, baseURL) {
  const response = await fetch(`${baseURL}/api/crops`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch crops: ${response.statusText}`);
  }

  const crops = await response.json();

  if (crops.length === 0) {
    return {
      success: true,
      message: "📋 You don't have any crops planted yet. Would you like to add some?",
      data: []
    };
  }

  const cropList = crops.map((crop, index) =>
    `${index + 1}. ${crop.name}${crop.variety ? ` (${crop.variety})` : ''} - Status: ${crop.status}${crop.plantingDate ? `, Planted: ${new Date(crop.plantingDate).toLocaleDateString()}` : ''}`
  ).join('\n');

  return {
    success: true,
    message: `📋 You have ${crops.length} crop(s) on your farm:\n\n${cropList}`,
    data: crops
  };
}

async function getWeatherAPI(location, userId, authToken, baseURL, userLocation = null) {
  // If no location provided, try to use user's current location
  if ((!location || location.trim() === '') && userLocation) {
    try {
      const detectedLocation = await getLocationFromCoordinates(
        userLocation.latitude,
        userLocation.longitude
      );
      if (detectedLocation) {
        location = detectedLocation;
        console.log(`Using user's current location: ${location}`);
      }
    } catch (error) {
      console.error('Error getting location from coordinates:', error);
    }
  }

  if (!location || location.trim() === '') {
    return {
      success: false,
      message: "🌤️ I'd be happy to get weather information for you! Please specify a location or allow location access. For example: 'What's the weather in Delhi?' or 'Get weather for Mumbai'",
      requiresInput: true
    };
  }

  // For now, return mock weather data
  // In a real implementation, you would integrate with a weather API
  const mockWeatherData = {
    location: location,
    temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
    humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
    conditions: ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain'][Math.floor(Math.random() * 4)],
    precipitation: Math.floor(Math.random() * 30),
    forecast: [
      { day: 'Today', high: 28, low: 18, conditions: 'Sunny' },
      { day: 'Tomorrow', high: 26, low: 17, conditions: 'Partly cloudy' },
      { day: 'Day after', high: 24, low: 16, conditions: 'Light rain' }
    ]
  };

  const forecastText = mockWeatherData.forecast.map(f =>
    `${f.day}: ${f.conditions}, High: ${f.high}°C, Low: ${f.low}°C`
  ).join('\n');

  const locationSource = userLocation && !location.includes(userLocation.latitude.toString()) ?
    ` (detected from your location)` : '';

  return {
    success: true,
    message: `🌤️ Weather for ${mockWeatherData.location}${locationSource}:\n\nCurrent: ${mockWeatherData.conditions}, ${mockWeatherData.temperature}°C, Humidity: ${mockWeatherData.humidity}%\n\nForecast:\n${forecastText}\n\n🌱 Farming tip: ${getFarmingTip(mockWeatherData)}`,
    data: mockWeatherData
  };
}

/**
 * Generate farming tips based on weather conditions
 */
function getFarmingTip(weatherData) {
  if (weatherData.conditions.includes('rain')) {
    return 'Good time for planting! Ensure proper drainage for existing crops.';
  } else if (weatherData.temperature > 30) {
    return 'High temperatures - increase watering frequency and provide shade for sensitive plants.';
  } else if (weatherData.humidity < 50) {
    return 'Low humidity - consider mulching to retain soil moisture.';
  } else {
    return 'Favorable conditions for most farming activities!';
  }
}

/**
 * Create a new farming task
 */
async function createTaskAPI(title, description, cropName, userId, authToken, baseURL) {
  try {
    let cropId = null;

    // If crop name is provided, find the crop ID
    if (cropName && cropName.trim()) {
      const cropsResponse = await fetch(`${baseURL}/api/crops`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (cropsResponse.ok) {
        const crops = await cropsResponse.json();
        const targetCrop = crops.find(crop =>
          crop.name.toLowerCase().includes(cropName.toLowerCase())
        );
        if (targetCrop) {
          cropId = targetCrop._id;
        }
      }
    }

    const taskData = {
      title: title.trim(),
      description: description?.trim() || title.trim(),
      ...(cropId && { crop: cropId }),
      priority: 'medium',
      category: 'general',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'pending'
    };

    const response = await fetch(`${baseURL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: `📝 Successfully created task: "${title}"${cropName ? ` for ${cropName}` : ''}!\n\n⏰ Due: ${new Date(taskData.dueDate).toLocaleDateString()}\n💡 You can view all your tasks by saying "show my tasks"`,
      data: result
    };
  } catch (error) {
    console.error('Create task API error:', error);
    return { success: false, message: 'Failed to create task: ' + error.message };
  }
}

/**
 * List farming tasks
 */
async function listTasksAPI(status, userId, authToken, baseURL) {
  try {
    let endpoint = `${baseURL}/api/tasks`;

    switch (status.toLowerCase()) {
      case 'today':
        endpoint = `${baseURL}/api/tasks/today`;
        break;
      case 'upcoming':
        endpoint = `${baseURL}/api/tasks/upcoming`;
        break;
      case 'completed':
      case 'done':
        endpoint = `${baseURL}/api/tasks/history`;
        break;
    }

    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const tasks = await response.json();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        success: true,
        message: `📋 No ${status === 'all' ? '' : status + ' '}tasks found.\n\n💡 You can create a new task by saying "Create task to water tomatoes"`,
        data: []
      };
    }

    const taskList = tasks.slice(0, 10).map((task, index) => {
      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
      const cropInfo = task.crop?.name ? ` (${task.crop.name})` : '';
      return `${index + 1}. ${task.title}${cropInfo} - Due: ${dueDate} - ${task.status}`;
    }).join('\n');

    return {
      success: true,
      message: `📋 Your ${status === 'all' ? '' : status + ' '}tasks (${Math.min(tasks.length, 10)} of ${tasks.length}):\n\n${taskList}${tasks.length > 10 ? '\n\n... and more in the app' : ''}`,
      data: tasks
    };
  } catch (error) {
    console.error('List tasks API error:', error);
    return { success: false, message: 'Failed to fetch tasks: ' + error.message };
  }
}

/**
 * Complete a farming task
 */
async function completeTaskAPI(taskIdentifier, userId, authToken, baseURL) {
  try {
    // First get tasks to find the one to complete
    const tasksResponse = await fetch(`${baseURL}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!tasksResponse.ok) {
      throw new Error('Failed to fetch tasks');
    }

    const tasks = await tasksResponse.json();
    let targetTask = null;

    // Find task by ID or by partial title match
    if (mongoose.Types.ObjectId.isValid(taskIdentifier)) {
      targetTask = tasks.find(task => task._id === taskIdentifier);
    } else {
      // Try to find by number (1, 2, 3) or partial title
      const taskNumber = parseInt(taskIdentifier);
      if (!isNaN(taskNumber) && taskNumber > 0 && taskNumber <= tasks.length) {
        targetTask = tasks[taskNumber - 1];
      } else {
        targetTask = tasks.find(task =>
          task.title.toLowerCase().includes(taskIdentifier.toLowerCase())
        );
      }
    }

    if (!targetTask) {
      return {
        success: false,
        message: `❌ Could not find task "${taskIdentifier}".\n\nAvailable tasks:\n${tasks.slice(0, 5).map((task, index) => `${index + 1}. ${task.title}`).join('\n')}`
      };
    }

    const response = await fetch(`${baseURL}/api/tasks/${targetTask._id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        feedback: 'Completed via chatbot',
        effectiveness: 'good'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.statusText}`);
    }

    return {
      success: true,
      message: `✅ Successfully completed task: "${targetTask.title}"\n\n🎉 Great work! Keep up with your farming activities!`,
      data: await response.json()
    };
  } catch (error) {
    console.error('Complete task API error:', error);
    return { success: false, message: 'Failed to complete task: ' + error.message };
  }
}

/**
 * List activities for a crop or all activities
 */
async function listActivitiesAPI(cropName, userId, authToken, baseURL) {
  try {
    let activities = [];

    if (cropName && cropName.trim()) {
      // Get specific crop activities
      const cropsResponse = await fetch(`${baseURL}/api/crops`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (cropsResponse.ok) {
        const crops = await cropsResponse.json();
        const targetCrop = crops.find(crop =>
          crop.name.toLowerCase().includes(cropName.toLowerCase())
        );

        if (targetCrop) {
          const activitiesResponse = await fetch(`${baseURL}/api/activities/crop/${targetCrop._id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });

          if (activitiesResponse.ok) {
            const activitiesData = await activitiesResponse.json();
            activities = activitiesData.activities || [];
          }
        }
      }
    } else {
      // Get all user activities (we'll need to implement this endpoint)
      const activitiesResponse = await fetch(`${baseURL}/api/activities`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        activities = activitiesData.activities || [];
      }
    }

    if (activities.length === 0) {
      return {
        success: true,
        message: `📊 No activities found${cropName ? ` for ${cropName}` : ''}.\n\n💡 You can record activities by saying "Record fertilizer activity for tomatoes"`,
        data: []
      };
    }

    const activityList = activities.slice(0, 10).map((activity, index) => {
      const date = activity.date ? new Date(activity.date).toLocaleDateString() : 'Unknown date';
      return `${index + 1}. ${activity.title} - ${date} (${activity.activityType})`;
    }).join('\n');

    return {
      success: true,
      message: `📊 Activities${cropName ? ` for ${cropName}` : ''} (${Math.min(activities.length, 10)} of ${activities.length}):\n\n${activityList}${activities.length > 10 ? '\n\n... and more in the app' : ''}`,
      data: activities
    };
  } catch (error) {
    console.error('List activities API error:', error);
    return { success: false, message: 'Failed to fetch activities: ' + error.message };
  }
}

/**
 * Add a new farming activity
 */
async function addActivityAPI(cropName, title, description, activityType, userId, authToken, baseURL) {
  try {
    // Find the crop
    const cropsResponse = await fetch(`${baseURL}/api/crops`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!cropsResponse.ok) {
      throw new Error('Failed to fetch crops');
    }

    const crops = await cropsResponse.json();
    const targetCrop = crops.find(crop =>
      crop.name.toLowerCase().includes(cropName.toLowerCase())
    );

    if (!targetCrop) {
      return {
        success: false,
        message: `❌ Could not find crop "${cropName}".\nAvailable crops: ${crops.map(c => c.name).join(', ') || 'None'}`
      };
    }

    const activityData = {
      cropId: targetCrop._id,
      title: title.trim(),
      description: description?.trim() || title.trim(),
      activityType: activityType?.trim() || 'general',
      date: new Date().toISOString()
    };

    const response = await fetch(`${baseURL}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(activityData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create activity: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: `📊 Successfully recorded activity: "${title}" for ${targetCrop.name}!\n\n📅 Date: ${new Date().toLocaleDateString()}\n💡 You can view all activities by saying "show activities for ${targetCrop.name}"`,
      data: result
    };
  } catch (error) {
    console.error('Add activity API error:', error);
    return { success: false, message: 'Failed to create activity: ' + error.message };
  }
}

/**
 * Get market prices for crops
 */
async function getMarketPricesAPI(cropName, userId, authToken, baseURL) {
  try {
    if (!cropName || cropName.trim() === '') {
      // Get best selling crops from database
      const response = await fetch(`${baseURL}/api/prices/latest?limit=5`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          const pricesText = data.data.map(price =>
            `${price.crop_name}: ₹${(price.price / 100).toFixed(0)}/kg in ${price.city}`
          ).join('\n');

          return {
            success: true,
            message: `💰 Top selling crops in the market:\n\n${pricesText}\n\n📈 These crops are currently in demand. Consider market trends when planning your next harvest!`,
            data: data.data
          };
        }
      }

      // Fallback with mock data for best selling crops
      return {
        success: true,
        message: `💰 Best selling crops in the market:\n\n🌾 Rice: ₹25-35/kg (High demand)\n🌽 Wheat: ₹22-28/kg (Stable demand)\n🥔 Potato: ₹15-25/kg (Seasonal peak)\n🍅 Tomato: ₹30-50/kg (Premium rates)\n🧅 Onion: ₹20-30/kg (Good demand)\n\n📈 These crops show strong market performance. Consider local conditions and farming expertise when choosing crops to grow.`,
        data: []
      };
    }

    // Try the market endpoint with correct parameter format
    const marketResponse = await fetch(`${baseURL}/api/market/prices?commodities=${encodeURIComponent(cropName)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (marketResponse.ok) {
      const contentType = marketResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const marketData = await marketResponse.json();

        if (marketData.results && marketData.results.length > 0) {
          const crop = marketData.results[0];

          let trendIcon = '📊';
          if (crop.trend === 'up') trendIcon = '📈';
          else if (crop.trend === 'down') trendIcon = '📉';

          let trendText = '';
          if (crop.change && crop.change > 0) {
            trendText = `\n${trendIcon} Price trend: ${crop.trend === 'up' ? 'Rising' : crop.trend === 'down' ? 'Falling' : 'Stable'} (${crop.change}% change)`;
          }

          const ageText = crop.isOldData ? ` (${crop.daysAgo} days ago)` : '';

          return {
            success: true,
            message: `💰 Market price for ${cropName}:\n\n💵 Current price: ${crop.price}${ageText}\n📍 Location: ${crop.marketLocation}${trendText}\n\n💡 ${crop.isOldData ? 'Note: Showing recent available data. ' : ''}Consider local market variations when planning sales.`,
            data: crop
          };
        }
      }
    }

    // Try the prices endpoint as fallback
    const pricesResponse = await fetch(`${baseURL}/api/prices/crops/${encodeURIComponent(cropName)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (pricesResponse.ok) {
      const contentType = pricesResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const pricesData = await pricesResponse.json();

        if (pricesData.success && pricesData.data && pricesData.data.length > 0) {
          const latest = pricesData.data[0];
          const avgPrice = pricesData.data.reduce((sum, p) => sum + p.price, 0) / pricesData.data.length;

          return {
            success: true,
            message: `💰 Market price for ${cropName}:\n\n💵 Latest price: ₹${(latest.price / 100).toFixed(0)}/kg\n📍 Location: ${latest.city}, ${latest.state}\n📊 Average (7 days): ₹${(avgPrice / 100).toFixed(0)}/kg\n📅 Last updated: ${new Date(latest.date).toLocaleDateString()}\n\n💡 Based on ${pricesData.count} recent price records.`,
            data: pricesData.data
          };
        }
      }
    }

    // If no real data available, provide helpful mock data
    const mockPrices = {
      'rice': { price: 2500, location: 'Multiple Markets' },
      'wheat': { price: 2200, location: 'Multiple Markets' },
      'tomato': { price: 4000, location: 'Local Markets' },
      'potato': { price: 2000, location: 'Regional Markets' },
      'onion': { price: 2500, location: 'Wholesale Markets' },
      'corn': { price: 1800, location: 'Agricultural Markets' },
      'cotton': { price: 5500, location: 'Cotton Markets' }
    };

    const searchKey = cropName.toLowerCase();
    const priceData = mockPrices[searchKey] || { price: 3000, location: 'Market Data Unavailable' };

    return {
      success: true,
      message: `💰 Estimated market price for ${cropName}:\n\n💵 Price range: ₹${(priceData.price / 100).toFixed(0)}/kg\n📍 ${priceData.location}\n\n⚠️ Note: Real-time data unavailable. Please check with local markets for current prices.`,
      data: { estimated: true, price: priceData.price }
    };

  } catch (error) {
    console.error('Get market prices API error:', error);
    return {
      success: false,
      message: `❌ Unable to fetch market prices for ${cropName || 'crops'}. ${error.message.includes('JSON') ? 'Market data service is temporarily unavailable.' : 'Please try again later.'}\n\n💡 You can check local markets or agricultural websites for current price information.`,
      data: null
    };
  }
}



/**
 * Chat endpoint with simple action detection and execution
 */
router.post('/', async (req, res) => {
  try {
    const { message, conversationHistory = [], userLocation, locationError } = req.body;
    const userId = req.user._id;
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service not configured. Please contact administrator.'
      });
    }

    // Store original message for response language detection
    const originalMessage = message;
    const isTamilMessage = detectTamilLanguage(originalMessage);

    // Translate Tamil input to English for consistent backend processing
    const translatedMessage = await translateTamilToEnglish(message);

    console.log(`Processing message - Original: "${originalMessage}" | Translated: "${translatedMessage}"`);

    // Add location context to the prompt if available
    let locationContext = '';
    if (userLocation) {
      locationContext = `\n\nUser's current location: Latitude ${userLocation.latitude}, Longitude ${userLocation.longitude} (accuracy: ${userLocation.accuracy}m)`;
    } else if (locationError) {
      locationContext = `\n\nNote: User location unavailable (${locationError}). For weather requests, ask user to specify a location.`;
    }

    // Use translated message for API processing but keep language context
    const languageNote = isTamilMessage ?
      '\n\nNOTE: User originally communicated in Tamil. Respond in Tamil when appropriate, but process commands in English for consistency.' :
      '';

    // Create simple prompt using translated message
    const prompt = `${SYSTEM_PROMPT}${languageNote}${locationContext}\n\nUser message (translated to English): ${translatedMessage}\n\nRespond with helpful farming advice. If the user wants to perform an action, include the ACTION: format in your response.`;

    // Use same pattern as other working Gemini calls in the codebase
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, response.statusText, errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!geminiText) {
      throw new Error('Empty response from AI service');
    }

    let finalMessage = geminiText;
    let actionResult = null;

    // Check if Gemini suggested an action
    const actionMatch = geminiText.match(/ACTION:\s*([^\n]+)/);
    if (actionMatch) {
      const actionString = actionMatch[1].trim();
      console.log('Detected action:', actionString);

      // Execute the action
      actionResult = await executeAction(actionString, userId, authToken, userLocation);

      if (actionResult) {
        // Replace the ACTION line with the result
        finalMessage = geminiText.replace(/ACTION:\s*[^\n]+/, actionResult.message);

        if (!actionResult.success) {
          finalMessage += '\n\n💡 You can also use the navigation menu to manage your crops manually.';
        }
      }
    } else {
      // If no action detected, check for common patterns and suggest actions
      const lowerMessage = translatedMessage.toLowerCase(); // Use translated message
      if (lowerMessage.includes('add') && lowerMessage.includes('crop')) {
        // Try to detect specific crop name, but if none found, ask for it
        const cropNamePatterns = [
          /add\s+([a-zA-Z]+)(?:\s+crop)?/i,  // "add tomato" or "add tomato crop"
          /add\s+(?:a\s+)?(\w+)(?:\s+variety)?/i, // "add a tomato" or "add tomato variety"
          /plant\s+(\w+)/i, // "plant tomato"
          /grow\s+(\w+)/i   // "grow tomato"
        ];

        let cropName = null;
        for (const pattern of cropNamePatterns) {
          const match = translatedMessage.match(pattern); // Use translated message
          if (match && match[1] && !['a', 'an', 'the', 'crop', 'new', 'some'].includes(match[1].toLowerCase())) {
            cropName = match[1];
            break;
          }
        }

        if (cropName) {
          actionResult = await executeAction(`ADD_CROP(${cropName})`, userId, authToken, userLocation);
          if (actionResult) {
            finalMessage += '\n\n' + actionResult.message;
          }
        } else {
          // User wants to add a crop but didn't specify which one
          actionResult = await executeAction('ADD_CROP()', userId, authToken, userLocation);
          if (actionResult && !actionResult.success) {
            finalMessage += '\n\n' + actionResult.message;
          }
        }
      } else if (lowerMessage.includes('list') && lowerMessage.includes('crop')) {
        actionResult = await executeAction('LIST_CROPS()', userId, authToken, userLocation);
        if (actionResult && actionResult.success) {
          finalMessage += '\n\n' + actionResult.message;
        }
      } else if (lowerMessage.includes('remove') && lowerMessage.includes('crop')) {
        const cropNamePatterns = [
          /remove\s+([a-zA-Z]+)(?:\s+crop)?/i,  // "remove tomato" or "remove tomato crop"  
          /delete\s+([a-zA-Z]+)/i, // "delete tomato"
          /remove\s+(?:the\s+)?(\w+)/i // "remove the tomato"
        ];

        let cropName = null;
        for (const pattern of cropNamePatterns) {
          const match = message.match(pattern);
          if (match && match[1] && !['a', 'an', 'the', 'crop', 'my'].includes(match[1].toLowerCase())) {
            cropName = match[1];
            break;
          }
        }

        if (cropName) {
          actionResult = await executeAction(`REMOVE_CROP(${cropName})`, userId, authToken);
        } else {
          // User wants to remove a crop but didn't specify which one
          actionResult = await executeAction('REMOVE_CROP()', userId, authToken);
        }

        if (actionResult) {
          finalMessage += '\n\n' + actionResult.message;
        }
      } else if (lowerMessage.includes('weather')) {
        // Try to extract location from the message
        let location = null;
        const locationPatterns = [
          /weather\s+(?:in|for|at)\s+([\w\s]+)/i,
          /(?:in|for|at)\s+([\w\s]+)\s+weather/i,
          /weather\s+([\w\s]{3,})/i
        ];

        for (const pattern of locationPatterns) {
          const match = message.match(pattern);
          if (match) {
            location = match[1].trim();
            break;
          }
        }

        if (location) {
          actionResult = await executeAction(`GET_WEATHER(${location})`, userId, authToken, userLocation);
        } else {
          actionResult = await executeAction('GET_WEATHER()', userId, authToken, userLocation);
        }

        if (actionResult) {
          finalMessage += '\n\n' + actionResult.message;
        }
      } else if (lowerMessage.includes('task')) {
        // Handle task-related requests
        if (lowerMessage.includes('create') || lowerMessage.includes('add')) {
          const taskPatterns = [
            /(?:create|add)\s+task\s+(?:to\s+)?(.+)/i,
            /(?:create|add)\s+(.+)\s+task/i,
            /task\s+(?:to\s+)?(.+)/i
          ];

          let taskTitle = null;
          for (const pattern of taskPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
              taskTitle = match[1].trim();
              break;
            }
          }

          if (taskTitle) {
            actionResult = await executeAction(`CREATE_TASK(${taskTitle})`, userId, authToken, userLocation);
          } else {
            actionResult = await executeAction('CREATE_TASK()', userId, authToken, userLocation);
          }
        } else if (lowerMessage.includes('complete') || lowerMessage.includes('done')) {
          const completePatterns = [
            /(?:complete|done|finish)\s+task\s+(\d+|.+)/i,
            /task\s+(\d+|.+)\s+(?:complete|done|finish)/i
          ];

          let taskId = null;
          for (const pattern of completePatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
              taskId = match[1].trim();
              break;
            }
          }

          if (taskId) {
            actionResult = await executeAction(`COMPLETE_TASK(${taskId})`, userId, authToken, userLocation);
          } else {
            actionResult = await executeAction('COMPLETE_TASK()', userId, authToken, userLocation);
          }
        } else if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
          let status = 'all';
          if (lowerMessage.includes('today')) status = 'today';
          else if (lowerMessage.includes('upcoming')) status = 'upcoming';
          else if (lowerMessage.includes('completed') || lowerMessage.includes('done')) status = 'completed';

          actionResult = await executeAction(`LIST_TASKS(${status})`, userId, authToken, userLocation);
        } else {
          actionResult = await executeAction('LIST_TASKS(all)', userId, authToken, userLocation);
        }

        if (actionResult) {
          finalMessage += '\n\n' + actionResult.message;
        }
      } else if (lowerMessage.includes('activity') || lowerMessage.includes('activities')) {
        // Handle activity-related requests
        if (lowerMessage.includes('add') || lowerMessage.includes('record') || lowerMessage.includes('create')) {
          const activityPatterns = [
            /(?:record|add|create)\s+(.+)\s+activity\s+for\s+(\w+)/i,
            /(?:record|add|create)\s+activity\s+(.+)\s+for\s+(\w+)/i,
            /applied\s+(.+)\s+to\s+(\w+)/i,
            /fertilized\s+(\w+)\s+with\s+(.+)/i
          ];

          let activityTitle = null;
          let cropName = null;

          for (const pattern of activityPatterns) {
            const match = message.match(pattern);
            if (match) {
              if (pattern.source.includes('fertilized')) {
                cropName = match[1];
                activityTitle = `Applied ${match[2]}`;
              } else {
                activityTitle = match[1];
                cropName = match[2];
              }
              break;
            }
          }

          if (activityTitle && cropName) {
            actionResult = await executeAction(`ADD_ACTIVITY(${cropName}, ${activityTitle})`, userId, authToken, userLocation);
          } else {
            actionResult = await executeAction('ADD_ACTIVITY()', userId, authToken, userLocation);
          }
        } else {
          const cropMatch = message.match(/activities?\s+for\s+(\w+)/i);
          const cropName = cropMatch ? cropMatch[1] : null;

          if (cropName) {
            actionResult = await executeAction(`LIST_ACTIVITIES(${cropName})`, userId, authToken, userLocation);
          } else {
            actionResult = await executeAction('LIST_ACTIVITIES()', userId, authToken, userLocation);
          }
        }

        if (actionResult) {
          finalMessage += '\n\n' + actionResult.message;
        }
      } else if (lowerMessage.includes('price') || lowerMessage.includes('market')) {
        // Handle market price requests
        const pricePatterns = [
          /(?:price|market)\s+(?:of\s+|for\s+)?(\w+)/i,
          /(\w+)\s+(?:price|market)/i,
          /check\s+(\w+)\s+prices?/i
        ];

        let cropName = null;
        for (const pattern of pricePatterns) {
          const match = message.match(pattern);
          if (match && match[1] && !['current', 'latest', 'today'].includes(match[1].toLowerCase())) {
            cropName = match[1];
            break;
          }
        }

        if (cropName) {
          actionResult = await executeAction(`GET_MARKET_PRICES(${cropName})`, userId, authToken, userLocation);
        } else {
          actionResult = await executeAction('GET_MARKET_PRICES()', userId, authToken, userLocation);
        }

        if (actionResult) {
          finalMessage += '\n\n' + actionResult.message;
        }
      }
    }

    res.json({
      success: true,
      message: finalMessage.trim(),
      conversationId: `${userId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      originalMessage: originalMessage, // Store original Tamil input
      translatedMessage: translatedMessage, // Store English translation
      isTranslated: isTamilMessage, // Flag indicating if translation occurred
      ...(actionResult && { actionExecuted: true, actionResult })
    });

  } catch (error) {
    console.error('Chat error:', error);

    // Provide helpful fallback message
    const fallbackMessage = "I'm your farming assistant! While I'm having some technical difficulties, you can still use the navigation menu to manage your crops, check weather, view market prices, and more. How can I help you with farming advice?";

    res.status(200).json({
      success: true,
      message: fallbackMessage,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

/**
 * Get chat history endpoint (for future implementation)
 */
router.get('/history/:conversationId?', async (req, res) => {
  try {
    // For now, return empty history
    // In a full implementation, you would store and retrieve conversation history
    res.json({
      success: true,
      history: [],
      message: 'Chat history feature coming soon!'
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history'
    });
  }
});

module.exports = router;