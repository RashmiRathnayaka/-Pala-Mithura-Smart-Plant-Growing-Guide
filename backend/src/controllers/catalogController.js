/** Plant categories and the disease / pest knowledge base. */
const { Category, Disease, Plant, Counter } = require('../models');
const ApiError = require('../utils/ApiError');
const storage = require('../services/storageService');
const audit = require('../services/auditService');

/* ── Categories ───────────────────────────────────────── */
async function listCategories(_req, res) {
  const cats = await Category.find({ isActive: true }).sort({ order: 1, 'name.en': 1 }).lean();
  const counts = await Plant.aggregate([{ $match: { isPublished: true } }, { $group: { _id: '$category', n: { $sum: 1 } } }]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({ success: true, items: cats.map((c) => ({ ...c, plantCount: byId[String(c._id)] || 0 })) });
}

async function createCategory(req, res) {
  const cat = await Category.create(req.valid.body);
  await audit.record({ entityType: 'category', entityId: cat._id, action: 'created', actor: req.user, after: cat });
  res.status(201).json({ success: true, category: cat });
}

async function updateCategory(req, res) {
  const cat = await Category.findById(req.valid.params.id);
  if (!cat) throw ApiError.notFound('Category not found');
  const before = cat.toObject();
  cat.set(req.valid.body);
  await cat.save();
  await audit.record({ entityType: 'category', entityId: cat._id, action: 'updated', actor: req.user, before, after: cat });
  res.json({ success: true, category: cat });
}

async function deleteCategory(req, res) {
  const cat = await Category.findById(req.valid.params.id);
  if (!cat) throw ApiError.notFound('Category not found');
  if (await Plant.exists({ category: cat._id })) {
    throw ApiError.conflict('Move or delete the plants in this category first', 'CATEGORY_IN_USE');
  }
  if (cat.image) await storage.deleteImage(cat.image);
  await cat.deleteOne();
  await audit.record({ entityType: 'category', entityId: cat._id, action: 'deleted', actor: req.user, before: cat });
  res.json({ success: true });
}

async function setCategoryImage(req, res) {
  const cat = await Category.findById(req.valid.params.id);
  if (!cat) throw ApiError.notFound('Category not found');
  if (!req.file) throw ApiError.badRequest('Please choose an image');
  const old = cat.image;
  cat.image = await storage.saveImage(req.file, 'categories');
  await cat.save();
  if (old) await storage.deleteImage(old);
  res.json({ success: true, category: cat });
}

/* ── Diseases / pests ─────────────────────────────────── */
async function listDiseases(req, res) {
  const filter = { isActive: true };
  if (req.query.plant) filter.plants = req.query.plant;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ 'name.si': rx }, { 'name.en': rx }, { causalAgent: rx }, { code: rx }];
  }
  const items = await Disease.find(filter).populate('plants', 'name plantCode').sort({ 'name.en': 1 }).lean();
  res.json({ success: true, items });
}

async function getDisease(req, res) {
  const d = await Disease.findById(req.valid.params.id).populate('plants', 'name plantCode images').lean();
  if (!d) throw ApiError.notFound('Disease not found');
  res.json({ success: true, disease: d });
}

/** Keeps Plant.pestsAndDiseases in sync with Disease.plants. */
async function syncPlantLinks(disease, previousPlantIds = []) {
  const now = disease.plants.map(String);
  const removed = previousPlantIds.map(String).filter((id) => !now.includes(id));
  await Plant.updateMany({ _id: { $in: now } }, { $addToSet: { pestsAndDiseases: disease._id } });
  if (removed.length) await Plant.updateMany({ _id: { $in: removed } }, { $pull: { pestsAndDiseases: disease._id } });
}

async function createDisease(req, res) {
  const body = { ...req.valid.body };
  if (!body.code) body.code = `DZ-${String(await Counter.next('disease')).padStart(4, '0')}`;
  const d = await Disease.create(body);
  await syncPlantLinks(d);
  await audit.record({ entityType: 'disease', entityId: d._id, action: 'created', actor: req.user, after: d });
  res.status(201).json({ success: true, disease: d });
}

async function updateDisease(req, res) {
  const d = await Disease.findById(req.valid.params.id);
  if (!d) throw ApiError.notFound('Disease not found');
  const before = d.toObject();
  const body = req.valid.body;
  d.set(body);
  if (body.verification?.status === 'verified') {
    d.verification.verifiedBy = req.user._id;
    d.verification.verifiedAt = new Date();
  }
  await d.save();
  await syncPlantLinks(d, before.plants);
  await audit.record({ entityType: 'disease', entityId: d._id, action: 'updated', actor: req.user, before, after: d });
  res.json({ success: true, disease: d });
}

async function deleteDisease(req, res) {
  const d = await Disease.findById(req.valid.params.id);
  if (!d) throw ApiError.notFound('Disease not found');
  await Plant.updateMany({ pestsAndDiseases: d._id }, { $pull: { pestsAndDiseases: d._id } });
  await Promise.all(d.images.map((i) => storage.deleteImage(i)));
  await d.deleteOne();
  await audit.record({ entityType: 'disease', entityId: d._id, action: 'deleted', actor: req.user, before: d });
  res.json({ success: true });
}

async function addDiseaseImages(req, res) {
  const d = await Disease.findById(req.valid.params.id);
  if (!d) throw ApiError.notFound('Disease not found');
  if (!req.files?.length) throw ApiError.badRequest('Please choose at least one image');
  const saved = await storage.saveImages(req.files, 'diseases');
  saved.forEach((s) => d.images.push(s));
  await d.save();
  res.status(201).json({ success: true, images: d.images });
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryImage,
  listDiseases,
  getDisease,
  createDisease,
  updateDisease,
  deleteDisease,
  addDiseaseImages,
};
