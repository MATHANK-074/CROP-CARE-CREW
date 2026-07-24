import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaArrowRight,
  FaWater,
  FaSeedling,
  FaBug,
  FaDisease,
  FaLeaf,
  FaTemperatureHigh,
  FaCloudRain
} from 'react-icons/fa';
import { GiFertilizerBag, GiWheat, GiTreeBranch } from 'react-icons/gi';

/**
 * Optimized TaskItem component with improved performance
 * Using memo to prevent re-renders when props haven't changed
 */
const OptimizedTaskItem = ({ task, onMarkDone, onMarkSkipped, disabled }) => {
  const { t } = useTranslation(['translation', 'tasks']);

  // Map category to icon
  const getCategoryIcon = () => {
    switch (task.category) {
      case 'irrigation':
        return <FaWater className="text-blue-500 w-5 h-5" />;
      case 'fertilization':
        return <GiFertilizerBag className="text-brown-500 w-5 h-5" />;
      case 'pest_control':
        return <FaBug className="text-red-500 w-5 h-5" />;
      case 'disease_treatment':
        return <FaDisease className="text-purple-500 w-5 h-5" />;
      case 'harvesting':
        return <GiWheat className="text-yellow-500 w-5 h-5" />;
      case 'planting':
        return <FaSeedling className="text-green-500 w-5 h-5" />;
      case 'pruning':
        return <GiTreeBranch className="text-green-700 w-5 h-5" />;
      case 'soil_management':
        return <FaLeaf className="text-brown-600 w-5 h-5" />;
      case 'weather_response':
        return <FaCloudRain className="text-gray-500 w-5 h-5" />;
      case 'temperature_control':
        return <FaTemperatureHigh className="text-orange-500 w-5 h-5" />;
      default:
        return <FaInfoCircle className="text-gray-500 w-5 h-5" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      console.error('Invalid date format:', e);
      return 'Invalid date';
    }
  };

  // Determine if task is overdue
  const isOverdue = task.status === 'pending' &&
    new Date(task.dueDate) < new Date() &&
    new Date(task.dueDate).toDateString() !== new Date().toDateString();

  return (
    <div className={`border rounded-lg p-4 transition-all ${task.status === 'done' ? 'bg-green-50 border-green-200' :
        task.status === 'skipped' ? 'bg-gray-50 border-gray-200' :
          isOverdue ? 'bg-red-50 border-red-200' :
            'bg-white border-gray-200 hover:border-green-300'
      }`}>
      <div className="flex items-center justify-between">
        {/* Left side with task info */}
        <div className="flex-grow mr-4">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0">
              {getCategoryIcon()}
            </span>
            <h3 className={`font-medium ${task.status === 'done' ? 'text-green-700' :
                task.status === 'skipped' ? 'text-gray-500 line-through' :
                  isOverdue ? 'text-red-700' : 'text-gray-900'
              }`}>
              {task.title}
            </h3>
          </div>

          <p className="text-sm text-gray-600 mt-1">{task.description}</p>

          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span>{t(`${task.category}`, { ns: 'tasks' })}</span>
            <span className="mx-2">•</span>
            <span>{t('due', { ns: 'tasks' })}: {formatDate(task.dueDate)}</span>

            {task.status === 'done' && (
              <>
                <span className="mx-2">•</span>
                <span className="text-green-600 flex items-center">
                  <FaCheck className="mr-1 w-3 h-3" />
                  {formatDate(task.completedDate)}
                </span>
              </>
            )}

            {task.status === 'skipped' && (
              <>
                <span className="mx-2">•</span>
                <span className="text-gray-500 flex items-center">
                  <FaTimes className="mr-1 w-3 h-3" />
                  {t('skipped', { ns: 'tasks' })}
                </span>
              </>
            )}

            {isOverdue && (
              <>
                <span className="mx-2">•</span>
                <span className="text-red-600">{t('overdue', { ns: 'tasks' })}</span>
              </>
            )}
          </div>
        </div>

        {/* Right side with actions */}
        <div className="flex-shrink-0 flex items-center space-x-2">
          {task.status === 'pending' && (
            <>
              <button
                onClick={() => onMarkDone(task._id)}
                disabled={disabled}
                className={`p-2 rounded-full transition ${disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                aria-label={t('mark_as_done', { ns: 'tasks' })}
              >
                <FaCheck className="w-4 h-4" />
              </button>

              <button
                onClick={() => onMarkSkipped(task._id)}
                disabled={disabled}
                className={`p-2 rounded-full transition ${disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                aria-label={t('mark_as_skipped', { ns: 'tasks' })}
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </>
          )}

          <Link
            to={`/tasks/detail/${task._id}`}
            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
            aria-label={t('view_details', { ns: 'tasks' })}
          >
            <FaArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(OptimizedTaskItem);