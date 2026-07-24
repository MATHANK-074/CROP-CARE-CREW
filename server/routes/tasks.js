const express = require('express');
const Task = require('../models/Task');
const Crop = require('../models/Crop');
const Activity = require('../models/Activity');
const UserAnalytics = require('../models/UserAnalytics');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const { generateRecommendations, saveRecommendations, generateAllUserTaskRecommendations } = require('../utils/taskRecommendationGenerator');
const { ensureDailyTasksForUser } = require('../services/dailyGeneration');

const router = express.Router();

/**
 * ACTIVITY LOGGING SYSTEM FOR AI CONTEXT
 * =====================================
 * 
 * This module ensures that ALL task completions are logged as activities 
 * in the activities collection so the AI has complete context of what users have done.
 * 
 * Activity logging is implemented in:
 * 1. POST /api/tasks/:id/complete - Main task completion with detailed feedback
 * 2. PUT /api/tasks/:id/status - Status updates (done/skipped)  
 * 3. PATCH /api/tasks/:id/complete - Quick task completion
 * 
 * Each completion creates both:
 * - Updated task record with completion date
 * - Activity record with rich context for AI prompt generation
 * 
 * Activity records include:
 * - Descriptive title and detailed description
 * - Mapped activity type based on task category
 * - Comprehensive tags for filtering and analysis
 * - Completion timing and effectiveness data
 * - User feedback and images when provided
 */

// Helper function to update user completion patterns for AI learning
async function updateUserCompletionPatterns(userId, patternData) {
  try {
    const analytics = await UserAnalytics.getOrCreateForUser(userId);
    await analytics.updateCompletionPattern(patternData);
    console.log(`📊 Updated completion patterns for user ${userId}: ${patternData.category} (${patternData.timing})`);
  } catch (error) {
    console.error('Error updating user completion patterns:', error);
  }
}


// All routes below require authentication
router.use(auth);

