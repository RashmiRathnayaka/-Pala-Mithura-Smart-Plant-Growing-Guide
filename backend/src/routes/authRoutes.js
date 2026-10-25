const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const env = require('../config/env');
const c = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { z } = require('../validators/common');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please try again later.' } },
});

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().max(200),
  password,
  phone: z.string().trim().max(20).optional().default(''),
  district: z.string().trim().max(60).optional().default(''),
  language: z.enum(['si', 'en']).optional().default('si'),
});

const loginSchema = z.object({ email: z.email().trim(), password: z.string().min(1).max(128) });

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  district: z.string().trim().max(60).optional(),
  agroZone: z.string().trim().max(30).optional(),
  language: z.enum(['si', 'en']).optional(),
  instructorProfile: z
    .object({
      qualification: z.string().trim().max(200).optional(),
      organization: z.string().trim().max(200).optional(),
      serviceArea: z.string().trim().max(200).optional(),
    })
    .optional(),
});

router.post('/register', authLimiter, validate({ body: registerSchema }), c.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), c.login);
router.get('/me', protect, c.me);
router.patch('/me', protect, validate({ body: updateSchema }), c.updateMe);
router.patch(
  '/me/password',
  protect,
  validate({ body: z.object({ currentPassword: z.string().min(1), newPassword: password }) }),
  c.changePassword
);
router.post('/me/avatar', protect, ...uploadImage('avatar'), c.uploadAvatar);
router.put('/me/push-token', protect, validate({ body: z.object({ token: z.string().max(300).optional() }) }), c.setPushToken);

module.exports = router;
