/**
 * Format Utilities
 * Centralized text formatting and display functions
 */

import { CROP_STATUS, TASK_STATUS, PRIORITY_LEVELS, COLORS } from '../constants';

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Convert camelCase or PascalCase to readable text
 * @param {string} str - String to convert
 * @returns {string} Readable text
 */
export const camelToReadable = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (match) => match.toUpperCase())
    .trim();
};

/**
 * Convert snake_case to readable text
 * @param {string} str - String to convert
 * @returns {string} Readable text
 */
export const snakeToReadable = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Convert kebab-case to readable text
 * @param {string} str - String to convert
 * @returns {string} Readable text
 */
export const kebabToReadable = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .split('-')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} ellipsis - Ellipsis string
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100, ellipsis = '...') => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num == null || isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = '₹') => {
  if (amount == null || isNaN(amount)) return `${currency}0`;
  return `${currency}${formatNumber(amount)}`;
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Get crop status badge properties
 * @param {string} status - Crop status
 * @returns {Object} Badge properties with color and text
 */
export const getCropStatusBadge = (status) => {
  const statusLower = status?.toLowerCase();
  
  switch (statusLower) {
    case 'growing':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        text: 'Growing'
      };
    case 'planted':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        text: 'Planted'
      };
    case 'flowering':
      return {
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        text: 'Flowering'
      };
    case 'fruiting':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        text: 'Fruiting'
      };
    case 'harvested':
      return {
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-800',
        text: 'Harvested'
      };
    case 'diseased':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        text: 'Diseased'
      };
    case 'failed':
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        text: 'Failed'
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        text: status || 'Unknown'
      };
  }
};

/**
 * Get task status badge properties
 * @param {string} status - Task status
 * @returns {Object} Badge properties with color and text
 */
export const getTaskStatusBadge = (status) => {
  const statusLower = status?.toLowerCase();
  
  switch (statusLower) {
    case 'completed':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        text: 'Completed',
        icon: '✓'
      };
    case 'in-progress':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        text: 'In Progress',
        icon: '⏳'
      };
    case 'pending':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        text: 'Pending',
        icon: '⏸'
      };
    case 'overdue':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        text: 'Overdue',
        icon: '⚠️'
      };
    case 'cancelled':
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        text: 'Cancelled',
        icon: '✕'
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        text: status || 'Unknown',
        icon: '?'
      };
  }
};

/**
 * Get priority badge properties
 * @param {string} priority - Priority level
 * @returns {Object} Badge properties with color and text
 */
export const getPriorityBadge = (priority) => {
  const priorityLower = priority?.toLowerCase();
  
  switch (priorityLower) {
    case 'urgent':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        text: 'Urgent',
        icon: '🔥'
      };
    case 'high':
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        text: 'High',
        icon: '⬆️'
      };
    case 'medium':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        text: 'Medium',
        icon: '➡️'
      };
    case 'low':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        text: 'Low',
        icon: '⬇️'
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        text: priority || 'Unknown',
        icon: '?'
      };
  }
};

/**
 * Format task category for display
 * @param {string} category - Task category
 * @returns {string} Formatted category name
 */
export const formatTaskCategory = (category) => {
  if (!category) return 'Other';
  
  const categoryMap = {
    'planting': 'Planting',
    'watering': 'Watering',
    'fertilizing': 'Fertilizing',
    'pest-control': 'Pest Control',
    'disease-management': 'Disease Management',
    'harvesting': 'Harvesting',
    'soil-preparation': 'Soil Preparation',
    'monitoring': 'Monitoring'
  };
  
  return categoryMap[category] || kebabToReadable(category);
};

/**
 * Get weather icon for condition
 * @param {string} condition - Weather condition
 * @returns {string} Weather icon emoji
 */
export const getWeatherIcon = (condition) => {
  const conditionLower = condition?.toLowerCase();
  
  switch (conditionLower) {
    case 'clear':
    case 'sunny':
      return '☀️';
    case 'cloudy':
      return '☁️';
    case 'rainy':
      return '🌧️';
    case 'stormy':
      return '⛈️';
    case 'foggy':
      return '🌫️';
    case 'snowy':
      return '❄️';
    default:
      return '🌤️';
  }
};

/**
 * Format temperature
 * @param {number} temp - Temperature value
 * @param {string} unit - Temperature unit (C or F)
 * @returns {string} Formatted temperature
 */
export const formatTemperature = (temp, unit = 'C') => {
  if (temp == null || isNaN(temp)) return '--°';
  return `${Math.round(temp)}°${unit}`;
};

/**
 * Generate initials from name
 * @param {string} name - Full name
 * @param {number} maxInitials - Maximum number of initials
 * @returns {string} Initials
 */
export const generateInitials = (name, maxInitials = 2) => {
  if (!name || typeof name !== 'string') return '??';
  
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, maxInitials)
    .map(word => word[0].toUpperCase())
    .join('');
};

/**
 * Format confidence score as percentage
 * @param {number} confidence - Confidence value (0-1)
 * @returns {string} Formatted confidence percentage
 */
export const formatConfidence = (confidence) => {
  if (confidence == null || isNaN(confidence)) return '0%';
  const percentage = confidence > 1 ? confidence : confidence * 100;
  return `${Math.round(percentage)}%`;
};

/**
 * Get status color for various entities
 * @param {string} status - Status value
 * @param {string} type - Type of status ('crop', 'task', 'priority')
 * @returns {string} Tailwind color class
 */
export const getStatusColor = (status, type = 'task') => {
  switch (type) {
    case 'crop':
      return getCropStatusBadge(status);
    case 'task':
      return getTaskStatusBadge(status);
    case 'priority':
      return getPriorityBadge(status);
    default:
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
};

/**
 * Clean and format user input
 * @param {string} input - User input string
 * @returns {string} Cleaned input
 */
export const cleanInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Generate slug from text
 * @param {string} text - Text to slugify
 * @returns {string} URL-friendly slug
 */
export const generateSlug = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default {
  capitalize,
  toTitleCase,
  camelToReadable,
  snakeToReadable,
  kebabToReadable,
  truncateText,
  formatFileSize,
  formatNumber,
  formatCurrency,
  formatPercentage,
  getCropStatusBadge,
  getTaskStatusBadge,
  getPriorityBadge,
  formatTaskCategory,
  getWeatherIcon,
  formatTemperature,
  generateInitials,
  formatConfidence,
  getStatusColor,
  cleanInput,
  generateSlug
};