/**
 * Chat API Integration Helper
 * 
 * This file provides utility functions for integrating the farming assistant
 * into other parts of your application without the full UI component.
 */

import React from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * Send a direct message to the farming assistant
 * @param {string} message - The message to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The response from the assistant
 */
export async function sendChatMessage(message, options = {}) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

/**
 * Quick actions for common farming operations
 */
export const ChatActions = {

  /**
   * Add a crop through chat interface
   */
  async addCrop(cropName, options = {}) {
    const message = `Add ${cropName} to my farm${options.variety ? ` (${options.variety} variety)` : ''}${options.location ? ` at ${options.location}` : ''}`;
    return await sendChatMessage(message);
  },

  /**
   * Get crop status
   */
  async getCropStatus(cropName = null) {
    const message = cropName ? `Show me the status of my ${cropName}` : 'Show me all my crops';
    return await sendChatMessage(message);
  },

  /**
   * Record fertilizer application
   */
  async recordFertilizer(cropName, fertilizerType, amount) {
    const message = `I applied ${amount} of ${fertilizerType} fertilizer to my ${cropName}`;
    return await sendChatMessage(message);
  },

  /**
   * Get weather information
   */
  async getWeatherAdvice(location = null) {
    const message = location ? `What's the weather like in ${location}?` : "What's the weather like for farming?";
    return await sendChatMessage(message);
  },

  /**
   * Remove a crop
   */
  async removeCrop(cropName) {
    const message = `Remove ${cropName} from my farm`;
    return await sendChatMessage(message);
  },

  /**
   * Update field information
   */
  async updateField(cropName, fieldData) {
    let message = `Update my ${cropName} field`;

    if (fieldData.location) {
      message += ` location to ${fieldData.location}`;
    }
    if (fieldData.soilType) {
      message += ` with soil type ${fieldData.soilType}`;
    }
    if (fieldData.fieldSize) {
      message += ` and field size ${fieldData.fieldSize} acres`;
    }

    return await sendChatMessage(message);
  }
};

/**
 * Chat integration hooks for React components
 */
export function useChatIntegration() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastResponse, setLastResponse] = React.useState(null);
  const [error, setError] = React.useState(null);

  const sendMessage = React.useCallback(async (message, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(message, options);
      setLastResponse(response);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const quickActions = React.useMemo(() => ({
    addCrop: (cropName, options) => sendMessage(`Add ${cropName} to my farm`, options),
    getCrops: () => sendMessage('Show me all my crops'),
    getWeather: () => sendMessage("What's the weather like for farming?"),
    recordFertilizer: (cropName, type, amount) =>
      sendMessage(`I applied ${amount} of ${type} fertilizer to my ${cropName}`),
  }), [sendMessage]);

  return {
    sendMessage,
    quickActions,
    isLoading,
    lastResponse,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Pre-built chat prompts for common scenarios
 */
export const ChatPrompts = {
  GETTING_STARTED: [
    "What crops should I plant this season?",
    "Show me all my current crops",
    "What's the weather forecast for farming?",
    "Help me plan my farming activities"
  ],

  CROP_MANAGEMENT: [
    "Add tomatoes to my farm",
    "How are my crops doing?",
    "I need to harvest my wheat",
    "Update my corn field location"
  ],

  FERTILIZER_AND_CARE: [
    "I applied NPK fertilizer to my rice today",
    "When should I fertilize my vegetables?",
    "My plants look unhealthy, what should I do?",
    "How much water do my crops need?"
  ],

  WEATHER_AND_PLANNING: [
    "Will it rain this week?",
    "Is it a good time to plant?",
    "Should I irrigate today?",
    "What farming activities should I do tomorrow?"
  ],

  HARVEST_AND_SALES: [
    "Mark my corn as harvested",
    "When should I harvest my tomatoes?",
    "What are the current market prices?",
    "Help me plan my harvest schedule"
  ]
};

export default {
  sendChatMessage,
  ChatActions,
  useChatIntegration,
  ChatPrompts
};