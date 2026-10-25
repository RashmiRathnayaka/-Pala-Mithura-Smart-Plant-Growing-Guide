const router = require('express').Router();
const c = require('../controllers/instructorController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { z, idParam } = require('../validators/common');

/**
 * Review body, validated per decision:
 *  accepted → optional comment
 *  modified → full edited content + required explanation of the changes
 *  rejected → required reason; optional alternative advice / request for more information
 */
const reviewBody = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal('accepted'),
    comment: z.string().trim().max(2000).optional(),
    publish: z.boolean().optional(),
  }),
  z.object({
    decision: z.literal('modified'),
    content: z.record(z.string(), z.any()),
    changeExplanation: z.string().trim().min(5, 'Please explain what you changed and why').max(3000),
    comment: z.string().trim().max(2000).optional(),
    publish: z.boolean().optional(),
  }),
  z.object({
    decision: z.literal('rejected'),
    rejectionReason: z.string().trim().min(5, 'A rejection reason is required').max(3000),
    alternativeRecommendation: z.string().trim().max(5000).optional(),
    additionalInfoRequested: z.string().trim().max(2000).optional(),
    comment: z.string().trim().max(2000).optional(),
    publish: z.boolean().optional(),
  }),
]);

// Only Agricultural Instructors (and admins, for oversight) can use these routes.
router.use(protect, authorize('instructor', 'admin'));

router.get('/dashboard', c.dashboard);
router.get('/queue', c.queue);
router.get('/history', c.history);
router.get('/recommendations/:id', validate({ params: idParam }), c.getOne);
router.get('/recommendations/:id/audit', validate({ params: idParam }), c.auditTrail);
// Decisions are restricted to instructors.
router.post('/recommendations/:id/review', authorize('instructor'), validate({ params: idParam, body: reviewBody }), c.review);
router.post('/recommendations/:id/publish', authorize('instructor'), validate({ params: idParam }), c.publish);
router.post('/recommendations/:id/regenerate', validate({ params: idParam }), c.regenerate);

module.exports = router;
