const mongoose = require('mongoose');
const CropPrice = require('./models/CropPrice');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agritech';

const districts = ['Erode', 'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Thanjavur', 'Trichy', 'Tirunelveli', 'Karur', 'Vellore'];
const crops = [
  { name: 'tomato', basePrice: 2000, variance: 800 },
  { name: 'brinjal', basePrice: 2500, variance: 600 },
  { name: 'eggplant', basePrice: 2500, variance: 600 },
  { name: 'rice', basePrice: 4500, variance: 500 },
  { name: 'wheat', basePrice: 3200, variance: 400 },
  { name: 'maize', basePrice: 2100, variance: 300 },
  { name: 'cotton', basePrice: 7500, variance: 1000 },
  { name: 'onion', basePrice: 3500, variance: 1500 },
  { name: 'potato', basePrice: 1800, variance: 400 },
  { name: 'banana', basePrice: 1500, variance: 300 },
  { name: 'apple', basePrice: 8500, variance: 2000 }
];

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    let inserted = 0;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const district of districts) {
      for (const crop of crops) {
        // Generate random price based on base price and variance
        const priceToday = crop.basePrice + (Math.random() * crop.variance * 2 - crop.variance);
        const priceYesterday = priceToday + (Math.random() * 200 - 100);

        const marketName = `${district} Central Market`;

        // Today's record
        const recordToday = {
          crop_name: crop.name.toLowerCase(),
          city: district,
          state: 'Tamil Nadu',
          price: Math.round(priceToday),
          market: marketName,
          date: today
        };

        // Yesterday's record (so trend can be calculated)
        const recordYesterday = {
          crop_name: crop.name.toLowerCase(),
          city: district,
          state: 'Tamil Nadu',
          price: Math.round(priceYesterday),
          market: marketName,
          date: yesterday
        };

        // Upsert today
        await CropPrice.findOneAndUpdate(
          { crop_name: recordToday.crop_name, city: recordToday.city, date: { $gte: new Date(today.setHours(0,0,0,0)), $lte: new Date(today.setHours(23,59,59,999)) } },
          recordToday,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Upsert yesterday
        await CropPrice.findOneAndUpdate(
          { crop_name: recordYesterday.crop_name, city: recordYesterday.city, date: { $gte: new Date(yesterday.setHours(0,0,0,0)), $lte: new Date(yesterday.setHours(23,59,59,999)) } },
          recordYesterday,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        inserted += 2;
      }
    }
    
    console.log(`Successfully seeded/updated ${inserted} market price records!`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.disconnect();
  }
}

seedData();
