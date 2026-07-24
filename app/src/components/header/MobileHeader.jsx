import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSeedling, FaBars, FaBell, FaTimes, FaUser } from 'react-icons/fa';
import AlertsBadge from '../AlertsBadge';

const MobileHeader = ({ onMenuToggle, isMenuOpen }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const loggedIn = !!localStorage.getItem('token');

  // Language switcher dropdown
  const [langDropdown, setLangDropdown] = useState(false);

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    setLangDropdown(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-white shadow-sm flex items-center justify-between px-4 z-40 md:hidden">

      {/* Left - App name */}

      <div
        className="flex items-center cursor-pointer"
        onClick={() => navigate('/home')}
      >
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white mr-2">
          <FaSeedling />
        </div>
        <span className="font-bold text-lg">
          <span className="text-green-600">Agri</span>
          <span className="text-yellow-500">Tech</span>
        </span>
      </div>


      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Alerts Icon - Show only if logged in */}
        {loggedIn && userId && (
          <AlertsBadge
            userId={userId}
            onClick={() => navigate('/alerts')}
            className="text-gray-700 hover:bg-gray-100 p-2 rounded-full"
            showCount={true}
          />
        )}



        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setLangDropdown(!langDropdown)}
            className="px-2 py-1 text-xs font-medium rounded bg-gray-100 hover:bg-gray-200"
            aria-label="Change language"
          >
            {i18n.language === 'en' ? 'EN' : 'TA'}
          </button>

          {langDropdown && (
            <div className="absolute right-0 mt-1 bg-white shadow-md rounded-md py-1 z-50">
              <button
                onClick={() => toggleLanguage('en')}
                className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'en' ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}`}
              >
                English
              </button>
              <button
                onClick={() => toggleLanguage('ta')}
                className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'ta' ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}`}
              >
                தமிழ்
              </button>
            </div>
          )}
        </div>

        {/* User Profile - Always at the far right */}

        {loggedIn && (
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="User Profile"
            title={t('profile') || 'Profile'}
          >
            <FaUser className="text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileHeader;
