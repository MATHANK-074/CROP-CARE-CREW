/**
 * Chatbot Demo Page
 * 
 * A simple demo page to test the chatbot functionality
 * This can be used for testing and demonstrations
 */

import React, { useState } from 'react';
import { ChatActions, useChatIntegration, ChatPrompts } from '../api/chat';
import { FaRobot, FaSeedling, FaCloudRain, FaTractor } from 'react-icons/fa';

const ChatbotDemo = () => {
  const { sendMessage, quickActions, isLoading, lastResponse, error, clearError } = useChatIntegration();
  const [testMessage, setTestMessage] = useState('');
  const [responses, setResponses] = useState([]);

  const handleSendTest = async () => {
    if (!testMessage.trim()) return;

    try {
      const response = await sendMessage(testMessage);
      setResponses(prev => [...prev, {
        message: testMessage,
        response: response.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setTestMessage('');
    } catch (err) {
      console.error('Test failed:', err);
    }
  };

  const handleQuickAction = async (actionName, actionFn) => {
    try {
      const response = await actionFn();
      setResponses(prev => [...prev, {
        message: `Quick Action: ${actionName}`,
        response: response.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      console.error('Quick action failed:', err);
    }
  };

  const handlePromptTest = async (prompt) => {
    try {
      const response = await sendMessage(prompt);
      setResponses(prev => [...prev, {
        message: prompt,
        response: response.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      console.error('Prompt test failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaRobot className="text-3xl text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Farming Assistant Chatbot Demo</h1>
        </div>

        {/* Test Message Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Custom Message
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSendTest()}
            />
            <button
              onClick={handleSendTest}
              disabled={isLoading || !testMessage.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleQuickAction('Add Crop', () => quickActions.addCrop('tomato'))}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200 disabled:opacity-50"
            >
              <FaSeedling />
              <span>Add Crop</span>
            </button>
            <button
              onClick={() => handleQuickAction('Get Crops', quickActions.getCrops)}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              <FaTractor />
              <span>My Crops</span>
            </button>
            <button
              onClick={() => handleQuickAction('Weather', quickActions.getWeather)}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-md hover:bg-yellow-200 disabled:opacity-50"
            >
              <FaCloudRain />
              <span>Weather</span>
            </button>
            <button
              onClick={() => handleQuickAction('Fertilizer', () => quickActions.recordFertilizer('wheat', 'NPK', '10kg'))}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-md hover:bg-purple-200 disabled:opacity-50"
            >
              <FaRobot />
              <span>Fertilizer</span>
            </button>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Sample Prompts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ChatPrompts.GETTING_STARTED.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptTest(prompt)}
                disabled={isLoading}
                className="text-left bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">×</button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Processing...</span>
          </div>
        )}
      </div>

      {/* Responses */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Chat Responses</h2>

        {responses.length === 0 ? (
          <p className="text-gray-500 italic">No responses yet. Try sending a message or using quick actions!</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {responses.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-2">
                  <span className="text-sm text-gray-500">{item.timestamp}</span>
                  <div className="bg-blue-50 px-3 py-2 rounded mt-1">
                    <strong>You:</strong> {item.message}
                  </div>
                </div>
                <div className="bg-green-50 px-3 py-2 rounded">
                  <strong>Assistant:</strong> {item.response}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotDemo;