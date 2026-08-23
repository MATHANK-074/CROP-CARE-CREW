const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FeedStock = require('../models/FeedStock');
const FeedLog = require('../models/FeedLog');

// @route   GET api/feed
// @desc    Get all feed stocks for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const feedStocks = await FeedStock.find({ user: req.user.id }).sort({ feedName: 1 });
    res.json(feedStocks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/feed
// @desc    Add new feed stock type
// @access  Private
router.post('/', auth, async (req, res) => {
  const { feedType, feedName, quantity, unit, lowStockThreshold } = req.body;

  try {
    const newFeedStock = new FeedStock({
      user: req.user.id,
      feedType,
      feedName,
      quantity,
      unit,
      lowStockThreshold
    });

    const feedStock = await newFeedStock.save();
    res.json(feedStock);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/feed/:id
// @desc    Update feed stock details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { feedType, feedName, unit, lowStockThreshold } = req.body;

  const feedFields = {};
  if (feedType) feedFields.feedType = feedType;
  if (feedName) feedFields.feedName = feedName;
  if (unit) feedFields.unit = unit;
  if (lowStockThreshold !== undefined) feedFields.lowStockThreshold = lowStockThreshold;

  try {
    let feedStock = await FeedStock.findById(req.params.id);

    if (!feedStock) return res.status(404).json({ msg: 'Feed stock not found' });

    // Make sure user owns stock
    if (feedStock.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    feedStock = await FeedStock.findByIdAndUpdate(
      req.params.id,
      { $set: feedFields },
      { new: true }
    );

    res.json(feedStock);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/feed/:id
// @desc    Delete feed stock
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let feedStock = await FeedStock.findById(req.params.id);

    if (!feedStock) return res.status(404).json({ msg: 'Feed stock not found' });

    // Make sure user owns stock
    if (feedStock.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await FeedStock.findByIdAndRemove(req.params.id);

    // Also delete logs
    await FeedLog.deleteMany({ feedStock: req.params.id });

    res.json({ msg: 'Feed stock removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/feed/:id/log
// @desc    Log feed action (Consume or Restock or Adjust)
// @access  Private
router.post('/:id/log', auth, async (req, res) => {
  const { action, quantity, cost, notes, date, supplier, batchNumber, expiryDate } = req.body;

  try {
    let feedStock = await FeedStock.findById(req.params.id);

    if (!feedStock) return res.status(404).json({ msg: 'Feed stock not found' });
    if (feedStock.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ msg: 'Valid quantity is required' });
    }

    const previousStock = feedStock.quantity || 0;
    let newStock = previousStock;

    const subtractActions = ['CONSUMPTION', 'ADJUSTMENT_REMOVE', 'WASTAGE', 'SPOILAGE', 'Consumed'];
    const addActions = ['PURCHASE', 'RESTOCK', 'ADJUSTMENT_ADD', 'Restocked', 'Adjustment'];

    if (subtractActions.includes(action)) {
      if (previousStock < numQuantity) {
        return res.status(400).json({ msg: 'Insufficient stock quantity for this operation' });
      }
      newStock = previousStock - numQuantity;
    } else if (addActions.includes(action)) {
      newStock = previousStock + numQuantity;
      if (['PURCHASE', 'RESTOCK', 'Restocked'].includes(action)) {
        feedStock.lastRestocked = date || Date.now();
        if (cost !== undefined && cost !== null) {
           feedStock.costPerUnit = cost; // Optional: Update the master cost if price changes
        }
      }
    } else {
      return res.status(400).json({ msg: 'Invalid action type' });
    }

    feedStock.quantity = newStock;
    await feedStock.save();

    // Create log entry
    const newLog = new FeedLog({
      user: req.user.id,
      feedStock: req.params.id,
      action,
      quantity: numQuantity,
      previousStock,
      newStock,
      cost,
      supplier,
      batchNumber,
      expiryDate,
      notes,
      date: date || Date.now()
    });

    const log = await newLog.save();
    
    // Return both updated stock and log
    res.json({ feedStock, log });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/feed/:id/logs
// @desc    Get logs for a specific feed stock
// @access  Private
router.get('/:id/logs', auth, async (req, res) => {
  try {
    const logs = await FeedLog.find({ feedStock: req.params.id, user: req.user.id })
                              .sort({ date: -1 })
                              .limit(50);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
