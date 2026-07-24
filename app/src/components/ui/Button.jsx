import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow hover:from-green-500 hover:to-green-700 focus:ring-green-400 hover:shadow-lg hover:-translate-y-0.5',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 focus:ring-gray-400',
    outline: 'border-2 border-green-500 text-green-600 hover:bg-green-50 focus:ring-green-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      )}
      {children}
    </button>
  );
};

export default Button;