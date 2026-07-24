/**
 * Language Debug Utility
 * 
 * This utility provides functions to help debug language issues in the application
 * It allows forcing language changes and checking translation capabilities
 */

import i18n from '../i18n';

/**
 * Force change the language and ensure it's applied
 * @param {string} language - Language code to switch to (en, ta, hi)
 */
export const forceLanguageChange = (language) => {
  // Change language in i18n
  i18n.changeLanguage(language);

  // Store in localStorage for persistence
  try { localStorage.setItem('i18nextLng', language); } catch { }

  // Update document language if in browser
  if (typeof document !== 'undefined') document.documentElement.lang = language;

  // Log the result
};

/**
 * Test a translation key in all languages
 * @param {string} key - Translation key to test
 * @param {Object} options - Translation options
 */
export const testTranslation = (key, options = {}) => {
  const result = {};
  const langs = ['en', 'ta', 'hi'];

  // Store current language
  const currentLang = i18n.language;

  // Test translation in all languages
  langs.forEach(lang => {
    i18n.changeLanguage(lang);
    result[lang] = i18n.exists(key, options) ?
      i18n.t(key, options) :
      `[MISSING: ${key}]`;
  });

  // Restore original language
  i18n.changeLanguage(currentLang);

  console.table(result);
  return result;
};

/**
 * Test crop translations for common crops
 */
export const testCropTranslations = () => {
  const crops = ["Rice", "Wheat", "Corn", "Tomato", "Potato"];
  const result = {};

  // Store current language
  const currentLang = i18n.language;

  // Test each crop in all languages with various path formats
  crops.forEach(crop => {
    result[crop] = {};

    ['en', 'ta', 'hi'].forEach(lang => {
      i18n.changeLanguage(lang);

      // Test different path formats
      const paths = [
        `database_content.crops.crop_${crop.toLowerCase()}`,
        `crops.crop_${crop.toLowerCase()}`,
        `database.crops.${crop.toLowerCase()}`,
        `crop_${crop.toLowerCase()}`,
        `crops.${crop.toLowerCase()}`
      ];

      const translations = {};
      paths.forEach(path => {
        translations[path] = i18n.exists(path) ?
          i18n.t(path) :
          `[MISSING]`;
      });

      result[crop][lang] = translations;
    });
  });

  // Restore original language
  i18n.changeLanguage(currentLang);
  return result;
};

export default {
  forceLanguageChange,
  testTranslation,
  testCropTranslations
};