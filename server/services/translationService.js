/**
 * Mock translation service - returns original content without translation
 * @param {object} content - Arbitrary object with string values
 * @param {string} sourceLocale - e.g., 'en'
 * @param {string} targetLocale - e.g., 'ta'
 */
async function translateObject(content, sourceLocale = 'en', targetLocale = 'ta') {
  // Return original content without translation
  return { translated: content, engine: 'mock' }
}

module.exports = { translateObject }
