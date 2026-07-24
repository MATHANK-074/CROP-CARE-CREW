/**
 * Optimized Task Recommendation Generator
 * This service handles task recommendations with performance optimizations:
 * 1. Caches recommendations to reduce API calls
 * 2. Implements request debouncing
 * 3. Processes recommendations in a non-blocking way
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Crop = require('../models/Crop');
const Task = require('../models/Task');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cache for storing recommendations to reduce API calls
// Structure: { cropId: { recommendations: [...], timestamp: Date } }
const recommendationsCache = new Map();

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

// In-flight requests tracking to prevent duplicate API calls
const pendingRequests = new Map();

/**
 * Generate task recommendations for a specific crop
 * @param {string} cropId - The ID of the crop
 * @param {Object} user - The user object
 * @returns {Promise<Array>} - Array of task recommendations
 */
async function generateTaskRecommendations(cropId, user) {
  try {
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
    const requestPromise = generateRecommendationsFromAPI(cropId, user);
    pendingRequests.set(cropId, requestPromise);

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
 * Generate task recommendations from the AI API
 * @param {string} cropId - The ID of the crop
 * @param {Object} user - The user object
 * @returns {Promise<Array>} - Array of task recommendations
 */
async function generateRecommendationsFromAPI(cropId, user) {
  try {
    // Get crop details
    const crop = await Crop.findById(cropId);
    if (!crop) {
      throw new Error('Crop not found');
    }

    // Get existing tasks for this crop to avoid duplicates
    const existingTasks = await Task.find({
      cropId: cropId,
      userId: user._id,
      status: 'pending'
    });

    // Extract task titles for deduplication
    const existingTaskTitles = existingTasks.map(task => task.title.toLowerCase());

    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: "gemini-pro"
    });

    // Create a structured prompt for better results
    const prompt = `
      Generate 5 agricultural tasks for a ${crop.name} crop that was planted on ${crop.plantingDate}.
      
      Crop Details:
      - Name: ${crop.name}
      - Variety: ${crop.variety || 'N/A'}
      - Planting Date: ${crop.plantingDate}
      - Growth Stage: ${crop.growthStage || 'Not specified'}
      - Location: ${user.location || 'Not specified'}
      
      For each task, provide:
      1. A clear, specific title (not generic)
      2. A detailed description with actionable steps
      3. A category from this list: irrigation, fertilization, pest_control, disease_treatment, harvesting, planting, pruning, soil_management, weather_response, general
      4. An appropriate due date based on the crop's timeline
      
      Format the response as a JSON array of task objects with these properties: title, description, category, dueDate.
      
      Please avoid suggesting these existing tasks:
      ${existingTaskTitles.join(', ')}
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
    console.error('Error generating task recommendations:', error);
    throw error;
  }
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

module.exports = {
  generateTaskRecommendations,
  clearCachedRecommendations,
  clearAllCachedRecommendations
};