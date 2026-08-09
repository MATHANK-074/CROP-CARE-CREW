const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Livestock = require('../models/Livestock');
const BreedingRecord = require('../models/BreedingRecord');
const Notification = require('../models/Notification');

// GET /api/reproductive/insights - Get AI Reproductive Insights
router.get('/insights', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();

    // 1. Fetch all livestock (cows & buffaloes)
    const livestock = await Livestock.find({ 
      user: userId, 
      category: { $in: ['Cow', 'Buffalo', 'Heifer'] } 
    }).lean();

    // 2. Fetch all breeding records
    const breedingRecords = await BreedingRecord.find({ user: userId }).sort({ eventDate: -1 }).lean();

    // Prepare insights structure
    const insights = {
      summaryStats: {
        totalCows: livestock.length,
        pregnant: 0,
        possibleHeat: 0,
        breedingAttention: 0,
        pregnancyCheckDue: 0,
        notPregnant: 0,
        repeatedFailure: 0,
        insufficientData: 0
      },
      cowInsights: [],
      calendarEvents: []
    };

    const newNotifications = [];

    // Analyze each cow
    for (const cow of livestock) {
      // Get records for this cow
      const cowRecords = breedingRecords.filter(r => r.livestock.toString() === cow._id.toString());
      const latestRecord = cowRecords.length > 0 ? cowRecords[0] : null;

      let status = 'Insufficient Data';
      let heatProbability = 0;
      let action = 'Ensure data is recorded';
      let aiAttemptsCount = 0;
      let lastHeatDate = null;
      let isPregnant = cow.status === 'Pregnant'; // Fallback to basic status

      if (cowRecords.length > 0) {
        // Count consecutive failed AI attempts
        for (let i = 0; i < cowRecords.length; i++) {
          if (cowRecords[i].eventType === 'Artificial Insemination') {
            if (cowRecords[i].outcome === 'Failed') aiAttemptsCount++;
            else break; // Stop counting if we hit a success/pending
          }
        }

        // Find last heat observation or calving
        const lastHeat = cowRecords.find(r => r.eventType === 'Heat Observation');
        const lastCalving = cowRecords.find(r => r.outcome === 'Delivered Calf');
        if (lastHeat) lastHeatDate = lastHeat.eventDate;

        // Determine Status based on latest record
        if (latestRecord.outcome === 'Confirmed Pregnant') {
          status = 'Pregnant';
          isPregnant = true;
          action = 'Monitor for healthy gestation';
          insights.summaryStats.pregnant++;
          
          if (latestRecord.expectedDeliveryDate) {
             insights.calendarEvents.push({
                date: latestRecord.expectedDeliveryDate,
                type: 'calving',
                cowTag: cow.tagId
             });
             // Calving Reminder (14 days before)
             const daysToCalving = (new Date(latestRecord.expectedDeliveryDate) - today) / (1000 * 60 * 60 * 24);
             if (daysToCalving > 0 && daysToCalving <= 14) {
               newNotifications.push({ title: 'Calving Reminder', message: `Estimated calving period for Cow ${cow.tagId} is approaching.`, type: 'Calving Reminder', priority: 'Attention Required', cowId: cow._id });
             }
          }
        } 
        else if (latestRecord.outcome === 'Pending' && (latestRecord.eventType === 'Artificial Insemination' || latestRecord.eventType === 'Natural Mating')) {
          const daysSinceAI = (today - new Date(latestRecord.eventDate)) / (1000 * 60 * 60 * 24);
          if (daysSinceAI >= 35) {
            status = 'Pregnancy Confirmation Pending';
            action = 'Pregnancy check is due';
            insights.summaryStats.pregnancyCheckDue++;
            
            insights.calendarEvents.push({
               date: today, // Due now
               type: 'pregnancy_check',
               cowTag: cow.tagId
            });

            newNotifications.push({ title: 'Pregnancy Alert', message: `Pregnancy confirmation for Cow ${cow.tagId} is due.`, type: 'Pregnancy Alert', priority: 'Attention Required', cowId: cow._id });
          } else {
            status = 'AI Pending Review';
            action = `Wait for pregnancy check (${Math.round(35 - daysSinceAI)} days left)`;
          }
        }
        else if (aiAttemptsCount >= 3) {
          status = 'Repeated Conception Failure';
          action = 'Veterinary examination/follow-up recommended.';
          insights.summaryStats.repeatedFailure++;
          newNotifications.push({ title: 'Follow-up Alert', message: `Cow ${cow.tagId} has repeated unsuccessful AI attempts.`, type: 'Follow-up Alert', priority: 'High Priority', cowId: cow._id });
        }
        else {
          // Heat Prediction Logic
          let daysSinceRelevantEvent = 0;
          if (latestRecord.nextHeatPredictionDate) {
             const heatPredictDate = new Date(latestRecord.nextHeatPredictionDate);
             const daysDiff = (heatPredictDate - today) / (1000 * 60 * 60 * 24);
             
             if (Math.abs(daysDiff) <= 4) {
               heatProbability = Math.abs(daysDiff) <= 2 ? 87 : 75; // Peak around prediction
             }
          } else if (lastHeatDate) {
             const daysSinceLastHeat = (today - new Date(lastHeatDate)) / (1000 * 60 * 60 * 24);
             // 21 day cycle
             const cycleDay = daysSinceLastHeat % 21;
             if (cycleDay >= 19 || cycleDay <= 2) {
                heatProbability = cycleDay === 20 || cycleDay === 0 ? 92 : 80;
             }
          }

          if (heatProbability >= 75) {
            status = 'Possible Heat';
            action = 'Veterinary/AI evaluation recommended';
            insights.summaryStats.possibleHeat++;
            insights.summaryStats.breedingAttention++;
            
            insights.calendarEvents.push({
               date: today, 
               type: 'heat',
               cowTag: cow.tagId
            });

            newNotifications.push({ title: 'Heat Alert', message: `Cow ${cow.tagId} has a high likelihood of heat.`, type: 'Heat Alert', priority: 'High Priority', cowId: cow._id });
          } else {
            status = 'Not Pregnant';
            action = 'Monitor for heat signs';
            insights.summaryStats.notPregnant++;
          }
        }
      } else {
        insights.summaryStats.insufficientData++;
      }

      insights.cowInsights.push({
        cow,
        status,
        heatProbability,
        action,
        aiAttempts: aiAttemptsCount,
        lastHeat: lastHeatDate,
        latestRecord
      });
    }

    // Save newly generated notifications (prevent spamming by checking recent duplicates)
    for (const n of newNotifications) {
      const exists = await Notification.findOne({
        user: userId,
        relatedLivestock: n.cowId,
        type: n.type,
        createdAt: { $gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) } // past 24 hours
      });

      if (!exists) {
        await Notification.create({
          user: userId,
          title: n.title,
          message: n.message,
          type: n.type,
          priority: n.priority,
          relatedLivestock: n.cowId
        });
      }
    }

    res.json(insights);
  } catch (error) {
    console.error('Error generating AI reproductive insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reproductive/notifications - Get user notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
                                          .sort({ createdAt: -1 })
                                          .populate('relatedLivestock', 'tagId')
                                          .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reproductive/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reproductive/notifications/:id/review - Mark notification as reviewed
router.put('/notifications/:id/review', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { reviewed: true, read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
