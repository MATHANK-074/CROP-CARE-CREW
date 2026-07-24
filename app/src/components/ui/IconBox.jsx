import React from 'react';

const IconBox = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'flex items-center justify-center rounded-full shadow';
  
  const variants = {
    primary: 'bg-gradient-to-br from-green-100 to-green-300 dark:from-green-800 dark:to-green-600 text-green-600 dark:text-green-300',
    secondary: 'bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-800 dark:to-blue-600 text-blue-600 dark:text-blue-300',
    warning: 'bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-800 dark:to-yellow-600 text-yellow-600 dark:text-yellow-300',
    danger: 'bg-gradient-to-br from-red-100 to-red-300 dark:from-red-800 dark:to-red-600 text-red-600 dark:text-red-300',
    info: 'bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-800 dark:to-blue-600 text-blue-600 dark:text-blue-300'
  };
  
  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default IconBox;