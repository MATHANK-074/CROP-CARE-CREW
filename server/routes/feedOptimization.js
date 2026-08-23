const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Livestock = require('../models/Livestock');
const BreedingRecord = require('../models/BreedingRecord');
const MedicalRecord = require('../models/MedicalRecord');
const FeedStock = require('../models/FeedStock');
const FeedConfiguration = require('../models/FeedConfiguration');
const FeedPlanOverride = require('../models/FeedPlanOverride');
const MilkLog = require('../models/MilkLog');
const FarmSetting = require('../models/FarmSetting');
const AnimalFeedRecord = require('../models/AnimalFeedRecord');

// Configuration default seeder if none exist
const ensureDefaultConfigurations = async (userId) => {
  let configs = await FeedConfiguration.find({ user: userId });
  
  // Check if upgrading from V1 to V2 (if the V2 CALF stage doesn't exist but configs do)
  const hasV2Config = configs.some(c => c.lifeStage === 'CALF');
  
  if (configs.length > 0 && !hasV2Config) {
    // Delete legacy V1 configs
    await FeedConfiguration.deleteMany({ user: userId });
    configs = [];
  }

  if (configs.length === 0) {
    const defaultConfigs = [
      // CALF
      { user: userId, lifeStage: 'CALF', feedType: 'Milk / Milk Replacer', baseQuantityKg: 4, goal: 'Growth' },
      { user: userId, lifeStage: 'CALF', feedType: 'Calf Starter', baseQuantityKg: 0.5, goal: 'Growth' },
      { user: userId, lifeStage: 'CALF', feedType: 'Green Fodder', baseQuantityKg: 1, goal: 'Rumen Development' },
      // GROWING HEIFER
      { user: userId, lifeStage: 'GROWING HEIFER', feedType: 'Green Fodder', baseQuantityKg: 10, goal: 'Growth' },
      { user: userId, lifeStage: 'GROWING HEIFER', feedType: 'Paddy Straw', baseQuantityKg: 2, goal: 'Maintenance' },
      { user: userId, lifeStage: 'GROWING HEIFER', feedType: 'Rice Bran', baseQuantityKg: 1, goal: 'Energy' },
      // ADULT NON-LACTATING
      { user: userId, lifeStage: 'ADULT NON-LACTATING', feedType: 'Green Fodder', baseQuantityKg: 15, goal: 'Maintenance' },
      { user: userId, lifeStage: 'ADULT NON-LACTATING', feedType: 'Paddy Straw', baseQuantityKg: 5, goal: 'Maintenance' },
      // PREGNANT
      { user: userId, lifeStage: 'PREGNANT', feedType: 'Green Fodder', baseQuantityKg: 20, pregnancyTrimester3Multiplier: 5, pregnancyTrimester2Multiplier: 2, goal: 'Gestation' },
      { user: userId, lifeStage: 'PREGNANT', feedType: 'Groundnut Cake', baseQuantityKg: 1, pregnancyTrimester3Multiplier: 1, goal: 'Protein for Fetus' },
      { user: userId, lifeStage: 'PREGNANT', feedType: 'Mineral Mixture', baseQuantityKg: 0.1, goal: 'Fetal Development' },
      // PREGNANT + LACTATING
      { user: userId, lifeStage: 'PREGNANT + LACTATING', feedType: 'Green Fodder', baseQuantityKg: 15, milkMultiplier: 0.5, pregnancyTrimester3Multiplier: 5, goal: 'Gestation + Lactation' },
      { user: userId, lifeStage: 'PREGNANT + LACTATING', feedType: 'Groundnut Cake', baseQuantityKg: 1, milkMultiplier: 0.2, pregnancyTrimester3Multiplier: 1, goal: 'Gestation + Lactation Protein' },
      { user: userId, lifeStage: 'PREGNANT + LACTATING', feedType: 'Mineral Mixture', baseQuantityKg: 0.15, milkMultiplier: 0.01, goal: 'Minerals' },
      // DRY COW
      { user: userId, lifeStage: 'DRY COW', feedType: 'Green Fodder', baseQuantityKg: 10, goal: 'Preparation for Calving' },
      { user: userId, lifeStage: 'DRY COW', feedType: 'Paddy Straw', baseQuantityKg: 8, goal: 'Maintenance' },
      // LACTATING
      { user: userId, lifeStage: 'LACTATING', feedType: 'Green Fodder', baseQuantityKg: 15, milkMultiplier: 0.5, goal: 'Milk Production' },
      { user: userId, lifeStage: 'LACTATING', feedType: 'Groundnut Cake', baseQuantityKg: 1, milkMultiplier: 0.3, goal: 'Milk Protein' },
      { user: userId, lifeStage: 'LACTATING', feedType: 'Mineral Mixture', baseQuantityKg: 0.1, milkMultiplier: 0.01, goal: 'Minerals' },
      // SPECIAL CARE
      { user: userId, lifeStage: 'SPECIAL CARE', feedType: 'Special Diet', baseQuantityKg: 1, goal: 'Recovery' },
      // BULL
      { user: userId, lifeStage: 'BULL', feedType: 'Green Fodder', baseQuantityKg: 20, goal: 'Maintenance' }
    ];
    await FeedConfiguration.insertMany(defaultConfigs);
    configs = await FeedConfiguration.find({ user: userId });
  }
  return configs;
};

