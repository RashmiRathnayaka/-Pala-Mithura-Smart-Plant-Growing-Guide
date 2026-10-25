const router = require('express').Router();
const c = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { z, idParam } = require('../validators/common');
const { ROLES } = require('../utils/constants');

const password = z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/\d/);
const instructorProfile = z
  .object({
    qualification: z.string().trim().max(200).optional(),
    organization: z.string().trim().max(200).optional(),
    serviceArea: z.string().trim().max(200).optional(),
  })
  .optional();

router.use(protect, authorize('admin'));

router.get('/stats', c.stats);
router.get('/activity', c.activity);
router.get(
  '/users',
  validate({
    query: z.object({
      q: z.string().trim().max(100).optional(),
      role: z.enum(Object.values(ROLES)).optional(),
      active: z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? undefined : v === 'true')),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(30),
    }),
  }),
  c.listUsers
);
router.post(
  '/users',
  validate({
    body: z.object({
      name: z.string().trim().min(2).max(100),
      email: z.email().trim(),
      password,
      role: z.enum(Object.values(ROLES)).default(ROLES.INSTRUCTOR),
      phone: z.string().trim().max(20).optional(),
      district: z.string().trim().max(60).optional(),
      instructorProfile,
    }),
  }),
  c.createUser
);
router.patch(
  '/users/:id',
  validate({
    params: idParam,
    body: z.object({
      role: z.enum(Object.values(ROLES)).optional(),
      isActive: z.boolean().optional(),
      name: z.string().trim().min(2).max(100).optional(),
      district: z.string().trim().max(60).optional(),
      instructorProfile,
    }),
  }),
  c.updateUser
);
router.post('/users/:id/reset-password', validate({ params: idParam, body: z.object({ newPassword: password }) }), c.resetPassword);

module.exports = router;
