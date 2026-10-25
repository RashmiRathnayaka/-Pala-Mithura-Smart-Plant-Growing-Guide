const mongoose = require('mongoose');

/**
 * Append-only audit trail for recommendations (spec §8: original AI recommendation,
 * instructor changes, decision, reviewer, timestamps and the final published version).
 * Entries are never updated or deleted through the API.
 */
const auditLogSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['recommendation', 'plant', 'disease', 'user', 'category'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        'ai_generated',
        'ai_failed',
        'queued_for_review',
        'claimed',
        'accepted',
        'modified',
        'rejected',
        'published',
        'created',
        'updated',
        'deleted',
        'verified',
        'role_changed',
        'status_changed',
      ],
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = system
    actorRole: { type: String, default: 'system' },
    note: { type: String, default: '' },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });

const immutable = function blockMutation() {
  throw new Error('Audit log entries are immutable');
};
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], immutable);

module.exports = mongoose.model('AuditLog', auditLogSchema);
