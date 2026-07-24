/**
 * Task Recommendation Generator
 * 
 * This module generates task recommendations based on:
 * 1. Crop data (type, growth stage, planting date)
 * 2. Weather data (current and forecast)
 * 3. Disease risk assessments
 * 4. Previous task history (to avoid redundant recommendations)
 * 
 * Performance optimizations:
 * - Implements caching to reduce API calls
 * - Uses request debouncing to prevent duplicate calls
 * - Processes recommendations in a non-blocking way
 */

const Task = require('../models/Task');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI client when the API key is available
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Cache for storing recommendations to reduce API calls
// Structure: { cropId: { recommendations: [...], timestamp: Date } }
const recommendationsCache = new Map();

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

// In-flight requests tracking to prevent duplicate API calls
const pendingRequests = new Map();

/**
 * Generate task recommendations for a specific crop
 * 
 * @param {Object} crop - The crop document
 * @param {Object} weatherData - Current and forecast weather data
 * @param {Object} diseaseRisks - Any detected disease risks for this crop
 * @param {Object} options - Configuration options for recommendation generation
 * @returns {Array} - Array of task objects (not yet saved to database)
 */
async function generateRecommendations(crop, weatherData, diseaseRisks = {}, options = {}) {
  const cropId = crop._id.toString();

  // Check if there's an in-flight request for this crop
  if (pendingRequests.has(cropId)) {
    return pendingRequests.get(cropId);
  }

  // Check cache first
  const cachedData = recommendationsCache.get(cropId);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
    console.log('Using cached recommendations for crop', cropId);
    return cachedData.recommendations;
  }

  // Create promise for this request and store it
  const requestPromise = _generateRecommendations(crop, weatherData, diseaseRisks, options);
  pendingRequests.set(cropId, requestPromise);

  try {
    // Wait for the result
    const recommendations = await requestPromise;

    // Update cache
    recommendationsCache.set(cropId, {
      recommendations,
      timestamp: Date.now()
    });

    // Clear from pending requests
    pendingRequests.delete(cropId);

    return recommendations;
  } catch (error) {
    // Clear from pending requests on error
    pendingRequests.delete(cropId);
    throw error;
  }
}

/**
 * Internal function to generate recommendations
 */
