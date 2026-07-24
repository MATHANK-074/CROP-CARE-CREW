/**
 * ChatBot Component - Farming Assistant Interface
 * 
 * A modern, responsive chat interface for the farming assistant.
 * Features:
 * - Clean, WhatsApp-like design
 * - Typing indicators
 * - Action item highlights
 * - Suggested messages
 * - Responsive layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaSeedling,
  FaTimes,
  FaComments,
  FaMicrophone,
  FaStop
} from 'react-icons/fa';
import chatService from '../services/chatService';

const ChatBot = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState('en-US');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Supported languages for speech recognition
  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
    { code: 'hi-IN', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
    { code: 'te-IN', name: 'Telugu (తెలుగు)', flag: '🇮🇳' }
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 3;

      // Update language when speechLanguage changes
      recognitionRef.current.lang = speechLanguage;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show interim results in real-time
        setInputMessage(finalTranscript + interimTranscript);

        // Only stop listening when we get a final result
        if (finalTranscript) {
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Speech recognition error';

        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'language-not-supported':
            errorMessage = `Language ${speechLanguage} not supported. Try switching languages.`;
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        // Show error message to user
        const errorMsg = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `🎤 ${errorMessage}`,
          timestamp: new Date().toISOString(),
          isError: true
        };
        setMessages(prev => [...prev, errorMsg]);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [speechLanguage]);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageMenu && !event.target.closest('.language-menu')) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          console.log('User location obtained:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(error.message);

          // Add a helpful message about location
          const locationMessage = {
            id: `location-error-${Date.now()}`,
            role: 'assistant',
            content: `🌍 Location access denied. I'll need you to specify a location for weather updates (e.g., "weather in Mumbai").`,
            timestamp: new Date().toISOString(),
            isSuggestion: true
          };
          setMessages(prev => [...prev, locationMessage]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationError('Geolocation not supported');
      console.log('Geolocation not supported by this browser');
    }
  }, []);

  // Initialize chat with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "🌱 Hello! I'm your farming assistant. I can help you manage crops, check weather, track fertilizer applications, and more. What would you like to do today?",
        timestamp: new Date().toISOString(),
        isWelcome: true
      }]);
    }
  }, []);

  /**
   * Start voice recording
   */
  const startListening = () => {
    if (recognitionRef.current && speechSupported && !isListening) {
      // Update language before starting
      recognitionRef.current.lang = speechLanguage;
      setIsListening(true);
      setInputMessage(''); // Clear previous input

      try {
        recognitionRef.current.start();

        // Add a helpful message
        const helpMessage = {
          id: `help-${Date.now()}`,
          role: 'assistant',
          content: `🎤 Listening in ${supportedLanguages.find(lang => lang.code === speechLanguage)?.name || speechLanguage}. Start speaking...`,
          timestamp: new Date().toISOString(),
          isSuggestion: true
        };
        setMessages(prev => [...prev, helpMessage]);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  /**
   * Stop voice recording
   */
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  /**
   * Change speech recognition language
   */
  const changeSpeechLanguage = (languageCode) => {
    setSpeechLanguage(languageCode);
    setShowLanguageMenu(false);

    // Show confirmation message
    const confirmMessage = {
      id: `lang-change-${Date.now()}`,
      role: 'assistant',
      content: `🌐 Voice language changed to ${supportedLanguages.find(lang => lang.code === languageCode)?.name || languageCode}`,
      timestamp: new Date().toISOString(),
      isSuggestion: true
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  /**
   * Send message to chatbot
   */
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      // Send message to chat service with location data
      const response = await chatService.sendMessage(userMessage.content, {
        userLocation: userLocation,
        locationError: locationError
      });

      // Create assistant message
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
        success: response.success,
        functionCalls: response.functionCalls || [],
        actions: chatService.extractActionItems(response)
      };

      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);

      // If rate limited, show helpful suggestion
      if (response.isRateLimited) {
        setTimeout(() => {
          const suggestionMessage = {
            id: `suggestion-${Date.now()}`,
            role: 'assistant',
            content: "💡 While you wait, you can use the navigation menu to manage crops manually, or try the quick actions below for common tasks.",
            timestamp: new Date().toISOString(),
            isSuggestion: true
          };
          setMessages(prev => [...prev, suggestionMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error('Chat error:', error);

      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: chatService.getErrorMessage(error),
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Use suggested message
   */
  const useSuggestedMessage = (suggestion) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Clear chat history
   */
  const clearChat = () => {
    setMessages([]);
    chatService.clearHistory();
    setShowSuggestions(true);
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 md:bottom-20 left-4 right-4 md:right-6 md:left-auto z-50 md:w-96 w-full max-w-md mx-auto md:mx-0 h-[550px] md:h-[550px] flex flex-col">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 h-full flex flex-col overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 md:p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-white bg-opacity-20 p-1.5 md:p-2 rounded-lg md:rounded-xl backdrop-blur-sm">
              <FaSeedling className="text-sm md:text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base">Farming Assistant</h3>
              <p className="text-green-100 text-xs md:text-sm font-medium">
                {isTyping ? '🤔 Thinking...' : isLoading ? '⚡ Processing...' : isListening ? '🎤 Listening...' : '🟢 Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <button
              onClick={clearChat}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-200 hover:scale-105"
              title="Clear chat"
            >
              <FaComments className="text-sm md:text-base" />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-200 hover:scale-105"
            >
              <FaTimes className="text-sm md:text-base" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-0 pb-4 md:pb-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          {/* Suggested messages */}
          {showSuggestions && messages.length <= 1 && (
            <SuggestedMessages onSelect={useSuggestedMessage} />
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-3 md:p-4 rounded-b-2xl md:rounded-b-3xl flex-shrink-0">
          {/* Input Row */}
          <div className="flex items-end space-x-2 md:space-x-3 mb-2 md:mb-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "🎤 Listening..." : "💬 Type your message"}
                rows="1"
                className="w-full border-2 border-gray-200 rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 pr-20 md:pr-28 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-xs md:text-sm placeholder-gray-500 transition-all duration-200"
                disabled={isLoading || isListening}
                style={{
                  minHeight: '40px',
                  maxHeight: '80px'
                }}
              />

              {/* Voice Controls */}
              {speechSupported && (
                <div className="absolute right-12 md:right-16 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {/* Language selector */}
                  <div className="relative language-menu">
                    <button
                      onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                      className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title="Select voice language"
                    >
                      <span className="text-xs md:text-sm">
                        {supportedLanguages.find(lang => lang.code === speechLanguage)?.flag || '🌐'}
                      </span>
                    </button>

                    {showLanguageMenu && (
                      <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-48 md:min-w-56 max-h-40 md:max-h-48 overflow-y-auto">
                        <div className="p-3">
                          <p className="text-xs font-semibold text-gray-600 mb-3 pb-2 border-b border-gray-100">🎤 Voice Language</p>
                          {supportedLanguages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => changeSpeechLanguage(lang.code)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 flex items-center space-x-3 transition-all duration-200 ${speechLanguage === lang.code ? 'bg-green-50 text-green-800 border border-green-200' : 'text-gray-700'
                                }`}
                            >
                              <span className="text-base">{lang.flag}</span>
                              <span className="font-medium">{lang.name}</span>
                              {speechLanguage === lang.code && <span className="ml-auto text-green-600">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Voice button */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                    className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 shadow-sm ${isListening
                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                      } disabled:opacity-50`}
                    title={isListening ? 'Stop recording' : `Start voice input (${supportedLanguages.find(lang => lang.code === speechLanguage)?.name})`}
                  >
                    {isListening ? <FaStop className="text-xs md:text-sm" /> : <FaMicrophone className="text-xs md:text-sm" />}
                  </button>
                </div>
              )}

              {/* Send button */}
              {inputMessage.trim() && (
                <button
                  onClick={sendMessage}
                  disabled={isLoading || isListening}
                  className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-green-600 to-green-700 text-white p-2 md:p-2.5 rounded-lg md:rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 shadow-md hover:scale-105 hover:shadow-lg"
                >
                  <FaPaperPlane className="text-xs md:text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex space-x-1 md:space-x-2">
            <QuickActionButton
              text="🌾 My crops"
              onClick={() => useSuggestedMessage("Show me all my crops")}
            />
            <QuickActionButton
              text="🌤️ Weather"
              onClick={() => useSuggestedMessage("What's the weather like?")}
            />
            <QuickActionButton
              text="➕ Add crop"
              onClick={() => useSuggestedMessage("Add a new crop to my farm")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual message bubble component
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isSuggestion = message.isSuggestion;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 md:mb-4`}>
      <div className={`max-w-[90%] md:max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Assistant Avatar and Name */}
        {!isUser && (
          <div className="flex items-center mb-1 md:mb-2 px-1">
            <div className="bg-green-100 p-1 md:p-1.5 rounded-lg md:rounded-xl mr-2 shadow-sm">
              <FaRobot className="text-green-600 text-xs md:text-sm" />
            </div>
            <span className="text-xs font-semibold text-gray-600 tracking-wide hidden md:inline">Farming Assistant</span>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl shadow-md ${isUser
            ? 'bg-gradient-to-br from-green-600 to-green-700 text-white rounded-br-md'
            : isError
              ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-800 border border-red-200 rounded-bl-md'
              : isSuggestion
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border border-blue-200 rounded-bl-md'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border border-gray-200 rounded-bl-md'
          } transition-all duration-200 hover:shadow-lg`}>

          {/* Message Content */}
          <div
            className="whitespace-pre-wrap leading-relaxed text-xs md:text-sm"
            dangerouslySetInnerHTML={{
              __html: chatService.formatMessage(message.content)
            }}
          />

          {/* Action Items */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-4 space-y-2">
              {message.actions.map((action, index) => (
                <div key={index} className={`flex items-center space-x-3 text-sm p-3 rounded-xl ${isUser ? 'bg-white bg-opacity-20' : 'bg-white border border-gray-200 shadow-sm'
                  } transition-all duration-200 hover:shadow-md`}>
                  <span className="text-lg">{action.icon}</span>
                  <span className={`font-medium ${isUser ? 'text-green-100' : 'text-gray-700'
                    }`}>
                    {action.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs mt-3 ${isUser ? 'text-green-100' : 'text-gray-500'
            } opacity-75 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Typing indicator component
 */
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-3 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="bg-green-100 p-1.5 rounded-lg">
          <FaRobot className="text-green-600 text-sm" />
        </div>
        <span className="text-sm text-gray-600 font-medium">Assistant is typing</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Suggested messages component
 */
const SuggestedMessages = ({ onSelect }) => {
  const suggestions = chatService.getSuggestedMessages();

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600 bg-gray-100 inline-block px-3 py-1 rounded-full">💡 Try asking:</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {suggestions.slice(0, 4).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="text-left p-4 bg-gradient-to-r from-white to-gray-50 hover:from-green-50 hover:to-green-100 rounded-xl border border-gray-200 hover:border-green-300 transition-all duration-200 text-sm shadow-sm hover:shadow-md transform hover:scale-[1.02]"
          >
            <span className="font-medium text-gray-700 hover:text-green-700">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Quick action button component
 */
const QuickActionButton = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="flex-1 px-2 md:px-3 py-2 md:py-2.5 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold transition-all duration-200 border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
  >
    {text}
  </button>
);

export default ChatBot;