import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaHome,
  FaSearch,
  FaRupeeSign,
  FaLeaf,
  FaBell,
  FaTasks,
  FaCalendarAlt
} from 'react-icons/fa';

const MobileBottomNav = ({ userId }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const loggedIn = !!localStorage.getItem('token');

  // Function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden shadow-lg bottom-nav-animate" style={{ height: '4rem' }}>
      <div className="grid grid-cols-5 h-16">
        {/* Home */}
        <Link
          to="/home"
          className={`flex flex-col items-center justify-center ${isActive('/home')
            ? 'text-green-600 border-t-2 border-green-600 -mt-[2px]'
            : 'text-gray-600'}`}
        >
          <FaHome className={`${isActive('/home') ? 'text-xl scale-110' : 'text-lg'} mb-1 transition-transform`} />
          <span className="text-xs font-medium">{t('home')}</span>
        </Link>

        {/* Disease Detection */}
        <Link
          to="/disease-detection"
          className={`flex flex-col items-center justify-center ${isActive('/disease-detection')
            ? 'text-green-600 border-t-2 border-green-600 -mt-[2px]'
            : 'text-gray-600'}`}
        >
          <FaSearch className={`${isActive('/disease-detection') ? 'text-xl scale-110' : 'text-lg'} mb-1 transition-transform`} />
          <span className="text-xs font-medium">{t('detect')}</span>
        </Link>

        {/* Market Prices */}
        <Link
          to="/market-prices"
          className={`flex flex-col items-center justify-center ${isActive('/market-prices')
            ? 'text-green-600 border-t-2 border-green-600 -mt-[2px]'
            : 'text-gray-600'}`}
        >
          <FaRupeeSign className={`${isActive('/market-prices') ? 'text-xl scale-110' : 'text-lg'} mb-1 transition-transform`} />
          <span className="text-xs font-medium">{t('market')}</span>
        </Link>

        {/* Calendar */}
        <Link
          to="/calendar"
          className={`flex flex-col items-center justify-center ${isActive('/calendar')
            ? 'text-green-600 border-t-2 border-green-600 -mt-[2px]'
            : 'text-gray-600'}`}
        >
          <FaCalendarAlt className={`${isActive('/calendar') ? 'text-xl scale-110' : 'text-lg'} mb-1 transition-transform`} />
          <span className="text-xs font-medium">Calendar</span>
        </Link>

        {/* Tasks Link */}
        <Link
          to="/tasks"
          className={`flex flex-col items-center justify-center ${isActive('/tasks')
            ? 'text-green-600 border-t-2 border-green-600 -mt-[2px]'
            : 'text-gray-600'}`}
        >
          <FaTasks className={`${isActive('/tasks') ? 'text-xl scale-110' : 'text-lg'} mb-1 transition-transform`} />
          <span className="text-xs font-medium">{t('tasks.tasks')}</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileBottomNav;
