const mongoose = require('mongoose');
const { Plant, Category, User, Counter } = require('../models');
const ApiError = require('../utils/ApiError');
const storage = require('../services/storageService');
const audit = require('../services/auditService');
const { currentSeason, zoneForDistrict } = require('../utils/srilanka');
const { ROLES } = require('../utils/constants');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isStaff = (user) => user && [ROLES.ADMIN, ROLES.INSTRUCTOR].includes(user.role);

/** Light projection for lists/cards. */
const CARD_FIELDS = 'plantCode name scientificName category images season sunlight growthDurationDays harvest.startDays verification.status viewCount createdAt isPublished';

async function resolveCategoryFilter(category) {
  if (!category) return null;
  if (mongoose.isValidObjectId(category)) return category;
  const cat = await Category.findOne({ slug: category.toLowerCase() }).select('_id').lean();
  return cat ? cat._id : new mongoose.Types.ObjectId(); // unknown slug → empty result
}

async function list(req, res) {
  const { q, category, season, zone, verification, sort, page, limit, includeUnpublished } = req.valid.query;
  const filter = {};
  if (!(includeUnpublished && isStaff(req.user))) filter.isPublished = true;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ 'name.si': rx }, { 'name.en': rx }, { scientificName: rx }, { plantCode: rx }, { varieties: rx }];
  }
  const catId = await resolveCategoryFilter(category);
  if (catId) filter.category = catId;
  if (season) filter['season.keys'] = { $in: [season, 'year_round'] };
  if (zone) filter['regions.zones'] = zone;
  if (verification) filter['verification.status'] = verification;

  const sortBy = { popular: { viewCount: -1, _id: 1 }, recent: { createdAt: -1, _id: 1 }, name: { 'name.en': 1, _id: 1 } }[sort];
  const [items, total] = await Promise.all([
    Plant.find(filter)
      .select(CARD_FIELDS)
      .populate('category', 'slug name icon color')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Plant.countDocuments(filter),
  ]);
  res.json({ success: true, items, page, limit, total, pages: Math.ceil(total / limit) });
}

