const mongoose = require('mongoose');
const { ImageSchema } = require('./shared');
const { GROWTH_STAGES } = require('../utils/constants');

const userPlantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
    nickname: { type: String, trim: true, default: '' },
    plantingDate: { type: Date, required: true },
    location: {
      district: { type: String, default: '' },
      area: { type: String, default: '' }, // village / garden description
      agroZone: { type: String, default: '' },
    },
    quantity: { type: Number, min: 1, default: 1 },
    growthStage: { type: String, enum: GROWTH_STAGES, default: 'seed' },
    growthStageUpdatedAt: { type: Date, default: Date.now },
    lastWateredAt: Date,
    wateringLog: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: String, default: '' },
        note: { type: String, default: '' },
      },
    ],
    fertilizerLog: [
      {
        date: { type: Date, default: Date.now },
        type: { type: String, required: true },
        quantity: { type: String, default: '' },
        note: { type: String, default: '' },
      },
    ],
    photos: [ImageSchema],
    notes: [
      {
        text: { type: String, required: true, maxlength: 2000 },
        isProblem: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
      },
    ],
    reminders: {
      watering: { type: Boolean, default: true },
      // null → use the crop's own recommended interval
      wateringIntervalDays: { type: Number, min: 1, max: 60, default: null },
      fertilizer: { type: Boolean, default: true },
      harvest: { type: Boolean, default: true },
      time: { type: String, default: '07:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    },
    status: { type: String, enum: ['active', 'harvested', 'archived'], default: 'active', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserPlant', userPlantSchema);
