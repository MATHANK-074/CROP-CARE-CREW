const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FarmSetting = require('../models/FarmSetting');

// @route   GET api/farm-settings
// @desc    Get farm settings for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let settings = await FarmSetting.findOne({ user: req.user.id });
    if (!settings) {
      // Create default if none exists
      settings = new FarmSetting({ user: req.user.id });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/farm-settings
// @desc    Update farm settings
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    const { milkSellingPricePerLitre, currency, effectiveFrom } = req.body;
    
    if (milkSellingPricePerLitre !== undefined) {
      if (typeof milkSellingPricePerLitre !== 'number' || isNaN(milkSellingPricePerLitre) || milkSellingPricePerLitre <= 0 || !isFinite(milkSellingPricePerLitre)) {
        return res.status(400).json({ msg: 'Invalid milk selling price' });
      }
    }

    let settings = await FarmSetting.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new FarmSetting({ user: req.user.id });
    }

    const currentDate = new Date();
    const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : currentDate;

    // Handle price history logic
    if (milkSellingPricePerLitre !== undefined && milkSellingPricePerLitre !== settings.milkSellingPricePerLitre) {
      // If there was an old price, close its history entry
      if (settings.milkSellingPricePerLitre !== undefined) {
        if (settings.priceHistory.length > 0) {
          const lastEntry = settings.priceHistory[settings.priceHistory.length - 1];
          if (!lastEntry.effectiveTo) {
            lastEntry.effectiveTo = effectiveDate;
          }
        } else {
          // If no history yet, add the current one before changing
          settings.priceHistory.push({
            price: settings.milkSellingPricePerLitre,
            effectiveFrom: settings.effectiveFrom || settings.createdAt || new Date(0),
            effectiveTo: effectiveDate,
            updatedBy: 'Admin'
          });
        }
      }

      // Add new price to history
      settings.priceHistory.push({
        price: milkSellingPricePerLitre,
        effectiveFrom: effectiveDate,
        updatedBy: 'Admin'
      });

      settings.milkSellingPricePerLitre = milkSellingPricePerLitre;
      settings.effectiveFrom = effectiveDate;
    }

    if (currency) settings.currency = currency;

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
