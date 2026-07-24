import React from 'react';

/**
 * Enhanced TaskSkeleton component for loading states
 * Fixed dimensions to prevent layout shifts
 */
const OptimizedTaskSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="flex items-center justify-between">
        {/* Left side with task info */}
        <div className="flex-grow mr-4">
          <div className="flex items-center gap-2">
            {/* Category icon placeholder */}
            <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0"></div>

            {/* Title placeholder */}
            <div className="h-5 bg-gray-200 rounded w-3/5"></div>
          </div>

          {/* Description placeholder */}
          <div className="h-4 bg-gray-200 rounded w-4/5 mt-2"></div>

          {/* Meta info placeholder */}
          <div className="flex items-center mt-2">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="mx-2 h-3 w-3 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>

        {/* Right side with actions */}
        <div className="flex-shrink-0 flex items-center space-x-2">
          {/* Action button placeholders */}
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedTaskSkeleton;