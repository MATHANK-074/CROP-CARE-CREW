const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/agritech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  try {
    const FeedConfiguration = require('./server/models/FeedConfiguration');
    const User = require('./server/models/User');

    const user = await User.findOne();
    if (!user) {
      console.log('No user found to test with.');
      process.exit(0);
    }
    
    // Simulate ensureDefaultConfigurations
    let configs = await FeedConfiguration.find({ user: user._id });
    const hasV2Config = configs.some(c => c.lifeStage === 'CALF');
    
    if (configs.length > 0 && !hasV2Config) {
      console.log('Detected V1 configs. Deleting...');
      await FeedConfiguration.deleteMany({ user: user._id });
      configs = [];
    }

    if (configs.length === 0) {
      console.log('Seeding V2 configs...');
      const defaultConfigs = [
        { user: user._id, lifeStage: 'CALF', feedType: 'Milk / Milk Replacer', baseQuantityKg: 4, goal: 'Growth' },
        { user: user._id, lifeStage: 'GROWING HEIFER', feedType: 'Green Fodder', baseQuantityKg: 10, goal: 'Growth' }
      ];
      await FeedConfiguration.insertMany(defaultConfigs);
      configs = await FeedConfiguration.find({ user: user._id });
    }
    
    console.log(`Total configs for user: ${configs.length}`);
    const hasCalf = configs.some(c => c.lifeStage === 'CALF');
    console.log(`Has CALF (V2) config: ${hasCalf}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
