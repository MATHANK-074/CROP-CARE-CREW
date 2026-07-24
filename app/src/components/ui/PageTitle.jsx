import React from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { getPageTitleKey } from '../../utils/translationHelper';

/**
 * PageTitle Component
 * 
 * Renders a page title with proper translation using the translation helper
 * 
 * @param {Object} props - Component props
 * @param {string} props.pageName - The name of the page to display title for
 * @param {Object} props.className - Additional CSS classes for styling
 * @returns {JSX.Element} - Rendered component
 */
const PageTitle = ({ pageName, className = '', ...rest }) => {
  const { t } = useTranslation();

  // Get the translation key for this page title
  const titleKey = getPageTitleKey(pageName);

  // Fallback if translation is missing - capitalize the page name
  const fallbackTitle = pageName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter

  return (
    <h1 className={`page-title ${className}`} {...rest}>
      {t(titleKey, fallbackTitle)}
    </h1>
  );
};

PageTitle.propTypes = {
  pageName: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default PageTitle;