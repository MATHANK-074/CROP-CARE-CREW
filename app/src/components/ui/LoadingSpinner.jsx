import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <div className={`${sizes[size]} border-2 border-gray-300 dark:border-gray-600 border-t-green-500 rounded-full animate-spin ${className}`}></div>
  );
};

export default LoadingSpinner;