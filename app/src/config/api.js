// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create full API URL
export const createApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
};

// Export commonly used API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  USER: (userId) => `/auth/user/${userId}`,
  PROFILE_IMAGE: (userId) => `/auth/user/${userId}/profile-image`,

  // Crop endpoints
  CROPS: '/crops',
  CROP_BY_ID: (id) => `/crops/${id}`,
  CROP_COSTS: (id) => `/crops/${id}/costs`,

  // Task endpoints
  TASKS: '/tasks',
  TASKS_TODAY: '/tasks/today',
  TASKS_UPCOMING: '/tasks/upcoming',
  TASKS_HISTORY: '/tasks/history',
  TASK_BY_ID: (id) => `/tasks/${id}`,
  TASK_STATUS: (id) => `/tasks/${id}/status`,
  TASKS_BY_CROP: (cropId) => `/tasks?cropId=${cropId}`,

  // Disease endpoints
  DISEASE_REPORT: '/disease/report',
  DISEASE_ALERTS: (userId) => `/disease/alerts?userId=${userId}`,
  DISEASE_ALERTS_READ: '/disease/alerts/read',

  // Activity endpoints
  ACTIVITIES: '/activities',
  ACTIVITIES_BY_CROP: (cropId) => `/activities/crop/${cropId}?limit=10`,
};

// Helper to build full URL with API base
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}/api${endpoint}`;
};