/** Recommended plants for the user's district/zone and the current season. */
async function recommended(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);
  const district = req.query.district || req.user?.district || '';
  const zone = req.query.zone || req.user?.agroZone || zoneForDistrict(district);
  const season = currentSeason();

  const plants = await Plant.find({ isPublished: true })
    .select(`${CARD_FIELDS} regions.zones`)
    .populate('category', 'slug name icon color')
    .lean();

  const scored = plants
    .map((p) => {
      const reasons = [];
      let score = 0;
      const keys = p.season?.keys || [];
      if (keys.includes(season) || keys.includes('year_round')) {
        score += 3;
        reasons.push('season');
      }
      if (zone && (p.regions?.zones || []).includes(zone)) {
        score += 3;
        reasons.push('zone');
      }
      if (p.verification?.status === 'verified') score += 1;
      score += Math.min(p.viewCount || 0, 500) / 500;
      return { ...p, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.json({ success: true, context: { season, zone: zone || null, district: district || null }, items: scored });
}

async function getOne(req, res) {
  const { id } = req.valid.params;
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { plantCode: id.toUpperCase() };
  const plant = await Plant.findOne(query)
    .populate('category', 'slug name icon color')
    .populate('pestsAndDiseases')
    .populate('verification.verifiedBy', 'name role')
    .lean();
  if (!plant || (!plant.isPublished && !isStaff(req.user))) throw ApiError.notFound('Plant not found');
  Plant.updateOne({ _id: plant._id }, { $inc: { viewCount: 1 } }).catch(() => {});
  let isFavorite = false;
  if (req.user) isFavorite = (req.user.favorites || []).some((f) => f.toString() === plant._id.toString());
  res.json({ success: true, plant, isFavorite });
}

async function create(req, res) {
  const body = req.valid.body;
  if (!(await Category.exists({ _id: body.category }))) throw ApiError.badRequest('Category does not exist');
  if (!body.plantCode) body.plantCode = `PM-${String(await Counter.next('plant')).padStart(4, '0')}`;
  const plant = await Plant.create({ ...body, createdBy: req.user._id, updatedBy: req.user._id });
  await audit.record({ entityType: 'plant', entityId: plant._id, action: 'created', actor: req.user, after: plant });
  res.status(201).json({ success: true, plant });
}

async function update(req, res) {
  const plant = await Plant.findById(req.valid.params.id);
  if (!plant) throw ApiError.notFound('Plant not found');
  const before = plant.toObject();
  const body = { ...req.valid.body };
  if (body.category && !(await Category.exists({ _id: body.category }))) throw ApiError.badRequest('Category does not exist');

  // Changing content resets verification unless the editor sets it explicitly.
  const verificationTouched = body.verification && body.verification.status;
  plant.set(body);
  if (!verificationTouched && plant.verification.status === 'verified') {
    plant.verification.status = 'needs_review';
    plant.verification.verifiedBy = undefined;
    plant.verification.verifiedAt = undefined;
  }
  if (verificationTouched && body.verification.status === 'verified') {
    plant.verification.verifiedBy = req.user._id;
    plant.verification.verifiedAt = new Date();
  }
  plant.updatedBy = req.user._id;
  await plant.save();
  await audit.record({ entityType: 'plant', entityId: plant._id, action: 'updated', actor: req.user, before, after: plant });
  res.json({ success: true, plant });
}

async function verify(req, res) {
  const { status, notes, uncertainFields } = req.valid.body;
  const plant = await Plant.findById(req.valid.params.id);
  if (!plant) throw ApiError.notFound('Plant not found');
  const before = plant.verification.toObject();
  plant.verification.status = status;
  if (notes !== undefined) plant.verification.notes = notes;
  if (uncertainFields) plant.verification.uncertainFields = uncertainFields;
  plant.verification.verifiedBy = status === 'verified' ? req.user._id : undefined;
  plant.verification.verifiedAt = status === 'verified' ? new Date() : undefined;
  await plant.save();
  await audit.record({ entityType: 'plant', entityId: plant._id, action: 'verified', actor: req.user, before, after: plant.verification });
  res.json({ success: true, plant });
}

async function remove(req, res) {
  const plant = await Plant.findById(req.valid.params.id);
  if (!plant) throw ApiError.notFound('Plant not found');
  const { UserPlant, ProblemReport } = require('../models');
  const inUse = (await UserPlant.exists({ plant: plant._id })) || (await ProblemReport.exists({ plant: plant._id }));
  if (inUse) {
    // Keep history intact: unpublish instead of deleting.
    plant.isPublished = false;
    await plant.save();
    await audit.record({ entityType: 'plant', entityId: plant._id, action: 'status_changed', actor: req.user, note: 'Unpublished (in use, not deleted)' });
    return res.json({ success: true, unpublished: true, message: 'Plant is in use by users, so it was unpublished instead of deleted' });
  }
  await Promise.all(plant.images.map((img) => storage.deleteImage(img)));
  await plant.deleteOne();
  await User.updateMany({ favorites: plant._id }, { $pull: { favorites: plant._id } });
  await audit.record({ entityType: 'plant', entityId: plant._id, action: 'deleted', actor: req.user, before: plant });
  res.json({ success: true, deleted: true });
}

async function addImages(req, res) {
  const plant = await Plant.findById(req.valid.params.id);
  if (!plant) throw ApiError.notFound('Plant not found');
  if (!req.files?.length) throw ApiError.badRequest('Please choose at least one image');
  if (plant.images.length + req.files.length > 12) throw ApiError.badRequest('A plant can have at most 12 images');
  const saved = await storage.saveImages(req.files, 'plants');
  const caption = typeof req.body.caption === 'string' ? req.body.caption.slice(0, 200) : '';
  saved.forEach((s) => plant.images.push({ ...s, caption }));
  plant.updatedBy = req.user._id;
  await plant.save();
  res.status(201).json({ success: true, images: plant.images });
}

async function removeImage(req, res) {
  const { id, imageId } = req.valid.params;
  const plant = await Plant.findById(id);
  if (!plant) throw ApiError.notFound('Plant not found');
  const img = plant.images.id(imageId);
  if (!img) throw ApiError.notFound('Image not found');
  await storage.deleteImage(img);
  img.deleteOne();
  await plant.save();
  res.json({ success: true, images: plant.images });
}

/* Favorites */
async function listFavorites(req, res) {
  const user = await User.findById(req.user._id)
    .populate({ path: 'favorites', select: CARD_FIELDS, match: { isPublished: true }, populate: { path: 'category', select: 'slug name icon color' } })
    .lean();
  res.json({ success: true, items: (user.favorites || []).filter(Boolean) });
}

async function addFavorite(req, res) {
  const { id } = req.valid.params;
  if (!(await Plant.exists({ _id: id, isPublished: true }))) throw ApiError.notFound('Plant not found');
  await User.updateOne({ _id: req.user._id }, { $addToSet: { favorites: id } });
  res.json({ success: true, isFavorite: true });
}

async function removeFavorite(req, res) {
  await User.updateOne({ _id: req.user._id }, { $pull: { favorites: req.valid.params.id } });
  res.json({ success: true, isFavorite: false });
}

module.exports = { list, recommended, getOne, create, update, verify, remove, addImages, removeImage, listFavorites, addFavorite, removeFavorite };
