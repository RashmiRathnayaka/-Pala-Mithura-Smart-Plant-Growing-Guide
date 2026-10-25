const express = require('express');
const c = require('../controllers/catalogController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, uploadImages } = require('../middleware/upload');
const { z, objectId, idParam, localized, localizedList } = require('../validators/common');
const { SYMPTOMS, PLANT_PARTS, VERIFICATION } = require('../utils/constants');

const admin = authorize('admin');
const staff = authorize('admin', 'instructor');

/* Categories */
const categoryBody = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes').max(40),
  name: z.object({ si: z.string().trim().min(1).max(80), en: z.string().trim().min(1).max(80) }),
  description: localized.optional(),
  icon: z.string().trim().max(40).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const categories = express.Router();
categories.get('/', c.listCategories);
categories.post('/', protect, admin, validate({ body: categoryBody }), c.createCategory);
categories.patch('/:id', protect, admin, validate({ params: idParam, body: categoryBody.partial() }), c.updateCategory);
categories.delete('/:id', protect, admin, validate({ params: idParam }), c.deleteCategory);
categories.post('/:id/image', protect, admin, validate({ params: idParam }), ...uploadImage('image'), c.setCategoryImage);

/* Diseases / pests */
const diseaseBody = z.object({
  code: z.string().trim().max(20).optional(),
  name: z.object({ si: z.string().trim().min(1).max(150), en: z.string().trim().min(1).max(150) }),
  causalAgent: z.string().trim().max(200).optional(),
  type: z.enum(['fungal', 'bacterial', 'viral', 'phytoplasma', 'pest', 'deficiency', 'environmental']),
  vector: localized.optional(),
  affectedParts: z.array(z.enum(PLANT_PARTS)).optional(),
  symptomKeys: z.array(z.enum(SYMPTOMS)).optional(),
  symptoms: localizedList.optional(),
  prevention: localizedList.optional(),
  treatment: localizedList.optional(),
  safety: localizedList.optional(),
  plants: z.array(objectId).optional(),
  verification: z
    .object({
      status: z.enum(VERIFICATION).optional(),
      notes: z.string().max(2000).optional(),
      sources: z.array(z.object({ title: z.string().min(1).max(300), url: z.string().max(500).optional() })).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

const diseases = express.Router();
diseases.get('/', c.listDiseases);
diseases.get('/:id', validate({ params: idParam }), c.getDisease);
diseases.post('/', protect, admin, validate({ body: diseaseBody }), c.createDisease);
diseases.patch('/:id', protect, staff, validate({ params: idParam, body: diseaseBody.partial() }), c.updateDisease);
diseases.delete('/:id', protect, admin, validate({ params: idParam }), c.deleteDisease);
diseases.post('/:id/images', protect, staff, validate({ params: idParam }), ...uploadImages('images', 6), c.addDiseaseImages);

module.exports = { categories, diseases };
