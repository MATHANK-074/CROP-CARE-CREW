import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import VerticalHeader from './VerticalHeader';
import MobileHeader from './header/MobileHeader';
import MobileBottomNav from './header/MobileBottomNav';
import PageTitle from './ui/PageTitle';
import FloatingChatButton from './FloatingChatButton';
import { getPageNameFromPath } from '../utils/translationHelper';
import useDocumentTitle from '../hooks/useDocumentTitle';
import '../styles/layout.css';
import '../styles/animations.css';

const AppLayout = ({ children, pageTitle }) => {
  const location = useLocation();
  const path = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Page name for translation - use provided pageTitle or determine from path
  const pageName = pageTitle || getPageNameFromPath(path);

  // Use the document title hook here, where we have router context
  useDocumentTitle(path, 'AgriTech');

  // Check if current path is login, signup, or landing page
  const isExcludedPath = path === '/' || path === '/login' || path === '/signup';

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Memoize device state calculations to prevent unnecessary recalculations
  const deviceState = useMemo(() => ({
    isMobile: windowWidth < 768,
    isTablet: windowWidth >= 768 && windowWidth < 1024,
    isDesktop: windowWidth >= 1024
  }), [windowWidth]);

  const { isMobile, isTablet, isDesktop } = deviceState;

  // Optimize resize handler with useCallback
  const handleResize = useCallback(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  // Update window width and device states on resize
  useEffect(() => {
    // Set initial values
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Get userId for alerts
  const userId = localStorage.getItem('userId');

  return (
    <>
      {/* Navigation components */}
      {!isExcludedPath && (
        <>
          {/* Desktop/Tablet sidebar - only visible on medium screens and above */}
          {!isMobile && (
            <div className="sidebar-container">
              <VerticalHeader collapsed={isTablet} />
            </div>
          )}

          {/* Mobile top header - only visible on small screens */}
          {isMobile && (
            <>
              <div className="mobile-header-animate">
                <MobileHeader onMenuToggle={toggleMobileMenu} isMenuOpen={mobileMenuOpen} />
              </div>

              {/* Mobile bottom navigation - only visible on small screens */}
              <MobileBottomNav userId={userId} />
            </>
          )}
        </>
      )}

      {/* Mobile menu overlay - only shown when menu is open on mobile */}
      {mobileMenuOpen && !isExcludedPath && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          style={{ animation: 'fadeIn 0.2s ease forwards' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div
        className={`transition-all duration-300 flex flex-col ${!isExcludedPath ?
          isMobile ?
            'with-vertical-header with-mobile-bottom-nav' :
            isTablet ?
              'with-vertical-header with-collapsed-sidebar' :
              'with-vertical-header'
          : ''}`}
        style={{
          minHeight: isExcludedPath ? '100vh' : isMobile ? 'calc(100vh - 9rem)' : '100vh',
          overflowX: 'hidden'
        }}
        onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}
      >
        {/* Page title for non-excluded paths */}
        {/* {!isExcludedPath && (
          <div className="page-title-container px-4 py-2 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
            <PageTitle pageName={pageName} className="text-xl md:text-2xl font-bold text-primary-600" />
          </div>
        )} */}

        {children}
      </div>

      {/* Floating Chat Button - Only show when user is logged in and not on excluded paths */}
      {!isExcludedPath && localStorage.getItem('token') && (
        <FloatingChatButton />
      )}
    </>
  );
};

export default AppLayout;
