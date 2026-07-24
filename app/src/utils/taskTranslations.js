import i18n from '../i18n';

/**
 * Utility function to translate database task descriptions with placeholder replacements
 * 
 * This function handles dynamic task descriptions that might contain placeholders
 * for crop names, categories, etc. It replaces these with their translated versions.
 * 
 * @param {string} description - The task description from database
 * @param {Object} replacements - Object containing values to replace in the description
 * @returns {string} - Translated description with replaced values
 */
export const translateTaskDescription = (description, replacements = {}) => {
  if (!description) return '';

  // First check if the entire description has a direct translation
  const directTranslationKey = `task_descriptions.${description.replace(/\s+/g, '_').toLowerCase()}`;
  if (i18n.exists(directTranslationKey)) {
    return i18n.t(directTranslationKey, replacements);
  }

  // Otherwise, look for placeholder patterns in the text
  // Example: "Water the {crop}" -> Replace {crop} with translated crop name
  let translatedDescription = description;

  // Handle {crop} replacements
  if (replacements.crop) {
    const cropTranslationKey = `database_content.crops.crop_${replacements.crop.toLowerCase().replace(/\s+/g, '_')}`;
    const translatedCrop = i18n.exists(cropTranslationKey) ? i18n.t(cropTranslationKey) : replacements.crop;
    translatedDescription = translatedDescription.replace(/\{crop\}/g, translatedCrop);
  }

  // Handle {category} replacements
  if (replacements.category) {
    const categoryTranslationKey = `database_content.categories.category_${replacements.category.toLowerCase()}`;
    const translatedCategory = i18n.exists(categoryTranslationKey) ?
      i18n.t(categoryTranslationKey) : replacements.category;
    translatedDescription = translatedDescription.replace(/\{category\}/g, translatedCategory);
  }

  // Handle other dynamic content
  Object.keys(replacements).forEach(key => {
    if (key !== 'crop' && key !== 'category') {
      translatedDescription = translatedDescription.replace(
        new RegExp(`\\{${key}\\}`, 'g'),
        replacements[key]
      );
    }
  });

  return translatedDescription;
};

/**
 * Translate fixed task descriptions that are stored as database values
 * 
 * This helps with common task descriptions that would be stored directly in the database
 * 
 * @param {string} taskDescription - The fixed task description from database
 * @returns {string} - Translated task description if found, or original
 */
export const translateFixedTaskDescription = (taskDescription) => {
  if (!taskDescription) return '';

  // Create translation key from task description
  const descriptionKey = `fixed_task_descriptions.${taskDescription
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '')}` // Remove leading/trailing underscores

  // Check if we have this key in translations
  if (i18n.exists(descriptionKey)) {
    return i18n.t(descriptionKey);
  }

  // Fall back to original description
  return taskDescription;
};

// Singleton instance for importing the entire utility
const TaskTranslations = {
  translateTaskDescription,
  translateFixedTaskDescription
};

export default TaskTranslations;