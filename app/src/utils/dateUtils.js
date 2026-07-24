/**
 * Date Utilities
 * Centralized date formatting and manipulation functions
 */

/**
 * Check if a date is valid
 * @param {*} date - Date to validate
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (date) => {
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
  return false;
};

/**
 * Format date with fallback for invalid dates
 * @param {*} dateInput - Date string, Date object, or timestamp
 * @param {string} format - Format type ('DD/MM/YYYY', 'en-GB', 'en-US', 'ISO')
 * @param {string} fallback - Fallback string for invalid dates
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, format = 'DD/MM/YYYY', fallback = 'N/A') => {
  if (!dateInput) return fallback;

  let date;
  try {
    date = new Date(dateInput);
  } catch (error) {
    return fallback;
  }

  if (!isValidDate(date)) {
    return fallback;
  }

  switch (format) {
    case 'DD/MM/YYYY': {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    case 'MM/DD/YYYY': {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
    case 'YYYY-MM-DD': {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    }
    case 'en-GB':
      return date.toLocaleDateString('en-GB');
    case 'en-US':
      return date.toLocaleDateString('en-US');
    case 'ISO':
      return date.toISOString();
    case 'long':
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'short':
      return date.toLocaleDateString(undefined, {
        year: '2-digit',
        month: 'short',
        day: 'numeric'
      });
    default:
      return date.toLocaleDateString('en-GB');
  }
};

/**
 * Format date for market prices specifically (matches the existing format in MarketPrices.jsx)
 * @param {*} dateInput - Date string, Date object, or timestamp
 * @returns {string} Formatted date in DD/MM/YYYY format
 */
export const formatMarketDate = (dateInput) => {
  return formatDate(dateInput, 'DD/MM/YYYY', new Date().toLocaleDateString('en-GB'));
};

/**
 * Get relative time string (e.g., "2 days ago", "Today", "Yesterday")
 * @param {*} dateInput - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateInput) => {
  if (!isValidDate(dateInput)) return 'Unknown time';

  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (diffDays >= 30 && diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
};

/**
 * Check if date is today
 * @param {*} dateInput - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (dateInput) => {
  if (!isValidDate(dateInput)) return false;

  const date = new Date(dateInput);
  const today = new Date();

  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Check if date is within a certain number of days
 * @param {*} dateInput - Date to check
 * @param {number} days - Number of days
 * @returns {boolean} True if date is within the specified days
 */
export const isWithinDays = (dateInput, days) => {
  if (!isValidDate(dateInput)) return false;

  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = Math.abs(now - date);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays <= days;
};

/**
 * Add days to a date
 * @param {*} dateInput - Base date
 * @param {number} days - Number of days to add
 * @returns {Date|null} New date or null if invalid input
 */
export const addDays = (dateInput, days) => {
  if (!isValidDate(dateInput)) return null;

  const date = new Date(dateInput);
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Get days between two dates
 * @param {*} date1 - First date
 * @param {*} date2 - Second date
 * @returns {number|null} Number of days or null if invalid dates
 */
export const getDaysBetween = (date1, date2) => {
  if (!isValidDate(date1) || !isValidDate(date2)) return null;

  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2 - d1);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export default {
  isValidDate,
  formatDate,
  formatMarketDate,
  getRelativeTime,
  isToday,
  isWithinDays,
  addDays,
  getDaysBetween
};
