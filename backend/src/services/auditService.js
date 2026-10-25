const { AuditLog } = require('../models');

/** Deep plain-object snapshot so later edits to the document don't change history. */
function snapshot(value) {
  if (value == null) return null;
  const plain = typeof value.toObject === 'function' ? value.toObject() : value;
  return JSON.parse(JSON.stringify(plain));
}

async function record({ entityType, entityId, action, actor = null, note = '', before = null, after = null }) {
  return AuditLog.create({
    entityType,
    entityId,
    action,
    actor: actor ? actor._id : null,
    actorRole: actor ? actor.role : 'system',
    note,
    before: snapshot(before),
    after: snapshot(after),
  });
}

async function history(entityType, entityId) {
  return AuditLog.find({ entityType, entityId })
    .sort({ createdAt: 1, _id: 1 })
    .populate('actor', 'name role')
    .lean();
}

module.exports = { record, history, snapshot };
