import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPageNameFromPath, getPageTitleKey } from '../utils/translationHelper';

/**
 * DocumentTitleHandler Component
 * 
 * This component updates the document title based on the current route.
 * Place it inside your Router component to have it update titles automatically.
 * 
 * @param {Object} props - Component props
 * @param {string} props.appName - The name of the app to append to the title
 * @returns {null} - This component doesn't render anything
 */
const DocumentTitleHandler = ({ appName = 'AgriTech' }) => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    // Get the page name from the current path
    const pageName = getPageNameFromPath(location.pathname);

    // Get the translation key for the page title
    const titleKey = getPageTitleKey(pageName);

    // Get translated page title
    const pageTitle = t(titleKey);

    // Set document title - format: "Page Title | AppName"
    document.title = pageTitle
      ? `${pageTitle} | ${appName}`
      : appName;

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = appName;
    };
  }, [location.pathname, t, appName]);

  // This component doesn't render anything
  return null;
};

export default DocumentTitleHandler;