const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Livestock = require('../models/Livestock');
const BreedingRecord = require('../models/BreedingRecord');
const MedicalRecord = require('../models/MedicalRecord');
const MilkLog = require('../models/MilkLog');
const AnimalFeedRecord = require('../models/AnimalFeedRecord');
const CalendarEvent = require('../models/CalendarEvent');
const { generateHealthEvaluation } = require('../utils/healthEvaluationGenerator');
const {
  calculateDataConfidence,
  predictMilkYield,
  evaluateHealthRisk,
  calculateLifecycleScore,
  calculateKeepVsSell
} = require('../utils/farmIntelligenceEngine');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `livestock-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// POST /api/livestock/:id/profile-image - Upload animal photo
router.post('/:id/profile-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const animal = await Livestock.findOne({ _id: req.params.id, user: req.user.id });
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5002';
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    animal.profile_img = imageUrl;
    await animal.save();

    res.json({ message: 'Profile image uploaded successfully', imageUrl });
  } catch (err) {
    console.error('Error uploading livestock image:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/livestock - Get all livestock for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const livestock = await Livestock.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(livestock);
  } catch (error) {
    console.error('Error fetching livestock:', error);
    res.status(500).json({ message: 'Server error while fetching livestock' });
  }
});

// GET /api/livestock/dashboard/stats - Get fleet-style dashboard statistics
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const allLivestock = await Livestock.find({ user: userId });
    
    const totalAnimals = allLivestock.length;
    const milkingCows = allLivestock.filter(a => a.status === 'Milking').length;
    const pregnantCows = allLivestock.filter(a => a.status === 'Pregnant').length;
    const poultryFlocks = allLivestock.filter(a => a.species === 'Poultry').length;

    // Get upcoming alerts from Breeding Records
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // For medical alerts (drying off / vitamins)
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    const twoMonths = new Date(today);
    twoMonths.setDate(today.getDate() + 60);

    // Find cows due for delivery soon (next 7 days)
    const upcomingDeliveries = await BreedingRecord.find({
      user: userId,
      expectedDeliveryDate: { $gte: today, $lte: nextWeek },
      outcome: { $in: ['Pending', 'Confirmed Pregnant'] }
    }).populate('livestock', 'tagId');

    // Find cows due for next heat cycle (needs AI)
    const dueForHeat = await BreedingRecord.find({
      user: userId,
      nextHeatPredictionDate: { $gte: today, $lte: nextWeek }
    }).populate('livestock', 'tagId');

    // Medical Alerts: Drying off (2 months before delivery) or pre-delivery vitamins (1 month before)
    const medicalAlerts = await BreedingRecord.find({
      user: userId,
      expectedDeliveryDate: { $gte: today, $lte: twoMonths },
      outcome: { $in: ['Pending', 'Confirmed Pregnant'] }
    }).populate('livestock', 'tagId');

    res.json({
      metrics: {
        totalAnimals,
        milkingCows,
        pregnantCows,
        poultryFlocks
      },
      alerts: {
        deliveries: upcomingDeliveries,
        heatChecks: dueForHeat,
        medical: medicalAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching livestock stats:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

// POST /api/livestock - Add a new animal
router.post('/', auth, async (req, res) => {
  try {
    const { tagId, species, trackingType, flockSize, category, breed, birthDate, ageString, buyingPrice, gender, status, weight, expectedDeliveryDate, notes } = req.body;
    
    const newAnimal = new Livestock({
      user: req.user.id,
      tagId, species, trackingType, flockSize, category, breed, birthDate, ageString, buyingPrice, gender, status, weight, notes
    });

    const savedAnimal = await newAnimal.save();

    // If bought pregnant, instantly register a BreedingRecord so alerts track it!
    if (status === 'Pregnant' && expectedDeliveryDate) {
      const newRecord = new BreedingRecord({
        user: req.user.id,
        livestock: savedAnimal._id,
        eventType: 'Natural Mating', // Assumed for market-bought pregnant cows
        eventDate: new Date(), // Today
        expectedDeliveryDate: new Date(expectedDeliveryDate),
        outcome: 'Confirmed Pregnant',
        notes: 'Pre-pregnant market purchase'
      });
      await newRecord.save();
    }

    res.status(201).json(savedAnimal);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An animal with this Tag ID already exists.' });
    }
    console.error('Error adding livestock:', error);
    res.status(500).json({ message: 'Server error while adding livestock' });
  }
});

// GET /api/livestock/milk/analytics - Get farm-wide milk analytics
router.get('/milk/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all milk logs for the user, populate livestock details
    const logs = await MilkLog.find({ user: userId }).populate('livestock', 'tagId status category breed').sort({ date: 1 });
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    // 1. Calculate Today's Yield
    let todayTotal = 0;
    let todayMorning = 0;
    let todayEvening = 0;
    
    // 2. Trend Data (Last 7 Days)
    const trendMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap[dateStr] = { date: dateStr, yield: 0, morning: 0, evening: 0 };
    }

    // 3. Leaderboard
    const cowYields = {};

    logs.forEach(log => {
      const logDate = new Date(log.date);
      const logDateOnly = logDate.toISOString().split('T')[0];
      const yieldLiters = log.yieldLiters || 0;

      // Trend accumulation
      if (trendMap[logDateOnly]) {
        trendMap[logDateOnly].yield += yieldLiters;
        if (log.session === 'Morning') trendMap[logDateOnly].morning += yieldLiters;
        if (log.session === 'Evening') trendMap[logDateOnly].evening += yieldLiters;
      }

      // Today's metrics
      if (logDate >= today && logDate < tomorrow) {
        todayTotal += yieldLiters;
        if (log.session === 'Morning') todayMorning += yieldLiters;
        if (log.session === 'Evening') todayEvening += yieldLiters;
      }

      // Leaderboard accumulation (let's do all-time for simplicity, or 30 days)
      if (log.livestock) {
        const tag = log.livestock.tagId;
        if (!cowYields[tag]) {
          cowYields[tag] = { tagId: tag, totalYield: 0, todayYield: 0 };
        }
        cowYields[tag].totalYield += yieldLiters;
        if (logDate >= today && logDate < tomorrow) {
          cowYields[tag].todayYield += yieldLiters;
        }
      }
    });

    const trend = Object.values(trendMap);
    
    const leaderboard = Object.values(cowYields)
      .sort((a, b) => b.totalYield - a.totalYield)
      .slice(0, 5); // Top 5 cows

    // --- FORECASTING LOGIC ---
    let forecast7Days = 0;
    let forecast30Days = 0;
    const dryingOffSoon = [];
    
    // Get all potential milking cows
    const activeCows = await Livestock.find({ user: userId, status: { $in: ['Milking', 'Pregnant'] } });
    
    // Get breeding records for pregnant cows to find expected delivery dates
    const breedingRecords = await BreedingRecord.find({ user: userId, outcome: 'Confirmed Pregnant' }).sort({ eventDate: -1 });
    
    // Get last 7 days of milk logs to calculate current base averages
    const recentMilkLogs = await MilkLog.find({ user: userId, date: { $gte: sevenDaysAgo } });

    activeCows.forEach(cow => {
      // Find average daily yield over the last 7 days for this cow
      const cowLogs = recentMilkLogs.filter(log => log.livestock.toString() === cow._id.toString());
      if (cowLogs.length === 0) return; // Cannot forecast without baseline

      const totalLiters = cowLogs.reduce((sum, log) => sum + (log.yieldLiters || 0), 0);
      let dailyBaseYield = totalLiters / 7;

      // Find if she is pregnant and has an EDD
      let dryDate = null;
      if (cow.status === 'Pregnant') {
        const latestBreeding = breedingRecords.find(br => br.livestock.toString() === cow._id.toString());
        if (latestBreeding && latestBreeding.expectedDeliveryDate) {
          dryDate = new Date(latestBreeding.expectedDeliveryDate);
          dryDate.setDate(dryDate.getDate() - 60); // 60 days before delivery
          
          // Check if drying off soon (within 30 days)
          const daysToDry = Math.ceil((dryDate - today) / (1000 * 60 * 60 * 24));
          if (daysToDry > 0 && daysToDry <= 30) {
            dryingOffSoon.push({ tagId: cow.tagId, dryDate: dryDate, daysToDry });
          }
        }
      }

      // Calculate future 30 days
      for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + dayOffset);

        let yieldToday = 0;

        // If cow has reached dry date, yield is 0
        if (dryDate && futureDate >= dryDate) {
          yieldToday = 0;
        } else {
          // Apply a generic natural decay of 0.33% per day (approx 10% per month)
          const decayFactor = Math.pow(1 - 0.0033, dayOffset);
          yieldToday = dailyBaseYield * decayFactor;
          
          // If pregnant and approaching dry period (within 30 days of dry date), decay faster!
          if (dryDate) {
             const daysToDry = Math.ceil((dryDate - futureDate) / (1000 * 60 * 60 * 24));
             if (daysToDry <= 30 && daysToDry > 0) {
                 // Additional heavy drop as she prepares to dry
                 yieldToday = yieldToday * (daysToDry / 30);
             }
          }
        }

        if (dayOffset <= 7) {
          forecast7Days += yieldToday;
        }
        forecast30Days += yieldToday;
      }
    });
    // --- END FORECASTING LOGIC ---

    res.json({
      today: { total: todayTotal, morning: todayMorning, evening: todayEvening },
      trend,
      leaderboard,
      forecast: {
        next7Days: forecast7Days,
        next30Days: forecast30Days,
        dryingOffSoon
      }
    });
    
  } catch (error) {
    console.error('Error fetching milk analytics:', error);
    res.status(500).json({ message: 'Server error fetching milk analytics' });
  }
});

// POST /api/livestock/:id/breeding - Log a breeding event
router.post('/:id/breeding', auth, async (req, res) => {
  try {
    const { eventType, eventDate, semenDetails, notes } = req.body;
    const livestockId = req.params.id;

    // Verify ownership
    const animal = await Livestock.findOne({ _id: livestockId, user: req.user.id });
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }

    let expectedDeliveryDate = null;
    if (eventType === 'Artificial Insemination' || eventType === 'Natural Mating') {
      // Add ~283 days for cow gestation
      const date = new Date(eventDate);
      date.setDate(date.getDate() + 283);
      expectedDeliveryDate = date;
      
      // Update animal status
      animal.status = 'Pregnant';
      await animal.save();
    }

    const newRecord = new BreedingRecord({
      user: req.user.id,
      livestock: livestockId,
      eventType,
      eventDate,
      semenDetails,
      expectedDeliveryDate,
      notes
    });

    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    console.error('Error logging breeding event:', error);
    res.status(500).json({ message: 'Server error while logging event' });
  }
});

// GET /api/livestock/:id/breeding - Get breeding history for specific animal
router.get('/:id/breeding', auth, async (req, res) => {
  try {
    const records = await BreedingRecord.find({ 
      user: req.user.id, 
      livestock: req.params.id 
    }).sort({ eventDate: -1 });
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching breeding history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/livestock/:id/medical - Log a medical/injection event
router.post('/:id/medical', auth, async (req, res) => {
  try {
    const { type, name, date, notes } = req.body;
    const livestockId = req.params.id;

    // Verify ownership
    const animal = await Livestock.findOne({ _id: livestockId, user: req.user.id });
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }

    const newRecord = new MedicalRecord({
      user: req.user.id,
      livestock: livestockId,
      type,
      name,
      date: date || new Date(),
      notes
    });

    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    console.error('Error logging medical event:', error);
    res.status(500).json({ message: 'Server error while logging medical event' });
  }
});

// GET /api/livestock/:id/medical - Get medical history for specific animal
router.get('/:id/medical', auth, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ 
      user: req.user.id, 
      livestock: req.params.id 
    }).sort({ date: -1 });
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/livestock/:id/milk - Log milk yield
router.post('/:id/milk', auth, async (req, res) => {
  try {
    const livestockId = req.params.id;
    const { date, session, yieldLiters, fatPercentage, snfPercentage, notes } = req.body;

    const animal = await Livestock.findOne({ _id: livestockId, user: req.user.id });
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    const log = new MilkLog({
      user: req.user.id,
      livestock: livestockId,
      date: date || new Date(),
      session,
      yieldLiters,
      fatPercentage,
      snfPercentage,
      notes
    });

    const savedLog = await log.save();
    res.status(201).json(savedLog);
  } catch (error) {
    console.error('Error logging milk:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// POST /api/livestock/:id/milk/daily - Log daily milk yield (Morning & Evening)
router.post('/:id/milk/daily', auth, async (req, res) => {
  try {
    const livestockId = req.params.id;
    const { date, morningYield, eveningYield, notes } = req.body;

    const animal = await Livestock.findOne({ _id: livestockId, user: req.user.id });
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    if (animal.status !== 'Milking') {
      return res.status(400).json({ message: 'Animal is not currently milking.' });
    }

    const mYield = parseFloat(morningYield) || 0;
    const eYield = parseFloat(eveningYield) || 0;

    if (mYield < 0 || eYield < 0) {
      return res.status(400).json({ message: 'Milk yield cannot be negative.' });
    }
    
    if (mYield === 0 && eYield === 0) {
      return res.status(400).json({ message: 'At least one session yield must be greater than zero.' });
    }

    const logDate = date ? new Date(date) : new Date();
    // Normalize date to start of day for accurate duplicate checking
    const startOfDay = new Date(logDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Check for duplicates
    const existingLogs = await MilkLog.find({
      user: req.user.id,
      livestock: livestockId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingLogs.length > 0) {
      return res.status(409).json({ message: 'Milk records already exist for this date. Please edit existing records.' });
    }

    const logsToSave = [];
    if (mYield > 0) {
      logsToSave.push(new MilkLog({
        user: req.user.id,
        livestock: livestockId,
        date: logDate,
        session: 'Morning',
        yieldLiters: mYield,
        notes
      }));
    }
    
    if (eYield > 0) {
      logsToSave.push(new MilkLog({
        user: req.user.id,
        livestock: livestockId,
        date: logDate, // keep same exact date string for grouping
        session: 'Evening',
        yieldLiters: eYield,
        notes
      }));
    }

    const savedLogs = await MilkLog.insertMany(logsToSave);
    res.status(201).json(savedLogs);
  } catch (error) {
    console.error('Error logging daily milk:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/livestock/:id/milk - Get milk yield history
router.get('/:id/milk', auth, async (req, res) => {
  try {
    const logs = await MilkLog.find({ 
      user: req.user.id, 
      livestock: req.params.id 
    }).sort({ date: -1 });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching milk logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/livestock/:id/delivery - Log automated delivery (creates calf, updates mother)
router.post('/:id/delivery', auth, async (req, res) => {
  try {
    const { calfGender, calfWeight, deliveryDate } = req.body;
    const livestockId = req.params.id;

    // 1. Get Mother
    const mother = await Livestock.findOne({ _id: livestockId, user: req.user.id });
    if (!mother) return res.status(404).json({ message: 'Mother not found' });

    // 2. Change Mother status to Milking
    mother.status = 'Milking';
    await mother.save();

    // 3. Auto-generate Calf
    const calf = new Livestock({
      user: req.user.id,
      tagId: `CALF-OF-${mother.tagId}-${Math.floor(Math.random() * 1000)}`,
      category: 'Calf',
      breed: mother.breed,
      birthDate: deliveryDate || new Date(),
      ageString: '0 months',
      gender: calfGender || 'Female',
      status: 'Growing',
      weight: calfWeight || 0,
      notes: `Auto-generated calf from ${mother.tagId}`
    });
    const savedCalf = await calf.save();

    // 4. Update Breeding Record (if exists) to mark as Delivered and set Next Heat
    const dDate = new Date(deliveryDate || new Date());
    const nextHeat = new Date(dDate);
    nextHeat.setDate(dDate.getDate() + 45); // Predict heat in 45 days

    await BreedingRecord.findOneAndUpdate(
      { livestock: livestockId, user: req.user.id, outcome: { $in: ['Pending', 'Confirmed Pregnant'] } },
      { 
        outcome: 'Delivered Calf',
        actualDeliveryDate: dDate,
        nextHeatPredictionDate: nextHeat
      },
      { sort: { eventDate: -1 } } // Get most recent pregnancy
    );

    res.status(201).json({ message: 'Delivery logged successfully!', calf: savedCalf });
  } catch (error) {
    console.error('Error logging delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/livestock/:id/viability - Generate AI Health Viability
router.post('/:id/viability', auth, async (req, res) => {
  try {
    const livestockId = req.params.id;
    const cow = await Livestock.findOne({ _id: livestockId, user: req.user.id });
    if (!cow) {
      return res.status(404).json({ message: 'Livestock not found' });
    }

    const medicalRecords = await MedicalRecord.find({ livestock: livestockId, user: req.user.id }).sort({ date: -1 });

    const evaluation = await generateHealthEvaluation(cow, medicalRecords);
    console.log("AI Evaluation result:", evaluation);

    // Map keys to handle potential capitalization issues from Gemini
    const mappedEvaluation = {
      recommendation: evaluation.recommendation || evaluation.Recommendation || 'Monitor',
      healthScore: evaluation.healthScore || evaluation.HealthScore || evaluation.score || 0,
      reasoning: evaluation.reasoning || evaluation.Reasoning || 'No reasoning provided.'
    };

    // Save to the DB
    cow.set('aiHealthEvaluation', {
      ...mappedEvaluation,
      lastEvaluated: new Date()
    });
    await cow.save();

    res.json(cow.aiHealthEvaluation);
  } catch (error) {
    console.error('Error running AI viability check:', error);
    res.status(500).json({ message: 'Server error during AI evaluation' });
  }
});

// GET /api/livestock/asset-dashboard - Comprehensive Farm Asset & Profit Intelligence
router.get('/asset-dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const animals = await Livestock.find({ user: userId });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentLogs = await MilkLog.find({ user: userId, date: { $gte: thirtyDaysAgo } });
    const prevLogs = await MilkLog.find({ user: userId, date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    const breedingRecords = await BreedingRecord.find({ user: userId }).sort({ eventDate: -1 });
    const medicalRecords = await MedicalRecord.find({ user: userId }).sort({ date: -1 });
    const feedRecords = await AnimalFeedRecord.find({ user: userId, date: { $gte: thirtyDaysAgo } });
    const prevFeedRecords = await AnimalFeedRecord.find({ user: userId, date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });
    const calendarEvents = await CalendarEvent.find({ user: userId, status: 'Pending' });

    let totalAssetValue = 0;
    let monthlyRevenue = 0;
    let monthlyExpenses = 0;
    let prevMonthlyRevenue = 0;
    let prevMonthlyExpenses = 0;
    
    // User configurable defaults (could be passed in req.query or fetched from a settings DB, using hardcoded defaults for now as requested)
    const milkPricePerL = parseFloat(req.query.milkPrice) || 45; // INR per liter
    const dailyFeedCost = parseFloat(req.query.feedCost) || 120; // INR per cow per day
    const dailyMedicalCost = parseFloat(req.query.medicalCost) || 20; // INR average maintenance

    const animalAssets = [];
    const alerts = [];
    let retainCount = 0;
    let monitorCount = 0;
    let saleConsiderationCount = 0;
    let vetReviewCount = 0;

    for (const animal of animals) {
      // 1. Core Data
      const animalLogs = recentLogs.filter(log => log.livestock.toString() === animal._id.toString());
      const animalBreeding = breedingRecords.filter(br => br.livestock.toString() === animal._id.toString());
      const animalMedical = medicalRecords.filter(mr => mr.livestock.toString() === animal._id.toString());
      
      // Age Calc
      let ageYears = 3; // default
      if (animal.birthDate) {
        ageYears = (new Date() - new Date(animal.birthDate)) / (1000 * 60 * 60 * 24 * 365.25);
      } else if (animal.ageString) {
        const match = animal.ageString.match(/(\d+)\s*years?/i);
        if (match) ageYears = parseInt(match[1]);
      }

      // Milk Calcs
      let currentAvgYield = 0; // last 7 days
      let thirtyDayAvgYield = 0;
      let last3DaysAvgYield = 0;
      let todayYield = 0;
      let peakYield = 0;

      const todayStr = new Date().toISOString().split('T')[0];
      
      // Group by date
      const dailyYields = {};
      animalLogs.forEach(log => {
        const dStr = new Date(log.date).toISOString().split('T')[0];
        dailyYields[dStr] = (dailyYields[dStr] || 0) + (log.yieldLiters || 0);
      });

      const yieldValues = Object.values(dailyYields);
      if (yieldValues.length > 0) {
        thirtyDayAvgYield = yieldValues.reduce((a, b) => a + b, 0) / Math.max(yieldValues.length, 1);
        peakYield = Math.max(...yieldValues);
        
        // simple heuristic for 3-day and 7-day
        const sortedDates = Object.keys(dailyYields).sort().reverse();
        if (sortedDates.includes(todayStr)) todayYield = dailyYields[todayStr];
        
        let sum7 = 0, count7 = 0;
        let sum3 = 0, count3 = 0;
        for (let i = 0; i < Math.min(7, sortedDates.length); i++) {
          sum7 += dailyYields[sortedDates[i]];
          count7++;
          if (i < 3) {
            sum3 += dailyYields[sortedDates[i]];
            count3++;
          }
        }
        currentAvgYield = count7 > 0 ? sum7 / count7 : 0;
        last3DaysAvgYield = count3 > 0 ? sum3 / count3 : 0;
      }

      // Check Pregnancy & EDD
      let isPregnant = animal.status === 'Pregnant';
      let edd = null;
      let daysToDryOff = null;
      if (isPregnant) {
        const latestBreeding = animalBreeding.find(b => b.outcome === 'Confirmed Pregnant');
        if (latestBreeding && latestBreeding.expectedDeliveryDate) {
          edd = new Date(latestBreeding.expectedDeliveryDate);
          const dryDate = new Date(edd);
          dryDate.setDate(dryDate.getDate() - 60);
          daysToDryOff = Math.ceil((dryDate - new Date()) / (1000 * 60 * 60 * 24));
        }
      }

      // 2. Intelligence: Data Confidence
      const dataConfidence = calculateDataConfidence(animalLogs, 30);

      // 3. Intelligence: Milk Forecasting
      const milkForecast = predictMilkYield(animal, thirtyDayAvgYield, todayYield, peakYield, isPregnant, daysToDryOff);

      // 4. Intelligence: Health Risk Evaluation
      const recentMedical = animalMedical.filter(mr => (new Date() - new Date(mr.date)) < 30 * 24 * 60 * 60 * 1000);
      const recentMedicalCount = recentMedical.length;
      const healthEval = evaluateHealthRisk(animal, thirtyDayAvgYield, todayYield, recentMedicalCount, isPregnant, daysToDryOff);
      
      const healthRiskScore = healthEval.score;
      const riskLevel = healthEval.riskLevel;
      const healthReasons = healthEval.factors;

      if (riskLevel === 'CRITICAL') {
        alerts.push({ animal: animal.tagId, severity: 'Critical', message: 'Critical Health Risk Detected', action: 'Veterinary Review Required' });
      }
      
      // Check upcoming due dates for alerts
      animalMedical.forEach(mr => {
         if (mr.nextDueDate && new Date(mr.nextDueDate) > new Date()) {
            alerts.push({
               animal: animal.tagId,
               severity: 'Info',
               message: `Upcoming Medical/Vaccination: ${mr.name}`,
               action: `Due: ${new Date(mr.nextDueDate).toLocaleDateString()}`
            });
         }
      });

      // 5. Economics
      const estMonthlyRevenue = thirtyDayAvgYield * 30 * milkPricePerL;
      
      // Calculate actual historical costs from DB (last 30 days)
      const recentBreeding = animalBreeding.filter(br => (new Date() - new Date(br.eventDate)) < 30 * 24 * 60 * 60 * 1000);
      const recentMedicalCosts = recentMedical.reduce((sum, mr) => sum + (mr.cost || 0), 0);
      const recentBreedingCosts = recentBreeding.reduce((sum, br) => sum + (br.cost || 0), 0);
      
      const animalFeedLogs = feedRecords.filter(fr => fr.livestock.toString() === animal._id.toString());
      let recentFeedCost = animalFeedLogs.reduce((sum, fr) => sum + (fr.cost || 0), 0);
      
      let usedDefaultFeed = false;
      if (recentFeedCost === 0) {
         recentFeedCost = dailyFeedCost * 30; // INR 120/day * 30 days
         usedDefaultFeed = true;
      }

      let totalMaintenanceCost = recentMedicalCosts + recentBreedingCosts;
      let usedDefaultMedical = false;
      if (totalMaintenanceCost === 0) {
         totalMaintenanceCost = dailyMedicalCost * 30;
         usedDefaultMedical = true;
      }

      const netContribution = estMonthlyRevenue - recentFeedCost - totalMaintenanceCost;
      
      monthlyRevenue += estMonthlyRevenue;
      monthlyExpenses += (recentFeedCost + totalMaintenanceCost);

      // Previous 30 Days Logic
      const animalPrevLogs = prevLogs.filter(log => log.livestock.toString() === animal._id.toString());
      let prev30DayYieldTotal = 0;
      animalPrevLogs.forEach(log => { prev30DayYieldTotal += (log.yieldLiters || 0); });
      const prevThirtyDayAvgYield = animalPrevLogs.length > 0 ? prev30DayYieldTotal / 30 : 0;
      
      const prevAnimalMedical = medicalRecords.filter(mr => mr.livestock.toString() === animal._id.toString() && (new Date() - new Date(mr.date)) >= 30 * 24 * 60 * 60 * 1000 && (new Date() - new Date(mr.date)) < 60 * 24 * 60 * 60 * 1000);
      const prevAnimalBreeding = breedingRecords.filter(br => br.livestock.toString() === animal._id.toString() && (new Date() - new Date(br.eventDate)) >= 30 * 24 * 60 * 60 * 1000 && (new Date() - new Date(br.eventDate)) < 60 * 24 * 60 * 60 * 1000);
      
      const prevEstMonthlyRevenue = prevThirtyDayAvgYield * 30 * milkPricePerL;
      
      const prevMedicalCosts = prevAnimalMedical.reduce((sum, mr) => sum + (mr.cost || 0), 0);
      const prevBreedingCosts = prevAnimalBreeding.reduce((sum, br) => sum + (br.cost || 0), 0);
      let prevMaintenanceCost = prevMedicalCosts + prevBreedingCosts;
      if (prevMaintenanceCost === 0) prevMaintenanceCost = dailyMedicalCost * 30;

      const prevAnimalFeedLogs = prevFeedRecords.filter(fr => fr.livestock.toString() === animal._id.toString());
      let prevFeedCost = prevAnimalFeedLogs.reduce((sum, fr) => sum + (fr.cost || 0), 0);
      if (prevFeedCost === 0) prevFeedCost = dailyFeedCost * 30;

      prevMonthlyRevenue += prevEstMonthlyRevenue;
      prevMonthlyExpenses += (prevFeedCost + prevMaintenanceCost);

      const isEstimatedValue = !animal.buyingPrice;
      let assetValue = animal.buyingPrice || (50000 + (thirtyDayAvgYield * 2000) - (ageYears * 2000));
      if (assetValue < 10000) assetValue = 15000;
      totalAssetValue += assetValue;

      // 6. Intelligence: Lifecycle Score
      const recentAI = animalBreeding.filter(b => b.eventType === 'Artificial Insemination');
      const aiAttempts = recentAI.length;
      const lifecycleEval = calculateLifecycleScore(animal, healthRiskScore, thirtyDayAvgYield, netContribution, ageYears, aiAttempts, isPregnant);

      const lifecycleScore = lifecycleEval.score;
      const recommendation = lifecycleEval.recommendation;
      const lifecycleReasons = lifecycleEval.reasons;

      if (recommendation === 'VETERINARY REVIEW') vetReviewCount++;
      else if (recommendation === 'CONSIDER SALE') saleConsiderationCount++;
      else if (recommendation === 'MONITOR') monitorCount++;
      else retainCount++;

      // 7. Intelligence: Keep vs Sell (12 months)
      const keepVsSell = calculateKeepVsSell({
          estMonthlyRevenue,
          estMonthlyFeed: recentFeedCost,
          estMonthlyMedical: totalMaintenanceCost,
          netContribution,
          assetValue
      }, animal);
      
      // Performance Trend
      let trend = 'STABLE →';
      if (animalLogs.length < 5) trend = 'INSUFFICIENT DATA';
      else {
        const longTermDrop = peakYield > 0 && thirtyDayAvgYield < peakYield ? ((peakYield - thirtyDayAvgYield)/peakYield)*100 : 0;
        if (longTermDrop > 20 || (netContribution < 0 && animal.status === 'Milking')) trend = 'DECLINING ↓';
        if (healthRiskScore > 75) trend = 'CRITICAL ↓↓';
        if (thirtyDayAvgYield > peakYield * 0.9 && thirtyDayAvgYield > 10) trend = 'STRONG ↑';
      }

      animalAssets.push({
        animal,
        metrics: {
          ageYears,
          todayYield,
          currentAvgYield,
          thirtyDayAvgYield,
          peakYield,
          isPregnant,
          daysToDryOff,
          healthRiskScore,
          riskLevel,
          healthReasons,
          estMonthlyRevenue,
          estMonthlyFeed: recentFeedCost,
          estMonthlyMedical: totalMaintenanceCost,
          usedDefaultFeed,
          usedDefaultMedical,
          netContribution,
          assetValue,
          isEstimatedValue,
          keepVsSell,
          dataConfidence,
          milkForecast,
          lifecycleScore,
          lifecycleReasons,
          recommendation,
          trend
        }
      });
    }

    // Farm-wide or general alerts from Calendar
    calendarEvents.forEach(event => {
       const animalTag = event.livestock ? animals.find(a => a._id.toString() === event.livestock.toString())?.tagId : 'Farm';
       alerts.push({
           animal: animalTag || 'Farm',
           severity: event.eventType === 'Vet Visit' || event.eventType === 'Vaccination' ? 'Warning' : 'Info',
           message: `${event.eventType}: ${event.title}`,
           action: `Due: ${new Date(event.eventDate).toLocaleDateString()}`
       });
    });

    const netProfit = monthlyRevenue - monthlyExpenses;
    const portfolioHealth = Math.max(0, 100 - ( (saleConsiderationCount + vetReviewCount) / Math.max(animals.length, 1) * 100 ));

    const total30DayMilkVolume = monthlyRevenue / milkPricePerL;
    let costPerLitre = 0;
    if (total30DayMilkVolume > 0) {
      costPerLitre = monthlyExpenses / total30DayMilkVolume;
    }
    const estimatedMargin = milkPricePerL - costPerLitre;
    const breakEvenDailyYield = monthlyExpenses > 0 ? (monthlyExpenses / milkPricePerL / 30) : 0;
    
    const prevNetProfit = prevMonthlyRevenue - prevMonthlyExpenses;
    let profitChangePct = null;
    if (prevNetProfit !== 0 && (prevMonthlyRevenue > 0 || prevMonthlyExpenses > 0)) {
        profitChangePct = ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100;
    }

    const financialKPIs = {
        total30DayMilkVolume,
        costPerLitre,
        estimatedMargin,
        breakEvenDailyYield,
        prevNetProfit,
        profitChangePct
    };const farmForecast = {
       days7: { revenue: 0, expenses: 0, profit: 0 },
       days30: { revenue: 0, expenses: 0, profit: 0 },
       days90: { revenue: 0, expenses: 0, profit: 0 }
    };

    let projected30DayLossYield = 0;
    const productionLossPredictions = [];
    let highRiskCount = 0;
    let strongContributorsCount = 0;

    animalAssets.forEach(asset => {
       const m = asset.metrics;
       
       // Revenue forecasts based on milk predictions
       const p7DailyRev = m.milkForecast.predicted7Day * milkPricePerL;
       const p30DailyRev = m.milkForecast.predicted30Day * milkPricePerL;

       farmForecast.days7.revenue += (p7DailyRev * 7);
       farmForecast.days30.revenue += (p30DailyRev * 30);
       farmForecast.days90.revenue += (p30DailyRev * 90);
       
       // Expenses forecasts based on 30-day historical burn rate
       const dailyFeed = m.estMonthlyFeed / 30;
       const dailyMed = m.estMonthlyMedical / 30;
       const dailyExpense = dailyFeed + dailyMed;

       farmForecast.days7.expenses += (dailyExpense * 7);
       farmForecast.days30.expenses += (dailyExpense * 30);
       farmForecast.days90.expenses += (dailyExpense * 90);

       // Production Loss
       const expected30DayYield = m.thirtyDayAvgYield * 30;
       const projected30DayYield = m.milkForecast.predicted30Day * 30;
       if (expected30DayYield > projected30DayYield && m.milkForecast.declinePercent > 10) {
          const loss = expected30DayYield - projected30DayYield;
          projected30DayLossYield += loss;
          productionLossPredictions.push({
             animal: asset.animal.tagId,
             currentProduction: expected30DayYield,
             projectedProduction: projected30DayYield,
             potentialLoss: loss,
             revenueImpact: loss * milkPricePerL,
             reason: m.milkForecast.reason
          });
       }

       if (m.riskLevel === 'CRITICAL' || m.riskLevel === 'HIGH') highRiskCount++;
       if (m.netContribution > 0 && m.trend === 'STRONG ↑') strongContributorsCount++;
    });

    farmForecast.days7.profit = farmForecast.days7.revenue - farmForecast.days7.expenses;
    farmForecast.days30.profit = farmForecast.days30.revenue - farmForecast.days30.expenses;
    farmForecast.days90.profit = farmForecast.days90.revenue - farmForecast.days90.expenses;

    // Intelligence Summary (Dynamically generated to match specific user request)
    const isProfitable = netProfit > 0;
    const prodStability = projected30DayLossYield > 50 ? 'declining due to upcoming dry-offs' : 'stable across the herd';
    const monitorText = monitorCount > 0 ? `${monitorCount} animal(s) require monitoring.` : 'No animals require monitoring.';
    const vetText = vetReviewCount > 0 ? `${vetReviewCount} critical veterinary alerts are currently active.` : 'No critical veterinary alerts are currently active.';
    
    let intelligenceSummary = `Your farm is currently operating ${isProfitable ? 'profitably' : 'at a loss'}.\n\n`;
    intelligenceSummary += `Milk production is ${prodStability}.\n`;
    intelligenceSummary += `${monitorText}\n`;
    intelligenceSummary += `${vetText}\n\n`;
    intelligenceSummary += `Estimated 30-day net profit:\n₹${Math.round(netProfit).toLocaleString('en-IN')}`;

    // Priority Actions (Sort alerts by severity)
    const priorityMap = { 'Critical': 4, 'Warning': 3, 'High': 2, 'Medium': 1, 'Info': 0 };
    const priorityActions = alerts.sort((a, b) => (priorityMap[b.severity] || 0) - (priorityMap[a.severity] || 0));

    res.json({
      portfolio: {
        totalAnimals: animals.length,
        totalAssetValue,
        monthlyRevenue,
        monthlyExpenses,
        netProfit,
        portfolioHealth,
        avgProfitPerAnimal: animals.length > 0 ? netProfit / animals.length : 0,
        financialKPIs,
        distribution: {
          retain: retainCount,
          monitor: monitorCount,
          lifecycleReview: saleConsiderationCount,
          vetReview: vetReviewCount
        }
      },
      farmForecast,
      intelligenceSummary,
      priorityActions,
      productionLossPredictions,
      animalAssets
    });

  } catch (error) {
    console.error('Error fetching asset dashboard:', error);
    res.status(500).json({ message: 'Server error fetching asset dashboard' });
  }
});

module.exports = router;
