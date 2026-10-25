const router = require('express').Router();
const c = require('../controllers/myPlantController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');
const { z, objectId, idParam } = require('../validators/common');
const { GROWTH_STAGES } = require('../utils/constants');

const pastOrToday = z.coerce.date().refine((d) => d <= new Date(Date.now() + 24 * 3600 * 1000), 'Date cannot be in the future');

const reminders = z.object({
  watering: z.boolean().optional(),
  wateringIntervalDays: z.number().int().min(1).max(60).nullable().optional(),
  fertilizer: z.boolean().optional(),
  harvest: z.boolean().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
});

const createBody = z.object({
  plant: objectId,
  nickname: z.string().trim().max(60).optional(),
  plantingDate: z.coerce.date(), // future dates are allowed so users can plan an upcoming planting
  location: z
    .object({ district: z.string().trim().max(60).optional(), area: z.string().trim().max(120).optional(), agroZone: z.string().trim().max(30).optional() })
    .optional(),
  quantity: z.number().int().min(1).max(100000).optional(),
  growthStage: z.enum(GROWTH_STAGES).optional(),
  reminders: reminders.optional(),
});

const updateBody = createBody.omit({ plant: true }).partial().extend({
  status: z.enum(['active', 'harvested', 'archived']).optional(),
});

router.use(protect);
router.get('/', c.list);
router.get('/reminders', c.reminders);
router.post('/', validate({ body: createBody }), c.create);
router.get('/:id', validate({ params: idParam }), c.getOne);
router.patch('/:id', validate({ params: idParam, body: updateBody }), c.update);
router.delete('/:id', validate({ params: idParam }), c.remove);
router.get('/:id/timeline', validate({ params: idParam }), c.timeline);

router.post(
  '/:id/watering',
  validate({ params: idParam, body: z.object({ date: pastOrToday.optional(), amount: z.string().max(60).optional(), note: z.string().max(300).optional() }) }),
  c.logWatering
);
router.post(
  '/:id/fertilizer',
  validate({
    params: idParam,
    body: z.object({
      date: pastOrToday.optional(),
      type: z.string().trim().min(1).max(80),
      quantity: z.string().trim().max(60).optional(),
      note: z.string().max(300).optional(),
    }),
  }),
  c.logFertilizer
);
router.post('/:id/notes', validate({ params: idParam, body: z.object({ text: z.string().trim().min(1).max(2000), isProblem: z.boolean().optional() }) }), c.addNote);
router.post('/:id/photos', validate({ params: idParam }), ...uploadImages('photos', 6), c.addPhotos);
router.delete('/:id/photos/:entryId', validate({ params: z.object({ id: objectId, entryId: objectId }) }), c.deletePhoto);
router.delete(
  '/:id/:kind/:entryId',
  validate({ params: z.object({ id: objectId, kind: z.enum(['watering', 'fertilizer', 'notes']), entryId: objectId }) }),
  c.deleteLogEntry
);

module.exports = router;
