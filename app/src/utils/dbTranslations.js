/**
 * Database Content Translation Utility
 * 
 * This utility helps handle translations for dynamic content loaded from database.
 * It provides functions to translate database values using defined mappings or fallbacks.
 */

import i18n from '../i18n';

// Common crop name translations
// Map database values to translation keys 
const cropTranslations = {
  // Example: { databaseValue: translationKey }
  "Rice": "crop_rice",
  "Wheat": "crop_wheat",
  "Corn": "crop_corn",
  "Cotton": "crop_cotton",
  "Sugarcane": "crop_sugarcane",
  "Potato": "crop_potato",
  "Tomato": "crop_tomato",
  "Onion": "crop_onion",
  "Chilli": "crop_chilli",
  "Garlic": "crop_garlic"
  // Add more crops as needed
};

// Common category/tag translations
const categoryTranslations = {
  "irrigation": "category_irrigation",
  "fertilization": "category_fertilization",
  "pest_control": "category_pest_control",
  "disease_treatment": "category_disease_treatment",
  "harvesting": "category_harvesting",
  "planting": "category_planting",
  "pruning": "category_pruning",
  "soil_management": "category_soil_management",
  "weather_response": "category_weather_response",
  "general": "category_general"
  // Add more categories as needed
};

// Common disease name translations
const diseaseTranslations = {
  "Blast": "disease_blast",
  "Blight": "disease_blight",
  "Rust": "disease_rust",
  "Powdery Mildew": "disease_powdery_mildew",
  "Leaf Spot": "disease_leaf_spot",
  "Root Rot": "disease_root_rot"
  // Add more diseases as needed
};

/**
 * Translates a crop name using predefined mappings or as a fallback
 * 
 * @param {string} cropName - The crop name from database
 * @param {string} namespace - The translation namespace to use
 * @returns {string} - Translated crop name
 */
export const translateCropName = (cropName, namespace = 'translation') => {
  // If no crop name provided, return empty string
  if (!cropName) return '';

  // Try case-insensitive and trimmed matching first
  const normalizedCropName = cropName.trim();

  // Debug information
  const debugMode = true;
  if (debugMode) {
    // console.group(`Translation debug for crop: "${normalizedCropName}"`);
    // console.log(`Current language: ${i18n.language}`);
  }

  // Try exact match first
  let translationKey = cropTranslations[normalizedCropName];

  // If no exact match, try case-insensitive match
  if (!translationKey) {
    const cropKey = Object.keys(cropTranslations).find(key =>
      key.toLowerCase() === normalizedCropName.toLowerCase()
    );
    if (cropKey) {
      translationKey = cropTranslations[cropKey];
      // if (debugMode) console.log(`Found case-insensitive match: ${cropKey} -> ${translationKey}`);
    }
  }

  // Try direct translation with "crop_" prefix if no mapping found
  if (!translationKey) {
    translationKey = `crop_${normalizedCropName.toLowerCase().replace(/\s+/g, '_')}`;
    // if (debugMode) console.log(`Using generated key: ${translationKey}`);
  }

  // Try multiple path formats for maximum compatibility
  const pathFormats = [
    `database_content.crops.${translationKey}`,
    `crops.${translationKey}`,
    `database.crops.${normalizedCropName.toLowerCase()}`,
    `crop_${normalizedCropName.toLowerCase()}`,
    translationKey
  ];

  if (debugMode) {
    // console.log('Trying translation paths:');
    pathFormats.forEach(path => {
      // console.log(`- ${path}: ${i18n.exists(path, { ns: namespace }) ? 'exists ✅' : 'missing ❌'}`);
    });
  }

  // Try each path format
  for (const path of pathFormats) {
    if (i18n.exists(path, { ns: namespace })) {
      const translated = i18n.t(path, { ns: namespace });
      if (debugMode) {
        // console.log(`✅ Translation found at path "${path}": "${translated}"`);
        // console.groupEnd();
      }
      return translated;
    }
  }

  // Log and return original if no translation found
  if (debugMode) {
    // console.log(`❌ No translation found for crop: ${cropName}`);
    // console.groupEnd();
  }

  return cropName;
};

/**
 * Translates a category using predefined mappings or as a fallback
 * 
 * @param {string} category - The category from database
 * @param {string} namespace - The translation namespace to use
 * @returns {string} - Translated category
 */
