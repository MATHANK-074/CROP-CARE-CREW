const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const CropPrice = require('../models/CropPrice');

const router = express.Router();

// Helper function to get price trend (up/down/stable)
const getPriceTrend = async (commodity, currentPrice, district) => {
  try {
    const filter = {
      crop_name: commodity.toLowerCase(),
      price: { $gt: 0 }
    };

    if (district) {
      filter.city = new RegExp(district, 'i');
    }

    // Get the last two price records to compare trend
    const recentPrices = await CropPrice.find(filter)
      .sort({ date: -1 })
      .limit(2);

    if (recentPrices.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    const [latest, previous] = recentPrices;
    const currentPriceValue = parseFloat(currentPrice) || latest.price;
    const previousPrice = previous.price;

    const change = currentPriceValue - previousPrice;
    const percentChange = ((change / previousPrice) * 100).toFixed(1);

    if (change > 0) {
      return { trend: 'up', change: percentChange, previousPrice };
    } else if (change < 0) {
      return { trend: 'down', change: Math.abs(percentChange), previousPrice };
    } else {
      return { trend: 'stable', change: 0, previousPrice };
    }
  } catch (error) {
    console.error('Error calculating price trend:', error);
    return { trend: 'stable', change: 0 };
  }
};

// Helper function to get most recent price from database
const getRecentPriceFromDB = async (commodity, district) => {
  try {
    let filter = { crop_name: commodity.toLowerCase() };
    if (district) {
      filter.city = new RegExp(district, 'i');
    }

    const recentPrice = await CropPrice.findOne(filter)
      .sort({ date: -1 })
      .limit(1);

    return recentPrice;
  } catch (error) {
    console.error(`Error fetching recent price for ${commodity}:`, error);
    return null;
  }
};

// Helper function to save price data to database
const savePriceToDatabase = async (priceData) => {
  try {
    const { commodity, price, marketLocation, raw } = priceData;

    if (!raw || !commodity) return;

    const priceValue = parseFloat(raw.modal_price || 0);
    if (priceValue === 0) return;

    // Create date for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Check if price already exists for today
    const existingPrice = await CropPrice.findOne({
      crop_name: commodity.toLowerCase(),
      city: raw.district || 'unknown',
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (existingPrice) {
      console.log(`Price already exists for ${commodity} in ${raw.district || 'unknown'}`);
      return;
    }

    // Save new price data
    const cropPrice = new CropPrice({
      crop_name: commodity.toLowerCase(),
      city: raw.district || raw.market || 'unknown',
      state: raw.state || 'unknown',
      price: priceValue,
      market: raw.market || 'unknown',
      date: new Date()
    });

    await cropPrice.save();
    console.log(`✅ Saved price: ${commodity} - ₹${priceValue} in ${raw.district || 'unknown'}`);
  } catch (error) {
    console.error(`Error saving price for ${priceData.commodity}:`, error.message);
  }
};

// GET /api/market/prices?commodities=Rice,Wheat&district=Chennai
router.get('/prices', async (req, res) => {
  try {
    const { commodities = '', district = '' } = req.query;
    if (!commodities) return res.status(400).json({ message: 'commodities query param required' });

    const GOV_KEY = process.env.GOV_API_KEY;
    if (!GOV_KEY) {
      console.log('No GOV_API_KEY found, using cached data...');

      // Try to get data from database instead
      const commodityList = commodities.split(',').map(s => s.trim()).filter(Boolean);
      const dbResults = await Promise.all(commodityList.map(async (commodity) => {
        try {
          const recentPrice = await getRecentPriceFromDB(commodity, district);

          if (recentPrice) {
            const trend = await getPriceTrend(commodity, recentPrice.price, district);
            const daysAgo = Math.floor((new Date() - new Date(recentPrice.date)) / (1000 * 60 * 60 * 24));
            const isOldData = daysAgo > 1; // Consider data old if more than 1 day

            return {
              commodity,
              price: `₹${Math.round(recentPrice.price / 100)} per kg`,
              marketLocation: `${recentPrice.market}, ${recentPrice.city}, ${recentPrice.state}`,
              trend: trend.trend,
              change: trend.change,
              isOldData: isOldData,
              daysAgo: daysAgo,
              lastUpdated: recentPrice.date.toLocaleDateString(),
              raw: {
                modal_price: recentPrice.price,
                market: recentPrice.market,
                district: recentPrice.city,
                state: recentPrice.state
              }
            };
          }

          return {
            commodity,
            price: 'N/A',
            marketLocation: 'No data available',
            trend: 'stable',
            isOldData: false,
            daysAgo: 0
          };
        } catch (error) {
          console.error(`Error fetching ${commodity} from database:`, error);
          return {
            commodity,
            price: 'N/A',
            marketLocation: 'Data unavailable',
            trend: 'stable',
            isOldData: false
          };
        }
      }));

      return res.json({ results: dbResults, source: 'database' });
    }

    const DATA_ID = '9ef84268-d588-465a-a308-a864a43d0070';
    const commodityList = commodities.split(',').map(s => s.trim()).filter(Boolean);

    // Helper with timeout using AbortController
    const fetchWithTimeout = async (url, timeout = 8000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return r;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    const results = await Promise.all(commodityList.map(async (commodity) => {
      const q = `https://api.data.gov.in/resource/${DATA_ID}?api-key=${GOV_KEY}&format=json&filters[commodity]=${encodeURIComponent(commodity)}${district ? `&filters[district]=${encodeURIComponent(district)}` : ''}&limit=1`;
      try {
        const r = await fetchWithTimeout(q, 8000);
        if (!r.ok) {
          // If API fails, try to get old data from database
          const recentPrice = await getRecentPriceFromDB(commodity, district);
          if (recentPrice) {
            const trend = await getPriceTrend(commodity, recentPrice.price, district);
            const daysAgo = Math.floor((new Date() - new Date(recentPrice.date)) / (1000 * 60 * 60 * 24));
            const isOldData = daysAgo > 1; // Consider data old if more than 1 day

            return {
              commodity,
              price: `₹${Math.round(recentPrice.price / 100)} per kg`,
              marketLocation: `${recentPrice.market}, ${recentPrice.city}, ${recentPrice.state}`,
              trend: trend.trend,
              change: trend.change,
              isOldData: isOldData,
              daysAgo: daysAgo,
              lastUpdated: recentPrice.date.toLocaleDateString(),
              error: `API Status ${r.status} - showing cached data`
            };
          }
          return { commodity, error: `Status ${r.status}`, price: 'N/A', marketLocation: 'No data available', trend: 'stable', isOldData: false, daysAgo: 0 };
        }

        const j = await r.json();
        if (j.records && j.records.length > 0) {
          const rec = j.records[0];
          const currentPriceValue = parseFloat(rec.modal_price || 0);
          const trend = await getPriceTrend(commodity, currentPriceValue, district);

          const result = {
            commodity,
            price: rec.modal_price ? `₹${parseInt(rec.modal_price, 10) / 100} per kg` : 'N/A',
            marketLocation: `${rec.market || ''}${rec.district ? `, ${rec.district}` : ''}${rec.state ? `, ${rec.state}` : ''}`.replace(/^,\s*/, ''),
            trend: trend.trend,
            change: trend.change,
            isOldData: false, // Fresh data from API
            daysAgo: 0, // Fresh data
            lastUpdated: new Date().toLocaleDateString(),
            raw: rec
          };

          // Save to database in the background
          savePriceToDatabase(result).catch(err =>
            console.error('Background save error:', err)
          );

          return result;
        } else {
          // No data from API, try database
          const recentPrice = await getRecentPriceFromDB(commodity, district);
          if (recentPrice) {
            const trend = await getPriceTrend(commodity, recentPrice.price, district);
            const daysAgo = Math.floor((new Date() - new Date(recentPrice.date)) / (1000 * 60 * 60 * 24));
            const isOldData = daysAgo > 1; // Consider data old if more than 1 day

            return {
              commodity,
              price: `₹${Math.round(recentPrice.price / 100)} per kg`,
              marketLocation: `${recentPrice.market}, ${recentPrice.city}, ${recentPrice.state}`,
              trend: trend.trend,
              change: trend.change,
              isOldData: isOldData,
              daysAgo: daysAgo,
              lastUpdated: recentPrice.date.toLocaleDateString(),
              note: 'No current data available - showing previous data'
            };
          }
          return { commodity, price: 'N/A', marketLocation: 'No data', trend: 'stable' };
        }
      } catch (err) {
        // On error, try to get old data from database
        const recentPrice = await getRecentPriceFromDB(commodity, district);
        if (recentPrice) {
          const trend = await getPriceTrend(commodity, recentPrice.price, district);
          const daysAgo = Math.floor((new Date() - new Date(recentPrice.date)) / (1000 * 60 * 60 * 24));
          const isOldData = daysAgo > 1; // Consider data old if more than 1 day

          return {
            commodity,
            price: `₹${Math.round(recentPrice.price / 100)} per kg`,
            marketLocation: `${recentPrice.market}, ${recentPrice.city}, ${recentPrice.state}`,
            trend: trend.trend,
            change: trend.change,
            isOldData: isOldData,
            daysAgo: daysAgo,
            lastUpdated: recentPrice.date.toLocaleDateString(),
            error: `${err.message} - showing cached data`
          };
        }
        return { commodity, price: 'N/A', marketLocation: 'Data unavailable', error: err.message, trend: 'stable', isOldData: false, daysAgo: 0 };
      }
    })); res.json({ results, source: 'government_api' });
  } catch (error) {
    console.error('Market proxy error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
