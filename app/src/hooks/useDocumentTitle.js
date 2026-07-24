import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPageNameFromPath, getPageTitleKey } from '../utils/translationHelper';

/**
 * Hook to update document title based on current route
 * This will set the browser tab title to the translated page title
 * 
 * IMPORTANT: This hook does NOT use useLocation() directly to avoid Router context errors.
 * The path must be provided by the component using this hook, which should be inside a Router.
 * 
 * @param {string} path - The current path (from useLocation().pathname in parent component)
 * @param {string} appName - The name of the app to include in the title
 */
const useDocumentTitle = (path, appName = 'AgriTech') => {
  const { t } = useTranslation();

  useEffect(() => {
    // Get the page name from the provided path
    const pageName = getPageNameFromPath(path);

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
  }, [path, t, appName]);
};

export default useDocumentTitle;