export const translateCategory = (category, namespace = 'translation') => {
  if (!category) return '';

  // Try case-insensitive and trimmed matching first
  const normalizedCategory = category.trim();

  // Debug information
  const debugMode = true;
  if (debugMode) {
    // console.group(`Translation debug for category: "${normalizedCategory}"`);
    // console.log(`Current language: ${i18n.language}`);
  }

  // Try exact match first
  let translationKey = categoryTranslations[normalizedCategory];

  // If no exact match, try case-insensitive match
  if (!translationKey) {
    const categoryKey = Object.keys(categoryTranslations).find(key =>
      key.toLowerCase() === normalizedCategory.toLowerCase()
    );
    if (categoryKey) {
      translationKey = categoryTranslations[categoryKey];
      // if (debugMode) console.log(`Found case-insensitive match: ${categoryKey} -> ${translationKey}`);
    }
  }

  // Try direct translation with "category_" prefix if no mapping found
  if (!translationKey) {
    translationKey = `category_${normalizedCategory.toLowerCase().replace(/\s+/g, '_')}`;
    // if (debugMode) console.log(`Using generated key: ${translationKey}`);
  }

  // Try multiple path formats for maximum compatibility
  const pathFormats = [
    `database_content.categories.${translationKey}`,
    `categories.${translationKey}`,
    `database.categories.${normalizedCategory.toLowerCase()}`,
    `category_${normalizedCategory.toLowerCase()}`,
    translationKey
  ];

  if (debugMode) {
    // console.log('Trying translation paths:');
    pathFormats.forEach(path => {
      // console.log(`- ${path}: ${i18n.exists(path, { ns: namespace }) ? 'exists ✅' : 'missing ❌'}`);
    });
  }

  // Try each path format
  for (const path of pathFormats) {
    if (i18n.exists(path, { ns: namespace })) {
      const translated = i18n.t(path, { ns: namespace });
      if (debugMode) {
        // console.log(`✅ Translation found at path "${path}": "${translated}"`);
        // console.groupEnd();
      }
      return translated;
    }
  }

  // Log and return original if no translation found
  if (debugMode) {
    // console.log(`❌ No translation found for category: ${category}`);
    // console.groupEnd();
  }

  return category;
};

/**
 * Translates a disease name using predefined mappings or as a fallback
 * 
 * @param {string} diseaseName - The disease name from database
 * @param {string} namespace - The translation namespace to use
 * @returns {string} - Translated disease name
 */
export const translateDisease = (diseaseName, namespace = 'translation') => {
  if (!diseaseName) return '';

  const translationKey = diseaseTranslations[diseaseName];

  if (translationKey && i18n.exists(translationKey, { ns: namespace })) {
    return i18n.t(translationKey, { ns: namespace });
  } else {
    return diseaseName;
  }
};

/**
 * Generic function to translate any database content using a mapping
 * 
 * @param {string} value - The value from database
 * @param {Object} mappings - Object mapping database values to translation keys
 * @param {string} namespace - The translation namespace to use
 * @returns {string} - Translated value
 */
export const translateDbValue = (value, mappings = {}, namespace = 'translation') => {
  if (!value) return '';

  const translationKey = mappings[value];

  if (translationKey && i18n.exists(translationKey, { ns: namespace })) {
    return i18n.t(translationKey, { ns: namespace });
  } else {
    return value;
  }
};

/**
 * Translates a database object fields by applying translation to specific fields
 * 
 * @param {Object} dbObject - Database object with fields to translate
 * @param {Object} fieldMappings - Object defining which fields to translate and their mapping
 * @param {string} namespace - The translation namespace to use
 * @returns {Object} - New object with translated fields
 */
export const translateDbObject = (dbObject, fieldMappings = {}, namespace = 'translation') => {
  if (!dbObject) return {};

  const translatedObject = { ...dbObject };

  Object.keys(fieldMappings).forEach(field => {
    if (dbObject[field]) {
      const mappings = fieldMappings[field];
      translatedObject[field] = translateDbValue(dbObject[field], mappings, namespace);
    }
  });

  return translatedObject;
};

// Singleton instance for importing the entire utility
const DBTranslations = {
  translateCropName,
  translateCategory,
  translateDisease,
  translateDbValue,
  translateDbObject,
  cropTranslations,
  categoryTranslations,
  diseaseTranslations
};

export default DBTranslations;