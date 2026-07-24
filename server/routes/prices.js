const express = require('express');
const router = express.Router();
const CropPrice = require('../models/CropPrice');
const govPriceService = require('../services/govPriceService');

// @route   GET /api/prices/crops/:cropName
// @desc    Get price data for a specific crop
// @access  Public
router.get('/crops/:cropName', async (req, res) => {
  try {
    const { cropName } = req.params;
    const { city, days = 7 } = req.query;

    const filter = { crop_name: cropName.toLowerCase() };

    // Add city filter if provided
    if (city) {
      filter.city = new RegExp(city, 'i');
    }

    // Add date filter for recent prices
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    filter.date = { $gte: since };

    const prices = await CropPrice.find(filter)
      .sort({ date: -1 })
      .limit(20);

    res.json({
      success: true,
      data: prices,
      count: prices.length
    });

  } catch (error) {
    console.error('Error fetching crop prices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crop prices',
      error: error.message
    });
  }
});

// @route   POST /api/prices/fetch
// @desc    Fetch and store prices from government API
// @access  Public
router.post('/fetch', async (req, res) => {
  try {
    const { crops } = req.body;
    const cropsToFetch = crops || ['Rice', 'Wheat', 'Maize', 'Cotton'];

    const result = await govPriceService.fetchAndStorePrices(cropsToFetch);

    if (result.success) {
      res.json({
        success: true,
        message: `Price fetch completed: ${result.saved} new records saved, ${result.skipped} duplicates skipped`,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        data: result
      });
    }

  } catch (error) {
    console.error('Error in price fetch operation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prices from government API',
      error: error.message
    });
  }
});

// @route   GET /api/prices/latest
// @desc    Get latest prices for all crops
// @access  Public
router.get('/latest', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const prices = await CropPrice.find({})
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: prices,
      count: prices.length
    });

  } catch (error) {
    console.error('Error fetching latest prices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest prices',
      error: error.message
    });
  }
});

// @route   GET /api/prices/cities
// @desc    Get available cities for price data
// @access  Public
router.get('/cities', async (req, res) => {
  try {
    const cities = await CropPrice.distinct('city');

    res.json({
      success: true,
      data: cities.sort(),
      count: cities.length
    });

  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cities',
      error: error.message
    });
  }
});

module.exports = router;