// Animal Classification Engine
const classifyAnimal = (cow, breedingRecords, medicalRecords, milkLogs) => {
  let profile = 'ADULT NON-LACTATING';
  let pregnancyStage = null;
  let daysToDelivery = null;
  let confidence = 'HIGH CONFIDENCE';
  let confidenceScore = 100;
  let explanation = '';
  let specialCare = false;
  
  // Conf checks
  if (!cow.breed || cow.breed.trim() === '') {
    confidenceScore -= 15;
  }
  if (!cow.weight || cow.weight <= 0) {
    confidenceScore -= 10;
  }
  if (!cow.birthDate) {
    confidenceScore -= 10;
  }
  
  // 1. Health Status
  const recentMedical = medicalRecords.filter(m => new Date(m.date) > new Date(Date.now() - 30*24*60*60*1000));
  if (cow.status === 'Sick' || cow.status === 'Injured' || recentMedical.length > 0) {
    specialCare = true;
    confidenceScore -= 10;
  }

  // 2. Pregnancy Status
  const sortedBreeding = [...breedingRecords].sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
  const latestPregnancy = sortedBreeding.find(r => r.eventType === 'Pregnancy Check');
  let isPregnant = false;
  if (latestPregnancy && latestPregnancy.outcome === 'Pregnant') {
    isPregnant = true;
    const aiRecord = sortedBreeding.find(r => r.eventType === 'Artificial Insemination' && new Date(r.eventDate) < new Date(latestPregnancy.eventDate));
    if (aiRecord) {
      const calvingDate = new Date(aiRecord.eventDate);
      calvingDate.setDate(calvingDate.getDate() + 283);
      daysToDelivery = Math.ceil((calvingDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysToDelivery <= 90) pregnancyStage = 'THIRD TRIMESTER';
      else if (daysToDelivery <= 180) pregnancyStage = 'SECOND TRIMESTER';
      else pregnancyStage = 'FIRST TRIMESTER';
    } else {
      confidenceScore -= 20;
    }
  }

  // 3. Milk Production
  const recentMilk = milkLogs.filter(m => new Date(m.date) > new Date(Date.now() - 30*24*60*60*1000));
  const isLactating = cow.status === 'Milking' || recentMilk.length > 0;
  
  let avgMilk = null;
  if (recentMilk.length > 0) {
    avgMilk = recentMilk.reduce((sum, m) => sum + m.quantity, 0) / recentMilk.length;
  } else if (cow.dailyMilkYield !== undefined && cow.dailyMilkYield !== null) {
    avgMilk = cow.dailyMilkYield;
  }

  if (isLactating && avgMilk === 0) {
    confidenceScore -= 10;
  } else if (isLactating && avgMilk === null) {
    confidenceScore -= 30;
  }

  // 4. Age & Dry Period
  const ageInDays = cow.birthDate ? Math.floor((new Date() - new Date(cow.birthDate)) / (1000 * 60 * 60 * 24)) : null;
  const isDry = cow.status === 'Dry';

  // Master Classification Logic
  let breedStr = cow.breed && cow.breed.trim() !== '' ? `${cow.breed} breed` : 'animal';

  if (specialCare) {
    profile = 'SPECIAL CARE';
    explanation = `Special Feeding Plan — Farmer/Veterinary Review Required for this ${breedStr}.`;
  } else if (ageInDays !== null && ageInDays < 180) {
    profile = 'CALF';
    explanation = `Young ${breedStr} — feed plan prioritizes growth and rumen development.`;
  } else if (ageInDays !== null && ageInDays < 730 && !isPregnant && !isLactating) {
    profile = 'GROWING HEIFER';
    explanation = `This ${breedStr} is in the growing stage. The feeding plan prioritizes balanced growth rather than maximum milk production.`;
  } else if (isDry) {
    profile = 'DRY COW';
    explanation = `This ${breedStr} is in the dry period. Feed logic focuses on maintenance and preparation for next lactation.`;
  } else if (isPregnant && isLactating) {
    profile = 'PREGNANT + LACTATING';
    const milkStr = avgMilk !== null ? `(${avgMilk.toFixed(1)} L/day)` : '(Milk data unavailable)';
    explanation = `Milk production requires a lactation ration ${milkStr}. This ${breedStr} is also in the ${pregnancyStage?.toLowerCase() || 'pregnant'} stage, so the configured pregnancy adjustment has been applied.`;
  } else if (isPregnant) {
    profile = 'PREGNANT';
    explanation = `Fetal growth is increasing, so the system has activated the configured pregnancy nutrition adjustment for this ${breedStr} (${pregnancyStage?.toLowerCase() || 'pregnant'}).`;
  } else if (isLactating) {
    profile = 'LACTATING';
    const milkStr = avgMilk !== null ? `(${avgMilk.toFixed(1)} L/day)` : '(Milk data unavailable)';
    explanation = `Feed allocation is primarily influenced by this ${breedStr}'s lactation status and current milk yield ${milkStr}.`;
  } else if (cow.gender === 'Male' && cow.category === 'Bull') {
    profile = 'BULL';
    explanation = `Standard bull maintenance diet for ${breedStr}.`;
  } else {
    profile = 'ADULT NON-LACTATING';
    explanation = `Standard maintenance profile for ${breedStr}.`;
  }
  
  if (confidenceScore < 70) confidence = 'LOW CONFIDENCE / DATA REQUIRED';
  else if (confidenceScore < 90) confidence = 'MEDIUM CONFIDENCE';
  else confidence = 'HIGH CONFIDENCE';
  
  if (confidence === 'LOW CONFIDENCE / DATA REQUIRED') {
      if (!cow.breed) explanation += ' Breed data unavailable — recommendation confidence reduced.';
      if (isLactating && avgMilk === null) explanation += ' Milk yield data missing.';
  }

  return {
    profile,
    pregnancyStage,
    daysToDelivery,
    isLactating,
    milkYield: avgMilk,
    confidence,
    confidenceScore,
    explanation,
    specialCare
  };
};

// Calculate individual feed plan
const calculateFeedPlan = (cowAnalysis, configs, feedStocks, overrides, cow) => {
  let mappedLifeStage = cowAnalysis.profile;
  const applicableConfigs = configs.filter(c => c.lifeStage === mappedLifeStage);
  
  let feedPlan = [];
  let dailyCost = 0;
  
  // Conf penalty if no configs
  if (applicableConfigs.length === 0) {
    cowAnalysis.confidenceScore -= 40;
    cowAnalysis.confidence = 'LOW CONFIDENCE / DATA REQUIRED';
  }

  for (let config of applicableConfigs) {
    let suggestedQty = config.baseQuantityKg || 0;
    let source = 'CONFIGURED_BASELINE';

    if (config.milkMultiplier > 0 && cowAnalysis.isLactating) {
      if (cowAnalysis.milkYield !== null) {
        suggestedQty += (cowAnalysis.milkYield * config.milkMultiplier);
        source = 'MILK_ADJUSTED';
      }
    }

    if (cowAnalysis.pregnancyStage === 'THIRD TRIMESTER' && config.pregnancyTrimester3Multiplier > 0) {
      suggestedQty += config.pregnancyTrimester3Multiplier;
      source = 'PREGNANCY_ADJUSTED';
    } else if (cowAnalysis.pregnancyStage === 'SECOND TRIMESTER' && config.pregnancyTrimester2Multiplier > 0) {
      suggestedQty += config.pregnancyTrimester2Multiplier;
      source = 'PREGNANCY_ADJUSTED';
    } else if (cowAnalysis.pregnancyStage === 'FIRST TRIMESTER' && config.pregnancyTrimester1Multiplier > 0) {
      suggestedQty += config.pregnancyTrimester1Multiplier;
      source = 'PREGNANCY_ADJUSTED';
    }

    // Biological Sanity Checks
    let reviewRequired = false;
    let reviewReason = null;
    if ((config.feedType === 'Concentrates' || config.feedType === 'Groundnut Cake') && suggestedQty > 15) {
      reviewRequired = true;
      reviewReason = 'Calculated concentrate allocation exceeds the safe range. Review recommended.';
    } else if (cowAnalysis.specialCare) {
      reviewRequired = true;
      reviewReason = 'Feeding plan requires farmer/veterinary review.';
    }

    const stockInfo = feedStocks.find(s => s.feedType === config.feedType);
    const costPerUnit = stockInfo?.costPerUnit || 0;
    let priceStatus = costPerUnit > 0 ? 'ACTUAL' : 'ESTIMATED';
    
    if (priceStatus === 'ESTIMATED') {
      cowAnalysis.confidenceScore -= 10;
      if (cowAnalysis.confidenceScore < 90 && cowAnalysis.confidenceScore >= 70) cowAnalysis.confidence = 'MEDIUM CONFIDENCE';
      if (cowAnalysis.confidenceScore < 70) cowAnalysis.confidence = 'LOW CONFIDENCE / DATA REQUIRED';
    }
    
    // Check for override
    const override = overrides.find(o => o.feedType === config.feedType && o.livestock.toString() === cow._id.toString());
    let isOverridden = false;
    let overrideReason = null;
    let overrideBy = null;
    let overrideDate = null;
    let originalAIQty = parseFloat(suggestedQty.toFixed(1));

    if (override) {
      suggestedQty = override.modifiedQty;
      source = 'FARMER_OVERRIDE';
      isOverridden = true;
      overrideReason = override.reason;
      overrideBy = override.modifiedBy;
      overrideDate = override.createdAt;
      originalAIQty = override.originalAIQty;
    }

    const itemCost = suggestedQty * costPerUnit;
    dailyCost += itemCost;

    feedPlan.push({
      feedType: config.feedType,
      suggestedQuantityKg: parseFloat(suggestedQty.toFixed(1)),
      estimatedDailyCost: itemCost,
      source,
      priceStatus,
      isOverridden,
      overrideReason,
      overrideBy,
      overrideDate,
      originalAIQty,
      reviewRequired,
      reviewReason
    });
  }

  return { feedPlan, dailyCost };
};

// @route   GET api/feed-optimization/dashboard
// @desc    Get complete AI feed predictions and optimization data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cows = await Livestock.find({ user: req.user.id });
    const breedingRecords = await BreedingRecord.find({ user: req.user.id });
    const medicalRecords = await MedicalRecord.find({ user: req.user.id });
    const milkLogs = await MilkLog.find({ user: req.user.id });
    const feedStocks = await FeedStock.find({ user: req.user.id });
    const overrides = await FeedPlanOverride.find({ user: req.user.id });
    const configs = await ensureDefaultConfigurations(req.user.id);
    const farmSetting = await FarmSetting.findOne({ user: req.user.id });

    // Historical Feed Logs (for anomalies and trends)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const animalFeedRecords = await AnimalFeedRecord.find({ 
      user: req.user.id,
      date: { $gte: twoWeeksAgo }
    });

    let cowProfiles = [];
    let todaysRequirement = {};
    let totalDailyCost = 0;
    
    let kpi = {
      totalCows: cows.length,
      pregnant: 0,
      lactating: 0,
      specialCare: 0
    };

    const milkPrice = farmSetting && farmSetting.milkSellingPricePerLitre > 0 ? farmSetting.milkSellingPricePerLitre : null;
    const milkPriceStatus = milkPrice !== null ? 'CONFIGURED' : 'NOT_CONFIGURED';

    let totalHistoricalCostCurrent7 = 0;
    let totalHistoricalCostPrev7 = 0;
    let totalHistoricalMilkCurrent7 = 0;
    let totalHistoricalMilkPrev7 = 0;

    for (let cow of cows) {
      const cowBreeding = breedingRecords.filter(r => r.livestock.toString() === cow._id.toString());
      const cowMedical = medicalRecords.filter(r => r.livestock.toString() === cow._id.toString());
      const cowMilk = milkLogs.filter(r => r.livestock.toString() === cow._id.toString());

      const analysis = classifyAnimal(cow, cowBreeding, cowMedical, cowMilk);
      
      if (analysis.profile.includes('PREGNANT')) kpi.pregnant++;
      if (analysis.isLactating) kpi.lactating++;
      if (analysis.specialCare) kpi.specialCare++;

      const { feedPlan, dailyCost } = calculateFeedPlan(analysis, configs, feedStocks, overrides, cow);
      totalDailyCost += dailyCost;

      // Calculate Cow Anomalies
      let anomaly = null;
      const cowFeedRecords = animalFeedRecords.filter(r => r.livestock.toString() === cow._id.toString());
      const last7DaysRecords = cowFeedRecords.filter(r => new Date(r.date) > new Date(Date.now() - 7*24*60*60*1000));
      
      let historical7DayAvgCost = 0;
      if (last7DaysRecords.length > 0) {
        let totalCost7 = last7DaysRecords.reduce((sum, r) => sum + r.cost, 0);
        // Assuming records are per day roughly, we estimate daily avg
        let uniqueDays = new Set(last7DaysRecords.map(r => new Date(r.date).toDateString())).size;
        historical7DayAvgCost = totalCost7 / (uniqueDays || 1);
        
        if (historical7DayAvgCost > 0 && dailyCost > historical7DayAvgCost * 1.20) {
          const change = ((dailyCost - historical7DayAvgCost) / historical7DayAvgCost) * 100;
          anomaly = {
            currentCost: parseFloat(dailyCost.toFixed(2)),
            historicalAverage: parseFloat(historical7DayAvgCost.toFixed(2)),
            percentageChange: parseFloat(change.toFixed(1)),
            severity: 'HIGH',
            reason: 'Feed cost is significantly higher than the recent farm average.'
          };
        }
      }

      // Backward compatibility logic for todaysRequirement matrix
      let cowDailyFeed = [];
      for (let item of feedPlan) {
        cowDailyFeed.push({
          feedType: item.feedType,
          kgRequired: item.suggestedQuantityKg
        });

        if (!todaysRequirement[item.feedType]) {
          todaysRequirement[item.feedType] = { total: 0, Normal: 0, Pregnant: 0, Lactating: 0, 'Special-Care': 0 };
        }
        
        let matrixCat = 'Normal';
        if (analysis.specialCare) matrixCat = 'Special-Care';
        else if (analysis.isLactating) matrixCat = 'Lactating';
        else if (analysis.profile.includes('PREGNANT')) matrixCat = 'Pregnant';

        todaysRequirement[item.feedType][matrixCat] += item.suggestedQuantityKg;
        todaysRequirement[item.feedType].total += item.suggestedQuantityKg;
      }

      const feedCostPerLitre = analysis.isLactating && (analysis.milkYield || 0) > 0 ? (dailyCost / analysis.milkYield).toFixed(2) : 'N/A';
      
      const estimatedMilkRevenue = analysis.isLactating && milkPrice !== null ? analysis.milkYield * milkPrice : (milkPrice === null ? 'NOT_AVAILABLE' : 0);
      const estimatedFeedMargin = estimatedMilkRevenue !== 'NOT_AVAILABLE' ? estimatedMilkRevenue - dailyCost : 'NOT_AVAILABLE';

      // Conf logic for missing milk price
      if (milkPrice === null) {
        analysis.confidenceScore -= 15;
        if (analysis.confidenceScore < 80) analysis.confidence = 'MEDIUM';
      }

      cowProfiles.push({
        cow,
        analysis,
        dailyFeed: cowDailyFeed, // backward compatibility
        feedPlan, // new structure
        anomaly,
        metrics: {
          dailyFeedCost: dailyCost,
          feedCostPerLitre,
          estimatedMilkRevenue,
          estimatedFeedMargin,
          milkPriceStatus,
          dataConfidence: analysis.confidenceScore,
          confidenceLevel: analysis.confidence,
          explanation: analysis.explanation
        }
      });
    }

    // Calculate Farm-Level Efficiency Trend
    // This requires historic records for the whole farm. We can use animalFeedRecords for cost and milkLogs for milk output
    const milkLast14 = milkLogs.filter(m => new Date(m.date) > twoWeeksAgo);
    const prev7Date = new Date(Date.now() - 7*24*60*60*1000);
    
    animalFeedRecords.forEach(r => {
      if (new Date(r.date) > prev7Date) totalHistoricalCostCurrent7 += r.cost;
      else totalHistoricalCostPrev7 += r.cost;
    });
    
    milkLast14.forEach(m => {
      if (new Date(m.date) > prev7Date) totalHistoricalMilkCurrent7 += m.quantity;
      else totalHistoricalMilkPrev7 += m.quantity;
    });

    let efficiencyTrend = { status: 'INSUFFICIENT_DATA' };
    if (totalHistoricalCostPrev7 > 0 && totalHistoricalCostCurrent7 > 0 && totalHistoricalMilkPrev7 > 0 && totalHistoricalMilkCurrent7 > 0) {
      let fclPrev = totalHistoricalCostPrev7 / totalHistoricalMilkPrev7;
      let fclCur = totalHistoricalCostCurrent7 / totalHistoricalMilkCurrent7;
      let change = ((fclCur - fclPrev) / fclPrev) * 100;
      
      let trend = 'STABLE';
      if (change < -2) trend = 'IMPROVING'; // Lower cost per litre is better
      else if (change > 2) trend = 'DECLINING';
      
      efficiencyTrend = {
        status: 'AVAILABLE',
        trend,
        prev7CostPerLitre: fclPrev.toFixed(2),
        cur7CostPerLitre: fclCur.toFixed(2),
        changePercentage: change.toFixed(1)
      };
    }

    // Inventory & Forecast Logic
    let inventoryPredictions = [];
    let inventoryValue = 0;
    
    for (let stock of feedStocks) {
      inventoryValue += ((stock.quantity || 0) * (stock.costPerUnit || 0));
      let dailyBurn = todaysRequirement[stock.feedType]?.total || stock.averageDailyConsumption || 0;
      let daysRemaining = dailyBurn > 0 ? Math.floor(stock.quantity / dailyBurn) : 'N/A';
      
      let status = '🟢 GOOD';
      let urgency = 0;
      let recommendedPurchaseQty = 0;

      const leadTime = stock.supplierLeadTimeDays || 0;
      const safety = stock.safetyStockLevel || 0;

      let requiredStock = (dailyBurn * leadTime) + safety;

      if ((stock.quantity || 0) <= 0 && dailyBurn > 0) {
        status = '🔴 CRITICAL';
        urgency = 3;
        recommendedPurchaseQty = Math.max(0, requiredStock - (stock.quantity || 0)) + (dailyBurn * 30);
      } else if (daysRemaining !== 'N/A' && daysRemaining <= leadTime) {
        status = '🔴 CRITICAL';
        urgency = 3;
        recommendedPurchaseQty = Math.max(0, requiredStock - (stock.quantity || 0)) + (dailyBurn * 30);
      } else if (daysRemaining !== 'N/A' && daysRemaining <= (leadTime + safety / Math.max(1, dailyBurn))) {
        status = '🟠 REORDER SOON';
        urgency = 2;
        recommendedPurchaseQty = Math.max(0, requiredStock - (stock.quantity || 0)) + (dailyBurn * 15);
      } else if (daysRemaining !== 'N/A' && daysRemaining <= 15) {
        status = '🟡 MONITOR';
        urgency = 1;
      }
      
      if (stock.isActive === false) {
        recommendedPurchaseQty = 0;
      }
      
      let stockOutDate = null;
      if (daysRemaining !== 'N/A') {
        stockOutDate = new Date();
        stockOutDate.setDate(stockOutDate.getDate() + daysRemaining);
      }

      inventoryPredictions.push({
        feedStock: stock,
        dailyConsumption: parseFloat(dailyBurn.toFixed(1)),
        daysRemaining,
        status,
        urgency,
        stockOutDate: stock.supplierLeadTimeDays === undefined ? 'Lead time not configured' : stockOutDate,
        recommendedPurchaseQty: Math.max(0, Math.ceil(recommendedPurchaseQty)),
        requiredStock
      });
    }
    inventoryPredictions.sort((a, b) => b.urgency - a.urgency);

    // Feed Security Score
    let avgScore = 100;
    if (inventoryPredictions.length > 0) {
      let totalRisk = inventoryPredictions.reduce((acc, inv) => acc + (inv.urgency * 25), 0);
      avgScore = Math.max(0, 100 - (totalRisk / inventoryPredictions.length));
    }

    const farmForecast = {
      days7: inventoryPredictions.map(i => ({ type: i.feedStock.feedType, demand: i.dailyConsumption * 7 })),
      days30: inventoryPredictions.map(i => ({ type: i.feedStock.feedType, demand: i.dailyConsumption * 30 })),
      days60: inventoryPredictions.map(i => ({ type: i.feedStock.feedType, demand: i.dailyConsumption * 60 })),
      days90: inventoryPredictions.map(i => ({ type: i.feedStock.feedType, demand: i.dailyConsumption * 90 }))
    };

    res.json({
      kpi: {
        ...kpi,
        totalDailyCost,
        feedSecurityScore: avgScore,
        inventoryValue
      },
      todaysRequirement,
      inventoryPredictions,
      cowProfiles,
      farmForecast,
      efficiencyTrend,
      milkPriceStatus,
      milkSellingPricePerLitre: milkPrice
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/feed-optimization/override
// @desc    Override AI Feed recommendation
// @access  Private
router.post('/override', auth, async (req, res) => {
  try {
    const { livestockId, feedType, originalAIQty, modifiedQty, reason } = req.body;
    const override = new FeedPlanOverride({
      user: req.user.id,
      livestock: livestockId,
      feedType,
      originalAIQty,
      modifiedQty,
      reason,
      modifiedBy: 'Farmer'
    });
    await override.save();
    res.json({ message: 'Override saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
