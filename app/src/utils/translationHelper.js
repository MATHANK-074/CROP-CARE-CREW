/**
 * Translation Helper Utility
 * 
 * This file contains mappings for all page names and their corresponding translation keys
 * to ensure consistent translation across the application.
 */

// Page name mapping to translation keys
export const pageTranslations = {
  // Main navigation pages
  home: 'home',
  diseaseDetection: 'disease_detection',
  cropRecommendation: 'crop_recommendation',
  marketPrices: 'market_prices',
  governmentSchemes: 'government_schemes',
  weather: 'weather',
  profile: 'profile',
  alerts: 'alerts',

  // Task-related pages
  tasks: 'tasks',
  taskDetails: 'task_details',
  addTask: 'add_task',

  // Crop-related pages
  crops: 'crops',
  cropDetails: 'crop_details',
  addCrop: 'add_crop',

  // Auth pages
  login: 'sign_in',
  signup: 'sign_up',

  // Other pages
  settings: 'settings',
  help: 'help',
  about: 'about'
};

/**
 * URL path to page name mapping
 * Maps URL paths to their corresponding page names
 */
export const urlPathToPageName = {
  '/': 'home',
  '/detect-disease': 'diseaseDetection',
  '/crop-recommendation': 'cropRecommendation',
  '/market-prices': 'marketPrices',
  '/gov-schemes': 'governmentSchemes',
  '/profile': 'profile',
  '/alerts': 'alerts',
  '/tasks': 'tasks',
  '/add-task': 'addTask',
  '/crops': 'crops',
  '/add-crop': 'addCrop',
  '/login': 'login',
  '/signup': 'signup',
  '/settings': 'settings',
  '/help': 'help',
  '/about': 'about'
};

/**
 * Get page name from URL path
 * @param {string} path - Current URL path
 * @returns {string} - Corresponding page name
 */
export const getPageNameFromPath = (path) => {
  // Exact match check
  if (urlPathToPageName[path]) {
    return urlPathToPageName[path];
  }

  // Check for path with parameters
  // Examples: /tasks/123, /crops/456
  const pathSegments = path.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const basePath = `/${pathSegments[0]}`;
    if (urlPathToPageName[basePath]) {
      return urlPathToPageName[basePath];
    }

    // Special cases for specific paths with parameters
    if (pathSegments[0] === 'tasks' && pathSegments.length > 1) {
      return 'taskDetails';
    }

    if (pathSegments[0] === 'crops' && pathSegments.length > 1) {
      return 'cropDetails';
    }
  }

  // Default to home if no match found
  return 'home';
};

/**
 * Get translation key for a page
 * @param {string} pageName - The name of the page
 * @returns {string} - The translation key for the page
 */
export const getPageTranslationKey = (pageName) => {
  return pageTranslations[pageName] || pageName;
};

/**
 * Get the page title translation key for a page
 * This will look for the title in page_titles.{key} format
 * @param {string} pageName - The name of the page
 * @returns {string} - The translation key for the page title
 */
export const getPageTitleKey = (pageName) => {
  const pageKey = pageTranslations[pageName] || pageName;
  return `page_titles.${pageKey}`;
};

/**
 * List of all components with their translation namespaces
 * This helps track which components need translations and which namespaces they use
 */
export const componentTranslationNamespaces = {
  // Task Components
  'OptimizedTaskDashboard': ['translation', 'tasks'],
  'OptimizedTaskList': ['translation', 'tasks'],
  'OptimizedTaskDetail': ['translation', 'tasks'],
  'TaskRecommendationsModal': ['translation', 'tasks'],
  'TaskItem': ['translation', 'tasks'],
  'CropTaskSelector': ['translation', 'tasks'],

  // Weather Components
  'WeatherAnalysis': ['translation'],

  // Crop Components
  'CropRecommendation': ['translation'],
  'CropDetails': ['translation'],

  // Disease Components
  'DetectDisease': ['translation'],
  'DiseaseAlerts': ['translation'],

  // Auth Components
  'Login': ['translation'],
  'Signup': ['translation'],
  'Profile': ['translation'],

  // Other Components
  'MarketPrices': ['translation'],
  'GovSchemes': ['translation'],
  'Home': ['translation'],
  'ModernHome': ['translation']
};

/**
 * Check if a component has all required translations
 * @param {string} componentName - Name of the component
 * @param {Array} requiredKeys - Array of translation keys required by the component
 * @param {Object} translations - Translation object
 * @returns {Array} - Array of missing translation keys
 */
export const checkMissingTranslations = (componentName, requiredKeys, translations) => {
  const namespaces = componentTranslationNamespaces[componentName] || ['translation'];
  const missingKeys = [];

  for (const key of requiredKeys) {
    let found = false;
    for (const namespace of namespaces) {
      if (translations[namespace] && translations[namespace][key]) {
        found = true;
        break;
      }
    }
    if (!found) {
      missingKeys.push(key);
    }
  }

  return missingKeys;
};