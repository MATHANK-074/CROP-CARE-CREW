import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaArrowRight,
  FaWater,
  FaLeaf,
  FaBug,
  FaDisease,
  FaSeedling,
  FaCloudRain,
  FaTools,
  FaCalendarCheck
} from 'react-icons/fa';
import { translateCategory, translateCropName } from '../../utils/dbTranslations';
import { translateTaskDescription, translateFixedTaskDescription } from '../../utils/taskTranslations';
import i18n from '../../i18n';

/**
 * Individual task item component with status controls
 */
const TaskItem = ({ task, onMarkDone, onMarkSkipped, disabled = false }) => {
  const { t } = useTranslation(['translation', 'tasks']);

  // Get icon based on task category
  const getCategoryIcon = () => {
    switch (task.category) {
      case 'irrigation':
        return <FaWater className="text-blue-500" />;
      case 'fertilization':
        return <FaLeaf className="text-green-500" />;
      case 'pest_control':
        return <FaBug className="text-orange-500" />;
      case 'disease_treatment':
        return <FaDisease className="text-red-500" />;
      case 'planting':
        return <FaSeedling className="text-green-600" />;
      case 'weather_response':
        return <FaCloudRain className="text-blue-400" />;
      case 'harvesting':
        return <FaCalendarCheck className="text-yellow-600" />;
      default:
        return <FaTools className="text-gray-500" />;
    }
  };

  // Get priority class
  const getPriorityClass = () => {
    switch (task.priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Format due date
  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if task is due today
  const isToday = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);

    return today.getTime() === dueDate.getTime();
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'skipped':
        return <FaTimesCircle className="text-red-500 text-xl" />;
      case 'pending':
      default:
        return isToday(task.dueDate)
          ? <FaExclamationTriangle className="text-orange-500 text-xl" />
          : <FaClock className="text-blue-500 text-xl" />;
    }
  };

  return (
    <div className={`border rounded-lg p-3 sm:p-4 mb-3 shadow-sm ${getPriorityClass()} min-h-[120px] flex flex-col`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center flex-grow mr-2">
          <span className="mr-2 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">{getCategoryIcon()}</span>
          <h3 className="font-medium text-sm sm:text-base leading-tight">{task.title}</h3>
        </div>
        <span className="flex-shrink-0">{getStatusIcon()}</span>
      </div>

      {task.category && (
        <div className="text-xs text-gray-600 mb-2 bg-gray-50 px-2 py-1 rounded inline-block w-fit">
          {/* Use translation utility for category */}
          {translateCategory(task.category, 'translation')}
        </div>
      )}

      <p className="text-xs sm:text-sm mb-3 line-clamp-2 overflow-hidden flex-grow leading-relaxed text-gray-700">
        {task.crop
          ? translateTaskDescription(task.description, {
            crop: task.crop.name,
            category: task.category
          })
          : translateFixedTaskDescription(task.description)
        }
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div className="flex-shrink-0">
          <span className="font-semibold text-gray-600">{t('due', { ns: 'tasks' })}: </span>
          <span className={`${isToday(task.dueDate) ? 'font-bold text-orange-600' : 'text-gray-800'} bg-blue-50 px-2 py-1 rounded`}>
            {isToday(task.dueDate) ? t('today', { ns: 'tasks' }) : formatDueDate(task.dueDate)}
          </span>
        </div>

        {task.crop && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs truncate max-w-[150px] flex-shrink-0">
            {/* Use translation utility for crop name */}
            {translateCropName(task.crop.name, 'translation')}
          </span>
        )}
      </div>

      {task.status === 'pending' && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={() => onMarkSkipped(task._id)}
            disabled={disabled}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 rounded-md flex items-center justify-center text-sm font-medium transition-colors order-2 sm:order-1"
          >
            <FaTimesCircle className="mr-2 w-3 h-3" />
            {t('skip', { ns: 'tasks' })}
          </button>

          <button
            onClick={() => onMarkDone(task._id)}
            disabled={disabled}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-md flex items-center justify-center text-sm font-medium transition-colors order-1 sm:order-2"
          >
            <FaCheckCircle className="mr-2 w-3 h-3" />
            {t('mark_done', { ns: 'tasks' })}
          </button>
        </div>
      )}

      {/* Always reserve space for completion info to prevent layout shifts */}
      <div className="mt-3 text-xs text-center sm:text-right h-4">
        {(task.status === 'done' || task.status === 'skipped') && task.completedDate && (
          <span className={`inline-block px-2 py-1 rounded text-xs ${task.status === 'done' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
            <span className="font-semibold">
              {task.status === 'done' ? t('completed', { ns: 'tasks' }) : t('skipped', { ns: 'tasks' })}:
            </span>
            {' '}
            {new Date(task.completedDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskItem;