const mongoose = require('mongoose');

// User behavior analytics schema for AI learning
const userAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Task completion patterns
  completionPatterns: {
    // Task category preferences and performance
    categoryStats: {
      irrigation: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        early: { type: Number, default: 0 },
        late: { type: Number, default: 0 },
        avgCompletionTime: { type: Number, default: 0 } // in days
      },
      fertilization: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        early: { type: Number, default: 0 },
        late: { type: Number, default: 0 },
        avgCompletionTime: { type: Number, default: 0 }
      },
      pest_control: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        early: { type: Number, default: 0 },
        late: { type: Number, default: 0 },
        avgCompletionTime: { type: Number, default: 0 }
      },
      harvesting: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        early: { type: Number, default: 0 },
        late: { type: Number, default: 0 },
        avgCompletionTime: { type: Number, default: 0 }
      },
      pruning: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        early: { type: Number, default: 0 },
        late: { type: Number, default: 0 },
        avgCompletionTime: { type: Number, default: 0 }
      },
      soil_management: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        early: { type: Number, default: 0 },
        late: { type: Number, default: 0 },
        avgCompletionTime: { type: Number, default: 0 }
      }
    },

    // Priority handling patterns
    priorityStats: {
      urgent: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 }
      },
      high: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 }
      },
      medium: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 }
      },
      low: {
        total: { type: Number, default: 0 },
        onTime: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 }
      }
    },

    // Time-based patterns
    temporalPatterns: {
      // Day of week preferences (0 = Sunday, 6 = Saturday)
      dayOfWeekStats: [{
        day: Number, // 0-6
        completions: { type: Number, default: 0 },
        avgCompletionHour: { type: Number, default: 12 }
      }],

      // Monthly patterns
      monthlyStats: [{
        month: Number, // 0-11
        completions: { type: Number, default: 0 },
        categoryBreakdown: {
          irrigation: { type: Number, default: 0 },
          fertilization: { type: Number, default: 0 },
          pest_control: { type: Number, default: 0 },
          harvesting: { type: Number, default: 0 }
        }
      }],

      // Seasonal performance
      seasonalStats: [{
        season: Number, // 1-4
        completions: { type: Number, default: 0 },
        onTimeRate: { type: Number, default: 0 }
      }]
    }
  },

  // AI recommendation effectiveness
  recommendationPerformance: {
    totalRecommendations: { type: Number, default: 0 },
    acceptedRecommendations: { type: Number, default: 0 },
    rejectedRecommendations: { type: Number, default: 0 },
    avgUserRating: { type: Number, default: 0 },

    // Category-wise recommendation success
    categorySuccess: {
      irrigation: { success: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      fertilization: { success: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      pest_control: { success: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      harvesting: { success: { type: Number, default: 0 }, total: { type: Number, default: 0 } }
    }
  },

  // User engagement metrics
  engagementMetrics: {
    totalTasksCompleted: { type: Number, default: 0 },
    totalTasksAssigned: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    avgTasksPerWeek: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },

    // Feedback patterns
    providesNotes: { type: Number, default: 0 }, // How often user provides notes
    uploadsImages: { type: Number, default: 0 }, // How often user uploads images
    avgNotesLength: { type: Number, default: 0 }
  },

  // Learning insights for AI
  aiInsights: {
    preferredTaskTypes: [String], // Most completed task categories
    bestPerformanceDay: Number, // Day of week with highest completion rate
    bestPerformanceTime: Number, // Hour of day with most completions
    riskCategories: [String], // Categories where user often completes late
    recommendedSchedule: {
      irrigation: [Number], // Preferred days for irrigation tasks
      fertilization: [Number], // Preferred days for fertilization
      harvesting: [Number] // Preferred days for harvesting
    }
  }
}, {
  timestamps: true,
  // Optimize for frequent updates
  versionKey: false
});

// Create indexes for efficient querying
userAnalyticsSchema.index({ user: 1 }, { unique: true });
userAnalyticsSchema.index({ 'completionPatterns.categoryStats': 1 });
userAnalyticsSchema.index({ 'engagementMetrics.completionRate': -1 });

// Static method to get or create analytics for user
userAnalyticsSchema.statics.getOrCreateForUser = async function (userId) {
  let analytics = await this.findOne({ user: userId });

  if (!analytics) {
    analytics = new this({
      user: userId,
      completionPatterns: {
        temporalPatterns: {
          dayOfWeekStats: Array.from({ length: 7 }, (_, i) => ({ day: i, completions: 0, avgCompletionHour: 12 })),
          monthlyStats: Array.from({ length: 12 }, (_, i) => ({
            month: i,
            completions: 0,
            categoryBreakdown: { irrigation: 0, fertilization: 0, pest_control: 0, harvesting: 0 }
          })),
          seasonalStats: Array.from({ length: 4 }, (_, i) => ({ season: i + 1, completions: 0, onTimeRate: 0 }))
        }
      }
    });
    await analytics.save();
  }

  return analytics;
};

// Method to update completion patterns
userAnalyticsSchema.methods.updateCompletionPattern = function (patternData) {
  const { category, priority, timing, dayOfWeek, month } = patternData;

  // Update category stats
  if (this.completionPatterns.categoryStats[category]) {
    this.completionPatterns.categoryStats[category].total += 1;
    this.completionPatterns.categoryStats[category][timing] += 1;
  }

  // Update priority stats
  if (this.completionPatterns.priorityStats[priority]) {
    this.completionPatterns.priorityStats[priority].total += 1;
    if (timing === 'onTime' || timing === 'early') {
      this.completionPatterns.priorityStats[priority].onTime += 1;
    }
  }

  // Update temporal patterns
  const dayStats = this.completionPatterns.temporalPatterns.dayOfWeekStats.find(d => d.day === dayOfWeek);
  if (dayStats) {
    dayStats.completions += 1;
    dayStats.avgCompletionHour = new Date().getHours();
  }

  const monthStats = this.completionPatterns.temporalPatterns.monthlyStats.find(m => m.month === month);
  if (monthStats) {
    monthStats.completions += 1;
    if (monthStats.categoryBreakdown[category] !== undefined) {
      monthStats.categoryBreakdown[category] += 1;
    }
  }

  // Update engagement metrics
  this.engagementMetrics.totalTasksCompleted += 1;
  this.engagementMetrics.lastActiveDate = new Date();

  // Recalculate completion rate
  if (this.engagementMetrics.totalTasksAssigned > 0) {
    this.engagementMetrics.completionRate =
      (this.engagementMetrics.totalTasksCompleted / this.engagementMetrics.totalTasksAssigned) * 100;
  }

  return this.save();
};

module.exports = mongoose.model('UserAnalytics', userAnalyticsSchema);