async function _generateRecommendations(crop, weatherData, diseaseRisks = {}, options = {}) {
  const {
    includeWeatherTasks = true,
    includeGrowthStageTasks = true,
    includeDiseaseTasks = true,
    daysToLookAhead = 7
  } = options;

  const userId = crop.user;
  const tasks = [];
  const today = new Date();

  // Get recent tasks to avoid duplicates (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTasks = await Task.find({
    crop: crop._id,
    user: userId,
    createdAt: { $gte: thirtyDaysAgo }
  }).select('title category status completedDate');

  // Helper function to check if we've already recommended a similar task recently
  const hasSimilarRecentTask = (category, titleKeywords) => {
    return recentTasks.some(task => {
      if (task.category !== category) return false;

      // For exact match tasks (like disease treatments), we want to check if it was done
      const similarTitle = titleKeywords.some(keyword =>
        task.title.toLowerCase().includes(keyword.toLowerCase())
      );

      // If there's a similar task that is still pending, don't create a duplicate
      if (similarTitle && task.status === 'pending') return true;

      // If a similar task was completed/skipped less than a certain time ago, don't recreate it
      if (similarTitle && (task.status === 'done' || task.status === 'skipped')) {
        if (!task.completedDate) return false;

        // For some task categories, we want to wait longer before suggesting again
        const daysToWait = {
          'irrigation': 2,
          'fertilization': 14,
          'pest_control': 7,
          'disease_treatment': 5,
          'soil_management': 30,
          'pruning': 14,
          'general': 7
        };

        const waitDays = daysToWait[category] || 7;
        const daysSinceCompletion = Math.floor(
          (today - new Date(task.completedDate)) / (1000 * 60 * 60 * 24)
        );

        return daysSinceCompletion < waitDays;
      }

      return false;
    });
  };

  // 1. Growth Stage Tasks - Based on planting date and crop type
  if (includeGrowthStageTasks && crop.plantingDate) {
    const plantingDate = new Date(crop.plantingDate);
    const daysSincePlanting = Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24));

    // Calculate current growth stage based on days since planting and typical growth days
    let currentStage = 'seedling';
    const growthDays = parseInt(crop.growthDays) || 90; // Default to 90 days if not specified

    if (daysSincePlanting > growthDays * 0.8) {
      currentStage = 'mature';
    } else if (daysSincePlanting > growthDays * 0.6) {
      currentStage = 'fruiting';
    } else if (daysSincePlanting > growthDays * 0.3) {
      currentStage = 'flowering';
    } else if (daysSincePlanting > growthDays * 0.1) {
      currentStage = 'vegetative';
    }

    // Add generic growth stage tasks if we don't have similar tasks already
    switch (currentStage) {
      case 'seedling':
        if (!hasSimilarRecentTask('irrigation', ['water', 'irrigation', 'seedling'])) {
          tasks.push({
            title: `Water ${crop.name} seedlings carefully`,
            description: `Newly planted ${crop.name} seedlings need gentle watering to establish roots. Avoid overwatering but keep soil consistently moist.`,
            category: 'irrigation',
            priority: 'high',
            dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
            source: 'growth_stage',
            generationFactors: {
              cropStage: currentStage
            }
          });
        }
        break;

      case 'vegetative':
        if (!hasSimilarRecentTask('fertilization', ['fertilize', 'nutrient', 'vegetative'])) {
          tasks.push({
            title: `Apply vegetative growth fertilizer to ${crop.name}`,
            description: `${crop.name} plants are in vegetative growth stage and need nitrogen-rich fertilizer to develop strong leaves and stems.`,
            category: 'fertilization',
            priority: 'medium',
            dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            source: 'growth_stage',
            generationFactors: {
              cropStage: currentStage
            }
          });
        }
        break;

      case 'flowering':
        if (!hasSimilarRecentTask('fertilization', ['flowering', 'bloom', 'phosphorus'])) {
          tasks.push({
            title: `Apply bloom fertilizer to ${crop.name}`,
            description: `${crop.name} plants are flowering and need phosphorus-rich fertilizer to support bloom development.`,
            category: 'fertilization',
            priority: 'medium',
            dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            source: 'growth_stage',
            generationFactors: {
              cropStage: currentStage
            }
          });
        }

        if (!hasSimilarRecentTask('pest_control', ['inspect', 'pest', 'flower'])) {
          tasks.push({
            title: `Inspect ${crop.name} for pests during flowering`,
            description: `Flowering ${crop.name} plants can attract pests. Carefully check for signs of infestation, especially on flower buds.`,
            category: 'pest_control',
            priority: 'medium',
            dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
            source: 'growth_stage',
            generationFactors: {
              cropStage: currentStage
            }
          });
        }
        break;

      case 'fruiting':
        if (!hasSimilarRecentTask('irrigation', ['water', 'fruiting', 'consistent'])) {
          tasks.push({
            title: `Maintain consistent irrigation for ${crop.name} during fruiting`,
            description: `${crop.name} plants need consistent moisture during fruit development to prevent issues like cracking and blossom end rot.`,
            category: 'irrigation',
            priority: 'high',
            dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
            source: 'growth_stage',
            generationFactors: {
              cropStage: currentStage
            }
          });
        }

        if (!hasSimilarRecentTask('general', ['support', 'stake', 'fruit'])) {
          tasks.push({
            title: `Check support structures for ${crop.name}`,
            description: `As ${crop.name} develops heavy fruit, ensure any support structures (stakes, trellises) are secure and plants are properly supported.`,
            category: 'general',
            priority: 'medium',
            dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            source: 'growth_stage',
            generationFactors: {
              cropStage: currentStage
            }
          });
        }
        break;

      case 'mature':
        if (!hasSimilarRecentTask('harvesting', ['harvest', 'ripe', 'mature'])) {
          tasks.push({
            title: `Check ${crop.name} for harvest readiness`,
            description: `${crop.name} crops are nearing maturity. Monitor for harvest indicators like color, firmness, and size.`,
            category: 'harvesting',
            priority: 'high',
            dueDate: today, // Today
            source: 'growth_stage',
            generationFactors: {
              cropStage: currentStage
            }
          });
        }
        break;
    }
  }

  // 2. Weather-Based Tasks
  if (includeWeatherTasks && weatherData) {
    // Check for high temperature alert
    if (weatherData.temp > 32 && !hasSimilarRecentTask('weather_response', ['heat', 'temperature', 'shade'])) {
      tasks.push({
        title: `Protect ${crop.name} from high temperatures`,
        description: `Temperatures are expected to exceed 32°C. Consider providing shade or additional irrigation to protect your ${crop.name} crop.`,
        category: 'weather_response',
        priority: 'high',
        dueDate: today, // Today
        source: 'weather_alert',
        generationFactors: {
          weather: {
            conditions: 'high temperature',
            temperature: weatherData.temp
          }
        }
      });
    }

    // Check for upcoming rain and adjust irrigation
    const rainForecast = weatherData.daily?.find(d =>
      d.values.precipitationProbability > 70 || d.values.precipitation > 5
    );

    if (rainForecast && !hasSimilarRecentTask('irrigation', ['rain', 'precipitation', 'adjust'])) {
      const rainDate = new Date(rainForecast.time);

      tasks.push({
        title: `Adjust irrigation schedule due to forecast rain`,
        description: `Heavy rain is forecast for ${rainDate.toLocaleDateString()}. Reduce or pause irrigation to prevent overwatering your ${crop.name} crop.`,
        category: 'irrigation',
        priority: 'medium',
        dueDate: new Date(rainDate.getTime() - 24 * 60 * 60 * 1000), // Day before rain
        source: 'weather_alert',
        generationFactors: {
          weather: {
            conditions: 'forecasted precipitation',
            rainfall: rainForecast.values.precipitation
          }
        }
      });
    }

    // Check for frost warning (temperature below 2°C)
    const frostForecast = weatherData.daily?.find(d =>
      d.values.temperatureMin < 2
    );

    if (frostForecast && !hasSimilarRecentTask('weather_response', ['frost', 'freeze', 'protect'])) {
      const frostDate = new Date(frostForecast.time);

      tasks.push({
        title: `Protect ${crop.name} from frost`,
        description: `Frost is forecast for ${frostDate.toLocaleDateString()} with temperatures dropping to ${frostForecast.values.temperatureMin}°C. Cover sensitive ${crop.name} plants or bring them indoors if possible.`,
        category: 'weather_response',
        priority: 'urgent',
        dueDate: new Date(frostDate.getTime() - 24 * 60 * 60 * 1000), // Day before frost
        source: 'weather_alert',
        generationFactors: {
          weather: {
            conditions: 'forecasted frost',
            temperature: frostForecast.values.temperatureMin
          }
        }
      });
    }

    // Check for extended dry period
    const dryPeriod = weatherData.daily?.every(d =>
      d.values.precipitation < 2 && d.values.precipitationProbability < 30
    );

    if (dryPeriod && !hasSimilarRecentTask('irrigation', ['drought', 'dry', 'mulch'])) {
      tasks.push({
        title: `Apply mulch to retain moisture for ${crop.name}`,
        description: `A dry period is expected for the next week. Apply mulch around ${crop.name} plants to conserve soil moisture and reduce watering needs.`,
        category: 'irrigation',
        priority: 'medium',
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        source: 'weather_alert',
        generationFactors: {
          weather: {
            conditions: 'extended dry period'
          }
        }
      });
    }
  }

  // 3. Disease Risk Tasks
  if (includeDiseaseTasks && diseaseRisks && Object.keys(diseaseRisks).length > 0) {
    Object.entries(diseaseRisks).forEach(([disease, risk]) => {
      if (risk.level === 'high' && !hasSimilarRecentTask('disease_treatment', [disease, 'treatment', 'spray'])) {
        tasks.push({
          title: `Treat ${crop.name} for ${disease} risk`,
          description: `High risk of ${disease} detected for your ${crop.name} crop. Apply appropriate treatment as soon as possible to prevent spread.`,
          category: 'disease_treatment',
          priority: 'urgent',
          dueDate: today, // Today
          source: 'disease_detection',
          generationFactors: {
            diseaseRisk: {
              disease: disease,
              riskLevel: 'high'
            }
          }
        });
      } else if (risk.level === 'medium' && !hasSimilarRecentTask('disease_treatment', [disease, 'monitor', 'inspect'])) {
        tasks.push({
          title: `Monitor ${crop.name} for ${disease} symptoms`,
          description: `Medium risk of ${disease} detected for your ${crop.name} crop. Carefully inspect plants for early symptoms and be prepared to treat if necessary.`,
          category: 'disease_treatment',
          priority: 'high',
          dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
          source: 'disease_detection',
          generationFactors: {
            diseaseRisk: {
              disease: disease,
              riskLevel: 'medium'
            }
          }
        });
      }
    });
  }

  // Add generic maintenance tasks if needed
  if (tasks.length === 0 || (tasks.length < 2 && Math.random() > 0.5)) {
    if (!hasSimilarRecentTask('general', ['inspect', 'check', 'monitor'])) {
      tasks.push({
        title: `General inspection of ${crop.name} crop`,
        description: `Perform a thorough inspection of your ${crop.name} plants, checking for any signs of pests, disease, nutrient deficiencies, or other issues.`,
        category: 'general',
        priority: 'medium',
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        source: 'system_generated'
      });
    }
  }

  // Set user and crop IDs for all tasks
  return tasks.map(task => ({
    ...task,
    user: userId,
    crop: crop._id
  }));
}

