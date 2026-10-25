const mongoose = require('mongoose');

/** Bilingual text: Sinhala (primary) + English. */
const LocalizedText = new mongoose.Schema(
  {
    si: { type: String, trim: true, default: '' },
    en: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

/** Bilingual list of strings (e.g. uses, prevention steps). */
const LocalizedList = new mongoose.Schema(
  {
    si: { type: [String], default: [] },
    en: { type: [String], default: [] },
  },
  { _id: false }
);

/** A stored image (Cloudinary or local disk). */
const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' }, // Cloudinary public_id or local file name
    provider: { type: String, enum: ['cloudinary', 'local', 'external'], default: 'local' },
    caption: { type: String, default: '' },
    width: Number,
    height: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/** Where a fact came from, and how sure we are about it. */
const SourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, default: '' },
  },
  { _id: false }
);

module.exports = { LocalizedText, LocalizedList, ImageSchema, SourceSchema };
