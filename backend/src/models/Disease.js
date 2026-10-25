const mongoose = require('mongoose');
const { LocalizedText, LocalizedList, ImageSchema, SourceSchema } = require('./shared');
const { VERIFICATION, SYMPTOMS, PLANT_PARTS } = require('../utils/constants');

/**
 * Diseases, pests, nutrient deficiencies and environmental problems.
 * This is the "verified agricultural knowledge" the AI is grounded on.
 */
const diseaseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: LocalizedText, required: true },
    causalAgent: { type: String, default: '' }, // e.g. "Alternaria solani"
    type: {
      type: String,
      enum: ['fungal', 'bacterial', 'viral', 'phytoplasma', 'pest', 'deficiency', 'environmental'],
      required: true,
    },
    vector: { type: LocalizedText, default: () => ({}) }, // e.g. whitefly for TYLCV
    affectedParts: [{ type: String, enum: PLANT_PARTS }],
    symptomKeys: [{ type: String, enum: SYMPTOMS }], // used for matching with reported symptoms
    symptoms: { type: LocalizedList, default: () => ({}) },
    prevention: { type: LocalizedList, default: () => ({}) },
    treatment: { type: LocalizedList, default: () => ({}) },
    safety: { type: LocalizedList, default: () => ({}) },
    images: [ImageSchema],
    plants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant', index: true }],
    verification: {
      status: { type: String, enum: VERIFICATION, default: 'needs_review' },
      notes: { type: String, default: '' },
      sources: [SourceSchema],
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: Date,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

diseaseSchema.index({ 'name.si': 'text', 'name.en': 'text', causalAgent: 'text' });

module.exports = mongoose.model('Disease', diseaseSchema);
