const { z } = require('zod');
const mongoose = require('mongoose');

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid id');
const idParam = z.object({ id: objectId });

const localized = z
  .object({ si: z.string().trim().max(5000).optional().default(''), en: z.string().trim().max(5000).optional().default('') })
  .partial();

const localizedList = z
  .object({ si: z.array(z.string().trim().max(1000)).optional(), en: z.array(z.string().trim().max(1000)).optional() })
  .partial();

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

/** Multipart forms send arrays as JSON strings or repeated fields – accept both. */
const arrayField = (item) =>
  z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      const s = v.trim();
      if (s.startsWith('[')) {
        try {
          return JSON.parse(s);
        } catch {
          return [s];
        }
      }
      return s.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return [v];
  }, z.array(item));

const optionalNumber = (schema) =>
  z.preprocess((v) => (v === '' || v === null || v === undefined || v === 'null' ? undefined : v), schema.optional());

module.exports = { z, objectId, idParam, localized, localizedList, pagination, arrayField, optionalNumber };
