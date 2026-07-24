import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Language switcher component with visual indicator for current language
 * Supports English, Tamil, and Hindi
 */
const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  // Language switching functionality

  // Handle language with region codes (en-US, etc)
  const currentLang = i18n.language.startsWith('en')
    ? 'en'
    : i18n.language.startsWith('ta')
      ? 'ta'
      : i18n.language.startsWith('hi')
        ? 'hi'
        : i18n.language;

  // Change language and store in localStorage
  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('i18nextLng', lng); } catch { }
    if (typeof document !== 'undefined') document.documentElement.lang = lng;
  }

  return (
    <div className="language-switcher flex items-center space-x-2">
      <button
        onClick={() => changeLang('en')}
        className={`px-2 py-1 rounded transition-colors duration-200 ${currentLang === 'en'
          ? 'bg-green-600 text-white font-medium ring-2 ring-green-400'
          : 'text-white hover:bg-gray-700'
          }`}
        aria-label="Switch to English"
        title={t('switch_to_english', 'Switch to English')}
      >
        EN
      </button>

      <button
        onClick={() => changeLang('hi')}
        className={`px-2 py-1 rounded transition-colors duration-200 ${currentLang === 'hi'
          ? 'bg-green-600 text-white font-medium ring-2 ring-green-400'
          : 'text-white hover:bg-gray-700'
          }`}
        aria-label="हिंदी में बदलें"
        title={t('switch_to_hindi', 'Switch to Hindi')}
      >
        हिंदी
      </button>

      <button
        onClick={() => changeLang('ta')}
        className={`px-2 py-1 rounded transition-colors duration-200 ${currentLang === 'ta'
          ? 'bg-green-600 text-white font-medium ring-2 ring-green-400'
          : 'text-white hover:bg-gray-700'
          }`}
        aria-label="தமிழுக்கு மாறவும்"
        title={t('switch_to_tamil', 'Switch to Tamil')}
      >
        தமிழ்
      </button>
    </div>
  )
}

export default LanguageSwitcher
