import React from 'react';

/**
 * ProgressBar component - A reusable progress bar with customization options
 * @param {number} progress - Current progress percentage (0-100)
 * @param {string} status - Status of the progress ('completed', 'in-progress', 'not-started', 'wishlist')
 * @param {string} size - Size of the progress bar ('sm', 'md', 'lg')
 * @param {boolean} showLabel - Whether to show the progress percentage
 * @param {boolean} showDetails - Whether to show detailed information (completed/total)
 * @param {number} completedCount - Number of completed items
 * @param {number} totalCount - Total number of items
 * @param {string} label - Optional custom label
 */
const ProgressBar = ({ 
  progress = 0, 
  status = 'in-progress', 
  size = 'md', 
  showLabel = true, 
  showDetails = false,
  completedCount = 0,
  totalCount = 0,
  label = 'Progress'
}) => {
  // Validate and constrain progress value
  const validProgress = Math.min(Math.max(0, progress), 100);
  
  // Determine height based on size
  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }[size] || 'h-2.5';
  
  // Determine colors based on status
  const barColor = {
    completed: 'bg-green-500',
    'in-progress': 'bg-blue-500',
    'not-started': 'bg-yellow-500',
    wishlist: 'bg-purple-500'
  }[status] || 'bg-blue-500';
  
  // Determine text for label
  const labelText = showDetails && totalCount > 0 
    ? `${completedCount}/${totalCount} completed`
    : `${validProgress}%`;
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{label}</span>
          <span className="font-medium">{labelText}</span>
        </div>
      )}
      <div className="relative">
        <div className={`overflow-hidden ${heightClass} text-xs flex rounded-full bg-gray-200`}>
          <div
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-500 ease-in-out ${barColor}`}
            style={{ width: `${validProgress}%` }}
            role="progressbar"
            aria-valuenow={validProgress}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>
      {showDetails && totalCount > 0 && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{completedCount} completed</span>
          <span>{totalCount} total</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar; 