/**
 * Save generated task recommendations to the database
 * 
 * @param {Array} tasks - Array of task objects to save
 * @returns {Array} - Array of saved task documents
 */
async function saveRecommendations(tasks) {
  const savedTasks = [];

  for (const task of tasks) {
    const newTask = new Task(task);
    await newTask.save();
    savedTasks.push(newTask);
  }

  return savedTasks;
}

/**
 * Generate and save task recommendations for all crops belonging to a user
 * 
 * @param {String} userId - User ID
 * @param {Object} options - Configuration options
 * @returns {Object} - Results of task generation
 */
/**
 * Enhanced function to generate user task recommendations with rate limiting
 * @param {String} userId - User ID
 * @param {Object} options - Enhanced configuration options
 * @returns {Object} - Results of task generation
 */
async function generateAllUserTaskRecommendations(userId, options = {}) {
  const Crop = require('../models/Crop');

  // Find all active crops for the user
  const crops = await Crop.find({
    user: userId,
    status: { $in: ['Growing', 'Planning', 'Harvested'] } // Include recently harvested for post-harvest tasks
  });

  if (!crops.length) {
    return { success: true, message: 'No active crops found', taskCount: 0, cropResults: [] };
  }

  let totalTasksGenerated = 0;
  const results = [];

  console.log(`Generating tasks for ${crops.length} crops for user ${userId}`);

  // For each crop, generate recommendations with rate limiting
  for (const crop of crops) {
    try {
      // Enhanced options with crop-specific context
      const cropSpecificOptions = {
        ...options,
        maxTasksPerDay: options.maxTasksPerDay || 5, // Limit to 5 tasks per day
        // Use AI generation only for the first crop to avoid rate limits
        useAIGeneration: process.env.GEMINI_API_KEY && results.length === 0,
        // Enhanced weather context
        weatherData: options.weatherData || { temp: 25, daily: [] },
        // Disease risk assessment (can be expanded with ML models)
        diseaseRisks: options.diseaseRisks || {},
        // Seasonal and location-based adjustments
        includeSeasonalTasks: options.includeSeasonalTasks !== false,
        // Prioritization based on crop value and urgency
        prioritizeUrgentTasks: options.prioritizeUrgentTasks !== false
      };

      // Generate tasks using the enhanced system
      let tasks = [];

      if (cropSpecificOptions.useAIGeneration && process.env.GEMINI_API_KEY) {
        try {
          // Try AI generation only for the first crop to manage rate limits
          const User = require('../models/User');
          const user = await User.findById(userId);
          const aiTasks = await generateAIRecommendations(crop, user);

          // Convert AI tasks to proper format
          tasks = aiTasks.map(task => ({
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority || 'medium',
            dueDate: task.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            user: userId,
            crop: crop._id,
            source: 'ai_generated',
            isRecommendation: true
          }));

          console.log(`Generated ${tasks.length} AI tasks for crop ${crop.name} (${crop._id})`);
        } catch (aiError) {
          console.warn(`AI generation failed for crop ${crop._id}, using rule-based generation:`, aiError.message);
          // Fallback to rule-based generation
          tasks = await generateRecommendations(crop, cropSpecificOptions.weatherData, cropSpecificOptions.diseaseRisks, cropSpecificOptions);
        }
      } else {
        // Use rule-based generation for subsequent crops to avoid rate limits
        tasks = await generateRecommendations(crop, cropSpecificOptions.weatherData, cropSpecificOptions.diseaseRisks, cropSpecificOptions);
      }

      // Save the generated tasks
      const savedTasks = await saveRecommendations(tasks);

      totalTasksGenerated += savedTasks.length;
      results.push({
        cropId: crop._id,
        cropName: crop.name,
        cropVariety: crop.variety,
        tasksGenerated: savedTasks.length,
        taskCategories: savedTasks.map(t => t.category),
        generationMethod: cropSpecificOptions.useAIGeneration ? 'ai_with_fallback' : 'rule_based'
      });

      console.log(`Successfully generated ${savedTasks.length} tasks for ${crop.name} (${crop._id})`);

    } catch (error) {
      console.error(`Error generating tasks for crop ${crop._id} (${crop.name}):`, error.message);
      results.push({
        cropId: crop._id,
        cropName: crop.name,
        error: error.message,
        tasksGenerated: 0
      });
    }
  }

  // Log generation summary
  const successfulCrops = results.filter(r => !r.error).length;
  const failedCrops = results.filter(r => r.error).length;

  console.log(`Task generation complete for user ${userId}: ${totalTasksGenerated} tasks across ${successfulCrops} crops (${failedCrops} failed)`);

  return {
    success: true,
    taskCount: totalTasksGenerated,
    cropResults: results,
    summary: {
      totalCrops: crops.length,
      successfulCrops,
      failedCrops,
      tasksPerCrop: Math.round(totalTasksGenerated / Math.max(successfulCrops, 1))
    }
  };
}

