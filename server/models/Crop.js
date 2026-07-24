const mongoose = require('mongoose');

// Define sub-schemas for complex data structures
const irrigationEventSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  duration: { type: Number, comment: "Duration in minutes" },
  amount: { type: Number, comment: "Amount in liters or inches" },
  method: { type: String, enum: ['drip', 'sprinkler', 'flood', 'manual', 'other'] },
  waterSource: String,
  soilMoistureBefore: Number,
  soilMoistureAfter: Number,
  notes: String
}, { timestamps: true, _id: true });

const fertilizationEventSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, required: true }, // e.g., NPK, organic, foliar
  product: String,
  npkRatio: String,
  amount: { type: Number, comment: "Amount in kg or g" },
  applicationMethod: { type: String, enum: ['foliar', 'soil', 'fertigation', 'other'] },
  coverage: { type: String, comment: "Full field, specific area, etc." },
  notes: String
}, { timestamps: true, _id: true });

const pestDiseaseEventSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['pest', 'disease', 'weed'] },
  name: String,
  severity: { type: Number, min: 1, max: 10, comment: "1-10 scale" },
  affectedArea: String,
  treatment: {
    product: String,
    applicationDate: Date,
    amount: Number,
    method: String
  },
  effectiveness: { type: Number, min: 1, max: 10 },
  notes: String
}, { timestamps: true, _id: true });

const growthRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  stage: { type: String, enum: ['seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'harvested'] },
  height: Number,
  canopyWidth: Number,
  images: [String], // URLs to images
  healthRating: { type: Number, min: 1, max: 10 },
  notes: String
}, { timestamps: true, _id: true });

const harvestEventSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  yield: Number,
  yieldUnit: { type: String, default: 'kg' },
  quality: { type: String, enum: ['excellent', 'good', 'average', 'poor'] },
  marketValue: Number,
  notes: String
}, { timestamps: true, _id: true });

const cropSchema = new mongoose.Schema({
  // Basic crop information
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  variety: String,
  status: { type: String, default: 'Growing', enum: ['Planning', 'Growing', 'Harvested', 'Failed', 'Completed'] },

  // Planting details
  plantingDate: { type: Date },
  harvestDate: { type: Date }, // Expected harvest date
  actualHarvestDate: { type: Date }, // Actual harvest date when completed
  seedSource: String,
  plantingMethod: { type: String, enum: ['direct seeding', 'transplanting', 'cutting', 'grafting', 'other'] },

  // Field information
  fieldId: String,
  // Use a flat structure for location to avoid GeoJSON schema conflicts
  locationName: String,
  location: String, // Alternative field for location name
  locationLatitude: Number,
  locationLongitude: Number,
  locationArea: Number,
  locationAreaUnit: {
    type: String,
    default: 'acres',
    enum: ['acres', 'hectares', 'square meters', 'square feet']
  },
  soilType: String,
  previousCrop: String,
  irrigationType: String, // Added: Drip, Sprinkler, Flood, Manual, Rainwater
  growthDays: Number, // Added: Expected days from planting to harvest

  // Field location object (alternative structure for compatibility)
  fieldLocation: {
    latitude: Number,
    longitude: Number,
    name: String
  },

  // Companion planting and trap crops
  companionCrops: [String],
  trapCrops: [String],
  beneficialPlants: [String],

  // Event history - arrays of sub-documents
  irrigationHistory: [irrigationEventSchema],
  fertilizationHistory: [fertilizationEventSchema],
  pestDiseaseHistory: [pestDiseaseEventSchema],
  growthHistory: [growthRecordSchema],
  harvestHistory: [harvestEventSchema],



  // Cost and labor tracking
  costs: [{
    date: Date,
    category: { type: String, enum: ['seeds', 'fertilizer', 'pesticide', 'labor', 'equipment', 'other'] },
    amount: Number,
    description: String
  }],

  laborHours: [{
    date: Date,
    hours: Number,
    task: String,
    personnel: String,
    notes: String
  }],

  // Notes and additional information
  notes: [{
    date: { type: Date, default: Date.now },
    text: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);