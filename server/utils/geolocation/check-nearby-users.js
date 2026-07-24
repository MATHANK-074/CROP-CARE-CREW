const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

async function checkUsersNearLocation() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/agritech';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Test location from your recent test
    const testLocation = {
      type: 'Point',
      coordinates: [80.1234, 13.987] // From your PowerShell test
    };

    console.log('Checking for users near location:', testLocation.coordinates);
    console.log('Search radius: 10km\n');

    // Find users near the test location (same query as disease.js)
    const usersNearby = await User.find({
      location: {
        $near: {
          $geometry: testLocation,
          $maxDistance: 10000 // 10km
        }
      }
    });

    console.log(`Found ${usersNearby.length} users within 10km of the reported location:`);

    if (usersNearby.length === 0) {
      console.log('❌ NO USERS FOUND NEARBY - This is why no emails are sent!\n');

      // Check if any users have locations at all
      const usersWithLocation = await User.find({
        location: { $exists: true, $ne: null }
      }).select('name email location');

      console.log(`Total users with location data: ${usersWithLocation.length}`);

      if (usersWithLocation.length > 0) {
        console.log('Users with location data:');
        usersWithLocation.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name || 'Unnamed'} (${user.email}) - [${user.location?.coordinates?.[0] || 'N/A'}, ${user.location?.coordinates?.[1] || 'N/A'}]`);
        });

        console.log('\n💡 SOLUTION: Try reporting disease at one of these user locations');
        console.log('Or increase the search radius in disease.js');
      } else {
        console.log('❌ No users have location data set');
        console.log('💡 SOLUTION: Users need to set their location in their profile');
      }
    } else {
      console.log('✅ Users found who should receive emails:');
      usersNearby.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Unnamed'} (${user.email})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkUsersNearLocation();