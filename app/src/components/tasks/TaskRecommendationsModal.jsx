import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaCheck, FaSave, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { saveTask } from '../../utils/taskRecommendationGenerator';

const TaskRecommendationsModal = ({
  isOpen,
  onClose,
  recommendations = [],
  cropId,
  onTaskSaved
}) => {
  const { t } = useTranslation(['translation', 'tasks']);
  const [selectedTasks, setSelectedTasks] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [savedTasks, setSavedTasks] = useState({});

  if (!isOpen) return null;

  // Handle task selection toggle
  const toggleTaskSelection = (index) => {
    setSelectedTasks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Get category icon based on task category
  const getCategoryBadge = (category) => {
    const categoryColors = {
      'irrigation': 'bg-blue-100 text-blue-800 border-blue-200',
      'fertilization': 'bg-green-100 text-green-800 border-green-200',
      'pest_control': 'bg-orange-100 text-orange-800 border-orange-200',
      'disease_treatment': 'bg-red-100 text-red-800 border-red-200',
      'harvesting': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'planting': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'pruning': 'bg-purple-100 text-purple-800 border-purple-200',
      'soil_management': 'bg-amber-100 text-amber-800 border-amber-200',
      'weather_response': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'general': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {t(category, { ns: 'tasks' })}
      </span>
    );
  };

  // Get priority badge based on priority level
  const getPriorityBadge = (priority) => {
    const priorityColors = {
      'urgent': 'bg-red-100 text-red-800 border-red-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[priority] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {t(`priority_${priority}`, { ns: 'tasks' })}
      </span>
    );
  };

  // Save all selected tasks
  const handleSaveSelected = async () => {
    setSaving(true);
    const selectedIndices = Object.entries(selectedTasks)
      .filter(([_, isSelected]) => isSelected)
      .map(([index]) => parseInt(index));

    // Track successful saves and saved task objects
    let successCount = 0;
    let failedCount = 0;
    const savedTaskObjects = [];

    try {
      // Save all tasks without individual toasts
      for (const index of selectedIndices) {
        try {
          setSavingTaskId(index);
          const task = recommendations[index];

          if (!task.user) {
            task.user = localStorage.getItem('userId');
          }

          const savedTask = await saveTask(cropId, task);
          savedTaskObjects.push(savedTask);

          // Mark task as saved
          setSavedTasks(prev => ({
            ...prev,
            [index]: savedTask
          }));

          successCount++;
        } catch (error) {
          console.error('Error saving task:', error);
          failedCount++;
        }
      }

      // Send all saved tasks as a batch to parent
      // Include success/failure counts so parent can show appropriate toast
      if (savedTaskObjects.length > 0 && onTaskSaved) {
        // Pass the array of tasks to the parent component along with metadata
        onTaskSaved(savedTaskObjects, false, {
          successCount,
          failedCount,
          isFromBulkSave: true
        });
      } else {
        // Only show toasts here if we're not notifying the parent
        // Show a single toast for all saved tasks
        if (successCount > 0) {
          toast.success(t('multiple_tasks_saved_success', {
            count: successCount,
            ns: 'tasks',
            defaultValue: `${successCount} tasks saved successfully`
          }));
        }

        // Show error toast only if some tasks failed
        if (failedCount > 0) {
          toast.error(t('multiple_tasks_failed', {
            count: failedCount,
            ns: 'tasks',
            defaultValue: `Failed to save ${failedCount} tasks`
          }));
        }
      }
    } catch (error) {
      console.error('Error in bulk save operation:', error);
      toast.error(t('bulk_save_failed', { ns: 'tasks', defaultValue: 'Failed to save tasks' }));
    } finally {
      setSaving(false);
      setSavingTaskId(null);
    }
  };

  // Save a single task
  const handleSaveTask = async (index) => {
    try {
      setSavingTaskId(index);
      const task = recommendations[index];

      // Ensure user ID is included
      if (!task.user) {
        task.user = localStorage.getItem('userId');
      }

      const savedTask = await saveTask(cropId, task);

      // Mark task as saved
      setSavedTasks(prev => ({
        ...prev,
        [index]: savedTask
      }));

      // For individual task saves (not part of bulk operation)
      // Include skipToast=false to allow toast in parent component
      if (onTaskSaved && !saving) {
        // Single task handling with toast in parent
        onTaskSaved(savedTask, false);
        // Don't show toast here as it will be shown by parent
      } else if (onTaskSaved && saving) {
        // When part of bulk operation, pass skipToast=true
        onTaskSaved(savedTask, true, { part: 'bulk' });
      }

      // Only show toast here for individual task saves if we're not notifying parent
      if (!saving && !onTaskSaved) {
        toast.success(t('task_saved_success', { ns: 'tasks' }));
      }
    } catch (error) {
      console.error('Error saving task:', error);
      if (!saving) {
        toast.error(`${t('failed_to_save_task', { ns: 'tasks' })}: ${error.message}`);
      }
    } finally {
      setSavingTaskId(null);
    }
  };

  // Check if at least one task is selected
  const hasSelectedTasks = Object.values(selectedTasks).some(isSelected => isSelected);

  // Select all tasks
  const handleSelectAll = () => {
    const newSelected = {};
    recommendations.forEach((_, index) => {
      // Only select tasks that haven't been saved yet
      if (!savedTasks[index]) {
        newSelected[index] = true;
      }
    });
    setSelectedTasks(newSelected);
  };

  // Deselect all tasks
  const handleDeselectAll = () => {
    setSelectedTasks({});
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FaInfoCircle className="mr-2 text-blue-500" />
            {t('ai_task_recommendations', { ns: 'tasks' })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-grow p-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('no_recommendations_generated', { ns: 'tasks' })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Instruction */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  {t('recommendation_instructions', { ns: 'tasks' })}
                </p>
              </div>

              {/* Bulk actions */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded"
                  >
                    {t('select_all', { ns: 'tasks' })}
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    disabled={!hasSelectedTasks}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded disabled:opacity-50"
                  >
                    {t('deselect_all', { ns: 'tasks' })}
                  </button>
                </div>

                <button
                  onClick={handleSaveSelected}
                  disabled={!hasSelectedTasks || saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('saving_selected', { ns: 'tasks' })}
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-1" />
                      {t('save_selected', { ns: 'tasks' })}
                    </>
                  )}
                </button>
              </div>

              {/* Recommendations list */}
              {recommendations.map((task, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${savedTasks[index] ? 'bg-green-50 border-green-300' :
                    selectedTasks[index] ? 'bg-blue-50 border-blue-300' : 'bg-white'
                    }`}
                >
                  <div className="flex items-start">
                    {/* Checkbox for selection */}
                    {!savedTasks[index] ? (
                      <div className="mr-3 pt-1">
                        <input
                          type="checkbox"
                          checked={!!selectedTasks[index]}
                          onChange={() => toggleTaskSelection(index)}
                          className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="mr-3 pt-1">
                        <FaCheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    )}

                    {/* Task content */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <div className="flex space-x-2">
                          {getCategoryBadge(task.category)}
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-3">{task.description}</p>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div>
                          {t('due_date', { ns: 'tasks' })}: {new Date(task.dueDate).toLocaleDateString()}
                        </div>

                        {/* Individual save button */}
                        {!savedTasks[index] && (
                          <button
                            onClick={() => handleSaveTask(index)}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded flex items-center"
                          >
                            {savingTaskId === index ? (
                              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <FaCheck className="mr-1" />
                            )}
                            {t('save_task', { ns: 'tasks' })}
                          </button>
                        )}

                        {/* Saved indicator */}
                        {savedTasks[index] && (
                          <span className="text-green-600 flex items-center">
                            <FaCheckCircle className="mr-1" />
                            {t('saved', { ns: 'tasks' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded"
          >
            {t('close', { ns: 'common' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskRecommendationsModal;