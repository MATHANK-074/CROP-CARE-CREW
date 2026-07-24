const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: function () {
      // Only required for individual tasks, not for daily generation trackers
      // Allow null for general tasks that aren't crop-specific
      return this.generationType !== 'daily_generation_tracker' &&
        this.category !== 'general';
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Task details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true,
    enum: ['irrigation', 'fertilization', 'pest_control', 'disease_treatment',
      'harvesting', 'planting', 'pruning', 'soil_management', 'weather_response', 'general']
  },

  // Timeframes
  dueDate: {
    type: Date,
    required: true
  },
  recommendedTimeframe: {
    start: Date,
    end: Date
  },
  // Optional images related to the task (e.g., reference images, attachments)
  images: {
    type: [String],
    default: []
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'done', 'skipped'],
    default: 'pending'
  },
  completedDate: {
    type: Date
  },

  // Source and generation details
  source: {
    type: String,
    enum: ['system_generated', 'weather_alert', 'disease_detection', 'growth_stage', 'user_created'],
    default: 'system_generated'
  },
  generationFactors: {
    weather: {
      conditions: String,
      temperature: Number,
      rainfall: Number
    },
    cropStage: String,
    diseaseRisk: {
      disease: String,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }
  },

  // Generation type - distinguishes individual tasks from daily generation tracking records
  generationType: {
    type: String,
    enum: ['individual_task', 'daily_generation_tracker'],
    default: 'individual_task'
  },

  // Daily generation tracking fields (only used when generationType = 'daily_generation_tracker')
  dailyGeneration: {
    // Generation date (normalized to start of day)
    date: {
      type: Date,
      set: function (date) {
        if (!date) return date;
        const d = new Date(date);
        d.setHours(0, 0, 0, 0); // Set to start of day
        return d;
      }
    },

    // Generated tasks count and IDs
    tasksGenerated: {
      type: Number,
      default: 0
    },
    taskIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }],

    // Generation context
    cropsProcessed: [{
      cropId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
      },
      cropName: String,
      tasksCreated: Number
    }],

    generationContext: {
      weather: {
        conditions: String,
        temperature: Number,
        rainfall: Number
      },
      seasonalFactors: String,
      farmingPhase: String // planting, growing, harvesting, etc.
    },

    // Completion tracking
    completedTasks: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    }
  },

  // Related metadata
  relatedActivity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['article', 'video', 'image', 'document']
    }
  }],

  // Feedback for completed tasks
  feedback: {
    type: new mongoose.Schema({
      notes: String,
      effectiveness: {
        type: Number,
        min: 1,
        max: 5
      },
      images: {
        type: [String], // URLs to result images
        default: []
      }
    }, { _id: false, versionKey: false }),
    default: {}
  }
}, { timestamps: true });

// Create indexes for better querying performance
taskSchema.index({ crop: 1, dueDate: 1, status: 1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ category: 1 });

// Indexes for daily generation tracking
taskSchema.index({ user: 1, generationType: 1, 'dailyGeneration.date': 1 }, { unique: true, partialFilterExpression: { generationType: 'daily_generation_tracker' } });
taskSchema.index({ generationType: 1, 'dailyGeneration.date': 1, status: 1 });

// Virtual for completion percentage (only for daily generation trackers)
taskSchema.virtual('completionPercentage').get(function () {
  if (this.generationType !== 'daily_generation_tracker' || !this.dailyGeneration.totalTasks) return null;
  if (this.dailyGeneration.totalTasks === 0) return 0;
  return Math.round((this.dailyGeneration.completedTasks / this.dailyGeneration.totalTasks) * 100);
});

// Enable virtuals in JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Static method to check if tasks were already generated for today
taskSchema.statics.isGeneratedToday = async function (userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const generation = await this.findOne({
    user: userId,
    generationType: 'daily_generation_tracker',
    'dailyGeneration.date': today,
    status: 'done' // Using 'done' to indicate completed generation
  });

  return !!generation;
};

// Static method to get today's generation record
taskSchema.statics.getTodaysGeneration = async function (userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await this.findOne({
    user: userId,
    generationType: 'daily_generation_tracker',
    'dailyGeneration.date': today
  });
};

module.exports = mongoose.model('Task', taskSchema);