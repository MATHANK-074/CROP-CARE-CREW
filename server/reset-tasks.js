/**
 * Utility script to reset today's task generation for testing
 * This will delete today's tasks and generation tracker so new enhanced tasks can be generated
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Task = require('./models/Task');

async function resetTodaysTasks() {
  try {
    console.log('🔄 Resetting today\'s tasks for testing...\n');

    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agritech';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('📅 Target date:', today.toDateString());

    // Find all tasks for today (both individual tasks and generation trackers)
    const todaysTasks = await Task.find({
      $or: [
        { dueDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
        {
          generationType: 'daily_generation_tracker',
          'dailyGeneration.date': today
        }
      ]
    });

    console.log(`📋 Found ${todaysTasks.length} tasks to delete:`);
    todaysTasks.forEach(task => {
      console.log(`  - ${task.generationType}: ${task.title}`);
    });

    if (todaysTasks.length > 0) {
      // Delete all today's tasks
      const result = await Task.deleteMany({
        $or: [
          { dueDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
          {
            generationType: 'daily_generation_tracker',
            'dailyGeneration.date': today
          }
        ]
      });

      console.log(`\n✅ Deleted ${result.deletedCount} tasks/records`);
      console.log('🎉 Today\'s task generation has been reset!');
      console.log('💡 Next API call to /daily will generate new enhanced tasks');
    } else {
      console.log('\n💡 No tasks found for today - ready for fresh generation');
    }

  } catch (error) {
    console.error('❌ Error resetting tasks:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📪 Disconnected from MongoDB');
  }
}

resetTodaysTasks();