/**
 * Clear cached recommendations for a specific crop
 * @param {string} cropId - The ID of the crop
 */
function clearCachedRecommendations(cropId) {
  recommendationsCache.delete(cropId);
}

/**
 * Clear all cached recommendations
 */
function clearAllCachedRecommendations() {
  recommendationsCache.clear();
}

/**
 * Helper function to determine current season based on month
 * @param {number} month - Month number (1-12)
 * @returns {string} - Season name
 */
function getCurrentSeason(month) {
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn/Fall';
  return 'Winter';
}

/**
 * Generate task recommendations using Gemini AI
 * @param {Object} crop - The crop object
 * @param {Object} user - The user object
 * @returns {Promise<Array>} - Array of task recommendations
 */
async function generateAIRecommendations(crop, user) {
  try {
    if (!genAI) {
      throw new Error('Gemini API key not configured');
    }

    // Get existing tasks for this crop to avoid duplicates
    const existingTasks = await Task.find({
      crop: crop._id,
      user: user._id,
      status: 'pending'
    });

    // Extract task titles for deduplication
    const existingTaskTitles = existingTasks.map(task => task.title.toLowerCase());

    // Get recent activities for this crop (last 60 days for comprehensive context)
    const Activity = require('../models/Activity');
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentActivities = await Activity.find({
      crop: crop._id,
      user: user._id,
      date: { $gte: sixtyDaysAgo }
    }).sort({ date: -1 }).limit(20); // Get last 20 activities for context

    // Format activities for prompt
    const activityHistory = recentActivities.map(activity => {
      const activityDate = new Date(activity.date).toLocaleDateString();
      return `${activityDate}: ${activity.title} (${activity.activityType}) - ${activity.description || 'No details'}`;
    }).join('\n');

    // Get crop's embedded event history for additional context
    const cropEvents = [];

    // Recent irrigation events
    if (crop.irrigationHistory && crop.irrigationHistory.length > 0) {
      const recentIrrigation = crop.irrigationHistory.slice(-3); // Last 3 irrigation events
      recentIrrigation.forEach(event => {
        const eventDate = new Date(event.date).toLocaleDateString();
        cropEvents.push(`${eventDate}: Irrigation - ${event.method || 'Unknown method'}, ${event.amount || 'Unknown amount'} ${event.notes ? '(' + event.notes + ')' : ''}`);
      });
    }

    // Recent fertilization events
    if (crop.fertilizationHistory && crop.fertilizationHistory.length > 0) {
      const recentFertilization = crop.fertilizationHistory.slice(-3);
      recentFertilization.forEach(event => {
        const eventDate = new Date(event.date).toLocaleDateString();
        cropEvents.push(`${eventDate}: Fertilization - ${event.type || 'Unknown type'}, ${event.product || 'Unknown product'} ${event.notes ? '(' + event.notes + ')' : ''}`);
      });
    }

    // Recent pest/disease events
    if (crop.pestDiseaseHistory && crop.pestDiseaseHistory.length > 0) {
      const recentPestDisease = crop.pestDiseaseHistory.slice(-3);
      recentPestDisease.forEach(event => {
        const eventDate = new Date(event.date).toLocaleDateString();
        cropEvents.push(`${eventDate}: ${event.type || 'Issue'} - ${event.name || 'Unknown'}, Severity: ${event.severity || 'N/A'} ${event.treatment?.product ? 'Treated with: ' + event.treatment.product : ''}`);
      });
    }

    // Recent growth records
    if (crop.growthHistory && crop.growthHistory.length > 0) {
      const recentGrowth = crop.growthHistory.slice(-3);
      recentGrowth.forEach(event => {
        const eventDate = new Date(event.date).toLocaleDateString();
        cropEvents.push(`${eventDate}: Growth Record - Stage: ${event.stage || 'Unknown'}, Height: ${event.height || 'N/A'}, Health: ${event.healthRating || 'N/A'}/10`);
      });
    }

    const cropEventHistory = cropEvents.length > 0 ? cropEvents.join('\n') : 'No recorded events in crop history';
    const combinedActivityContext = `${activityHistory}${activityHistory && cropEventHistory ? '\n\n' : ''}${cropEventHistory}`;
    const activityContextForPrompt = combinedActivityContext || 'No recent activities or events recorded';;

    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: "gemini-pro"
    });

    // Calculate crop age and growth stage for better task recommendations
    const plantingDate = new Date(crop.plantingDate);
    const today = new Date();
    const cropAgeInDays = Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24));

    // Determine current season for seasonal recommendations
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentSeason = getCurrentSeason(currentMonth);

    // Get upcoming dates for task scheduling
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Create a comprehensive and enhanced prompt for better results
    const maxTasksPerDay = options.maxTasksPerDay || 5; // Default to 5 tasks maximum
    const prompt = `
      You are an expert agricultural consultant with 20+ years of experience in crop management and sustainable farming practices. Generate a MAXIMUM of ${maxTasksPerDay} highly specific, actionable, and scientifically-backed agricultural tasks for a ${crop.name} crop.

      IMPORTANT: Generate ONLY the most critical and essential tasks. Quality over quantity - focus on the highest impact activities that are most crucial for crop health and yield.

      === CROP ANALYSIS ===
      Crop: ${crop.name} (${crop.variety || 'Standard variety'})
      Planting Date: ${crop.plantingDate}
      Crop Age: ${cropAgeInDays} days since planting
      Current Growth Stage: ${crop.growthStage || 'Not specified'}
      Farm Location: ${user.location || 'General region'}
      Current Season: ${currentSeason}
      Today's Date: ${today.toISOString().split('T')[0]}

      === TASK GENERATION CRITERIA ===
      1. **Priority-Based Recommendations**: Focus on time-sensitive, growth-stage appropriate tasks
      2. **Scientific Rationale**: Each task should have agricultural science backing
      3. **Seasonal Relevance**: Consider current season and upcoming weather patterns
      4. **Preventive Care**: Include disease prevention, pest management, and soil health
      5. **Resource Optimization**: Consider water conservation, nutrient efficiency
      6. **Harvest Optimization**: If near harvest, include quality and yield optimization tasks
      
      === TASK CATEGORIES TO PRIORITIZE ===
      - **Critical/Urgent**: irrigation, disease_treatment, pest_control (if immediate action needed)
      - **Important**: fertilization, soil_management, pruning (for optimal growth)
      - **Preventive**: weather_response, general monitoring (for long-term health)
      - **Harvest-Ready**: harvesting (only if crop is mature enough)

      === EXISTING TASKS TO AVOID ===
      Do not duplicate these existing pending tasks: ${existingTaskTitles.length > 0 ? existingTaskTitles.join(', ') : 'None'}

      === RECENT CROP ACTIVITIES & HISTORY ===
      Recent activities and events for this crop (last 60 days):
      ${activityContextForPrompt}
      
      **Important**: Consider this activity history when generating tasks:
      - Avoid recommending recently completed activities
      - Build upon previous work (e.g., if fertilized recently, focus on other needs)
      - Address any issues mentioned in pest/disease history
      - Consider irrigation patterns and adjust watering recommendations
      - Factor in growth stage progression from growth records
      - Use treatment effectiveness data to improve future recommendations

      === OUTPUT REQUIREMENTS ===
      Generate MAXIMUM ${maxTasksPerDay} tasks as a JSON array with these exact properties:
      CRITICAL: Return only the most essential tasks - prioritize quality over quantity!
      Focus on the highest impact activities that are absolutely necessary for optimal crop health.
      
      - title: Specific, actionable task title (avoid generic terms)
      - description: Detailed scientific explanation with step-by-step instructions, benefits, and timing rationale
      - category: One of [irrigation, fertilization, pest_control, disease_treatment, harvesting, planting, pruning, soil_management, weather_response, general]
      - dueDate: ISO date string (YYYY-MM-DD) - consider urgency and crop growth cycle
      - priority: One of [low, medium, high, urgent] based on impact on crop health and yield

      TASK PRIORITIZATION ORDER:
      1. **URGENT/CRITICAL**: Immediate threats to crop survival (disease, severe pest issues, drought stress)
      2. **HIGH PRIORITY**: Time-sensitive activities for optimal growth (irrigation, fertilization at key stages)
      3. **MEDIUM PRIORITY**: Important maintenance that supports healthy development
      4. **LOW PRIORITY**: Only include if fewer than ${maxTasksPerDay} higher priority tasks exist

      === TASK FOCUS AREAS ===
      1. **Growth Stage Specific**: Tasks appropriate for current ${cropAgeInDays}-day-old ${crop.name}
      2. **Seasonal Activities**: ${currentSeason}-appropriate farming activities
      3. **Preventive Measures**: Disease/pest prevention before problems occur
      4. **Yield Optimization**: Tasks that maximize quality and quantity of harvest
      5. **Resource Efficiency**: Water-smart and nutrient-efficient practices
      6. **Soil Health**: Long-term soil fertility and structure improvement
      7. **Weather Preparedness**: Tasks to prepare for seasonal weather changes
      8. **Activity-Based Planning**: Use recent activity history to plan complementary tasks
      9. **Issue Resolution**: Address any problems identified in pest/disease or growth records
      10. **Timing Optimization**: Schedule tasks based on previous activity patterns and effectiveness

      **Context Integration Guidelines**:
      - If recent irrigation shows good soil moisture, focus on other maintenance
      - If pest/disease issues were treated, schedule follow-up monitoring
      - If fertilization was recent, consider micronutrient or organic supplements
      - If growth records show stress, prioritize recovery and health restoration
      - Use activity patterns to optimize timing (e.g., if user typically waters mornings)

      Return ONLY the JSON array, no additional text or explanations.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract the JSON object from the response
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    // Parse JSON
    const parsedRecommendations = JSON.parse(jsonMatch[0]);

    // Generate unique IDs for recommendations to help track selections
    const recommendations = parsedRecommendations.map((rec, index) => ({
      id: `rec-${Date.now()}-${index}`,
      ...rec
    }));

    return recommendations;
  } catch (error) {
    console.error('Error generating AI task recommendations:', error);
    throw error;
  }
}

module.exports = {
  generateRecommendations,
  saveRecommendations,
  generateAllUserTaskRecommendations,
  clearCachedRecommendations,
  clearAllCachedRecommendations,
  generateAIRecommendations
};