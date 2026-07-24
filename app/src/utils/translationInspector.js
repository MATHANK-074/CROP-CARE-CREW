/**
 * Translation Inspector and Fixer Utility
 * 
 * This utility provides functions to help inspect and fix translation issues
 * It helps identify missing translations and structural problems in the translation files
 */

import i18n from '../i18n';

/**
 * Inspect the complete i18n resource store structure
 * @returns {Object} Complete analysis of the i18n resource store
 */
export const inspectTranslations = () => {
  // Check if i18n is initialized
  if (!i18n.isInitialized) {
    console.error('i18n is not initialized yet');
    return { error: 'i18n not initialized' };
  }

  const result = {
    languages: {},
    missingKeys: {},
    structuralIssues: [],
    summary: {}
  };

  // Get all languages in the store
  const languages = Object.keys(i18n.store?.data || {});
  result.languages = languages;

  // Check if any languages exist
  if (languages.length === 0) {
    result.structuralIssues.push('No languages found in the i18n store');
    return result;
  }

  // Get all namespaces from the first language (assume all languages have the same namespaces)
  const firstLang = languages[0];
  const namespaces = Object.keys(i18n.store?.data[firstLang] || {});
  result.namespaces = namespaces;

  // Collect all keys from all languages and namespaces
  const allKeys = {};

  // Collect keys from each language and namespace
  languages.forEach(lang => {
    result.missingKeys[lang] = [];

    namespaces.forEach(ns => {
      const nsData = i18n.store?.data[lang][ns];
      if (!nsData) {
        result.structuralIssues.push(`Missing namespace "${ns}" in language "${lang}"`);
        return;
      }

      // Flatten the nested keys
      const flatKeys = flattenKeys(nsData);

      // Add all keys to allKeys
      Object.keys(flatKeys).forEach(key => {
        if (!allKeys[ns]) allKeys[ns] = new Set();
        allKeys[ns].add(key);
      });
    });
  });

  // Check for missing keys in each language
  languages.forEach(lang => {
    namespaces.forEach(ns => {
      const nsData = i18n.store?.data[lang][ns];
      if (!nsData) return;

      const flatKeys = flattenKeys(nsData);

      // Find keys that exist in allKeys but not in this language's namespace
      allKeys[ns]?.forEach(key => {
        if (!flatKeys[key]) {
          result.missingKeys[lang].push(`${ns}:${key}`);
        }
      });
    });
  });

  // Build summary
  result.summary = {
    languageCount: languages.length,
    namespaceCount: namespaces.length,
    missingKeysByLanguage: Object.fromEntries(
      Object.entries(result.missingKeys).map(([lang, keys]) => [lang, keys.length])
    ),
    structuralIssueCount: result.structuralIssues.length
  };

  // Check specifically for database_content translations
  result.databaseContentAnalysis = analyzeDatabaseContent();

  return result;
};

/**
 * Flatten nested object keys with dot notation
 * @param {Object} obj - The nested object
 * @param {string} prefix - The prefix for the keys
 * @returns {Object} - Flattened object with dot notation keys
 */
const flattenKeys = (obj, prefix = '') => {
  const result = {};

  Object.keys(obj).forEach(key => {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flattenKeys(obj[key], newKey));
    } else {
      result[newKey] = obj[key];
    }
  });

  return result;
};

/**
 * Analyze database content translations specifically
 * @returns {Object} Analysis of database content translations
 */
const analyzeDatabaseContent = () => {
  const result = {
    crops: {},
    categories: {},
    diseases: {}
  };

  // Check each language for database_content structure
  const languages = Object.keys(i18n.store?.data || {});

  languages.forEach(lang => {
    const translation = i18n.store?.data[lang]?.translation;

    // Check database_content path
    const hasDbContent = translation &&
      translation.database_content &&
      typeof translation.database_content === 'object';

    if (!hasDbContent) {
      result[lang] = { error: 'Missing database_content structure' };
      return;
    }

    // Check crops
    result.crops[lang] = translation.database_content.crops ?
      Object.keys(translation.database_content.crops).length : 0;

    // Check categories
    result.categories[lang] = translation.database_content.categories ?
      Object.keys(translation.database_content.categories).length : 0;

    // Check diseases
    result.diseases[lang] = translation.database_content.diseases ?
      Object.keys(translation.database_content.diseases).length : 0;
  });

  return result;
};

/**
 * Fix common translation issues by programmatically updating the i18n store
 * @param {Object} options - Options for fixing
 */
export const fixCommonTranslationIssues = (options = {}) => {
  const { createMissing = true } = options;

  // Check if i18n is initialized
  if (!i18n.isInitialized) {
    console.error('i18n is not initialized yet');
    return { error: 'i18n not initialized' };
  }

  const results = {
    fixed: [],
    failed: []
  };

  // Get all languages in the store
  const languages = Object.keys(i18n.store?.data || {});

  // Ensure database_content structure exists in all languages
  languages.forEach(lang => {
    const translation = i18n.store?.data[lang]?.translation;

    if (!translation) {
      results.failed.push(`Missing translation namespace for ${lang}`);
      return;
    }

    // Check and fix database_content
    if (!translation.database_content) {
      if (createMissing) {
        translation.database_content = {
          crops: {},
          categories: {},
          diseases: {}
        };
        results.fixed.push(`Created database_content structure for ${lang}`);
      } else {
        results.failed.push(`Missing database_content for ${lang}`);
      }
    } else {
      // Check and fix crops
      if (!translation.database_content.crops) {
        if (createMissing) {
          translation.database_content.crops = {};
          results.fixed.push(`Created crops structure for ${lang}`);
        } else {
          results.failed.push(`Missing crops structure for ${lang}`);
        }
      }

      // Check and fix categories
      if (!translation.database_content.categories) {
        if (createMissing) {
          translation.database_content.categories = {};
          results.fixed.push(`Created categories structure for ${lang}`);
        } else {
          results.failed.push(`Missing categories structure for ${lang}`);
        }
      }

      // Check and fix diseases
      if (!translation.database_content.diseases) {
        if (createMissing) {
          translation.database_content.diseases = {};
          results.fixed.push(`Created diseases structure for ${lang}`);
        } else {
          results.failed.push(`Missing diseases structure for ${lang}`);
        }
      }
    }
  });

  return results;
};

/**
 * Reinitialize the i18n instance to force a refresh of the translation data
 */
export const reinitializeI18n = () => {
  // Force refresh the i18n instance
  i18n.reloadResources().then(() => {
  }).catch(err => {
    console.error('Failed to reload i18n resources:', err);
  });

  return 'Triggered i18n resource reload';
};

export default {
  inspectTranslations,
  fixCommonTranslationIssues,
  reinitializeI18n
};