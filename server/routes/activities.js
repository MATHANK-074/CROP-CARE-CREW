const express = require('express');
const Activity = require('../models/Activity');
const Crop = require('../models/Crop');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes below require authentication
router.use(auth);

// Get all activities for a specific crop
router.get('/crop/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;
    const { type, startDate, endDate, limit = 20, skip = 0 } = req.query;

    // Verify crop exists and belongs to the user
    const crop = await Crop.findOne({ _id: cropId, user: req.user._id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    // Build query
    const query = { crop: cropId, user: req.user._id };

    // Filter by activity type if provided
    if (type) {
      query.activityType = type;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Fetch activities with pagination
    const activities = await Activity.find(query)
      .sort({ date: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Activity.countDocuments(query);

    res.json({
      activities,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single activity
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found or access denied' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new activity for a crop
router.post('/', async (req, res) => {
  try {
    const { cropId, title, description, activityType, date, duration, personnel, images, tags, weather, location } = req.body;

    // Verify crop exists and belongs to the user
    const crop = await Crop.findOne({ _id: cropId, user: req.user._id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    // Create new activity
    const activity = new Activity({
      crop: cropId,
      user: req.user._id,
      title,
      description,
      activityType,
      date: date || Date.now(),
      duration,
      personnel,
      images,
      tags,
      weather,
      location
    });

    await activity.save();

    res.status(201).json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an activity
router.put('/:id', async (req, res) => {
  try {
    const { title, description, activityType, date, duration, personnel, images, tags, weather, location } = req.body;

    // Find the activity and ensure it belongs to the user
    let activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found or access denied' });
    }

    // Update fields
    if (title) activity.title = title;
    if (description !== undefined) activity.description = description;
    if (activityType) activity.activityType = activityType;
    if (date) activity.date = date;
    if (duration !== undefined) activity.duration = duration;
    if (personnel) activity.personnel = personnel;
    if (images) activity.images = images;
    if (tags) activity.tags = tags;
    if (weather) activity.weather = weather;
    if (location) activity.location = location;

    await activity.save();

    res.json(activity);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an activity
router.delete('/:id', async (req, res) => {
  try {
    const result = await Activity.deleteOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Activity not found or access denied' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;