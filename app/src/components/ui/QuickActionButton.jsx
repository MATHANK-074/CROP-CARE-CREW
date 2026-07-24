import React from 'react';

/**
 * QuickActionButton component for consistent action buttons across the app
 * 
 * @param {object} props Component props
 * @param {ReactNode} props.icon Icon component to display
 * @param {string} props.label Button label text
 * @param {string} props.variant Button style variant (primary, secondary, success, warning, danger, info)
 * @param {function} props.onClick Click handler function
 * @param {string} props.size Button size (sm, md, lg)
 * @param {string} props.className Additional CSS classes
 * @param {boolean} props.iconOnly Display only the icon without text
 */
const QuickActionButton = ({
  icon,
  label,
  variant = 'primary',
  onClick,
  size = 'md',
  className = '',
  iconOnly = false,
  ...rest
}) => {
  
  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    info: 'bg-teal-500 hover:bg-teal-600 text-white',
    light: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-800 border border-gray-300',
    'outline-primary': 'bg-transparent hover:bg-blue-50 text-blue-500 border border-blue-500',
    'outline-success': 'bg-transparent hover:bg-green-50 text-green-500 border border-green-500',
  };

  // Size styles
  const sizeStyles = {
    xs: iconOnly ? 'p-1' : 'px-2 py-1 text-xs',
    sm: iconOnly ? 'p-2' : 'px-3 py-1 text-sm',
    md: iconOnly ? 'p-3' : 'px-4 py-2 text-base',
    lg: iconOnly ? 'p-4' : 'px-5 py-2 text-lg'
  };

  // Shape styles
  const shapeStyles = iconOnly ? 'rounded-full' : 'rounded-md';

  // Icon size
  const iconSize = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Full button classes
  const buttonClasses = `
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.md}
    ${shapeStyles}
    transition-colors 
    font-medium
    flex 
    items-center 
    justify-center 
    gap-2
    focus:outline-none 
    focus:ring-2 
    focus:ring-offset-2 
    focus:ring-blue-300
    ${className}
  `;

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      type="button"
      {...rest}
    >
      {icon && (
        <span className={iconSize[size]}>
          {icon}
        </span>
      )}
      {!iconOnly && label && <span>{label}</span>}
    </button>
  );
};

export default QuickActionButton;