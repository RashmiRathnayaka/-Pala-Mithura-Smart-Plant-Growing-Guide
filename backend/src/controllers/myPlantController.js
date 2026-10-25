/** "My Plants" – the user's growing tracker (spec §5). */
const { UserPlant, Plant } = require('../models');
const ApiError = require('../utils/ApiError');
const storage = require('../services/storageService');
const { computeSchedule, buildTimeline } = require('../services/reminderService');
const { zoneForDistrict } = require('../utils/srilanka');

const PLANT_FIELDS = 'plantCode name scientificName images watering fertilizer.applications harvest growthStages growthDurationDays category';

/** Loads a user plant that belongs to the requester (users can never see others' plants). */
async function ownPlant(req, populate = true) {
  let q = UserPlant.findOne({ _id: req.valid.params.id, user: req.user._id });
  if (populate) q = q.populate('plant', PLANT_FIELDS);
  const up = await q;
  if (!up) throw ApiError.notFound('Plant not found in your garden');
  return up;
}

function withSchedule(up) {
  const obj = up.toObject ? up.toObject() : up;
  const plant = obj.plant && obj.plant.name ? obj.plant : null;
  return { ...obj, schedule: plant ? computeSchedule(obj, plant) : null };
}

async function list(req, res) {
  const status = req.query.status || 'active';
  const items = await UserPlant.find({ user: req.user._id, ...(status === 'all' ? {} : { status }) })
    .populate('plant', PLANT_FIELDS)
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, items: items.map(withSchedule) });
}

async function create(req, res) {
  const body = req.valid.body;
  const plant = await Plant.findOne({ _id: body.plant, isPublished: true }).select('_id').lean();
  if (!plant) throw ApiError.badRequest('Selected plant does not exist');
  const district = body.location?.district || req.user.district || '';
  const up = await UserPlant.create({
    ...body,
    user: req.user._id,
    location: {
      district,
      area: body.location?.area || '',
      agroZone: body.location?.agroZone || req.user.agroZone || zoneForDistrict(district) || '',
    },
  });
  await up.populate('plant', PLANT_FIELDS);
  res.status(201).json({ success: true, userPlant: withSchedule(up) });
}

async function getOne(req, res) {
  const up = await ownPlant(req);
  res.json({ success: true, userPlant: withSchedule(up) });
}

async function update(req, res) {
  const up = await ownPlant(req, false);
  const body = req.valid.body;
  if (body.growthStage && body.growthStage !== up.growthStage) up.growthStageUpdatedAt = new Date();
  if (body.reminders) up.reminders = { ...up.reminders.toObject(), ...body.reminders };
  const { reminders, ...rest } = body;
  up.set(rest);
  await up.save();
  await up.populate('plant', PLANT_FIELDS);
  res.json({ success: true, userPlant: withSchedule(up) });
}

async function remove(req, res) {
  const up = await ownPlant(req, false);
  if (req.query.hard === 'true') {
    await Promise.all(up.photos.map((p) => storage.deleteImage(p)));
    await up.deleteOne();
    return res.json({ success: true, deleted: true });
  }
  up.status = 'archived';
  await up.save();
  res.json({ success: true, archived: true });
}

async function logWatering(req, res) {
  const up = await ownPlant(req, false);
  const date = req.valid.body.date || new Date();
  up.wateringLog.push({ date, amount: req.valid.body.amount || '', note: req.valid.body.note || '' });
  if (up.wateringLog.length > 500) up.wateringLog.splice(0, up.wateringLog.length - 500);
  if (!up.lastWateredAt || date > up.lastWateredAt) up.lastWateredAt = date;
  await up.save();
  await up.populate('plant', PLANT_FIELDS);
  res.status(201).json({ success: true, userPlant: withSchedule(up) });
}

async function logFertilizer(req, res) {
  const up = await ownPlant(req, false);
  up.fertilizerLog.push({ date: req.valid.body.date || new Date(), ...req.valid.body });
  await up.save();
  await up.populate('plant', PLANT_FIELDS);
  res.status(201).json({ success: true, userPlant: withSchedule(up) });
}

async function deleteLogEntry(req, res) {
  const up = await ownPlant(req, false);
  const { kind, entryId } = req.valid.params;
  const arr = { watering: up.wateringLog, fertilizer: up.fertilizerLog, notes: up.notes }[kind];
  const entry = arr.id(entryId);
  if (!entry) throw ApiError.notFound('Entry not found');
  entry.deleteOne();
  if (kind === 'watering') {
    up.lastWateredAt = up.wateringLog.reduce((max, w) => (!max || w.date > max ? w.date : max), null);
  }
  await up.save();
  res.json({ success: true });
}

async function addPhotos(req, res) {
  const up = await ownPlant(req, false);
  if (!req.files?.length) throw ApiError.badRequest('Please choose at least one photo');
  if (up.photos.length + req.files.length > 60) throw ApiError.badRequest('Photo limit reached for this plant');
  const saved = await storage.saveImages(req.files, 'progress');
  const caption = typeof req.body.caption === 'string' ? req.body.caption.slice(0, 300) : '';
  saved.forEach((s) => up.photos.push({ ...s, caption }));
  await up.save();
  res.status(201).json({ success: true, photos: up.photos });
}

async function deletePhoto(req, res) {
  const up = await ownPlant(req, false);
  const photo = up.photos.id(req.valid.params.entryId);
  if (!photo) throw ApiError.notFound('Photo not found');
  await storage.deleteImage(photo);
  photo.deleteOne();
  await up.save();
  res.json({ success: true });
}

async function addNote(req, res) {
  const up = await ownPlant(req, false);
  up.notes.push({ text: req.valid.body.text, isProblem: !!req.valid.body.isProblem, date: new Date() });
  await up.save();
  res.status(201).json({ success: true, notes: up.notes });
}

async function timeline(req, res) {
  const up = await ownPlant(req);
  res.json({ success: true, ...buildTimeline(up.toObject(), up.plant.toObject()), schedule: computeSchedule(up.toObject(), up.plant.toObject()) });
}

/** All upcoming reminders across the user's active plants (the app schedules them as local notifications). */
async function reminders(req, res) {
  const items = await UserPlant.find({ user: req.user._id, status: 'active' }).populate('plant', PLANT_FIELDS).lean();
  const all = [];
  for (const up of items) {
    if (!up.plant) continue;
    const s = computeSchedule(up, up.plant);
    s.upcoming.forEach((r) =>
      all.push({ ...r, userPlantId: up._id, plantName: up.plant.name, nickname: up.nickname })
    );
  }
  all.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  res.json({ success: true, items: all });
}

module.exports = {
  list,
  create,
  getOne,
  update,
  remove,
  logWatering,
  logFertilizer,
  deleteLogEntry,
  addPhotos,
  deletePhoto,
  addNote,
  timeline,
  reminders,
};
