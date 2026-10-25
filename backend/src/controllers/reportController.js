/** Plant problem reports ("ශාක ගැටලු හඳුනාගැනීම") and the user's recommendations. */
const { ProblemReport, Plant, UserPlant, Recommendation } = require('../models');
const ApiError = require('../utils/ApiError');
const storage = require('../services/storageService');
const recService = require('../services/recommendationService');
const { ROLES } = require('../utils/constants');

const REC_POPULATE = [
  { path: 'plant', select: 'plantCode name scientificName images' },
  { path: 'report', select: 'photos symptoms description affectedParts durationDays growthStage district status createdAt' },
  { path: 'review.reviewer', select: 'name' },
];

async function submit(req, res) {
  const body = req.valid.body;
  const plant = await Plant.findOne({ _id: body.plant, isPublished: true }).select('_id').lean();
  if (!plant) throw ApiError.badRequest('Selected plant does not exist');

  let userPlant = null;
  if (body.userPlant) {
    userPlant = await UserPlant.findOne({ _id: body.userPlant, user: req.user._id }).lean();
    if (!userPlant) throw ApiError.badRequest('Selected garden plant was not found');
    if (String(userPlant.plant) !== String(body.plant)) throw ApiError.badRequest('Garden plant and selected crop do not match');
  }
  if (!req.files?.length && !body.symptoms.length && !body.description) {
    throw ApiError.badRequest('Add at least a photo, a symptom or a description');
  }

  const photos = await storage.saveImages(req.files || [], 'reports');
  const report = await ProblemReport.create({
    ...body,
    userPlant: userPlant ? userPlant._id : null,
    user: req.user._id,
    photos,
    district: body.district || userPlant?.location?.district || req.user.district || '',
    growthStage: body.growthStage || userPlant?.growthStage || null,
    language: body.language || req.user.language || 'si',
  });

  if (userPlant) {
    await UserPlant.updateOne(
      { _id: userPlant._id },
      { $push: { notes: { text: `[Problem report] ${body.description || body.symptoms.join(', ')}`.slice(0, 2000), isProblem: true, date: new Date() } } }
    );
  }

  // Runs the AI and queues the result for instructor review. AI failures are handled inside.
  const rec = await recService.createFromReport(report);
  const populated = await Recommendation.findById(rec._id).populate(REC_POPULATE);
  res.status(201).json({ success: true, report, recommendation: recService.toUserView(populated) });
}

async function listMine(req, res) {
  const items = await ProblemReport.find({ user: req.user._id })
    .populate('plant', 'plantCode name images')
    .populate('recommendation', 'recommendationCode status review.decision')
    .sort({ createdAt: -1 })
    .lean();
  // Never leak the internal review state before publishing.
  items.forEach((r) => {
    if (r.recommendation && r.recommendation.status !== 'published') {
      r.recommendation.status = 'pending_review';
      delete r.recommendation.review;
    }
  });
  res.json({ success: true, items });
}

async function getReport(req, res) {
  const r = await ProblemReport.findById(req.valid.params.id).populate('plant', 'plantCode name images').lean();
  if (!r) throw ApiError.notFound('Report not found');
  const isOwner = String(r.user) === String(req.user._id);
  if (!isOwner && req.user.role === ROLES.USER) throw ApiError.notFound('Report not found');
  res.json({ success: true, report: r });
}

async function myRecommendations(req, res) {
  const filter = { user: req.user._id };
  if (req.query.status === 'published') filter.status = 'published';
  if (req.query.status === 'pending') filter.status = { $ne: 'published' };
  const recs = await Recommendation.find(filter).populate(REC_POPULATE).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, items: recs.map(recService.toUserView) });
}

async function getRecommendation(req, res) {
  const rec = await Recommendation.findById(req.valid.params.id).populate(REC_POPULATE);
  if (!rec) throw ApiError.notFound('Recommendation not found');
  const isOwner = String(rec.user) === String(req.user._id);
  if (req.user.role === ROLES.USER) {
    if (!isOwner) throw ApiError.notFound('Recommendation not found');
    if (rec.status === 'published' && !rec.userViewedAt) {
      rec.userViewedAt = new Date();
      await Recommendation.updateOne({ _id: rec._id }, { $set: { userViewedAt: rec.userViewedAt } });
    }
    return res.json({ success: true, recommendation: recService.toUserView(rec) });
  }
  // Staff get the full record (instructor screens use /instructor routes for actions).
  res.json({ success: true, recommendation: rec });
}

module.exports = { submit, listMine, getReport, myRecommendations, getRecommendation };
