import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation resources
import en from './locales/en/translation.json'
import taskEn from './locales/en/tasks.json'
import ta from './locales/ta/translation.json'
import hi from './locales/hi/translation.json'

import taskTa from './locales/ta/task-translations.json'
import taskHi from './locales/hi/tasks.json';

// Log translation status for debugging

// // Check for any empty translation files
// if (!en || Object.keys(en).length === 0) {
//   console.error('English translation file is empty or not loaded correctly');
// }

// if (!ta || Object.keys(ta).length === 0) {
//   console.error('Tamil translation file is empty or not loaded correctly');
// }

// if (!hi || Object.keys(hi).length === 0) {
//   console.error('Hindi translation file is empty or not loaded correctly');
// }

// Prepare resources object
const resources = {
  en: {
    translation: en,
    tasks: taskEn
  },
  ta: {
    translation: ta,
    tasks: taskTa
  },
  hi: {
    translation: hi,
    tasks: taskHi
  }
}

// Check if database_content paths exist in each language
const validateDatabaseContent = (lang, resources) => {
  const res = resources[lang]?.translation;
  if (!res) return false;

  // Check for database_content structure
  if (!res.database_content) {
    // console.error(`Missing database_content structure in ${lang} translations`);
    return false;
  }

  // Check for crops
  if (!res.database_content.crops || Object.keys(res.database_content.crops).length === 0) {
    // console.error(`Missing or empty crops in ${lang} database_content`);
    return false;
  }

  return true;
};

// Validate key paths
Object.keys(resources).forEach(lang => {
  validateDatabaseContent(lang, resources);
});

// Get user's preferred language or default to English
const storedLang = localStorage.getItem('i18nextLng') || 'en';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    debug: process.env.NODE_ENV === 'development',
    keySeparator: '.',
    nsSeparator: ':',
    returnEmptyString: false
  })
  .then(() => {
    // i18n initialized successfully
    // Check for critical paths
    const path = 'database_content.crops.crop_rice';
  })
  .catch(error => {
    // console.error('i18n initialization error:', error);
  });

// Set document language attribute for screen readers
document.documentElement.lang = i18n.language;

export default i18n
