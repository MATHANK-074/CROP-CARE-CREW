const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Livestock = require('./models/Livestock');
const MilkLog = require('./models/MilkLog');
const AnimalFeedRecord = require('./models/AnimalFeedRecord');
const MedicalRecord = require('./models/MedicalRecord');
const BreedingRecord = require('./models/BreedingRecord');

async function checkStats() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cropcarecrew', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const numAnimals = await Livestock.countDocuments();
    const numMilk = await MilkLog.countDocuments();
    const numFeed = await AnimalFeedRecord.countDocuments();
    const numMedical = await MedicalRecord.countDocuments();
    const numBreeding = await BreedingRecord.countDocuments();
    
    let oldestMilk = await MilkLog.findOne().sort({ date: 1 });
    let newestMilk = await MilkLog.findOne().sort({ date: -1 });
    
    console.log(`Animals: ${numAnimals}`);
    console.log(`Milk Records: ${numMilk}`);
    console.log(`Feed Records: ${numFeed}`);
    console.log(`Medical Records: ${numMedical}`);
    console.log(`Breeding Records: ${numBreeding}`);
    
    if (oldestMilk && newestMilk) {
      console.log(`Milk Time Coverage: ${oldestMilk.date} to ${newestMilk.date}`);
    }

    const animals = await Livestock.find();
    let missingBirth = 0;
    let missingWeight = 0;
    
    animals.forEach(a => {
      if (!a.birthDate) missingBirth++;
      if (!a.weight || a.weight === 0) missingWeight++;
    });
    
    console.log(`Missing Birth Date: ${missingBirth}/${numAnimals} (${((missingBirth/(numAnimals||1))*100).toFixed(2)}%)`);
    console.log(`Missing Weight: ${missingWeight}/${numAnimals} (${((missingWeight/(numAnimals||1))*100).toFixed(2)}%)`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkStats();
