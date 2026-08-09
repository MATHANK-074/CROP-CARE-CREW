const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Livestock = require('../models/Livestock');
const BreedingRecord = require('../models/BreedingRecord');
const FeedStock = require('../models/FeedStock');
const FeedRule = require('../models/FeedRule');

// Helper to determine cow category and feed priorities
const determineCowCategory = (cow, breedingRecords) => {
  let category = 'Normal';
  let priority = 'Normal';
  let pregnancyStage = null;
  let daysToCalving = null;
  let recommendedAction = 'Standard Feeding Plan';

  // Sort records descending
  const sortedRecords = [...breedingRecords].sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
  const latestPregnancyCheck = sortedRecords.find(r => r.eventType === 'Pregnancy Check');

  if (latestPregnancyCheck && latestPregnancyCheck.outcome === 'Pregnant') {
    category = 'Pregnant';
    // Estimate calving date (283 days from AI)
    const aiRecord = sortedRecords.find(r => r.eventType === 'Artificial Insemination' && new Date(r.eventDate) < new Date(latestPregnancyCheck.eventDate));
    if (aiRecord) {
      const calvingDate = new Date(aiRecord.eventDate);
      calvingDate.setDate(calvingDate.getDate() + 283);
      daysToCalving = Math.ceil((calvingDate - new Date()) / (1000 * 60 * 60 * 24));

      if (daysToCalving <= 30) {
        priority = 'High Priority';
        pregnancyStage = 'Late Term (Critical)';
        recommendedAction = 'High-protein dry cow diet required.';
      } else if (daysToCalving <= 90) {
        priority = 'Attention';
        pregnancyStage = 'Third Trimester';
        recommendedAction = 'Increase calcium and concentrates.';
      } else {
        pregnancyStage = 'Early Term';
        recommendedAction = 'Standard pregnant maintenance diet.';
      }
    }
  } else if (cow.status === 'Milking' && cow.dailyMilkYield > 15) {
    category = 'High-Yield Lactating';
    priority = 'Attention';
    recommendedAction = 'High energy concentrate boost required.';
  } else if (cow.status === 'Milking') {
    category = 'Lactating';
    recommendedAction = 'Maintenance + milk yield replacement diet.';
  } else if (cow.status === 'Sick' || cow.status === 'Injured') {
    category = 'Special-Care';
    priority = 'High Priority';
    recommendedAction = 'Veterinary recommended diet only.';
  }

  return { category, priority, daysToCalving, pregnancyStage, recommendedAction };
};

