import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LanguageSwitcher from '../LanguageSwitcher'
import AlertsBadge from '../AlertsBadge'
import { useTranslation } from 'react-i18next'
import { FaSeedling, FaHome, FaSearch, FaRupeeSign, FaLeaf, FaSignInAlt, FaSignOutAlt, FaBars, FaTimes, FaCalendarAlt } from 'react-icons/fa'

function Header() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem('userId');

  // Keep body scroll behavior and auth sync in sync with menu state
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
    // Listen for login/logout changes from other tabs
    const syncAuth = () => setLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, [menuOpen]);

  // Update loggedIn state on mount and when token changes
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setLoggedIn(false);
    navigate('/login');
  };

  // Function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md relative w-full z-50 border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white">
            <FaSeedling className="text-lg" />
          </div>
          <div>
            <span className="font-bold text-xl">
              <span className="text-green-600">Agri</span>
              <span className="text-yellow-500">Tech</span>
            </span>
          </div>
        </Link>

        {/* Mobile Icons */}
        <div className="flex items-center gap-3 lg:hidden">
          {loggedIn && userId && (
            <AlertsBadge
              userId={userId}
              onClick={() => navigate('/alerts')}
              className="text-gray-700 hover:bg-gray-100 p-2 rounded-full"
            />
          )}

          <LanguageSwitcher />

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-700 hover:bg-gray-100 p-2 rounded-full focus:outline-none"
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block ml-6 flex-grow">
          <ul className="flex space-x-1 items-center">
            <li>
              <Link
                to="/home"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/home') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <FaHome className="text-lg" />
                <span>{t('home')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/disease-detection"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/disease-detection') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <FaSearch className="text-lg" />
                <span>{t('disease_detection')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/market-prices"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/market-prices') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <FaRupeeSign className="text-lg" />
                <span>{t('market_prices')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/calendar"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/calendar') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <FaCalendarAlt className="text-lg" />
                <span>Calendar</span>
              </Link>
            </li>
            <li>
              <Link
                to="/crop-recommendation"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/crop-recommendation') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <FaLeaf className="text-lg" />
                <span>{t('crop_recommendation')}</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Desktop Right Side Items */}
        <div className="hidden lg:flex items-center gap-4">
          {loggedIn && userId && (
            <AlertsBadge
              userId={userId}
              onClick={() => navigate('/alerts')}
              className="text-gray-700 hover:bg-gray-100 p-2 rounded-md"
            />
          )}
          <LanguageSwitcher />
          {!loggedIn ? (
            <Link to="/login" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition font-medium">
              <FaSignInAlt />
              <span>{t('sign_in')}</span>
            </Link>
          ) : (
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition font-medium">
              <FaSignOutAlt />
              <span>{t('logout')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-full bg-white shadow-xl px-6 py-4 transition-transform duration-300 z-50 ${menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white">
              <FaSeedling className="text-lg" />
            </div>
            <span className="font-bold text-xl">
              <span className="text-green-600">Agri</span>
              <span className="text-yellow-500">Tech</span>
            </span>
          </div>

          <button
            onClick={() => setMenuOpen(false)}
            className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <ul className="space-y-2 text-sm font-medium">
          <li>
            <Link
              to="/home"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg ${isActive('/home') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaHome className="text-lg" />
              <span>{t('home')}</span>
            </Link>
          </li>
          <li>
            <Link
              to="/disease-detection"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg ${isActive('/disease-detection') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaSearch className="text-lg" />
              <span>{t('disease_detection')}</span>
            </Link>
          </li>
          <li>
            <Link
              to="/market-prices"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg ${isActive('/market-prices') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaRupeeSign className="text-lg" />
              <span>{t('market_prices')}</span>
            </Link>
          </li>
          <li>
            <Link
              to="/calendar"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg ${isActive('/calendar') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaCalendarAlt className="text-lg" />
              <span>Calendar</span>
            </Link>
          </li>
          <li>
            <Link
              to="/crop-recommendation"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg ${isActive('/crop-recommendation') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaLeaf className="text-lg" />
              <span>{t('crop_recommendation')}</span>
            </Link>
          </li>

          {/* Authentication Button */}
          <li className="pt-4 mt-4 border-t border-gray-100">
            {!loggedIn ? (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium w-full"
              >
                <FaSignInAlt />
                <span>{t('sign_in')}</span>
              </Link>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium w-full"
              >
                <FaSignOutAlt />
                <span>{t('logout')}</span>
              </button>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Header;
