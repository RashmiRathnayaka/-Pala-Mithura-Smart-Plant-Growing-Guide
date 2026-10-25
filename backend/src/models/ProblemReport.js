const mongoose = require('mongoose');
const { ImageSchema } = require('./shared');
const { SYMPTOMS, PLANT_PARTS, GROWTH_STAGES } = require('../utils/constants');

/** "ශාක ගැටලු හඳුනාගැනීම" – a user's report of a plant problem. */
const problemReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
    userPlant: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPlant', default: null },
    photos: {
      type: [ImageSchema],
      validate: [(v) => v.length <= 6, 'A maximum of 6 photos is allowed'],
    },
    symptoms: [{ type: String, enum: SYMPTOMS }],
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    affectedParts: [{ type: String, enum: PLANT_PARTS }],
    durationDays: { type: Number, min: 0, max: 3650, default: null },
    growthStage: { type: String, enum: [...GROWTH_STAGES, null], default: null },
    district: { type: String, default: '' },
    recentWeather: { type: String, default: '' },
    language: { type: String, enum: ['si', 'en'], default: 'si' },
    status: {
      type: String,
      enum: ['submitted', 'analyzing', 'analyzed', 'ai_failed'],
      default: 'submitted',
    },
    recommendation: { type: mongoose.Schema.Types.ObjectId, ref: 'Recommendation', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProblemReport', problemReportSchema);
