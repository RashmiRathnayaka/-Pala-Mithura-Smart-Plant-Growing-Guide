const mongoose = require('mongoose');
const { REC_STATUS } = require('../utils/constants');

/** The content of a recommendation – used for both the AI draft and the final approved version. */
const RecommendationContent = new mongoose.Schema(
  {
    summary: { type: String, default: '' },
    possibleCauses: [
      {
        _id: false,
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['disease', 'pest', 'nutrient_deficiency', 'environmental', 'other'],
          default: 'other',
        },
        likelihood: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
        evidence: { type: String, default: '' },
        diseaseCode: { type: String, default: '' }, // link to the knowledge base when it matches
      },
    ],
    suggestedActions: [
      {
        _id: false,
        action: { type: String, required: true },
        priority: { type: String, enum: ['immediate', 'soon', 'routine'], default: 'soon' },
      },
    ],
    fertilizerAdvice: { type: String, default: '' },
    requiredMaterials: [String],
    preventionMethods: [String],
    furtherChecks: [String],
    additionalInfoNeeded: [String],
    safetyPrecautions: [String],
    urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    confidence: {
      level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      explanation: { type: String, default: '' },
    },
    language: { type: String, enum: ['si', 'en'], default: 'si' },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    recommendationCode: { type: String, required: true, unique: true }, // "Recommendation ID", e.g. REC-000123
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
    userPlant: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPlant', default: null },
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'ProblemReport', required: true },

    status: {
      type: String,
      enum: Object.values(REC_STATUS),
      default: REC_STATUS.AI_GENERATED,
      index: true,
    },

    aiOutput: { type: RecommendationContent, default: null },
    aiMeta: {
      provider: { type: String, default: '' },
      model: { type: String, default: '' },
      isTestOutput: { type: Boolean, default: false }, // true when produced by the offline mock
      imagesAnalyzed: { type: Number, default: 0 },
      latencyMs: Number,
      inputTokens: Number,
      outputTokens: Number,
      error: { type: String, default: '' },
      generatedAt: Date,
    },

    review: {
      decision: { type: String, enum: ['accepted', 'modified', 'rejected', null], default: null },
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      comment: { type: String, default: '' },
      changeExplanation: { type: String, default: '' },
      rejectionReason: { type: String, default: '' },
      alternativeRecommendation: { type: String, default: '' },
      additionalInfoRequested: { type: String, default: '' },
      reviewedAt: Date,
      claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      claimedAt: Date,
    },

    // Only set after an instructor has reviewed. This is what the farmer is told to follow.
    finalRecommendation: { type: RecommendationContent, default: null },
    publishedAt: Date,
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userViewedAt: Date,
  },
  { timestamps: true }
);

recommendationSchema.index({ status: 1, createdAt: 1 });
recommendationSchema.index({ 'review.reviewer': 1, 'review.reviewedAt': -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
module.exports.RecommendationContent = RecommendationContent;
