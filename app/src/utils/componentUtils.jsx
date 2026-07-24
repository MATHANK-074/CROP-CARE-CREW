/**
 * Shared Component Utilities
 * Common component patterns and reusable component builders
 */

import React from 'react';
import { getCropStatusBadge, getTaskStatusBadge, getPriorityBadge, formatDate, formatFileSize } from './formatUtils';

/**
 * Create a status badge component
 * @param {string} status - Status value
 * @param {string} type - Type of status ('crop', 'task', 'priority')
 * @param {Object} customProps - Additional props
 * @returns {React.Component} Status badge component
 */
export const createStatusBadge = (status, type = 'task', customProps = {}) => {
  let badgeInfo;
  
  switch (type) {
    case 'crop':
      badgeInfo = getCropStatusBadge(status);
      break;
    case 'task':
      badgeInfo = getTaskStatusBadge(status);
      break;
    case 'priority':
      badgeInfo = getPriorityBadge(status);
      break;
    default:
      badgeInfo = { bgColor: 'bg-gray-100', textColor: 'text-gray-800', text: status };
  }

  const { className = '', ...otherProps } = customProps;
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeInfo.bgColor} ${badgeInfo.textColor} ${className}`}
      {...otherProps}
    >
      {badgeInfo.icon && <span className="mr-1">{badgeInfo.icon}</span>}
      {badgeInfo.text}
    </span>
  );
};

/**
 * Create a loading skeleton component
 * @param {Object} props - Skeleton props
 * @returns {React.Component} Loading skeleton
 */
export const createLoadingSkeleton = ({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  className = '',
  lines = 1
}) => {
  const skeletonClass = `animate-pulse bg-gray-200 ${width} ${height} ${rounded} ${className}`;
  
  if (lines === 1) {
    return <div className={skeletonClass} />;
  }
  
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className={skeletonClass} />
      ))}
    </div>
  );
};

/**
 * Create an empty state component
 * @param {Object} props - Empty state props
 * @returns {React.Component} Empty state component
 */
export const createEmptyState = ({
  icon = '📭',
  title = 'No data available',
  description = 'There is nothing to display right now.',
  action = null,
  className = ''
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

/**
 * Create an error state component
 * @param {Object} props - Error state props
 * @returns {React.Component} Error state component
 */
export const createErrorState = ({
  error = 'An error occurred',
  onRetry = null,
  className = ''
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-red-900 mb-2">Something went wrong</h3>
      <p className="text-red-600 mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

/**
 * Create a confirmation dialog component
 * @param {Object} props - Dialog props
 * @returns {React.Component} Confirmation dialog
 */
export const createConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor = 'red'
}) => {
  if (!isOpen) return null;

  const confirmButtonClass = confirmButtonColor === 'red' 
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${confirmButtonClass} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Create a tooltip component
 * @param {Object} props - Tooltip props
 * @returns {React.Component} Tooltip component
 */
export const createTooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className={`absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm ${positionClasses[position]}`}>
          {content}
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      )}
    </div>
  );
};

/**
 * Create a pagination component
 * @param {Object} props - Pagination props
 * @returns {React.Component} Pagination component
 */
export const createPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxPageNumbers = 5,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPageNumbers / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPageNumbers - 1);

    if (end - start + 1 < maxPageNumbers) {
      start = Math.max(1, end - maxPageNumbers + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        {showPageNumbers && (
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {getPageNumbers().map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNumber === currentPage
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Create a file upload component
 * @param {Object} props - File upload props
 * @returns {React.Component} File upload component
 */
export const createFileUpload = ({
  onFileSelect,
  accept = "image/*",
  multiple = false,
  maxSize = 5 * 1024 * 1024,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFileSelect = (files) => {
    const fileList = Array.from(files);
    const validFiles = fileList.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFileSelect(multiple ? validFiles : validFiles[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
        isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      } ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="space-y-2">
        <div className="text-3xl">📁</div>
        <div className="text-sm text-gray-600">
          <p>Drop files here or click to select</p>
          <p className="text-xs text-gray-400">
            Maximum file size: {formatFileSize(maxSize)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default {
  createStatusBadge,
  createLoadingSkeleton,
  createEmptyState,
  createErrorState,
  createConfirmDialog,
  createTooltip,
  createPagination,
  createFileUpload
};