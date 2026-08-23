const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const axios = require('axios');

const Livestock = require('../models/Livestock');
const MilkLog = require('../models/MilkLog');
const AnimalFeedRecord = require('../models/AnimalFeedRecord');
const MedicalRecord = require('../models/MedicalRecord');
const BreedingRecord = require('../models/BreedingRecord');

// ML Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const READINESS_THRESHOLDS = {
  NOT_TRAINABLE: 49,
  EXPERIMENTAL: 199,
  PRODUCTION: 200
};

/**
 * Phase 6A: Data Readiness Engine
 * @route   GET api/ml/readiness
 * @desc    Evaluate data readiness gates
 * @access  Private
 */
router.get('/readiness', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const numAnimals = await Livestock.countDocuments({ user: userId });
    const numMilkRecords = await MilkLog.countDocuments({ user: userId });
    
    // Evaluate sequential continuity / usability (naive estimation for dashboard)
    const usableObservations = numMilkRecords; 
    
    let mlStatus = 'NOT READY';
    let required = READINESS_THRESHOLDS.NOT_TRAINABLE + 1;
    let reason = `Only ${usableObservations} sequential milk observations available.`;

    if (usableObservations > READINESS_THRESHOLDS.NOT_TRAINABLE && usableObservations <= READINESS_THRESHOLDS.EXPERIMENTAL) {
      mlStatus = 'EXPERIMENTAL ML';
      required = READINESS_THRESHOLDS.PRODUCTION;
      reason = 'Sufficient data for experimental training, but not for production deployment.';
    } else if (usableObservations > READINESS_THRESHOLDS.EXPERIMENTAL) {
      mlStatus = 'PRODUCTION CANDIDATE';
      required = 0;
      reason = 'Data thresholds met for production validation.';
    }

    res.json({
      ml_status: mlStatus,
      animals: numAnimals,
      milk_records: numMilkRecords,
      usable_observations: usableObservations,
      reason,
      required_for_next_gate: required
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

/**
 * Phase 6B & 6C: Leakage-Free Temporal Feature Extraction & Dataset Builder
 * @route   GET api/ml/dataset
 * @desc    Assemble temporal features for ML training
 * @access  Private
 */
router.get('/dataset', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const milkLogs = await MilkLog.find({ user: userId }).sort({ livestock: 1, date: 1 });
    
    const dataset = [];
    
    // Group logs by animal to calculate rolling temporal features
    const animalLogsMap = {};
    for (const log of milkLogs) {
      const aId = log.livestock.toString();
      if (!animalLogsMap[aId]) animalLogsMap[aId] = [];
      animalLogsMap[aId].push(log);
    }
    
    for (const aId in animalLogsMap) {
      const logs = animalLogsMap[aId];
      const animal = await Livestock.findById(aId);
      if (!animal) continue;
      
      const birthDate = animal.birthDate ? new Date(animal.birthDate) : null;
      
      for (let i = 0; i < logs.length - 1; i++) {
        // Temporal features available AT TIME OF i
        const currentLog = logs[i];
        const nextLog = logs[i + 1]; // TARGET: genuine next sequential record
        
        // Calculate rolling averages up to i
        const history = logs.slice(0, i + 1);
        
        let sum7 = 0; let count7 = 0;
        let sum30 = 0; let count30 = 0;
        const currentDate = new Date(currentLog.date);
        
        for (const past of history) {
          const daysDiff = (currentDate - new Date(past.date)) / (1000 * 3600 * 24);
          if (daysDiff <= 7) { sum7 += past.yieldLiters; count7++; }
          if (daysDiff <= 30) { sum30 += past.yieldLiters; count30++; }
        }
        
        const avg7 = count7 > 0 ? sum7 / count7 : currentLog.yieldLiters;
        const avg30 = count30 > 0 ? sum30 / count30 : currentLog.yieldLiters;
        
        const ageDays = birthDate ? Math.floor((currentDate - birthDate) / (1000 * 3600 * 24)) : 0;
        
        dataset.push({
          animal_id: aId,
          date: currentLog.date,
          age_days: ageDays,
          category: animal.category,
          status: animal.status,
          current_yield: currentLog.yieldLiters,
          avg_7d: avg7,
          avg_30d: avg30,
          target_next_yield: nextLog.yieldLiters // Genuine target
        });
      }
    }
    
    res.json(dataset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

/**
 * Phase 6I, 6J, 6K: Prediction API & Fallback Engine
 * @route   GET api/ml/predict/:animalId
 * @desc    Predict next-day milk yield (Fallback or ML)
 * @access  Private
 */
router.get('/predict/:animalId', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const animalId = req.params.animalId;
    
    const animal = await Livestock.findOne({ _id: animalId, user: userId });
    if (!animal) return res.status(404).json({ msg: 'Animal not found' });
    
    // Extract features for prediction
    const logs = await MilkLog.find({ livestock: animalId }).sort({ date: -1 }).limit(30);
    const currentYield = logs.length > 0 ? logs[0].yieldLiters : 0;
    
    // Rule-Based Estimate (Heuristic Fallback)
    const ruleBasedPrediction = currentYield > 0 ? currentYield * 0.98 : 0; // naive slight drop heuristic
    
    let useML = false;
    let mlResponse = null;
    
    // Attempt to call Python ML service
    try {
      // Check total data readiness for user to decide if ML should even be asked
      const numMilkRecords = await MilkLog.countDocuments({ user: userId });
      if (numMilkRecords >= READINESS_THRESHOLDS.PRODUCTION) {
        // Prepare feature vector
        const featureVector = {
          age_days: animal.birthDate ? Math.floor((new Date() - new Date(animal.birthDate)) / (1000 * 3600 * 24)) : 0,
          current_yield: currentYield,
          // (Other features would be calculated here)
        };
        
        const pyRes = await axios.post(`${ML_SERVICE_URL}/predict`, featureVector, { timeout: 3000 });
        if (pyRes.data && pyRes.data.status === 'PRODUCTION') {
          useML = true;
          mlResponse = pyRes.data;
        }
      }
    } catch (mlErr) {
      // Service unavailable, timeout, or model not ready
      console.log('ML Service unavailable or returned error, falling back to heuristic');
    }
    
    if (useML && mlResponse) {
      return res.json({
        prediction: mlResponse.prediction,
        model_name: mlResponse.model_name,
        model_version: mlResponse.model_version,
        training_dataset_size: mlResponse.training_dataset_size,
        validation_metric: mlResponse.validation_metric,
        baseline_metric: mlResponse.baseline_metric,
        confidence: mlResponse.confidence,
        timestamp: new Date().toISOString(),
        explanation: mlResponse.explanation,
        type: 'AI Prediction'
      });
    } else {
      return res.json({
        prediction: ruleBasedPrediction.toFixed(2),
        model_name: 'Rule-Based Heuristic',
        model_version: '1.0',
        training_dataset_size: 0,
        validation_metric: 'N/A',
        baseline_metric: 'N/A',
        confidence: 'Low',
        timestamp: new Date().toISOString(),
        explanation: `Expected milk yield is ${ruleBasedPrediction.toFixed(2)} L. This is a Rule-Based Estimate due to insufficient data for ML.`,
        type: 'Rule-Based Estimate'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
