import React from 'react';

const Input = ({
  label,
  error,
  className = '',
  type = 'text',
  required = false,
  ...props
}) => {
  const inputClasses = `
    w-full border border-gray-300 px-3 py-2 rounded-lg 
    bg-white text-gray-900
    placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400
    transition-all duration-200 text-base
    ${error ? 'border-red-500 focus:ring-red-400 focus:border-red-500' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-gray-700 mb-1 font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;