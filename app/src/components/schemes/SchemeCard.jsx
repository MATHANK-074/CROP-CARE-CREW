import React from 'react';
import Button from '../ui/Button';

const SchemeCard = ({ scheme }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-3">
        {scheme.icon}
        <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">{scheme.title}</h2>
      </div>
      <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">{scheme.description}</p>
      <Button 
        size="sm" 
        className="w-fit"
        onClick={() => {
          // Handle apply now action

        }}
      >
        Apply Now
      </Button>
    </div>
  );
};

export default SchemeCard;