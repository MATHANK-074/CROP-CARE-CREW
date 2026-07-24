import React from 'react';

/**
 * Skeleton component for task items to prevent layout shifts during loading
 */
const TaskSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 mb-3 shadow-sm bg-white animate-pulse">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-gray-200 mr-2"></div>
          <div className="h-5 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
      </div>

      <div className="h-4 bg-gray-200 rounded w-full mt-3 mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>

      <div className="flex items-center justify-between text-xs mt-4">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-5 bg-gray-200 rounded w-24"></div>
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <div className="w-16 h-8 bg-gray-200 rounded"></div>
        <div className="w-24 h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default TaskSkeleton;