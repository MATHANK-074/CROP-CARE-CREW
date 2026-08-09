const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Livestock = require('../models/Livestock');
const BreedingRecord = require('../models/BreedingRecord');
const MedicalRecord = require('../models/MedicalRecord');

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
    const calves = allLivestock.filter(a => a.category === 'Calf').length;

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
        calves
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
    const { tagId, category, breed, birthDate, ageString, buyingPrice, gender, status, weight, expectedDeliveryDate, notes } = req.body;
    
    const newAnimal = new Livestock({
      user: req.user.id,
      tagId, category, breed, birthDate, ageString, buyingPrice, gender, status, weight, notes
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

module.exports = router;
