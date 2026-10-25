const mongoose = require('mongoose');
const { LocalizedText, ImageSchema } = require('./shared');

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: LocalizedText, required: true },
    description: { type: LocalizedText, default: () => ({}) },
    icon: { type: String, default: 'leaf' }, // Ionicons name used by the app
    color: { type: String, default: '#2E7D32' },
    image: { type: ImageSchema, default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
