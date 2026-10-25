const { z, objectId, localized, localizedList, pagination } = require('./common');
const { GROWTH_STAGES, AGRO_ZONES, VERIFICATION } = require('../utils/constants');

const num = z.number().finite().nullable().optional();
const range = z.object({ min: num, max: num }).nullable().optional();

const plantBody = z.object({
  plantCode: z.string().trim().min(2).max(20).optional(),
  name: z.object({ si: z.string().trim().min(1).max(100), en: z.string().trim().min(1).max(100) }),
  scientificName: z.string().trim().min(2).max(150),
  family: z.string().trim().max(100).optional(),
  category: objectId,
  description: localized.optional(),
  uses: localizedList.optional(),
  varieties: z.array(z.string().trim().max(100)).max(50).optional(),
  season: z
    .object({ keys: z.array(z.enum(['yala', 'maha', 'year_round'])).optional(), text: localized.optional() })
    .optional(),
  soil: z
    .object({ type: localized.optional(), phMin: num, phMax: num, preparation: localized.optional() })
    .optional(),
  sunlight: z
    .object({ level: z.enum(['full_sun', 'partial_shade', 'shade']).nullable().optional(), notes: localized.optional() })
    .optional(),
  temperature: z.object({ minC: num, maxC: num, optimalMinC: num, optimalMaxC: num }).optional(),
  watering: z
    .object({
      intervalDays: z.number().int().min(1).max(60).nullable().optional(),
      intervalIsEstimate: z.boolean().optional(),
      quantity: localized.optional(),
      notes: localized.optional(),
    })
    .optional(),
  fertilizer: z
    .object({
      summary: localized.optional(),
      applications: z
        .array(
          z.object({
            timing: localized,
            daysAfterPlanting: z.number().int().min(-60).max(3650).nullable().optional(),
            products: z
              .array(z.object({ name: z.string().trim().min(1).max(80), rate: num, unit: z.string().trim().max(30).optional() }))
              .optional(),
            note: localized.optional(),
          })
        )
        .max(20)
        .optional(),
      organicOptions: localizedList.optional(),
      notes: localized.optional(),
    })
    .optional(),
  spacing: z.object({ plantCm: num, rowCm: num, notes: localized.optional() }).optional(),
  planting: z
    .object({
      method: z.enum(['direct_seeding', 'transplanting', 'vegetative', 'grafted']).nullable().optional(),
      depthCm: num,
      seedRate: localized.optional(),
      nurseryDays: range,
      germinationDays: range,
      notes: localized.optional(),
    })
    .optional(),
  growthDurationDays: range,
  harvest: z
    .object({ startDays: num, endDays: num, intervalDays: num, notes: localized.optional() })
    .optional(),
  growthStages: z
    .array(z.object({ stage: z.enum(GROWTH_STAGES), startDay: z.number().int().min(0), endDay: z.number().int().min(0).nullable().optional() }))
    .optional(),
  pestsAndDiseases: z.array(objectId).optional(),
  regions: z
    .object({ zones: z.array(z.enum(AGRO_ZONES)).optional(), districts: z.array(z.string().max(60)).optional(), climate: localized.optional() })
    .optional(),
  verification: z
    .object({
      status: z.enum(VERIFICATION).optional(),
      notes: z.string().max(2000).optional(),
      uncertainFields: z.array(z.string().max(80)).optional(),
      sources: z.array(z.object({ title: z.string().min(1).max(300), url: z.string().max(500).optional() })).optional(),
    })
    .optional(),
  isPublished: z.boolean().optional(),
});

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(), // id or slug
  season: z.enum(['yala', 'maha', 'year_round']).optional(),
  zone: z.enum(AGRO_ZONES).optional(),
  verification: z.enum(VERIFICATION).optional(),
  sort: z.enum(['popular', 'recent', 'name']).optional().default('name'),
  includeUnpublished: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  ...pagination,
});

module.exports = { plantBody, plantUpdate: plantBody.partial(), listQuery };
