const mongoose = require('mongoose');
const User = require('../models/User');
const Livestock = require('../models/Livestock');
const MilkLog = require('../models/MilkLog');
const AnimalFeedRecord = require('../models/AnimalFeedRecord');
const MedicalRecord = require('../models/MedicalRecord');
const BreedingRecord = require('../models/BreedingRecord');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected for Seeding'))
  .catch(err => console.error(err));

const seedRealisticFarm = async () => {
    try {
        console.log("Starting to seed a realistic dairy farm with test animals...");
        
        // Find a test user or create one
        let testUser = await User.findOne({ email: 'farm_test@example.com' });
        if (!testUser) {
            testUser = new User({
                name: 'Test Farmer',
                email: 'farm_test@example.com',
                password: 'password123',
                role: 'farmer'
            });
            await testUser.save();
        }
        
        const userId = testUser._id;
        
        // Clear old test data for this user
        await Livestock.deleteMany({ user: userId });
        await MilkLog.deleteMany({ user: userId });
        await AnimalFeedRecord.deleteMany({ user: userId });
        await MedicalRecord.deleteMany({ user: userId });
        await BreedingRecord.deleteMany({ user: userId });

        console.log("Cleared old test data.");

        const animals = [];
        const today = new Date();

        // Helper to generate dates
        const daysAgo = (days) => new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

        // 1. High-Producing Young Cow (Expected: RETAIN)
        animals.push({
            tagId: 'COW-001-TEST', category: 'Cow', breed: 'Holstein', status: 'Milking',
            birthDate: daysAgo(365 * 3), buyingPrice: 60000, profile_img: ''
        });

        // 2. Old, Declining Milk, High Cost (Expected: CONSIDER SALE)
        animals.push({
            tagId: 'COW-002-TEST', category: 'Cow', breed: 'Jersey', status: 'Milking',
            birthDate: daysAgo(365 * 8), buyingPrice: 40000, profile_img: ''
        });

        // 3. Pregnant, Approaching Dry-Off (Expected: MONITOR / NORMAL DECLINE)
        animals.push({
            tagId: 'COW-003-TEST', category: 'Cow', breed: 'Holstein', status: 'Pregnant',
            birthDate: daysAgo(365 * 4), buyingPrice: 50000, profile_img: ''
        });

        // 4. Low Milk, High Medical Cost (Expected: VETERINARY REVIEW)
        animals.push({
            tagId: 'COW-004-TEST', category: 'Cow', breed: 'Jersey', status: 'Milking',
            birthDate: daysAgo(365 * 5), buyingPrice: 45000, profile_img: ''
        });

        // Insert Animals
        const insertedAnimals = await Livestock.insertMany(animals.map(a => ({ ...a, user: userId })));
        console.log(`Inserted ${insertedAnimals.length} animals.`);

        // Feed Logs, Milk Logs, Medical Logs for each
        for (let i = 0; i < insertedAnimals.length; i++) {
            const animal = insertedAnimals[i];
            
            // 30 days of data
            for (let d = 30; d >= 0; d--) {
                const recordDate = daysAgo(d);

                // Feed
                await new AnimalFeedRecord({
                    user: userId, livestock: animal._id, feedType: 'Mixed Ratio',
                    quantityKg: 15, cost: i === 1 ? 250 : 180, date: recordDate
                }).save();

                // Milk
                let yieldL = 0;
                if (i === 0) yieldL = 14; // High producing (28L/day)
                if (i === 1) yieldL = 6 - (d * 0.05); // Declining from 6L/session
                if (i === 2) yieldL = 8 - (d * 0.1); // Dropping due to dry-off
                if (i === 3) yieldL = 4; // Low producing

                if (animal.status !== 'Dry') {
                    // Morning
                    await new MilkLog({
                        user: userId, livestock: animal._id, session: 'Morning',
                        yieldLiters: yieldL, date: recordDate
                    }).save();
                    // Evening
                    await new MilkLog({
                        user: userId, livestock: animal._id, session: 'Evening',
                        yieldLiters: yieldL * 0.9, date: recordDate
                    }).save();
                }
            }

            // Specific Medical Records
            if (i === 3) {
                // High medical cost for COW-004
                await new MedicalRecord({
                    user: userId, livestock: animal._id, type: 'Treatment',
                    name: 'Mastitis Treatment', cost: 3500, date: daysAgo(5)
                }).save();
            }

            // Specific Breeding Records
            if (i === 2) {
                // Pregnant cow
                await new BreedingRecord({
                    user: userId, livestock: animal._id, eventType: 'Artificial Insemination',
                    eventDate: daysAgo(210), outcome: 'Confirmed Pregnant'
                }).save();
            }
        }

        console.log("Seeding complete! Farm simulation ready.");
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedRealisticFarm();
