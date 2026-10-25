/** Agricultural Instructor dashboard, review queue and decisions (spec §8). */
const { Recommendation } = require('../models');
const ApiError = require('../utils/ApiError');
const recService = require('../services/recommendationService');
const audit = require('../services/auditService');
const { REC_STATUS, ROLES } = require('../utils/constants');

// Instructors see the farmer's name and district only – not email or phone.
const FULL_POPULATE = [
  { path: 'user', select: 'name district' },
  { path: 'plant', select: 'plantCode name scientificName images fertilizer.applications watering verification.status' },
  { path: 'userPlant', select: 'nickname plantingDate quantity growthStage lastWateredAt fertilizerLog wateringLog location photos notes' },
  { path: 'report' },
  { path: 'review.reviewer', select: 'name' },
  { path: 'publishedBy', select: 'name' },
];

async function dashboard(req, res) {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [pending, aiFailed, urgent, mineWeek, mineTotal, oldest] = await Promise.all([
    Recommendation.countDocuments({ status: REC_STATUS.PENDING_REVIEW }),
    Recommendation.countDocuments({ status: REC_STATUS.PENDING_REVIEW, aiOutput: null }),
    Recommendation.countDocuments({ status: REC_STATUS.PENDING_REVIEW, 'aiOutput.urgency': { $in: ['high', 'critical'] } }),
    Recommendation.countDocuments({ 'review.reviewer': req.user._id, 'review.reviewedAt': { $gte: since } }),
    Recommendation.countDocuments({ 'review.reviewer': req.user._id }),
    Recommendation.findOne({ status: REC_STATUS.PENDING_REVIEW }).sort({ createdAt: 1 }).select('createdAt').lean(),
  ]);
  const decisions = await Recommendation.aggregate([
    { $match: { 'review.reviewer': req.user._id } },
    { $group: { _id: '$review.decision', n: { $sum: 1 } } },
  ]);
  res.json({
    success: true,
    stats: {
      pending,
      aiFailed,
      urgent,
      reviewedThisWeek: mineWeek,
      reviewedTotal: mineTotal,
      oldestPendingAt: oldest?.createdAt || null,
      decisions: Object.fromEntries(decisions.map((d) => [d._id, d.n])),
    },
  });
}

const URGENCY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

async function queue(req, res) {
  const items = await Recommendation.find({ status: REC_STATUS.PENDING_REVIEW })
    .select('recommendationCode status createdAt aiOutput.urgency aiOutput.confidence aiOutput.summary aiMeta.isTestOutput aiMeta.error user plant report')
    .populate([
      { path: 'user', select: 'name district' },
      { path: 'plant', select: 'plantCode name images' },
      { path: 'report', select: 'photos symptoms' },
    ])
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();
  // Most urgent first, then oldest first; AI failures are treated as high priority.
  items.sort((a, b) => {
    const ua = a.aiOutput ? URGENCY_ORDER[a.aiOutput.urgency] ?? 2 : 1;
    const ub = b.aiOutput ? URGENCY_ORDER[b.aiOutput.urgency] ?? 2 : 1;
    return ua - ub || new Date(a.createdAt) - new Date(b.createdAt);
  });
  res.json({ success: true, items });
}

async function history(req, res) {
  const filter = { 'review.decision': { $ne: null } };
  if (req.user.role === ROLES.INSTRUCTOR || req.query.mine === 'true') filter['review.reviewer'] = req.user._id;
  if (req.query.decision) filter['review.decision'] = req.query.decision;
  const items = await Recommendation.find(filter)
    .select('recommendationCode status review createdAt publishedAt user plant')
    .populate([
      { path: 'user', select: 'name district' },
      { path: 'plant', select: 'plantCode name images' },
      { path: 'review.reviewer', select: 'name' },
    ])
    .sort({ 'review.reviewedAt': -1 })
    .limit(200)
    .lean();
  res.json({ success: true, items });
}

async function getOne(req, res) {
  const rec = await Recommendation.findById(req.valid.params.id).populate(FULL_POPULATE).lean();
  if (!rec) throw ApiError.notFound('Recommendation not found');
  const auditTrail = await audit.history('recommendation', rec._id);
  res.json({ success: true, recommendation: rec, audit: auditTrail });
}

async function review(req, res) {
  await recService.review(req.valid.params.id, req.user, req.valid.body);
  const rec = await Recommendation.findById(req.valid.params.id).populate(FULL_POPULATE).lean();
  res.json({ success: true, recommendation: rec });
}

async function publish(req, res) {
  await recService.publish(req.valid.params.id, req.user);
  const rec = await Recommendation.findById(req.valid.params.id).populate(FULL_POPULATE).lean();
  res.json({ success: true, recommendation: rec });
}

async function regenerate(req, res) {
  try {
    await recService.regenerate(req.valid.params.id, req.user);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, `AI service failed: ${err.message}`, 'AI_FAILED');
  }
  const rec = await Recommendation.findById(req.valid.params.id).populate(FULL_POPULATE).lean();
  res.json({ success: true, recommendation: rec });
}

async function auditTrail(req, res) {
  const exists = await Recommendation.exists({ _id: req.valid.params.id });
  if (!exists) throw ApiError.notFound('Recommendation not found');
  res.json({ success: true, items: await audit.history('recommendation', req.valid.params.id) });
}

module.exports = { dashboard, queue, history, getOne, review, publish, regenerate, auditTrail };
