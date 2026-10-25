const mongoose = require('mongoose');

/** Atomic sequence generator for human-readable IDs (PM-0001, REC-000001). */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function next(name) {
  const doc = await this.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
