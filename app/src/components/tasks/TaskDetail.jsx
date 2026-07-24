import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaWater,
  FaSeedling,
  FaBug,
  FaDisease,
  FaLeaf,
  FaTemperatureHigh,
  FaCloudRain
} from 'react-icons/fa';
import { GiFertilizerBag, GiWheat, GiTreeBranch } from 'react-icons/gi';

// Task detail skeleton loader for better UX during loading
const TaskDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>

    <div className="h-32 bg-gray-200 rounded mb-6"></div>

    <div className="grid grid-cols-2 gap-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>

    <div className="mt-6">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
    </div>
  </div>
);

/**
 * Task Detail component for displaying and managing individual tasks
 */
const TaskDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation(['translation', 'tasks']);
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    dueDate: '',
    notes: ''
  });

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'irrigation':
        return <FaWater className="text-blue-500" />;
      case 'fertilization':
        return <GiFertilizerBag className="text-brown-500" />;
      case 'pest_control':
        return <FaBug className="text-red-500" />;
      case 'disease_treatment':
        return <FaDisease className="text-purple-500" />;
      case 'harvesting':
        return <GiWheat className="text-yellow-500" />;
      case 'planting':
        return <FaSeedling className="text-green-500" />;
      case 'pruning':
        return <GiTreeBranch className="text-green-700" />;
      case 'soil_management':
        return <FaLeaf className="text-brown-600" />;
      case 'weather_response':
        return <FaCloudRain className="text-gray-500" />;
      case 'temperature_control':
        return <FaTemperatureHigh className="text-orange-500" />;
      default:
        return null;
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

  // Check if a date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return today.toDateString() === date.toDateString();
  };

  // Fetch task data
  const fetchTask = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/tasks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch task: ${res.status}`);
      }

      const data = await res.json();
      setTask(data);

      // Initialize form data for editing
      setFormData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
        notes: data.notes || ''
      });
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(t('failed_to_fetch_task', { ns: 'tasks' }));
    } finally {
      setLoading(false);
    }
  }, [id, navigate, t]);

  // Load task on component mount
  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update task
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error(`Failed to update task: ${res.status}`);
      }

      const updatedTask = await res.json();
      setTask(updatedTask);
      setIsEditing(false);
      toast.success(t('task_updated', { ns: 'tasks' }));
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error(t('failed_to_update_task', { ns: 'tasks' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark task as done
  const handleMarkDone = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/tasks/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'done' })
      });

      if (!res.ok) {
        throw new Error(`Failed to update task status: ${res.status}`);
      }

      // Update local state
      setTask(prev => ({
        ...prev,
        status: 'done',
        completedDate: new Date().toISOString()
      }));

      toast.success(t('task_marked_done', { ns: 'tasks' }));
    } catch (err) {
      console.error('Error marking task as done:', err);
      toast.error(t('failed_to_update_task', { ns: 'tasks' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark task as skipped
  const handleMarkSkipped = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/tasks/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'skipped' })
      });

      if (!res.ok) {
        throw new Error(`Failed to update task status: ${res.status}`);
      }

      // Update local state
      setTask(prev => ({
        ...prev,
        status: 'skipped',
        completedDate: new Date().toISOString()
      }));

      toast.info(t('task_marked_skipped', { ns: 'tasks' }));
    } catch (err) {
      console.error('Error marking task as skipped:', err);
      toast.error(t('failed_to_update_task', { ns: 'tasks' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!window.confirm(t('confirm_delete_task', { ns: 'tasks' }))) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to delete task: ${res.status}`);
      }

      toast.success(t('task_deleted', { ns: 'tasks' }));
      navigate('/tasks');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error(t('failed_to_delete_task', { ns: 'tasks' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if task is overdue
  const isOverdue = task &&
    task.status === 'pending' &&
    new Date(task.dueDate) < new Date() &&
    new Date(task.dueDate).toDateString() !== new Date().toDateString();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-4 sm:p-6 m-4">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)} /* This uses browser history to go back to previous page */
          className="inline-flex items-center text-gray-600 hover:text-gray-900 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2" />
          {t('back_to_tasks', { ns: 'tasks' })}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-md mb-6 flex items-start">
          <FaExclamationTriangle className="text-red-600 mr-2 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold">{t('error_occurred', { ns: 'tasks' })}</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <TaskDetailSkeleton />
      ) : (
        <>
          {!isEditing ? (
            // View mode
            <div>
              {/* Task header */}
              <div className="mb-8">
                {/* Main title section */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 rounded-lg border border-gray-200 mb-4">
                  <div className="flex items-start gap-3 mb-4">
                    {task?.category && (
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-2xl">
                          {getCategoryIcon(task.category)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h1 className={`text-2xl sm:text-3xl font-bold leading-tight mb-2 ${task?.status === 'done' ? 'text-green-700' :
                        task?.status === 'skipped' ? 'text-gray-500 line-through' :
                          isOverdue ? 'text-red-700' : 'text-gray-900'
                        }`}>
                        {task?.title}
                      </h1>

                      {task?.category && (
                        <div className="mb-3">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {t(`${task.category}`, { ns: 'tasks' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {task?.status === 'done' && (
                        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full flex items-center text-sm font-semibold">
                          <FaCheck className="mr-1 w-4 h-4" />
                          {t('completed', { ns: 'tasks' })}
                        </div>
                      )}
                      {task?.status === 'skipped' && (
                        <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-full flex items-center text-sm font-semibold">
                          <FaTimes className="mr-1 w-4 h-4" />
                          {t('skipped', { ns: 'tasks' })}
                        </div>
                      )}
                      {task?.status === 'pending' && isOverdue && (
                        <div className="bg-red-100 text-red-700 px-3 py-2 rounded-full flex items-center text-sm font-semibold">
                          <FaExclamationTriangle className="mr-1 w-4 h-4" />
                          {t('overdue', { ns: 'tasks' })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task metadata */}
                  <div className="flex flex-wrap gap-3">
                    {task?.dueDate && (
                      <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <FaCalendarAlt className="mr-2 text-blue-500 w-4 h-4" />
                        <span className="font-medium text-gray-700">{t('due', { ns: 'tasks' })}: </span>
                        <span className={`ml-1 font-semibold ${isToday(task.dueDate) ? 'text-orange-600' : 'text-gray-900'}`}>
                          {isToday(task.dueDate) ? t('today', { ns: 'tasks' }) : formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}

                    {task?.estimatedTime && (
                      <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <FaClock className="mr-2 text-yellow-500 w-4 h-4" />
                        <span className="font-medium text-gray-700">{t('duration', { ns: 'tasks' })}: </span>
                        <span className="ml-1 font-semibold text-gray-900">{task.estimatedTime} {t('minutes', { ns: 'tasks' })}</span>
                      </div>
                    )}

                    {(task?.status === 'done' || task?.status === 'skipped') && task?.completedDate && (
                      <div className={`flex items-center px-3 py-2 rounded-lg border text-sm ${task.status === 'done'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}>
                        {task.status === 'done' ? (
                          <FaCheck className="mr-2 w-4 h-4" />
                        ) : (
                          <FaTimes className="mr-2 w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {task.status === 'done' ? t('completed_on', { ns: 'tasks' }) : t('skipped_on', { ns: 'tasks' })}:
                        </span>
                        <span className="ml-1 font-semibold">{formatDate(task.completedDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Task description */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-6">
                <h2 className="font-medium mb-2 text-sm sm:text-base">{t('description', { ns: 'tasks' })}</h2>
                <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base leading-relaxed">{task?.description}</p>
              </div>

              {/* Task actions */}
              {task?.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    onClick={handleMarkDone}
                    disabled={isSubmitting}
                    className={`px-4 py-3 rounded-md flex-1 flex justify-center items-center text-sm sm:text-base font-medium ${isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                      }`}
                  >
                    <FaCheck className="mr-2" />
                    {t('mark_as_done', { ns: 'tasks' })}
                  </button>

                  <button
                    onClick={handleMarkSkipped}
                    disabled={isSubmitting}
                    className={`px-4 py-3 rounded-md flex-1 flex justify-center items-center text-sm sm:text-base font-medium ${isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                      }`}
                  >
                    <FaTimes className="mr-2" />
                    {t('skip_task', { ns: 'tasks' })}
                  </button>
                </div>
              )}

              {/* Task notes */}
              {task?.notes && (
                <div className="mb-6">
                  <h2 className="font-medium mb-2 text-sm sm:text-base">{t('notes', { ns: 'tasks' })}</h2>
                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base leading-relaxed">{task.notes}</p>
                  </div>
                </div>
              )}

              {/* Task image if available */}
              {task?.imageUrl && (
                <div className="mb-6">
                  <h2 className="font-medium mb-2 text-sm sm:text-base">{t('reference_image', { ns: 'tasks' })}</h2>
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={task.imageUrl}
                      alt={t('task_reference_image', { ns: 'tasks' })}
                      className="w-full h-auto max-h-80 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Edit and delete buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-3 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-md flex items-center justify-center text-sm sm:text-base font-medium border border-blue-200 hover:border-blue-300"
                >
                  <FaEdit className="mr-2" />
                  {t('edit_task', { ns: 'tasks' })}
                </button>

                <button
                  onClick={handleDeleteTask}
                  disabled={isSubmitting}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-md flex items-center justify-center text-sm sm:text-base font-medium border border-red-200 hover:border-red-300"
                >
                  <FaTrash className="mr-2" />
                  {t('delete_task', { ns: 'tasks' })}
                </button>
              </div>
            </div>
          ) : (
            // Edit mode
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('edit_task', { ns: 'tasks' })}</h1>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm" htmlFor="title">
                  {t('task_title', { ns: 'tasks' })}*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm" htmlFor="description">
                  {t('description', { ns: 'tasks' })}*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm" htmlFor="category">
                    {t('category', { ns: 'tasks' })}*
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">{t('select_category', { ns: 'tasks' })}</option>
                    <option value="irrigation">{t('irrigation', { ns: 'tasks' })}</option>
                    <option value="fertilization">{t('fertilization', { ns: 'tasks' })}</option>
                    <option value="pest_control">{t('pest_control', { ns: 'tasks' })}</option>
                    <option value="disease_treatment">{t('disease_treatment', { ns: 'tasks' })}</option>
                    <option value="harvesting">{t('harvesting', { ns: 'tasks' })}</option>
                    <option value="planting">{t('planting', { ns: 'tasks' })}</option>
                    <option value="pruning">{t('pruning', { ns: 'tasks' })}</option>
                    <option value="soil_management">{t('soil_management', { ns: 'tasks' })}</option>
                    <option value="weather_response">{t('weather_response', { ns: 'tasks' })}</option>
                    <option value="general">{t('general', { ns: 'tasks' })}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm" htmlFor="dueDate">
                    {t('due_date', { ns: 'tasks' })}*
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm" htmlFor="notes">
                  {t('notes', { ns: 'tasks' })}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-3 rounded-md flex-1 flex justify-center items-center text-sm sm:text-base font-medium ${isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                    }`}
                >
                  {isSubmitting ? t('saving', { ns: 'tasks' }) : t('save_changes', { ns: 'tasks' })}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-3 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 text-sm sm:text-base font-medium flex-1 sm:flex-none"
                >
                  {t('cancel', { ns: 'tasks' })}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default TaskDetail;