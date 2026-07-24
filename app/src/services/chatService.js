/**
 * Chat Service - Handles communication with the farming assistant chatbot
 * 
 * This service manages:
 * - Sending messages to the chat API
 * - Managing conversation history
 * - Handling authentication
 * - Error handling and retries
 */

import { API_BASE_URL } from '../config/api';

class ChatService {
  constructor() {
    this.conversationHistory = [];
    this.isTyping = false;
    this.apiBaseUrl = API_BASE_URL;
  }

  /**
   * Send a message to the chatbot and get response
   * @param {string} message - User message
   * @param {Object} options - Additional options (userLocation, locationError, etc.)
   * @returns {Promise<Object>} - Chat response
   */
  async sendMessage(message, options = {}) {
    try {
      this.isTyping = true;

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory.slice(-10), // Limit history
          userLocation: options.userLocation, // Include user location
          locationError: options.locationError, // Include location error if any
          ...options
        })
      });

      const data = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = data.retryAfter ? Math.ceil(data.retryAfter / 1000) : 30;
        throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.message || `Chat service error: ${response.statusText}`);
      }

      // Add messages to conversation history
      this.addToHistory('user', message);
      this.addToHistory('assistant', data.message);

      return {
        success: true,
        message: data.message,
        functionCalls: data.functionCalls || [],
        timestamp: data.timestamp,
        conversationId: data.conversationId,
        fallback: data.fallback
      };

    } catch (error) {
      console.error('Chat service error:', error);

      // Return error in a consistent format
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.message,
        timestamp: new Date().toISOString(),
        isRateLimited: error.message.includes('Rate limit') || error.message.includes('Too many requests')
      };
    } finally {
      this.isTyping = false;
    }
  }

  /**
   * Add message to conversation history
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Message content
   */
  addToHistory(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    // Limit history to prevent API limits (keep last 20 messages)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  /**
   * Get current conversation history
   * @returns {Array} - Array of conversation messages
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Check if chatbot is currently typing
   * @returns {boolean}
   */
  getIsTyping() {
    return this.isTyping;
  }

  /**
   * Get user-friendly error messages
   * @param {Error} error - Error object
   * @returns {string} - User-friendly error message
   */
  getErrorMessage(error) {
    if (error.message.includes('Authentication required')) {
      return "🔒 Please log in to use the farming assistant.";
    }

    if (error.message.includes('Session expired')) {
      return "🔒 Your session has expired. Please log in again.";
    }

    if (error.message.includes('Rate limit') || error.message.includes('Too many requests')) {
      return "⏳ Too many requests. Please wait a moment and try again.";
    }

    if (error.message.includes('Network')) {
      return "🌐 Network error. Please check your connection and try again.";
    }

    if (error.message.includes('AI service') || error.message.includes('temporarily unavailable')) {
      return "🤖 AI service is busy. Please try again in a few moments.";
    }

    if (error.message.includes('Gemini API')) {
      return "🤖 AI service temporarily unavailable. Please try again in a moment.";
    }

    return "❌ Sorry, I encountered an error. Please try again.";
  }

  /**
   * Get suggested starter messages for new users
   * @returns {Array<string>} - Array of suggested messages
   */
  getSuggestedMessages() {
    return [
      "Show me all my crops",
      "Add tomatoes to my farm",
      "What's the weather like for farming?",
      "I applied fertilizer to my wheat today",
      "How are my crops doing?",
      "Remove corn from my farm",
      "Update my rice field location"
    ];
  }

  /**
   * Get farming tips for empty state
   * @returns {Array<string>} - Array of farming tips
   */
  getFarmingTips() {
    return [
      "💡 Ask me to add crops: 'Add tomatoes to my farm'",
      "🌱 Check your crops: 'Show me all my crops'",
      "🌦️ Get weather updates: 'What's the weather like?'",
      "💊 Record fertilizer use: 'I applied NPK fertilizer to my wheat'",
      "📍 Update field info: 'Update my corn field location to North Field'",
      "🗑️ Remove crops: 'Remove potatoes from my farm'"
    ];
  }

  /**
   * Format message for display (handle markdown, links, etc.)
   * @param {string} message - Raw message
   * @returns {string} - Formatted message
   */
  formatMessage(message) {
    if (!message) return '';

    // Handle basic markdown-style formatting
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/🌱/g, '<span class="text-green-500">🌱</span>') // Green plants
      .replace(/🌧️/g, '<span class="text-blue-500">🌧️</span>') // Blue rain
      .replace(/☀️/g, '<span class="text-yellow-500">☀️</span>') // Yellow sun
      .replace(/✅/g, '<span class="text-green-500">✅</span>') // Green check
      .replace(/❌/g, '<span class="text-red-500">❌</span>'); // Red X
  }

  /**
   * Extract action items from chatbot response
   * @param {Object} response - Chatbot response
   * @returns {Array} - Array of action items
   */
  extractActionItems(response) {
    const actions = [];

    if (response.functionCalls && response.functionCalls.length > 0) {
      response.functionCalls.forEach(call => {
        switch (call.function) {
          case 'addCrop':
            actions.push({
              type: 'crop_added',
              crop: call.args.cropName,
              icon: '🌱'
            });
            break;
          case 'removeCrop':
            actions.push({
              type: 'crop_removed',
              crop: call.args.cropName,
              icon: '🗑️'
            });
            break;
          case 'addFertilizer':
            actions.push({
              type: 'fertilizer_applied',
              crop: call.args.cropName,
              fertilizer: call.args.type,
              icon: '💊'
            });
            break;
          case 'getWeather':
            actions.push({
              type: 'weather_checked',
              location: call.args.location || 'your area',
              icon: '🌤️'
            });
            break;
        }
      });
    }

    return actions;
  }

  /**
   * Check if user message contains farming intent
   * @param {string} message - User message
   * @returns {Object} - Intent analysis
   */
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Define intent patterns
    const intents = {
      addCrop: /add|plant|grow|start|new.*crop/i,
      removeCrop: /remove|delete|harvest|stop|get rid of/i,
      listCrops: /show|list|what.*crops|my.*crops|status/i,
      addFertilizer: /fertiliz|apply|feed|nutrient|npk/i,
      getWeather: /weather|rain|temperature|forecast|climate/i,
      updateField: /update|change|modify|edit.*field/i,
      general: /help|hi|hello|how|what|can you/i
    };

    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(lowerMessage)) {
        return {
          intent,
          confidence: 0.8, // Simple confidence score
          requiresAction: intent !== 'general'
        };
      }
    }

    return {
      intent: 'unknown',
      confidence: 0.3,
      requiresAction: false
    };
  }
}

// Create a singleton instance
const chatService = new ChatService();

export default chatService;