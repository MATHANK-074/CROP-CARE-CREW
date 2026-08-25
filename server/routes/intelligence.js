const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const exceljs = require('exceljs');

const Livestock = require('../models/Livestock');
const MilkLog = require('../models/MilkLog');
const AnimalFeedRecord = require('../models/AnimalFeedRecord');
const MedicalRecord = require('../models/MedicalRecord');
const BreedingRecord = require('../models/BreedingRecord');
const FarmSetting = require('../models/FarmSetting');

// @route   GET api/intelligence/data-center
// @desc    Get aggregated Farm Data Center metrics
// @access  Private
router.get('/data-center', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // 1. Total Animals & Lifecycle
    const animals = await Livestock.find({ user: userId });
    const totalAnimals = animals.length;
    let milkingCows = 0;
    let dryCows = 0;
    let calves = 0;
    
    animals.forEach(a => {
      if (a.status === 'Milking') milkingCows++;
      if (a.status === 'Dry') dryCows++;
      if (a.category === 'Calf') calves++;
    });

    // 2. Milk Production & Revenue (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const milkAgg = await MilkLog.aggregate([
      { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalYield: { $sum: "$yieldLiters" } } }
    ]);
    const totalMilk30d = milkAgg.length > 0 ? milkAgg[0].totalYield : 0;

    // Farm Settings for Price
    const settings = await FarmSetting.findOne({ user: userId });
    const milkPrice = settings ? settings.milkSellingPricePerLitre : 0;
    const totalMilkRevenue30d = totalMilk30d * milkPrice;

    // 3. Feed Cost (Last 30 Days)
    const feedAgg = await AnimalFeedRecord.aggregate([
      { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalCost: { $sum: "$cost" }, totalFeedKg: { $sum: "$quantityKg" } } }
    ]);
    const totalFeedCost30d = feedAgg.length > 0 ? feedAgg[0].totalCost : 0;
    const totalFeedKg30d = feedAgg.length > 0 ? feedAgg[0].totalFeedKg : 0;

    // 4. Medical Expenses (Last 30 Days)
    const medicalAgg = await MedicalRecord.aggregate([
      { $match: { user: userId, treatmentDate: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalCost: { $sum: "$cost" }, eventCount: { $sum: 1 } } }
    ]);
    const totalMedicalCost30d = medicalAgg.length > 0 ? medicalAgg[0].totalCost : 0;
    const healthEvents30d = medicalAgg.length > 0 ? medicalAgg[0].eventCount : 0;

    // 5. Breeding Expenses (Last 30 Days)
    const breedingAgg = await BreedingRecord.aggregate([
      { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalCost: { $sum: "$cost" }, eventCount: { $sum: 1 } } }
    ]);
    const totalBreedingCost30d = breedingAgg.length > 0 ? breedingAgg[0].totalCost : 0;
    const pregnancyEvents30d = breedingAgg.length > 0 ? breedingAgg[0].eventCount : 0;

    // 6. Farm Profitability
    const totalOperatingCost30d = totalFeedCost30d + totalMedicalCost30d + totalBreedingCost30d;
    const netProfit30d = totalMilkRevenue30d - totalOperatingCost30d;

    res.json({
      animals: {
        total: totalAnimals,
        milking: milkingCows,
        dry: dryCows,
        calves: calves
      },
      production30d: {
        totalMilkLiters: totalMilk30d,
        totalMilkRevenue: totalMilkRevenue30d
      },
      expenses30d: {
        totalFeedCost: totalFeedCost30d,
        totalFeedKg: totalFeedKg30d,
        totalMedicalCost: totalMedicalCost30d,
        totalBreedingCost: totalBreedingCost30d,
        totalOperatingCost: totalOperatingCost30d
      },
      events30d: {
        healthEvents: healthEvents30d,
        pregnancyEvents: pregnancyEvents30d
      },
      profitability30d: {
        netProfit: netProfit30d,
        profitMarginPercentage: totalMilkRevenue30d > 0 ? ((netProfit30d / totalMilkRevenue30d) * 100).toFixed(2) : 0
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/intelligence/quality
// @desc    Data Quality Engine
// @access  Private
router.get('/quality', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const issues = [];
    
    // Check Farm Settings
    const settings = await FarmSetting.findOne({ user: userId });
    if (!settings || !settings.milkSellingPricePerLitre) {
      issues.push({ severity: 'CRITICAL', type: 'MISSING_DATA', explanation: 'Milk selling price is missing.', action: 'Configure milk price in Farm Settings.' });
    }

    // Check Animals
    const animals = await Livestock.find({ user: userId });
    for (const animal of animals) {
      if (!animal.birthDate && !animal.ageString) {
        issues.push({ severity: 'HIGH', type: 'MISSING_DATA', animalId: animal._id, explanation: `Animal ${animal.tagId} is missing age/birth date.`, action: 'Update animal profile with age/birth date.' });
      }
      if (animal.category === 'Cow' && animal.status === 'Milking') {
        // Check for recent milk records (last 7 days)
        const recentMilk = await MilkLog.findOne({ user: userId, livestock: animal._id, date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
        if (!recentMilk) {
          issues.push({ severity: 'HIGH', type: 'MISSING_DATA', animalId: animal._id, explanation: `Milking cow ${animal.tagId} has no milk records in the last 7 days.`, action: 'Log milk production.' });
        }
      }
    }

    // Check Milk Records for anomalies
    const suspiciousMilk = await MilkLog.find({ user: userId, $or: [{ yieldLiters: { $lt: 0 } }, { yieldLiters: { $gt: 40 } }] });
    suspiciousMilk.forEach(m => {
      issues.push({ severity: 'CRITICAL', type: 'INVALID_DATA', recordId: m._id, explanation: `Impossible milk yield (${m.yieldLiters} L) recorded on ${m.date.toDateString()}.`, action: 'Review and correct milk log.' });
    });

    // Check Feed Records for anomalies
    const suspiciousFeed = await AnimalFeedRecord.find({ user: userId, $or: [{ quantityKg: { $lt: 0 } }, { quantityKg: { $gt: 50 } }, { cost: { $lt: 0 } }] });
    suspiciousFeed.forEach(f => {
      issues.push({ severity: 'CRITICAL', type: 'INVALID_DATA', recordId: f._id, explanation: `Suspicious feed quantity (${f.quantityKg} kg) or cost (${f.cost}) recorded.`, action: 'Review and correct feed record.' });
    });

    // Overall Score
    let score = 100;
    issues.forEach(i => {
      if (i.severity === 'CRITICAL') score -= 15;
      else if (i.severity === 'HIGH') score -= 10;
      else if (i.severity === 'MEDIUM') score -= 5;
      else score -= 2;
    });
    score = Math.max(0, score);

    res.json({
      overallScore: score,
      totalIssues: issues.length,
      issues: issues.sort((a, b) => {
        const sev = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return sev[b.severity] - sev[a.severity];
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/intelligence/analytics
// @desc    Historical Farm Analytics (Daily/Weekly/Monthly)
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { period = 'monthly' } = req.query; // 'daily', 'weekly', 'monthly'
    
    let dateFormat;
    if (period === 'daily') dateFormat = "%Y-%m-%d";
    else if (period === 'weekly') dateFormat = "%Y-W%V";
    else dateFormat = "%Y-%m";

    // Aggregate Milk Production
    const milkAgg = await MilkLog.aggregate([
      { $match: { user: userId } },
      { $group: {
          _id: { $dateToString: { format: dateFormat, date: "$date" } },
          totalYield: { $sum: "$yieldLiters" },
          avgYield: { $avg: "$yieldLiters" }
      }},
      { $sort: { "_id": -1 } }
    ]);

    // Aggregate Feed Cost
    const feedAgg = await AnimalFeedRecord.aggregate([
      { $match: { user: userId } },
      { $group: {
          _id: { $dateToString: { format: dateFormat, date: "$date" } },
          totalCost: { $sum: "$cost" },
          totalFeedKg: { $sum: "$quantityKg" }
      }},
      { $sort: { "_id": -1 } }
    ]);

    // Format output
    res.json({
      period,
      milkTrends: milkAgg,
      feedTrends: feedAgg
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/intelligence/features/:animalId
// @desc    ML Feature Engineering Pipeline for specific animal
// @access  Private
router.get('/features/:animalId', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const animalId = new mongoose.Types.ObjectId(req.params.animalId);

    const animal = await Livestock.findOne({ _id: animalId, user: userId });
    if (!animal) return res.status(404).json({ msg: 'Animal not found' });

    // Calculate age in days
    const ageDays = animal.birthDate ? Math.floor((new Date() - new Date(animal.birthDate)) / (1000 * 60 * 60 * 24)) : null;

    // Get Milk logs
    const milkLogs = await MilkLog.find({ livestock: animalId }).sort({ date: -1 });
    
    let milkYield1d = 0;
    let milkYield7dAvg = 0;
    let milkYield30dAvg = 0;
    
    if (milkLogs.length > 0) {
      milkYield1d = milkLogs[0].yieldLiters;
      
      const last7Days = milkLogs.filter(m => (new Date() - new Date(m.date)) / (1000 * 60 * 60 * 24) <= 7);
      milkYield7dAvg = last7Days.length > 0 ? (last7Days.reduce((sum, m) => sum + m.yieldLiters, 0) / last7Days.length) : 0;

      const last30Days = milkLogs.filter(m => (new Date() - new Date(m.date)) / (1000 * 60 * 60 * 24) <= 30);
      milkYield30dAvg = last30Days.length > 0 ? (last30Days.reduce((sum, m) => sum + m.yieldLiters, 0) / last30Days.length) : 0;
    }

    // Health events count
    const healthEvents = await MedicalRecord.countDocuments({ livestock: animalId });

    const features = {
      animal_id: animal._id,
      age_days: ageDays,
      category: animal.category,
      status: animal.status,
      milk_yield_1d: milkYield1d,
      milk_yield_7d_avg: milkYield7dAvg.toFixed(2),
      milk_yield_30d_avg: milkYield30dAvg.toFixed(2),
      health_event_count: healthEvents,
      data_confidence: ageDays && milkLogs.length > 10 ? 95 : 60
    };

    res.json(features);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/intelligence/dataset/build
// @desc    Trigger building an ML-Ready Dataset
// @access  Private
router.post('/dataset/build', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const animals = await Livestock.find({ user: userId });
    
    const dataset = [];

    for (const animal of animals) {
      const milkLogs = await MilkLog.find({ livestock: animal._id }).sort({ date: 1 });
      const feedRecords = await AnimalFeedRecord.find({ livestock: animal._id }).sort({ date: 1 });
      const healthEvents = await MedicalRecord.countDocuments({ livestock: animal._id });

      let totalYield = 0;
      let milkYield30dAvg = 0;
      
      const last30Days = milkLogs.filter(m => (new Date() - new Date(m.date)) / (1000 * 60 * 60 * 24) <= 30);
      milkYield30dAvg = last30Days.length > 0 ? (last30Days.reduce((sum, m) => sum + m.yieldLiters, 0) / last30Days.length) : 0;

      const featureRow = {
        date_generated: new Date().toISOString(),
        animal_id: animal._id,
        category: animal.category,
        status: animal.status,
        milk_yield_30d_avg: milkYield30dAvg.toFixed(2),
        total_feed_records: feedRecords.length,
        health_events: healthEvents,
        is_valid: (milkLogs.length > 5 && animal.birthDate) ? true : false
      };

      dataset.push(featureRow);
    }

    // In a real system, save this to an S3 bucket or a `Dataset` collection.
    // For now, return it to the frontend.
    res.json({ message: 'Dataset generated successfully', size: dataset.length, dataset });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/intelligence/export
// @desc    Export aggregated data as CSV
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const milkLogs = await MilkLog.find({ user: userId }).populate('livestock', 'tagId category').sort({ date: -1 }).limit(100);

    let csvContent = "Date,Animal Tag,Category,Yield(L),Session\n";
    milkLogs.forEach(log => {
      const tag = log.livestock ? log.livestock.tagId : 'Unknown';
      const cat = log.livestock ? log.livestock.category : 'Unknown';
      const session = log.session || 'N/A';
      csvContent += `${new Date(log.date).toISOString().split('T')[0]},${tag},${cat},${log.yieldLiters},${session}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=\"farm_export.csv\"');
    res.status(200).send(csvContent);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/intelligence/export/excel
// @desc    Export aggregated data as Excel
// @access  Private
router.get('/export/excel', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const milkLogs = await MilkLog.find({ user: userId }).populate('livestock', 'tagId category').sort({ date: -1 }).limit(500);
    const feedRecords = await AnimalFeedRecord.find({ user: userId }).populate('livestock', 'tagId category').sort({ date: -1 }).limit(500);

    const workbook = new exceljs.Workbook();
    workbook.creator = 'AgriTech Intelligence';
    workbook.created = new Date();

    // --- Milk Production Sheet ---
    const milkSheet = workbook.addWorksheet('Milk Production');
    milkSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Animal Tag', key: 'tag', width: 20 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Yield (L)', key: 'yield', width: 15 },
      { header: 'Session', key: 'session', width: 15 }
    ];

    // Style headers
    milkSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    milkSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
    milkSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    milkLogs.forEach(log => {
      milkSheet.addRow({
        date: new Date(log.date).toISOString().split('T')[0],
        tag: log.livestock ? log.livestock.tagId : 'Unknown',
        category: log.livestock ? log.livestock.category : 'Unknown',
        yield: log.yieldLiters,
        session: log.session || 'N/A'
      });
    });

    // --- Feed Records Sheet ---
    const feedSheet = workbook.addWorksheet('Feed Records');
    feedSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Animal Tag', key: 'tag', width: 20 },
      { header: 'Feed Type', key: 'type', width: 20 },
      { header: 'Quantity (kg)', key: 'quantity', width: 15 },
      { header: 'Cost (₹)', key: 'cost', width: 15 }
    ];

    feedSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    feedSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } };
    feedSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    feedRecords.forEach(record => {
      feedSheet.addRow({
        date: new Date(record.date).toISOString().split('T')[0],
        tag: record.livestock ? record.livestock.tagId : (record.groupId || 'Farm-wide'),
        type: record.feedType,
        quantity: record.quantityKg,
        cost: record.cost
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="farm_report.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