/**
 * @route   GET /api/tasks/analytics
 * @desc    Get AI learning analytics for the user
 * @access  Private
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user analytics
    const analytics = await UserAnalytics.getOrCreateForUser(userId);

    // Calculate additional insights
    const totalTasks = analytics.engagementMetrics.totalTasksCompleted;
    const insights = {
      summary: {
        totalTasksCompleted: totalTasks,
        completionRate: analytics.engagementMetrics.completionRate,
        streakDays: analytics.engagementMetrics.streakDays,
        lastActive: analytics.engagementMetrics.lastActiveDate
      },

      categoryPerformance: Object.keys(analytics.completionPatterns.categoryStats).map(category => {
        const stats = analytics.completionPatterns.categoryStats[category];
        const total = stats.total;
        return {
          category,
          total,
          onTimeRate: total > 0 ? ((stats.onTime + stats.early) / total * 100).toFixed(1) : 0,
          avgCompletionTime: stats.avgCompletionTime,
          performance: total > 0 ? (stats.onTime + stats.early > stats.late ? 'Good' : 'Needs Improvement') : 'No Data'
        };
      }).filter(item => item.total > 0),

      timePreferences: {
        bestDay: analytics.completionPatterns.temporalPatterns.dayOfWeekStats
          .reduce((best, current) => current.completions > best.completions ? current : best, { day: 0, completions: 0 }),
        monthlyDistribution: analytics.completionPatterns.temporalPatterns.monthlyStats
          .filter(m => m.completions > 0)
          .map(m => ({ month: m.month, completions: m.completions }))
      },

      aiRecommendations: {
        preferredCategories: Object.keys(analytics.completionPatterns.categoryStats)
          .filter(cat => analytics.completionPatterns.categoryStats[cat].total > 0)
          .sort((a, b) => analytics.completionPatterns.categoryStats[b].total - analytics.completionPatterns.categoryStats[a].total)
          .slice(0, 3),

        improvementAreas: Object.keys(analytics.completionPatterns.categoryStats)
          .filter(cat => {
            const stats = analytics.completionPatterns.categoryStats[cat];
            return stats.total > 0 && (stats.late / stats.total) > 0.3;
          }),

        recommendedSchedule: generateScheduleRecommendations(analytics)
      }
    };

    res.json({
      success: true,
      analytics: insights,
      lastUpdated: analytics.updatedAt
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Helper function to generate schedule recommendations
function generateScheduleRecommendations(analytics) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Find the best performing days
  const bestDays = analytics.completionPatterns.temporalPatterns.dayOfWeekStats
    .sort((a, b) => b.completions - a.completions)
    .slice(0, 3)
    .map(d => dayNames[d.day]);

  return {
    bestDaysForTasks: bestDays,
    suggestion: bestDays.length > 0
      ? `You perform best on ${bestDays.join(', ')}. Consider scheduling important tasks on these days.`
      : 'Complete more tasks to get personalized scheduling recommendations.'
  };
}

/**
 * @route   GET /api/tasks/insights
 * @desc    Get personalized task insights for AI learning
 * @access  Private
 */
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent completed tasks for pattern analysis
    const recentTasks = await Task.find({
      user: userId,
      status: 'done',
      generationType: 'individual_task',
      completedDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).populate('crop', 'name variety').sort({ completedDate: -1 });

    // Get corresponding activities
    const activities = await Activity.find({
      user: userId,
      tags: 'task-completion',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });

    // Analyze patterns
    const patterns = analyzeTaskPatterns(recentTasks, activities);

    res.json({
      success: true,
      insights: {
        recentActivity: {
          tasksCompleted: recentTasks.length,
          activitiesRecorded: activities.length,
          averageCompletionTime: patterns.avgCompletionTime
        },
        patterns,
        recommendations: generateAIRecommendations(patterns)
      }
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
});

// Helper function to analyze task patterns
function analyzeTaskPatterns(tasks, activities) {
  if (tasks.length === 0) {
    return {
      avgCompletionTime: 0,
      categoryDistribution: {},
      timingPerformance: {},
      engagement: 'low'
    };
  }

  const categoryCount = {};
  const timingCount = { early: 0, onTime: 0, late: 0 };
  let totalCompletionTime = 0;

  tasks.forEach(task => {
    // Category distribution
    categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;

    // Timing analysis
    const dueDate = new Date(task.dueDate);
    const completedDate = new Date(task.completedDate);
    const diff = Math.floor((completedDate - dueDate) / (1000 * 60 * 60 * 24));

    if (diff < 0) timingCount.early++;
    else if (diff === 0) timingCount.onTime++;
    else timingCount.late++;

    // Completion time
    const createdDate = new Date(task.createdAt);
    totalCompletionTime += Math.floor((completedDate - createdDate) / (1000 * 60 * 60 * 24));
  });

  return {
    avgCompletionTime: totalCompletionTime / tasks.length,
    categoryDistribution: categoryCount,
    timingPerformance: timingCount,
    engagement: tasks.length > 10 ? 'high' : tasks.length > 5 ? 'medium' : 'low'
  };
}

// Helper function to generate AI recommendations
function generateAIRecommendations(patterns) {
  const recommendations = [];

  // Timing recommendations
  const totalTiming = patterns.timingPerformance.early + patterns.timingPerformance.onTime + patterns.timingPerformance.late;
  if (totalTiming > 0) {
    const lateRate = patterns.timingPerformance.late / totalTiming;
    if (lateRate > 0.3) {
      recommendations.push({
        type: 'timing',
        message: 'Consider setting earlier due dates or reminders to improve task completion timing.',
        priority: 'medium'
      });
    } else if (patterns.timingPerformance.early / totalTiming > 0.5) {
      recommendations.push({
        type: 'timing',
        message: 'Great job completing tasks early! You might be able to handle more challenging tasks.',
        priority: 'low'
      });
    }
  }

  // Category recommendations
  const topCategory = Object.keys(patterns.categoryDistribution).reduce((a, b) =>
    patterns.categoryDistribution[a] > patterns.categoryDistribution[b] ? a : b, '');

  if (topCategory) {
    recommendations.push({
      type: 'category',
      message: `You excel at ${topCategory} tasks. Consider taking on more complex ${topCategory} activities.`,
      priority: 'low'
    });
  }

  // Engagement recommendations
  if (patterns.engagement === 'low') {
    recommendations.push({
      type: 'engagement',
      message: 'Try setting smaller, more achievable daily goals to build momentum.',
      priority: 'high'
    });
  }

  return recommendations;
}
router.get('/', async (req, res) => {
  try {
    const {
      status,
      category,
      cropId,
      dueAfter,
      dueBefore,
      priority,
      sort = 'dueDate',
      order = 'asc',
      limit = 50,
      skip = 0
    } = req.query;

    // Build query
    const query = {
      user: req.user._id,
      generationType: 'individual_task' // Only return individual tasks, not generation trackers
    };

    // Filter by status if provided
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter by category if provided
    if (category) {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // Filter by crop if provided
    if (cropId) {
      query.crop = cropId;
    }

    // Filter by due date range if provided
    if (dueAfter || dueBefore) {
      query.dueDate = {};
      if (dueAfter) {
        query.dueDate.$gte = new Date(dueAfter);
      }
      if (dueBefore) {
        query.dueDate.$lte = new Date(dueBefore);
      }
    }

    // Filter by priority if provided
    if (priority) {
      query.priority = priority;
    }

    // Determine sort direction
    const sortDirection = order.toLowerCase() === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortDirection;

    // Fetch tasks with pagination
    const tasks = await Task.find(query)
      .populate('crop', 'name variety status')
      .sort(sortOptions)
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/daily
 * @desc    Get or generate today's tasks for the authenticated user (once per day)
 * @access  Private
 */
router.get('/daily', async (req, res) => {
  try {
    // Allow configuration of max tasks per day via query parameter (default: 5)
    const maxTasksPerDay = parseInt(req.query.maxTasks) || 5;
    const result = await ensureDailyTasksForUser(req.user._id, maxTasksPerDay);
    return res.json(result);
  } catch (error) {
    console.error('Error getting/generating daily tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// generation helper moved to services/dailyGeneration.js

/**
 * @route   POST /api/tasks/:id/complete
 * @desc    Mark a daily task as completed and create activity record
 * @access  Private
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;
    const { notes, images } = req.body; // Optional completion details

    // Find and update the task
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: userId, status: 'pending', generationType: 'individual_task' },
      {
        status: 'done',
        completedDate: new Date(),
        ...(notes && { 'feedback.notes': notes }),
        ...(images && { 'feedback.images': images })
      },
      { new: true }
    ).populate('crop', 'name variety status');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or already completed'
      });
    }

    // Create comprehensive activity record for AI learning
    try {
      let activityType = 'general';

      // Map task categories to activity types
      switch (task.category) {
        case 'irrigation':
          activityType = 'watering';
          break;
        case 'pest_control':
          activityType = 'inspection';
          break;
        case 'soil_management':
          activityType = 'maintenance';
          break;
        case 'fertilization':
          activityType = 'fertilization';
          break;
        case 'harvesting':
          activityType = 'harvesting';
          break;
        case 'pruning':
          activityType = 'pruning';
          break;
        default:
          activityType = 'general';
      }

      // Calculate completion timing analysis
      const dueDate = new Date(task.dueDate);
      const completionDate = new Date();
      const timingDifference = Math.floor((completionDate - dueDate) / (1000 * 60 * 60 * 24)); // Days difference
      const timingStatus = timingDifference < 0 ? 'early' : timingDifference === 0 ? 'onTime' : 'late';

      // Calculate task duration (time from creation to completion)
      const taskDuration = Math.floor((completionDate - task.createdAt) / (1000 * 60 * 60 * 24));

      // Enhanced activity record with AI learning data
      const activity = new Activity({
        crop: task.crop._id,
        user: userId,
        title: `Completed: ${task.title}`,
        description: `✅ Task completed via AgriTech system\n\nOriginal task: ${task.description}${notes ? `\n\nUser notes: ${notes}` : ''}\n\n📊 Completion Analysis:\n• Timing: ${timingStatus} (${Math.abs(timingDifference)} days ${timingDifference < 0 ? 'early' : timingDifference > 0 ? 'late' : 'on time'})\n• Priority: ${task.priority}\n• Category: ${task.category}\n• Duration in system: ${taskDuration} days`,
        activityType: activityType,
        date: completionDate,
        duration: taskDuration * 1440, // Convert to minutes for consistency
        images: images || [],
        tags: [
          'system-generated',
          'task-completion',
          task.category,
          task.priority,
          timingStatus,
          `source-${task.source}`,
          `completion-day-${new Date().getDay()}`, // Track completion day patterns
          `season-${Math.floor((new Date().getMonth() + 1) / 3) + 1}` // Track seasonal patterns
        ]
      });

      await activity.save();

      // Track user completion patterns for AI learning
      await updateUserCompletionPatterns(userId, {
        category: task.category,
        priority: task.priority,
        timing: timingStatus,
        dayOfWeek: new Date().getDay(),
        month: new Date().getMonth()
      });

      console.log(`📝 Enhanced activity record created for AI learning: ${task.title} (${timingStatus})`);
    } catch (activityError) {
      // Don't fail the task completion if activity creation fails
      console.error('Error creating enhanced activity record:', activityError);
    }

    // Update the daily generation tracker record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Task.updateOne(
      {
        user: userId,
        generationType: 'daily_generation_tracker',
        'dailyGeneration.date': today
      },
      { $inc: { 'dailyGeneration.completedTasks': 1 } }
    );

    res.json({
      success: true,
      task,
      message: `✅ Task completed: ${task.title}`,
      activityCreated: true
    });

  } catch (error) {
    console.error('Error completing daily task:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});/**
 * @route   GET /api/tasks/today
 * @desc    Get today's tasks for the authenticated user
 * @access  Private
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      user: req.user._id,
      generationType: 'individual_task', // Only individual tasks
      dueDate: { $gte: today, $lt: tomorrow },
      status: 'pending'
    };

    // Filter by crop if provided
    if (req.query.cropId) {
      query.crop = req.query.cropId;
    }

    const tasks = await Task.find(query)
      .populate('crop', 'name variety status')
      .sort({ priority: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching today\'s tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/upcoming
 * @desc    Get upcoming tasks (next 7 days) for the authenticated user
 * @access  Private
 */
router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const query = {
      user: req.user._id,
      generationType: 'individual_task', // Only individual tasks
      dueDate: { $gt: today, $lte: nextWeek },
      status: 'pending'
    };

    // Filter by crop if provided
    if (req.query.cropId) {
      query.crop = req.query.cropId;
    }

    const tasks = await Task.find(query)
      .populate('crop', 'name variety status')
      .sort({ dueDate: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/history
 * @desc    Get task history (completed or skipped tasks)
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    const {
      cropId,
      category,
      startDate,
      endDate,
      status = ['done', 'skipped'],
      limit = 30,
      skip = 0
    } = req.query;

    // Build query
    const query = {
      user: req.user._id,
      generationType: 'individual_task', // Only individual tasks
      status: Array.isArray(status) ? { $in: status } : status
    };

    // Filter by crop if provided
    if (cropId) {
      query.crop = cropId;
    }

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Filter by completion date range if provided
    if (startDate || endDate) {
      query.completedDate = {};
      if (startDate) {
        query.completedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.completedDate.$lte = new Date(endDate);
      }
    }

    // Fetch task history with pagination
    const tasks = await Task.find(query)
      .populate('crop', 'name variety status')
      .sort({ completedDate: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching task history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/crop/:cropId
 * @desc    Get all tasks for a specific crop
 * @access  Private
 */
router.get('/crop/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;
    const { status, category, limit = 50, skip = 0 } = req.query;

    // Verify crop exists and belongs to the user
    const crop = await Crop.findOne({ _id: cropId, user: req.user._id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    // Build query
    const query = {
      crop: cropId,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    };

    // Filter by status if provided
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter by category if provided
    if (category) {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // Fetch tasks with pagination
    const tasks = await Task.find(query)
      .sort({ dueDate: 1, priority: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error(`Error fetching tasks for crop ${req.params.cropId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    }).populate('crop', 'name variety status');

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error(`Error fetching task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      crop: cropId,
      title,
      description,
      priority,
      category,
      type, // Support both 'category' and 'type' for compatibility
      dueDate,
      recommendedTimeframe,
      source,
      generationFactors,
      resources
    } = req.body;

    // Use category or type, whichever is provided
    const categoryMapping = {
      'sowing': 'planting',
      'fertilizer': 'fertilization',
      'pesticide': 'pest_control',
      'harvest': 'harvesting',
      'irrigation': 'irrigation',
      'pruning': 'pruning',
      'general': 'general'
    };

    const rawCategory = category || type || 'general';
    const taskCategory = categoryMapping[rawCategory] || rawCategory;

    // If crop is provided, verify it exists and belongs to the user
    let crop = null;
    if (cropId) {
      crop = await Crop.findOne({ _id: cropId, user: req.user._id });
      if (!crop) {
        return res.status(404).json({ message: 'Crop not found or access denied' });
      }
    }

    const task = new Task({
      crop: cropId || null, // Allow null for general tasks
      user: req.user._id,
      title,
      description: description || title, // Use title as description if not provided
      priority,
      category: taskCategory,
      dueDate,
      recommendedTimeframe,
      source,
      generationFactors,
      resources
    });

    await task.save();

    // Populate the crop reference in the response only if crop exists
    if (cropId) {
      await task.populate('crop', 'name variety status');
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/tasks/:id/status
 * @desc    Update task status (mark as done or skipped)
 * @access  Private
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, feedback } = req.body;

    if (!['pending', 'done', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    // Update status
    task.status = status;

    // If the task is being marked as done or skipped, record the completion date
    if (status === 'done' || status === 'skipped') {
      task.completedDate = new Date();

      // Record feedback if provided
      if (feedback) {
        task.feedback = {
          ...task.feedback,
          ...feedback
        };
      }

      // Create activity record for AI context when task is completed
      try {
        await task.populate('crop', 'name variety status');

        // Map task category to activity type
        let activityType = 'general';
        switch (task.category) {
          case 'irrigation':
            activityType = 'maintenance';
            break;
          case 'pest_control':
          case 'disease_treatment':
            activityType = 'inspection';
            break;
          case 'soil_management':
          case 'fertilization':
            activityType = 'maintenance';
            break;
          case 'harvesting':
            activityType = 'general';
            break;
          case 'pruning':
            activityType = 'pruning';
            break;
          default:
            activityType = 'general';
        }

        const activity = new Activity({
          crop: task.crop._id,
          user: req.user._id,
          title: `${status === 'done' ? 'Completed' : 'Skipped'}: ${task.title}`,
          description: `${status === 'done' ? '✅' : '⏭️'} Task ${status} via status update\n\n` +
            `Original task: ${task.description}\n` +
            `Category: ${task.category}\n` +
            `Priority: ${task.priority}\n` +
            `${feedback?.notes ? `Completion notes: ${feedback.notes}\n` : ''}` +
            `${feedback?.effectiveness ? `Effectiveness: ${feedback.effectiveness}/5\n` : ''}`,
          activityType: activityType,
          date: task.completedDate,
          images: feedback?.images || [],
          tags: [
            'task-completion',
            status,
            task.category,
            task.priority,
            task.source || 'unknown-source'
          ]
        });

        await activity.save();
        console.log(`📝 Activity created for ${status} task: ${task.title}`);
      } catch (activityError) {
        console.error('Error creating activity for task status update:', activityError);
      }
    } else {
      // If reverting to pending, clear completion date
      task.completedDate = null;
    }

    await task.save();

    // Populate the crop reference in the response
    await task.populate('crop', 'name variety status');

    res.json(task);
  } catch (error) {
    console.error(`Error updating task status for ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/tasks/:id/complete
 * @desc    Mark task as completed
 * @access  Private
 */
router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    // Update status to done
    task.status = 'done';
    task.completedDate = new Date();

    await task.save();

    // Create activity record for AI context
    try {
      await task.populate('crop', 'name variety status');

      // Map task category to activity type
      let activityType = 'general';
      switch (task.category) {
        case 'irrigation':
          activityType = 'maintenance';
          break;
        case 'pest_control':
        case 'disease_treatment':
          activityType = 'inspection';
          break;
        case 'soil_management':
        case 'fertilization':
          activityType = 'maintenance';
          break;
        case 'harvesting':
          activityType = 'general';
          break;
        case 'pruning':
          activityType = 'pruning';
          break;
        default:
          activityType = 'general';
      }

      const activity = new Activity({
        crop: task.crop._id,
        user: req.user._id,
        title: `Completed: ${task.title}`,
        description: `✅ Task completed via quick complete\n\n` +
          `Original task: ${task.description}\n` +
          `Category: ${task.category}\n` +
          `Priority: ${task.priority}\n` +
          `Completion method: Quick complete button`,
        activityType: activityType,
        date: task.completedDate,
        tags: [
          'task-completion',
          'quick-complete',
          task.category,
          task.priority,
          task.source || 'unknown-source'
        ]
      });

      await activity.save();
      console.log(`📝 Activity created for completed task: ${task.title}`);
    } catch (activityError) {
      console.error('Error creating activity for task completion:', activityError);
    }

    // Populate the crop reference in the response
    await task.populate('crop', 'name variety status');

    res.json(task);
  } catch (error) {
    console.error(`Error marking task as complete for ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      dueDate,
      recommendedTimeframe,
      resources,
      feedback
    } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    // Update allowed fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (category) task.category = category;
    if (dueDate) task.dueDate = dueDate;
    if (recommendedTimeframe) task.recommendedTimeframe = recommendedTimeframe;
    if (resources) task.resources = resources;
    if (feedback) task.feedback = { ...task.feedback, ...feedback };

    await task.save();

    // Populate the crop reference in the response
    await task.populate('crop', 'name variety status');

    res.json(task);
  } catch (error) {
    console.error(`Error updating task ${req.params.id}:`, error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(`Error deleting task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/tasks/generate-recommendations
 * @desc    Generate task recommendations for all user crops or a specific crop
 * @access  Private
 */
router.post('/generate-recommendations', async (req, res) => {
  try {
    const { cropId, includeWeather = true, includeGrowthStage = true, includeDisease = true } = req.body;

    // Get weather data - in a real implementation, you would fetch from a weather API
    // based on the user's location or crop locations
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

    // Disease risks - in a real implementation, this could come from disease detection system
    const diseaseRisks = {
      // Example disease risk
      'Powdery Mildew': { level: 'medium', confidence: 0.7 }
    };

    let result;

    if (cropId) {
      // Generate recommendations for a specific crop
      const crop = await Crop.findOne({ _id: cropId, user: req.user._id });

      if (!crop) {
        return res.status(404).json({ message: 'Crop not found or access denied' });
      }

      const recommendations = await generateRecommendations(
        crop,
        weatherData,
        diseaseRisks,
        {
          includeWeatherTasks: includeWeather,
          includeGrowthStageTasks: includeGrowthStage,
          includeDiseaseTasks: includeDisease
        }
      );

      const savedTasks = await saveRecommendations(recommendations);

      result = {
        success: true,
        taskCount: savedTasks.length,
        tasks: savedTasks
      };
    } else {
      // Generate recommendations for all user's crops
      result = await generateAllUserTaskRecommendations(
        req.user._id,
        {
          weatherData,
          diseaseRisks,
          includeWeatherTasks: includeWeather,
          includeGrowthStageTasks: includeGrowthStage,
          includeDiseaseTasks: includeDisease
        }
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating task recommendations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;