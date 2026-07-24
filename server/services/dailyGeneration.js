const Task = require('../models/Task');
const Crop = require('../models/Crop');
const Activity = require('../models/Activity');

// Helper used by both route and testing endpoint
async function generateDailyTasksForCrop(crop, today, dayOfWeek, maxTasksPerDay = 5) {
  const tasks = [];
  const cropName = crop.name || crop.cropName;
  const userId = crop.user;

  console.log(`Generating daily tasks for ${cropName} (max: ${maxTasksPerDay} tasks)`);

  // Get recent activities for this crop (last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivities = await Activity.find({
    crop: crop._id,
    user: userId,
    date: { $gte: thirtyDaysAgo }
  }).sort({ date: -1 });

  const getLastActivityOfType = (activityType) => {
    return recentActivities.find(activity =>
      activity.activityType === activityType ||
      activity.title.toLowerCase().includes(activityType.toLowerCase())
    );
  };

  const wasRecentlyDone = (activityType, daysThreshold = 7) => {
    const lastActivity = getLastActivityOfType(activityType);
    if (!lastActivity) return false;
    const daysSince = Math.floor((today - lastActivity.date) / (1000 * 60 * 60 * 24));
    return daysSince <= daysThreshold;
  };

  // Precompute crop age for reuse
  const plantingDate = crop.plantingDate ? new Date(crop.plantingDate) : null;
  const cropAge = plantingDate ? Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24)) : 0;

  // 1) Irrigation recommendation
  if (crop.status === 'Growing') {
    const lastWateringActivity = getLastActivityOfType('watering') ||
      getLastActivityOfType('irrigation') ||
      recentActivities.find(a => a.title.toLowerCase().includes('water'));

    const lastWatered = lastWateringActivity ? lastWateringActivity.date :
      (crop.lastIrrigation ? new Date(crop.lastIrrigation) : null);

    const daysSinceWater = lastWatered
      ? Math.floor((today - lastWatered) / (1000 * 60 * 60 * 24))
      : 5;

    let waterInterval = 2;
    let waterAdvice = '';

    if (cropName.toLowerCase().includes('rice') || cropName.toLowerCase().includes('paddy')) {
      waterInterval = 1;
      waterAdvice = 'Keep water level 2-3 inches above soil. Rice requires constant moisture.';
    } else if (cropName.toLowerCase().includes('wheat') || cropName.toLowerCase().includes('corn') ||
      cropName.toLowerCase().includes('maize')) {
      waterInterval = 3;
      waterAdvice = 'Deep watering is better than frequent shallow watering for grain crops.';
    } else if (cropName.toLowerCase().includes('tomato') || cropName.toLowerCase().includes('pepper')) {
      waterInterval = 2;
      waterAdvice = 'Water at soil level to avoid wetting leaves and preventing disease.';
    } else if (cropName.toLowerCase().includes('lettuce') || cropName.toLowerCase().includes('spinach')) {
      waterInterval = 1;
      waterAdvice = 'Leafy greens need consistent moisture but avoid waterlogging.';
    } else {
      waterAdvice = 'Check soil moisture 2 inches deep - water if dry to touch.';
    }

    if (daysSinceWater >= waterInterval) {
      const urgency = daysSinceWater > waterInterval + 2 ? 'URGENT' : '';
      const lastWaterInfo = lastWateringActivity ?
        `Last watered on ${lastWateringActivity.date.toLocaleDateString()} (${daysSinceWater} days ago)` :
        `No recent watering recorded (${daysSinceWater} days since last irrigation)`;

      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `${urgency ? urgency + ' - ' : ''}Water ${cropName}`,
        description: `🚿 IRRIGATION NEEDED\n\n📅 ${lastWaterInfo}\n\n💡 ${waterAdvice}\n\n🔍 Check: Soil moisture at root level, leaf drooping, and weather forecast before watering.`,
        category: 'irrigation',
        priority: daysSinceWater > waterInterval + 2 ? 'high' : 'medium',
        dueDate: today,
        images: [], resources: [], feedback: {},
        source: 'system_generated',
        generationFactors: { cropStage: crop.status, weather: { daysSinceWater } }
      });
    }

    // 2) Fertilization

    const lastFertilizing = getLastActivityOfType('fertiliz');
    const daysSinceFertilizer = lastFertilizing ?
      Math.floor((today - lastFertilizing.date) / (1000 * 60 * 60 * 24)) : 999;

    if (cropAge > 0) {
      let shouldFertilize = false;
      let fertilizerType = '';
      let fertilizerReason = '';

      if ((cropAge === 21 || (cropAge >= 18 && cropAge <= 24)) && daysSinceFertilizer > 14) {
        shouldFertilize = true;
        fertilizerType = 'Nitrogen-rich fertilizer (21-0-0 or similar)';
        fertilizerReason = '3-week stage: Focus on leaf and stem development';
      } else if ((cropAge === 45 || (cropAge >= 42 && cropAge <= 48)) && daysSinceFertilizer > 20) {
        shouldFertilize = true;
        fertilizerType = 'Balanced NPK fertilizer (10-10-10)';
        fertilizerReason = '6-week stage: Support overall growth and prepare for flowering';
      } else if ((cropAge === 70 || (cropAge >= 67 && cropAge <= 73)) && daysSinceFertilizer > 25) {
        shouldFertilize = true;
        fertilizerType = 'Phosphorus-potassium fertilizer (0-20-20)';
        fertilizerReason = '10-week stage: Promote flowering and fruit development';
      }

      if (shouldFertilize) {
        const lastFertInfo = lastFertilizing ?
          `Last fertilized on ${lastFertilizing.date.toLocaleDateString()} (${daysSinceFertilizer} days ago)` :
          'No recent fertilization recorded';

        tasks.push({
          crop: crop._id,
          user: crop.user,
          title: `Apply fertilizer to ${cropName}`,
          description: `🌱 FERTILIZATION SCHEDULED\n\n📅 Crop age: ${cropAge} days old\n📊 ${lastFertInfo}\n\n💡 Recommended: ${fertilizerType}\n🎯 Purpose: ${fertilizerReason}\n\n📋 Apply early morning or evening, water lightly after application.`,
          category: 'fertilization',
          priority: 'medium',
          dueDate: today,
          images: [], resources: [], feedback: {},
          source: 'system_generated',
          generationFactors: { cropStage: `${cropAge} days old`, weather: { daysSinceFertilizer } }
        });
      }
    }

    // 3) Pest inspection
    if (dayOfWeek === 1 || !wasRecentlyDone('inspection', 7)) {
      const lastInspection = getLastActivityOfType('inspection');
      const inspectionInfo = lastInspection ?
        `Last inspection: ${lastInspection.date.toLocaleDateString()}` :
        'No recent inspection recorded';

      let pestConcerns = '';
      if (cropName.toLowerCase().includes('tomato')) {
        pestConcerns = '🐛 Watch for: Hornworms, aphids, whiteflies\n🍄 Disease: Blight, fusarium wilt';
      } else if (cropName.toLowerCase().includes('corn') || cropName.toLowerCase().includes('maize')) {
        pestConcerns = '🐛 Watch for: Corn borers, armyworms, cutworms\n🍄 Disease: Corn smut, leaf blight';
      } else if (cropName.toLowerCase().includes('rice')) {
        pestConcerns = '🐛 Watch for: Brown planthopper, rice bugs\n🍄 Disease: Blast, bacterial leaf blight';
      } else {
        pestConcerns = '🐛 Watch for: Aphids, spider mites, caterpillars\n🍄 Disease: Fungal spots, wilting';
      }

      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `Weekly pest inspection - ${cropName}`,
        description: `🔍 PEST & DISEASE INSPECTION\n\n📅 ${inspectionInfo}\n\n${pestConcerns}\n\n📋 Check: Top and bottom of leaves, stems, soil around base\n📸 Take photos of any issues for identification`,
        category: 'pest_control',
        priority: 'medium',
        dueDate: today,
        images: [], resources: [], feedback: {},
        source: 'system_generated'
      });
    }

    // 4) Harvest preparation
    const harvestDate = crop.harvestDate ? new Date(crop.harvestDate) : null;
    if (harvestDate) {
      const daysToHarvest = Math.floor((harvestDate - today) / (1000 * 60 * 60 * 24));
      if (daysToHarvest <= 7 && daysToHarvest > 0) {
        const lastHarvestPrep = recentActivities.find(a =>
          a.title.toLowerCase().includes('harvest') ||
          a.title.toLowerCase().includes('tool') ||
          a.title.toLowerCase().includes('prepare')
        );

        const prepInfo = lastHarvestPrep ?
          `Previous prep: ${lastHarvestPrep.date.toLocaleDateString()}` :
          'No harvest preparation recorded';

        tasks.push({
          crop: crop._id,
          user: crop.user,
          title: `🚨 Prepare for ${cropName} harvest`,
          description: `🌾 HARVEST PREPARATION\n\n⏰ Harvest scheduled in ${daysToHarvest} days\n📅 ${prepInfo}\n\n✅ Tasks:\n• Check crop maturity indicators\n• Clean and sharpen harvesting tools\n• Prepare storage containers\n• Check weather forecast\n• Plan harvesting schedule\n\n💡 Early morning harvest often gives best quality.`,
          category: 'harvesting',
          priority: 'high',
          dueDate: today,
          images: [], resources: [], feedback: {},
          source: 'system_generated',
          generationFactors: { weather: { daysToHarvest } }
        });
      }
    }

    // 5) Weeding based on maintenance history or schedule
    const lastWeeding = getLastActivityOfType('maintenance') ||
      recentActivities.find(a => a.title.toLowerCase().includes('weed'));
    const daysSinceWeeding = lastWeeding ?
      Math.floor((today - lastWeeding.date) / (1000 * 60 * 60 * 24)) : 999;

    if ((cropAge > 0 && cropAge % 14 === 0) || daysSinceWeeding > 14) {
      const weedingInfo = lastWeeding ?
        `Last weeding: ${lastWeeding.date.toLocaleDateString()} (${daysSinceWeeding} days ago)` :
        'No recent weeding activity recorded';

      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `Remove weeds around ${cropName}`,
        description: `🌿 WEED MANAGEMENT\n\n📅 ${weedingInfo}\n\n🎯 Why: Weeds compete for nutrients, water, and sunlight\n\n📋 Method:\n• Hand-pull small weeds when soil is moist\n• Use hoe for larger areas\n• Mulch after weeding to prevent regrowth\n\n⏰ Best time: After watering or rain when soil is soft`,
        category: 'soil_management',
        priority: 'medium',
        dueDate: today,
        images: [], resources: [], feedback: {},
        source: 'system_generated',
        generationFactors: { weather: { daysSinceWeeding } }
      });
    }
  }

  // 6) Planning phase soil preparation
  if (crop.status === 'Planning') {
    const lastSoilPrep = recentActivities.find(a => a.title.toLowerCase().includes('soil') || a.title.toLowerCase().includes('till'))
      || recentActivities.find(a => a.activityType === 'maintenance');

    const prepInfo = lastSoilPrep ? `Previous soil work: ${lastSoilPrep.date.toLocaleDateString()}` : 'No recent soil preparation recorded';

    let soilAdvice = '';
    if (cropName.toLowerCase().includes('tomato') || cropName.toLowerCase().includes('pepper')) {
      soilAdvice = '🎯 Target: Well-draining, pH 6.0-6.8, rich in organic matter';
    } else if (cropName.toLowerCase().includes('rice')) {
      soilAdvice = '🎯 Target: Clay-loam soil, can hold water, pH 6.0-7.0';
    } else if (cropName.toLowerCase().includes('corn') || cropName.toLowerCase().includes('wheat')) {
      soilAdvice = '🎯 Target: Deep, fertile soil with good drainage, pH 6.0-7.0';
    } else {
      soilAdvice = '🎯 Target: Well-draining soil rich in organic matter';
    }

    tasks.push({
      crop: crop._id,
      user: crop.user,
      title: `Prepare field for ${cropName}`,
      description: `🚜 FIELD PREPARATION\n\n📅 ${prepInfo}\n\n${soilAdvice}\n\n📋 Steps:\n• Clear weeds and debris\n• Till soil 6-8 inches deep\n• Add compost or aged manure\n• Level the field\n• Test soil pH if possible\n\n💡 Let soil settle for 1-2 weeks before planting`,
      category: 'soil_management',
      priority: 'medium',
      dueDate: today,
      images: [], resources: [], feedback: {},
      source: 'system_generated',
      generationFactors: { cropStage: 'Planning phase' }
    });
  }

  // Limit tasks to maximum specified (default 5, previously was 3)
  const limitedTasks = tasks.slice(0, maxTasksPerDay);
  console.log(`Generated ${tasks.length} potential tasks, limited to ${limitedTasks.length} for ${cropName}`);

  return limitedTasks;
}

