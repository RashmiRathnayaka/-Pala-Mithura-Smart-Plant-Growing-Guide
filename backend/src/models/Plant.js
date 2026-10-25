const mongoose = require('mongoose');
const { LocalizedText, LocalizedList, ImageSchema, SourceSchema } = require('./shared');
const { VERIFICATION, GROWTH_STAGES, AGRO_ZONES } = require('../utils/constants');

const Range = new mongoose.Schema({ min: Number, max: Number }, { _id: false });

/** One fertilizer application, e.g. "basal: Urea 65, TSP 325, MOP 65 kg/ha". */
const FertilizerApplication = new mongoose.Schema(
  {
    timing: { type: LocalizedText, required: true },
    // Days relative to planting/transplanting. Negative = before planting. Drives reminders.
    daysAfterPlanting: { type: Number, default: null },
    products: [
      {
        _id: false,
        name: { type: String, required: true }, // Urea, TSP, MOP, compost …
        rate: { type: Number, default: null },
        unit: { type: String, default: 'kg/ha' },
      },
    ],
    note: { type: LocalizedText, default: () => ({}) },
  },
  { _id: false }
);

const GrowthStage = new mongoose.Schema(
  {
    stage: { type: String, enum: GROWTH_STAGES, required: true },
    startDay: { type: Number, required: true },
    endDay: { type: Number, default: null },
  },
  { _id: false }
);

const plantSchema = new mongoose.Schema(
  {
    plantCode: { type: String, required: true, unique: true, uppercase: true, trim: true }, // "Plant ID"
    name: { type: LocalizedText, required: true },
    scientificName: { type: String, required: true, trim: true },
    family: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: [ImageSchema],
    description: { type: LocalizedText, default: () => ({}) },
    uses: { type: LocalizedList, default: () => ({}) },
    varieties: { type: [String], default: [] },

    season: {
      keys: [{ type: String, enum: ['yala', 'maha', 'year_round'] }],
      text: { type: LocalizedText, default: () => ({}) },
    },
    soil: {
      type: { type: LocalizedText, default: () => ({}) },
      phMin: { type: Number, default: null },
      phMax: { type: Number, default: null },
      preparation: { type: LocalizedText, default: () => ({}) },
    },
    sunlight: {
      level: { type: String, enum: ['full_sun', 'partial_shade', 'shade', null], default: null },
      notes: { type: LocalizedText, default: () => ({}) },
    },
    temperature: {
      minC: { type: Number, default: null },
      maxC: { type: Number, default: null },
      optimalMinC: { type: Number, default: null },
      optimalMaxC: { type: Number, default: null },
    },
    watering: {
      // Default reminder interval. Users can override it per plant in "My Plants".
      intervalDays: { type: Number, default: null },
      intervalIsEstimate: { type: Boolean, default: true },
      quantity: { type: LocalizedText, default: () => ({}) },
      notes: { type: LocalizedText, default: () => ({}) },
    },
    fertilizer: {
      summary: { type: LocalizedText, default: () => ({}) },
      applications: [FertilizerApplication],
      organicOptions: { type: LocalizedList, default: () => ({}) },
      notes: { type: LocalizedText, default: () => ({}) },
    },
    spacing: {
      plantCm: { type: Number, default: null },
      rowCm: { type: Number, default: null },
      notes: { type: LocalizedText, default: () => ({}) },
    },
    planting: {
      method: { type: String, enum: ['direct_seeding', 'transplanting', 'vegetative', 'grafted', null], default: null },
      depthCm: { type: Number, default: null },
      seedRate: { type: LocalizedText, default: () => ({}) },
      nurseryDays: { type: Range, default: null },
      germinationDays: { type: Range, default: null },
      notes: { type: LocalizedText, default: () => ({}) },
    },
    growthDurationDays: { type: Range, default: null },
    harvest: {
      startDays: { type: Number, default: null }, // days after planting/transplanting
      endDays: { type: Number, default: null },
      intervalDays: { type: Number, default: null },
      notes: { type: LocalizedText, default: () => ({}) },
    },
    growthStages: [GrowthStage],
    pestsAndDiseases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Disease' }],
    regions: {
      zones: [{ type: String, enum: AGRO_ZONES }],
      districts: { type: [String], default: [] },
      climate: { type: LocalizedText, default: () => ({}) },
    },

    // Data quality – the spec requires uncertain information to be identified.
    verification: {
      status: { type: String, enum: VERIFICATION, default: 'needs_review', index: true },
      notes: { type: String, default: '' },
      uncertainFields: { type: [String], default: [] },
      sources: [SourceSchema],
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: Date,
    },

    viewCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

plantSchema.index(
  { 'name.si': 'text', 'name.en': 'text', scientificName: 'text' },
  { weights: { 'name.si': 5, 'name.en': 5, scientificName: 3 }, name: 'plant_text' }
);

module.exports = mongoose.model('Plant', plantSchema);
