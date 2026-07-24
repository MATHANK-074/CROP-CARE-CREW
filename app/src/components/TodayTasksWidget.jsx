import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateTasksBatch } from '@/utils/dynamicTranslator';
import {
  FaCheckCircle,
  FaTimes,
  FaHourglass,
  FaTint,
  FaLeaf,
  FaSeedling,
  FaBug,
  FaThermometerHalf,
  FaCalendarDay,
  FaStar,
  FaCheck,
  FaMagic
} from 'react-icons/fa';
import { MdCheckCircle } from "react-icons/md";
import { toast } from 'react-toastify';

// Task categories matching AgriTech project theme
const TASK_CATEGORIES = {
  IRRIGATION: {
    icon: FaTint,
    color: 'text-blue-600'
  },
  FERTILIZATION: {
    icon: FaLeaf,
    color: 'text-green-600'
  },
  PEST_CONTROL: {
    icon: FaBug,
    color: 'text-red-600'
  },
  MONITORING: {
    icon: FaSeedling,
    color: 'text-green-600'
  },
  HARVESTING: {
    icon: FaStar,
    color: 'text-yellow-600'
  },
  SOIL_MANAGEMENT: {
    icon: FaThermometerHalf,
    color: 'text-amber-600'
  },
  GENERAL: {
    icon: FaCalendarDay,
    color: 'text-gray-600'
  }
};