async function ensureDailyTasksForUser(userId, maxTasksPerDay = 5) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log(`Ensuring daily tasks for user ${userId} (max: ${maxTasksPerDay} per crop)`);

  const existing = await Task.getTodaysGeneration(userId);
  if (existing && existing.status === 'done') {
    const tasks = await Task.find({ _id: { $in: existing.dailyGeneration.taskIds }, status: 'pending' })
      .populate('crop', 'name variety status')
      .sort({ priority: -1 });
    return { success: true, tasks, generated: false, generatedAt: existing.createdAt, totalGenerated: existing.dailyGeneration.tasksGenerated, completionPercentage: existing.completionPercentage };
  }

  // Not generated; generate now
  const crops = await Crop.find({ user: userId, status: { $in: ['Growing', 'Planning'] } });
  if (crops.length === 0) {
    return { success: true, tasks: [], generated: false, message: 'No active crops found for task generation' };
  }

  const tasks = [];
  const taskIds = [];
  const cropsProcessed = [];
  const dayOfWeek = today.getDay();

  for (const crop of crops) {
    const cropTasks = await generateDailyTasksForCrop(crop, today, dayOfWeek, maxTasksPerDay);
    if (cropTasks.length > 0) {
      const savedTasks = await Task.insertMany(cropTasks);
      tasks.push(...savedTasks);
      taskIds.push(...savedTasks.map(t => t._id));
      cropsProcessed.push({ cropId: crop._id, cropName: crop.name, tasksCreated: cropTasks.length });
    }
  }

  const tracker = new Task({
    user: userId,
    title: `Daily Generation - ${today.toDateString()}`,
    description: `Daily task generation tracking record`,
    category: 'general',
    dueDate: today,
    status: 'done',
    generationType: 'daily_generation_tracker',
    dailyGeneration: {
      date: today,
      tasksGenerated: tasks.length,
      taskIds,
      cropsProcessed,
      totalTasks: tasks.length,
      completedTasks: 0
    }
  });
  await tracker.save();

  const populatedTasks = await Task.find({ _id: { $in: taskIds } })
    .populate('crop', 'name variety status')
    .sort({ priority: -1 });

  return { success: true, tasks: populatedTasks, generated: true, generatedAt: new Date(), totalGenerated: tasks.length, cropsProcessed: cropsProcessed.length };
}

module.exports = { generateDailyTasksForCrop, ensureDailyTasksForUser };
