import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import TaskItem from './TaskItem';
import TaskSkeleton from './TaskSkeleton';
import TaskRecommendationsModal from './TaskRecommendationsModal';
import { generateTaskRecommendations } from '../../utils/taskRecommendationGenerator';
import { toast } from 'react-toastify';
import {
  FaTasks,
  FaCalendarAlt,
  FaHistory,
  FaFilter,
  FaRobot,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';

// Get API key from environment variables
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY;

// Memoized task item component to prevent unnecessary re-renders
const MemoizedTaskItem = memo(TaskItem);

/**
 * Optimized Task list component that displays today's tasks, upcoming tasks, and task history
 * Features:
 * - AI-powered task recommendations using the Gemini API
 * - Performance optimizations with useCallback and useMemo
 * - Better error handling and loading states
 * - Memoized components to prevent unnecessary re-renders
 */
const TaskList = ({ cropId = null, refreshTrigger = 0 }) => {
  const { t } = useTranslation(['translation', 'tasks']);
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [recommendedTasks, setRecommendedTasks] = useState([]);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

  // Cache the fetch tasks function to prevent recreating it on each render
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Determine API endpoint based on active tab
      let url = '';
      switch (activeTab) {
        case 'today':
          url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks/today`;
          break;
        case 'upcoming':
          url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks/upcoming`;
          break;
        case 'history':
          url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks/history`;
          break;
        default:
          url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks`;
      }

      // Add crop filter if provided
      if (cropId) {
        url += url.includes('?') ? `&cropId=${cropId}` : `?cropId=${cropId}`;
      }

      // Add category filter if selected
      if (filterCategory !== 'all') {
        url += url.includes('?') ? `&category=${filterCategory}` : `?category=${filterCategory}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.status}`);
      }

      const data = await res.json();
      const newTasks = activeTab === 'history' || activeTab === 'all' ? data.tasks : data;

      setTasks(newTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(t('failed_to_fetch_tasks', { ns: 'tasks' }));
    } finally {
      setLoading(false);
    }
  }, [activeTab, cropId, filterCategory, t]);

  // Effect to fetch tasks when dependencies change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshTrigger]);

  // Generate new task recommendations using Gemini API
  const handleGenerateRecommendations = async () => {
    setLoading(true);
    setError(null);
    setIsGeneratingAI(true);
    setRecommendedTasks([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // If no cropId is provided, show an error
      if (!cropId) {
        setError(t('select_crop_first', { ns: 'tasks' }));
        return;
      }

      // 1. Fetch crop data
      const cropRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${cropId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!cropRes.ok) {
        throw new Error(`Failed to fetch crop data: ${cropRes.status}`);
      }

      const cropData = await cropRes.json();

      // 2. Fetch previous activities for this crop
      const activitiesRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/activities/crop/${cropId}?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!activitiesRes.ok) {
        throw new Error(`Failed to fetch activities: ${activitiesRes.status}`);
      }

      const activitiesData = await activitiesRes.json();
      const previousActivities = activitiesData.activities || [];

      // 3. Mock weather data (in a real app, fetch from a weather API)
      const weatherData = {
        temp: 25, // Example temperature in °C
        daily: [
          {
            time: new Date().toISOString(),
            values: {
              temperatureMax: 28,
              temperatureMin: 18,
              precipitation: 0,
              precipitationProbability: 10
            }
          },
          {
            time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            values: {
              temperatureMax: 27,
              temperatureMin: 17,
              precipitation: 5,
              precipitationProbability: 80
            }
          }
        ]
      };

      // Get user ID from localStorage
      const userId = localStorage.getItem('userId');

      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // 4. Generate task recommendations using Gemini API
      toast.info(t('generating_ai_recommendations', { ns: 'tasks' }));
      const recommendations = await generateTaskRecommendations(
        cropData,
        previousActivities,
        weatherData,
        { includeDiseasePrevention: true }
      );

      // Add user ID to each recommendation
      const recommendationsWithUser = recommendations.map(task => ({
        ...task,
        user: userId
      }));

      // 5. Store recommendations and show modal
      setRecommendedTasks(recommendationsWithUser);

      toast.success(t('recommendations_generated', { count: recommendationsWithUser.length, ns: 'tasks' }));
      setShowRecommendationsModal(true);

    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(t('failed_to_generate_recommendations', { ns: 'tasks' }));
      toast.error(t('ai_recommendation_error', { ns: 'tasks' }));
    } finally {
      setLoading(false);
      setIsGeneratingAI(false);
    }
  };

  // Mark task as done - using useCallback for performance
  const handleMarkDone = useCallback(async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks/${taskId}/status`, {
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

      // Update local state to reflect the change
      setTasks(tasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'done', completedDate: new Date().toISOString() }
          : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(t('failed_to_update_task'));
    }
  }, [tasks, t]);

  // Mark task as skipped - using useCallback for performance
  const handleMarkSkipped = useCallback(async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks/${taskId}/status`, {
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

      // Update local state to reflect the change
      setTasks(tasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'skipped', completedDate: new Date().toISOString() }
          : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(t('failed_to_update_task'));
    }
  }, [tasks, t]);

  // Handle task saved from recommendations modal - using useCallback
  const handleTaskSaved = useCallback((newTask) => {
    // If we're on the tab that should show this task, add it to the list
    const shouldAddToCurrentList =
      (activeTab === 'today' && new Date(newTask.dueDate).toDateString() === new Date().toDateString()) ||
      (activeTab === 'upcoming' && new Date(newTask.dueDate) > new Date());

    if (shouldAddToCurrentList) {
      setTasks(prevTasks => [newTask, ...prevTasks]);
    }

    toast.success(t('task_saved_success', { ns: 'tasks' }));
  }, [activeTab, t]);

  // Get filtered tasks based on category - using useMemo for performance
  const filteredTasks = useMemo(() => {
    if (filterCategory === 'all') {
      return tasks;
    }
    return tasks.filter(task => task.category === filterCategory);
  }, [tasks, filterCategory]);

  return (
    <div className="bg-white rounded-lg shadow p-4 min-h-[400px]">
      {/* Task Recommendations Modal */}
      <TaskRecommendationsModal
        isOpen={showRecommendationsModal}
        onClose={() => setShowRecommendationsModal(false)}
        recommendations={recommendedTasks}
        cropId={cropId}
        onTaskSaved={handleTaskSaved}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <FaTasks className="mr-2 text-green-600 w-5 h-5" />
          {t('crop_tasks', { ns: 'tasks' })}
        </h2>

        <button
          onClick={handleGenerateRecommendations}
          disabled={loading}
          className="flex items-center bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition"
        >
          {loading ? <FaSpinner className="animate-spin mr-1" /> : <FaRobot className="mr-1" />}
          {t('generate_ai_recommendations', { ns: 'tasks' })}
        </button>
      </div>

      {/* Tab Navigation - Fixed height to prevent layout shifts */}
      <div className="flex border-b mb-4 h-[41px]">
        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'today' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('today')}
        >
          <span className="flex items-center">
            <FaTasks className="mr-1 w-4 h-4" />
            {t('today', { ns: 'tasks' })}
          </span>
        </button>

        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'upcoming' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <span className="flex items-center">
            <FaCalendarAlt className="mr-1 w-4 h-4" />
            {t('upcoming', { ns: 'tasks' })}
          </span>
        </button>

        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="flex items-center">
            <FaHistory className="mr-1 w-4 h-4" />
            {t('history', { ns: 'tasks' })}
          </span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex items-center">
        <span className="mr-2 flex items-center text-sm">
          <FaFilter className="mr-1" />
          {t('filter', { ns: 'tasks' })}:
        </span>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">{t('all_categories', { ns: 'tasks' })}</option>
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-md mb-4 flex items-start">
          <FaExclamationTriangle className="text-red-600 mr-2 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold">{t('error_occurred', { ns: 'tasks' })}</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Content Area - Fixed Height Container */}
      <div className="min-h-[300px]">
        {/* AI Generation State */}
        {loading && isGeneratingAI && (
          <div className="flex flex-col justify-center items-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <FaSpinner className="animate-spin text-blue-600 text-3xl mb-3 w-8 h-8" />
            <p className="text-blue-700 font-medium flex items-center">
              <FaRobot className="mr-2 w-5 h-5" />
              {t('ai_generating_recommendations', { ns: 'tasks' })}
            </p>
            <p className="text-blue-500 text-sm mt-1">{t('ai_processing_message', { ns: 'tasks' })}</p>
            <div className="mt-4 w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse rounded-full"></div>
            </div>
          </div>
        )}

        {/* Loading State with Skeleton UI */}
        {loading && !isGeneratingAI && (
          <div className="space-y-4">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-6 text-gray-500 min-h-[200px] flex flex-col items-center justify-center">
            {activeTab === 'today' && (
              <p>{t('no_tasks_today', { ns: 'tasks' })}</p>
            )}
            {activeTab === 'upcoming' && (
              <p>{t('no_upcoming_tasks', { ns: 'tasks' })}</p>
            )}
            {activeTab === 'history' && (
              <p>{t('no_task_history', { ns: 'tasks' })}</p>
            )}
            <button
              onClick={handleGenerateRecommendations}
              className="mt-2 text-green-600 underline"
            >
              {t('generate_new_recommendations', { ns: 'tasks' })}
            </button>
          </div>
        )}

        {/* Tasks List */}
        {!loading && filteredTasks.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {filteredTasks.map(task => (
              <MemoizedTaskItem
                key={task._id}
                task={task}
                onMarkDone={handleMarkDone}
                onMarkSkipped={handleMarkSkipped}
                disabled={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;