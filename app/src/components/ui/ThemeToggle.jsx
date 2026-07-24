import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center w-12 h-6 
        bg-gray-200 dark:bg-gray-700 rounded-full transition-all duration-300 
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-800 hover:bg-gray-300 dark:hover:bg-gray-600
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {/* Toggle Circle */}
      <div
        className={`
          absolute w-5 h-5 bg-white dark:bg-gray-900 rounded-full shadow-md
          transform transition-transform duration-300 flex items-center justify-center
          ${isDark ? 'translate-x-6' : 'translate-x-0.5'}
        `}
      >
        <FontAwesomeIcon
          icon={isDark ? faMoon : faSun}
          className={`text-xs ${isDark ? 'text-blue-400' : 'text-yellow-500'}`}
        />
      </div>
      
      {/* Background Icons */}
      <div className="flex items-center justify-between w-full px-1">
        <FontAwesomeIcon
          icon={faSun}
          className={`text-xs transition-opacity ${isDark ? 'opacity-40' : 'opacity-0'} text-yellow-500`}
        />
        <FontAwesomeIcon
          icon={faMoon}
          className={`text-xs transition-opacity ${isDark ? 'opacity-0' : 'opacity-40'} text-blue-400`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;