/** Administrator: users, instructors, statistics and activity (spec §2C). */
const { User, Plant, Disease, Category, Recommendation, ProblemReport, UserPlant, AuditLog } = require('../models');
const ApiError = require('../utils/ApiError');
const audit = require('../services/auditService');
const ai = require('../services/ai/aiService');
const storage = require('../services/storageService');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function stats(_req, res) {
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [usersByRole, plants, plantsByVerification, diseases, categories, reports30, recsByStatus, decisions, userPlants, avgReview] =
    await Promise.all([
      User.aggregate([{ $group: { _id: { role: '$role', active: '$isActive' }, n: { $sum: 1 } } }]),
      Plant.countDocuments(),
      Plant.aggregate([{ $group: { _id: '$verification.status', n: { $sum: 1 } } }]),
      Disease.countDocuments(),
      Category.countDocuments(),
      ProblemReport.countDocuments({ createdAt: { $gte: since30 } }),
      Recommendation.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Recommendation.aggregate([{ $match: { 'review.decision': { $ne: null } } }, { $group: { _id: '$review.decision', n: { $sum: 1 } } }]),
      UserPlant.countDocuments({ status: 'active' }),
      Recommendation.aggregate([
        { $match: { 'review.reviewedAt': { $ne: null } } },
        { $project: { h: { $divide: [{ $subtract: ['$review.reviewedAt', '$createdAt'] }, 3600000] } } },
        { $group: { _id: null, avg: { $avg: '$h' } } },
      ]),
    ]);

  const roles = { user: 0, instructor: 0, admin: 0, inactive: 0 };
  usersByRole.forEach((r) => {
    roles[r._id.role] += r.n;
    if (!r._id.active) roles.inactive += r.n;
  });

  // Reports per day for the last 14 days (for a small chart).
  const since14 = new Date(Date.now() - 14 * 24 * 3600 * 1000);
  const daily = await ProblemReport.aggregate([
    { $match: { createdAt: { $gte: since14 } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Colombo' } }, n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      users: roles,
      plants,
      plantsByVerification: Object.fromEntries(plantsByVerification.map((p) => [p._id, p.n])),
      diseases,
      categories,
      activeUserPlants: userPlants,
      reportsLast30Days: reports30,
      recommendationsByStatus: Object.fromEntries(recsByStatus.map((r) => [r._id, r.n])),
      reviewDecisions: Object.fromEntries(decisions.map((d) => [d._id, d.n])),
      avgReviewHours: avgReview[0] ? Math.round(avgReview[0].avg * 10) / 10 : null,
      dailyReports: daily.map((d) => ({ date: d._id, count: d.n })),
      services: { ai: ai.providerInfo(), storage: storage.activeProvider() },
    },
  });
}

async function listUsers(req, res) {
  const { q, role, active, page = 1, limit = 30 } = req.valid.query;
  const filter = {};
  if (role) filter.role = role;
  if (active !== undefined) filter.isActive = active;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { district: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  items.forEach((u) => {
    delete u.password;
    delete u.pushToken;
  });
  res.json({ success: true, items, total, page, limit });
}

/** Admins create Agricultural Instructor (or admin) accounts directly. */
async function createUser(req, res) {
  const body = req.valid.body;
  if (await User.exists({ email: body.email.toLowerCase() })) throw ApiError.conflict('Email already in use', 'EMAIL_TAKEN');
  const user = await User.create(body);
  await audit.record({ entityType: 'user', entityId: user._id, action: 'created', actor: req.user, after: { role: user.role, email: user.email } });
  res.status(201).json({ success: true, user });
}

async function updateUser(req, res) {
  const user = await User.findById(req.valid.params.id);
  if (!user) throw ApiError.notFound('User not found');
  const body = req.valid.body;
  if (String(user._id) === String(req.user._id) && (body.role && body.role !== 'admin' || body.isActive === false)) {
    throw ApiError.badRequest('You cannot remove your own admin access');
  }
  const before = { role: user.role, isActive: user.isActive };
  if (body.role !== undefined) user.role = body.role;
  if (body.isActive !== undefined) user.isActive = body.isActive;
  if (body.name !== undefined) user.name = body.name;
  if (body.district !== undefined) user.district = body.district;
  if (body.instructorProfile) user.instructorProfile = { ...user.instructorProfile?.toObject?.(), ...body.instructorProfile };
  await user.save();
  const action = before.role !== user.role ? 'role_changed' : before.isActive !== user.isActive ? 'status_changed' : 'updated';
  await audit.record({ entityType: 'user', entityId: user._id, action, actor: req.user, before, after: { role: user.role, isActive: user.isActive } });
  res.json({ success: true, user });
}

async function resetPassword(req, res) {
  const user = await User.findById(req.valid.params.id).select('+password');
  if (!user) throw ApiError.notFound('User not found');
  user.password = req.valid.body.newPassword;
  await user.save();
  await audit.record({ entityType: 'user', entityId: user._id, action: 'updated', actor: req.user, note: 'Password reset by admin' });
  res.json({ success: true });
}

async function activity(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const filter = {};
  if (req.query.entityType) filter.entityType = req.query.entityType;
  const items = await AuditLog.find(filter)
    .select('-before -after')
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name role')
    .lean();
  res.json({ success: true, items });
}

module.exports = { stats, listUsers, createUser, updateUser, resetPassword, activity };
