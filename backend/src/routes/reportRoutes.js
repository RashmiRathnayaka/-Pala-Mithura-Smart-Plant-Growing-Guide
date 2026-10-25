const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const env = require('../config/env');
const c = require('../controllers/reportController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');
const { z, objectId, idParam, arrayField, optionalNumber } = require('../validators/common');
const { SYMPTOMS, PLANT_PARTS, GROWTH_STAGES } = require('../utils/constants');

// AI calls cost money – limit how often one user can submit.
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  keyGenerator: (req) => (req.user ? String(req.user._id) : ipKeyGenerator(req.ip)),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many reports in a short time. Please try again later.' } },
});

const reportBody = z.object({
  plant: objectId,
  userPlant: z.preprocess((v) => (v === '' || v === 'null' ? undefined : v), objectId.optional()),
  symptoms: arrayField(z.enum(SYMPTOMS)).default([]),
  affectedParts: arrayField(z.enum(PLANT_PARTS)).default([]),
  description: z.string().trim().max(3000).optional().default(''),
  durationDays: optionalNumber(z.coerce.number().int().min(0).max(3650)),
  growthStage: z.preprocess((v) => (v === '' ? undefined : v), z.enum(GROWTH_STAGES).optional()),
  district: z.string().trim().max(60).optional(),
  recentWeather: z.string().trim().max(300).optional(),
  language: z.enum(['si', 'en']).optional(),
});

const reports = express.Router();
reports.use(protect);
// multer must run before validation so multipart text fields are on req.body
reports.post('/', reportLimiter, ...uploadImages('photos', 6), validate({ body: reportBody }), c.submit);
reports.get('/', c.listMine);
reports.get('/:id', validate({ params: idParam }), c.getReport);

const recommendations = express.Router();
recommendations.use(protect);
recommendations.get('/', c.myRecommendations);
recommendations.get('/:id', validate({ params: idParam }), c.getRecommendation);

module.exports = { reports, recommendations };