const TodayTasksWidget = ({ crops = [], onTaskComplete, refreshKey, onTaskClick }) => {
  const { t } = useTranslation();
  const [todayTasks, setTodayTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Fetch daily tasks from API - generated only once per day
  useEffect(() => {
    const fetchDailyTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching daily tasks from API...');

        const token = localStorage.getItem('token');
        console.log('🔑 Auth token:', token ? 'Found' : 'Not found', token?.substring(0, 20) + '...');
        if (!token) {
          console.warn('No auth token found');
          setTodayTasks([]);
          return;
        }

        const response = await fetch(`${API_BASE}/api/tasks/daily`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 API Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error response:', errorText);
          throw new Error(`Failed to fetch daily tasks: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data.success) {
          console.log(`📋 Retrieved ${data.tasks.length} daily tasks`, data);
          let tasks = data.tasks || [];

          // Translation functionality disabled
          // Only translate when user's language is not English
          const lng = localStorage.getItem('i18nextLng') || 'en';
          if (lng && lng !== 'en') {
            try {
              tasks = await translateTasksBatch(tasks, lng, 'en');
            } catch (e) {
              // fail silently, keep English
            }
          }

          setTodayTasks(tasks);

          // Show generation status in console
          if (data.generated) {
            console.log('✨ New tasks generated for today');
          } else {
            console.log('♻️ Using existing tasks for today');
          }
        } else {
          throw new Error(data.message || 'Failed to get daily tasks');
        }

      } catch (err) {
        console.error('Error fetching daily tasks:', err);
        setError(err.message);
        setTodayTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyTasks();
  }, [refreshKey]); // Remove crops dependency - API will handle crop data

  // Task skip handler - marks task as skipped
  const handleSkipTask = async (task, reason = '') => {
    console.log('⏭️ Skipping task via API:', task.title);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }

      const requestBody = {
        status: 'skipped'
      };
      if (reason.trim()) {
        requestBody.feedback = { notes: reason.trim() };
      }

      const response = await fetch(`${API_BASE}/api/tasks/${task._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to skip task: ${response.status}`);
      }

      const result = await response.json();

      // Remove from today's tasks
      setTodayTasks(prev => prev.filter(t => t._id !== task._id));

      // Add to completed tasks with skipped status
      setCompletedTasks(prev => [...prev, { ...result, skippedAt: new Date(), status: 'skipped' }]);

      // Show success message
      toast.success(`⏭️ Task skipped: ${task.title}`, {
        position: "top-right",
        autoClose: 3000,
      });

    } catch (error) {
      console.error('Error skipping task:', error);
      toast.error(`Failed to skip task: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // State for completion modal
  const [completionModal, setCompletionModal] = useState({ show: false, task: null });
  const [completionNotes, setCompletionNotes] = useState('');

  // Task completion handler - now calls API to update database
  const handleMarkAsDone = async (task, notes = '') => {
    console.log('✅ Marking task as done via API:', task.title);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }

      const requestBody = {};
      if (notes.trim()) {
        requestBody.notes = notes.trim();
      }

      const response = await fetch(`${API_BASE}/api/tasks/${task._id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to complete task: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Remove from today's tasks
        setTodayTasks(prev => prev.filter(t => t._id !== task._id));

        // Add to completed tasks
        setCompletedTasks(prev => [...prev, { ...result.task, completedAt: new Date() }]);

        // Call parent callback if provided
        if (onTaskComplete) {
          onTaskComplete(result.task);
        }

        toast.success(result.message || `Task completed: ${task.title}`);
        console.log('✅ Task marked as complete:', result.task.title);
      } else {
        throw new Error(result.message || 'Failed to complete task');
      }

    } catch (error) {
      console.error('Error completing task:', error);
      toast.error(`Error completing task: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category) => {
    // Convert API category names to display format
    const categoryMapping = {
      'irrigation': 'IRRIGATION',
      'fertilization': 'FERTILIZATION',
      'pest_control': 'PEST_CONTROL',
      'soil_management': 'SOIL_MANAGEMENT',
      'harvesting': 'HARVESTING',
      'general': 'GENERAL'
    };

    const displayCategory = categoryMapping[category] || category.toUpperCase();
    return TASK_CATEGORIES[displayCategory] || TASK_CATEGORIES.GENERAL;
  };

  // Show loading state while fetching from API
  if (loading && todayTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden min-h-[500px] max-h-[520px] w-full max-w-full">{/* Added min-height for consistency */}
        <div className="bg-white border-b border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mr-4">
                <FaLeaf className="text-green-600 text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Today's Tasks</h3>
                <p className="text-green-600 text-sm">Loading tasks...</p>
              </div>
            </div>
            <div className="bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
              ...
            </div>
          </div>
        </div>

        <div className="p-5 min-h-[400px] max-h-96 overflow-y-auto bg-white">{/* Added min-height for loading state */}
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200"></div>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-green-600 absolute top-0 left-0"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if API call failed
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden min-h-[500px] max-h-[520px] w-full max-w-full">{/* Added min-height for error state */}
        <div className="bg-white border-b border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mr-4">
                <FaTimes className="text-red-600 text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Today's Tasks</h3>
                <p className="text-red-600 text-sm">Failed to load tasks</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 min-h-[400px] max-h-96 overflow-y-auto bg-white">{/* Added min-height for error state */}
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
              <FaTimes className="text-2xl" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Tasks</h4>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden min-h-[500px] max-h-[550px] w-full max-w-full">{/* Added min-height to match weather widget */}
      {/* Enhanced header with green colors and white background */}
      <div className="bg-white border-b border-gray-200 p-3 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 mr-3 sm:mr-4">
              <FaLeaf className="text-green-600 text-sm sm:text-lg" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Today's Tasks</h3>
              <p className="text-green-600 text-xs sm:text-sm">Daily activities</p>
            </div>
          </div>

          <div className="bg-green-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold">
            {todayTasks.length}
          </div>
        </div>
      </div>

      {/* Scrollable content with height to match weather widget */}
      <div className="p-2 sm:p-3 min-h-[400px] max-h-96 overflow-y-auto bg-white">{/* Added min-height for consistent sizing */}
        {todayTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full text-green-600 mx-auto mb-4">
              <MdCheckCircle className="text-2xl" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">All Tasks Complete!</h4>
            <p className="text-gray-600">Your farm is up to date</p>
          </div>
        ) : (
          <div className="space-y-1 sm:space-y-2">
            {todayTasks.map((task, index) => {
              const categoryInfo = getCategoryInfo(task.category);
              const IconComponent = categoryInfo.icon;

              return (
                <div
                  key={task._id || task.id || index}
                  className="bg-white rounded-lg border border-gray-100 p-2 sm:p-3 hover:shadow-md hover:border-green-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    {/* Add crop element at top */}
                    <div className="w-full">
                      <div className="flex items-center justify-between pb-2">
                        <div className="text-xs sm:text-sm bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">
                          <FaSeedling className="inline mr-1 text-xs" />
                          {task.crop?.name || task.cropName || 'Unknown Crop'}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 sm:gap-3 flex-1">
                        {/* Enhanced category icon */}
                        <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white border border-gray-200 ${categoryInfo.color} flex-shrink-0`}>
                          <IconComponent className="text-sm sm:text-base" />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Simplified task title */}
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2 leading-tight">
                            {task.displayTitle || task.title}
                          </h4>

                          {/* Simplified description - show only essential info */}
                          <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                            {(() => {
                              const desc = task.displayDescription || task.description;
                              const firstLine = desc.split('\n')[0];
                              // Remove emojis and show only the main task
                              const cleanDesc = firstLine.replace(/[🚿🌱🔍🌾🌿🚜📅📊💡🎯⏰📋]/g, '').trim();
                              return cleanDesc || 'Farm maintenance task';
                            })()}
                          </div>
                        </div>

                        {/* Action buttons: Complete and Skip - Mobile optimized */}
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                          {/* Simple complete button */}
                          <button
                            onClick={() => handleMarkAsDone(task)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded text-xs sm:text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1 min-w-[60px] sm:min-w-[80px]"
                            title="Complete Task"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border border-white/30 border-t-white"></div>
                            ) : (
                              <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                            <span className="font-medium">Done</span>
                          </button>

                          {/* Skip button */}
                          <button
                            onClick={() => setCompletionModal({ show: true, task, type: 'skip' })}
                            disabled={loading}
                            className="text-black-600 border border-gray-400 bg-white hover:bg-green-50 px-2 py-1.5 sm:px-3 sm:py-2 rounded text-xs sm:text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1 min-w-[60px] sm:min-w-[80px]"
                            title="Skip Task"
                          >
                            <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-medium">Skip</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enhanced completed/skipped tasks section */}
        {completedTasks.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center">
              Completed Today ({completedTasks.filter(t => t.status !== 'skipped').length})
              {completedTasks.filter(t => t.status === 'skipped').length > 0 &&
                ` • Skipped (${completedTasks.filter(t => t.status === 'skipped').length})`
              }
            </h4>

            <div className="space-y-3">
              {completedTasks.slice(0, 3).map((task, index) => (
                <div
                  key={task.id || index}
                  className={`flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm ${task.status === 'skipped' ? 'border-gray-200' : 'border-green-100'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {task.status === 'skipped' ? (
                      <FaTimes className="text-gray-500 text-sm" />
                    ) : (
                      <FaCheck className="text-green-600 text-sm" />
                    )}
                    <span className={`font-medium truncate ${task.status === 'skipped' ? 'text-gray-500 line-through' : 'text-gray-600 line-through'
                      }`}>
                      {task.displayTitle || task.title}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ml-3 px-2 py-1 rounded-lg ${task.status === 'skipped'
                    ? 'text-gray-600 bg-gray-100'
                    : 'text-green-600 bg-green-100'
                    }`}>
                    {new Date(task.completedAt || task.skippedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}

              {completedTasks.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-gray-600 text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full">
                    +{completedTasks.length - 3} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Action Modal (Complete or Skip) */}
      {completionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {completionModal.type === 'complete' ? '✅ Complete Task' : '⏭️ Skip Task'}
              </h3>

              <div className="mb-4">
                <h4 className={`font-semibold mb-2 ${completionModal.type === 'complete' ? 'text-green-700' : 'text-gray-700'}`}>
                  {completionModal.task?.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {completionModal.task?.crop?.name} • {completionModal.task?.category}
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="task-notes" className="block text-sm font-medium text-gray-700 mb-2">
                  {completionModal.type === 'complete' ? 'Notes (optional)' : 'Reason for skipping (optional)'}
                </label>
                <textarea
                  id="task-notes"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder={
                    completionModal.type === 'complete'
                      ? "Add any notes about how the task went, observations, or next steps..."
                      : "Why are you skipping this task? (weather, no time, already done, etc.)"
                  }
                  className={`w-full p-3 border border-gray-300 rounded-lg resize-none h-32 text-sm focus:ring-2 focus:border-transparent ${completionModal.type === 'complete' ? 'focus:ring-green-500' : 'focus:ring-gray-500'
                    }`}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setCompletionModal({ show: false, task: null, type: null });
                    setCompletionNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (completionModal.type === 'complete') {
                      await handleMarkAsDone(completionModal.task, completionNotes);
                    } else if (completionModal.type === 'skip') {
                      await handleSkipTask(completionModal.task, completionNotes);
                    }
                    setCompletionModal({ show: false, task: null, type: null });
                    setCompletionNotes('');
                  }}
                  disabled={loading}
                  className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${completionModal.type === 'complete'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  ) : completionModal.type === 'complete' ? (
                    <FaCheck className="w-4 h-4" />
                  ) : (
                    <FaTimes className="w-4 h-4" />
                  )}
                  {completionModal.type === 'complete' ? 'Complete Task' : 'Skip Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayTasksWidget;