// @route   GET api/feed-optimization/dashboard
// @desc    Get complete AI feed predictions and optimization data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cows = await Livestock.find({ user: req.user.id });
    const feedStocks = await FeedStock.find({ user: req.user.id });
    let feedRules = await FeedRule.find({ user: req.user.id });

    // Seed default rules if none exist
    if (feedRules.length === 0) {
      const defaultRules = [
        { user: req.user.id, cowCategory: 'Normal', feedType: 'Green Fodder', baseQuantityKg: 15 },
        { user: req.user.id, cowCategory: 'Normal', feedType: 'Dry Fodder', baseQuantityKg: 4 },
        { user: req.user.id, cowCategory: 'Lactating', feedType: 'Green Fodder', baseQuantityKg: 20, milkMultiplier: 0.5 },
        { user: req.user.id, cowCategory: 'Lactating', feedType: 'Concentrates', baseQuantityKg: 2, milkMultiplier: 0.4 },
        { user: req.user.id, cowCategory: 'Pregnant', feedType: 'Green Fodder', baseQuantityKg: 25, pregnancyMultiplier: 2 },
        { user: req.user.id, cowCategory: 'Pregnant', feedType: 'Concentrates', baseQuantityKg: 3, pregnancyMultiplier: 1.5 }
      ];
      await FeedRule.insertMany(defaultRules);
      feedRules = await FeedRule.find({ user: req.user.id });
    }

    // 1. Process Cows & Calculate Today's Required Feed
    let cowProfiles = [];
    let todaysRequirement = {}; // { 'Green Fodder': { 'Normal': 15, 'Pregnant': 50, total: 65 } }
    
    let kpi = {
      totalCows: cows.length,
      pregnant: 0,
      lactating: 0,
      specialCare: 0
    };

    for (let cow of cows) {
      const records = await BreedingRecord.find({ livestock: cow._id });
      const analysis = determineCowCategory(cow, records);
      
      if (analysis.category === 'Pregnant') kpi.pregnant++;
      if (analysis.category.includes('Lactating')) kpi.lactating++;
      if (analysis.category === 'Special-Care') kpi.specialCare++;

      let cowDailyFeed = [];

      // Calculate feed based on rules
      const applicableRules = feedRules.filter(r => r.cowCategory === analysis.category || (analysis.category.includes('Lactating') && r.cowCategory === 'Lactating'));
      
      for (let rule of applicableRules) {
        let kgRequired = rule.baseQuantityKg;
        if (rule.milkMultiplier && cow.dailyMilkYield) {
          kgRequired += (cow.dailyMilkYield * rule.milkMultiplier);
        }
        if (rule.pregnancyMultiplier && analysis.category === 'Pregnant') {
          // Increase feed as calving approaches (simple logic for now)
          if (analysis.daysToCalving && analysis.daysToCalving < 60) {
            kgRequired += rule.pregnancyMultiplier * 2;
          } else {
            kgRequired += rule.pregnancyMultiplier;
          }
        }

        cowDailyFeed.push({
          feedType: rule.feedType,
          kgRequired: parseFloat(kgRequired.toFixed(1))
        });

        // Add to matrix
        if (!todaysRequirement[rule.feedType]) {
          todaysRequirement[rule.feedType] = { total: 0, Normal: 0, Pregnant: 0, Lactating: 0, 'Special-Care': 0 };
        }
        
        let matrixCat = analysis.category;
        if (matrixCat === 'High-Yield Lactating') matrixCat = 'Lactating';
        if (!todaysRequirement[rule.feedType][matrixCat]) todaysRequirement[rule.feedType][matrixCat] = 0;
        
        todaysRequirement[rule.feedType][matrixCat] += kgRequired;
        todaysRequirement[rule.feedType].total += kgRequired;
      }

      cowProfiles.push({
        cow,
        analysis,
        dailyFeed: cowDailyFeed
      });
    }

    // 2. Inventory Predictions & Forecasting
    let inventoryPredictions = [];
    for (let stock of feedStocks) {
      let dailyBurn = todaysRequirement[stock.feedType]?.total || stock.averageDailyConsumption || 0;
      
      let daysRemaining = dailyBurn > 0 ? Math.floor(stock.quantity / dailyBurn) : 999;
      let status = '🟢 Normal';
      let urgency = 0;
      let recommendedPurchaseQty = 0;

      if (daysRemaining <= stock.supplierLeadTimeDays) {
        status = '🔴 Critical (Stock-Out Imminent)';
        urgency = 3;
        recommendedPurchaseQty = (dailyBurn * 30) + stock.safetyStockLevel; // Buy 1 month supply
      } else if (daysRemaining <= (stock.supplierLeadTimeDays + 5)) {
        status = '🟠 High Priority (Order Now)';
        urgency = 2;
        recommendedPurchaseQty = (dailyBurn * 30);
      } else if (daysRemaining <= 15) {
        status = '🟡 Attention (Stock Low)';
        urgency = 1;
      }

      let stockOutDate = new Date();
      stockOutDate.setDate(stockOutDate.getDate() + daysRemaining);

      inventoryPredictions.push({
        feedStock: stock,
        dailyConsumption: parseFloat(dailyBurn.toFixed(1)),
        daysRemaining: daysRemaining === 999 ? 'Indefinite' : daysRemaining,
        status,
        urgency,
        stockOutDate: daysRemaining === 999 ? null : stockOutDate,
        recommendedPurchaseQty: Math.ceil(recommendedPurchaseQty)
      });
    }

    // Sort predictions by urgency
    inventoryPredictions.sort((a, b) => b.urgency - a.urgency);

    res.json({
      kpi,
      todaysRequirement,
      inventoryPredictions,
      cowProfiles
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
