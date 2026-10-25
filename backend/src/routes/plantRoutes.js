const router = require('express').Router();
const c = require('../controllers/plantController');
const validate = require('../middleware/validate');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');
const { z, objectId, idParam } = require('../validators/common');
const { plantBody, plantUpdate, listQuery } = require('../validators/plantValidators');
const { VERIFICATION } = require('../utils/constants');

const staff = authorize('admin', 'instructor');

router.get('/', optionalAuth, validate({ query: listQuery }), c.list);
router.get('/recommended', optionalAuth, c.recommended);
router.get('/:id', optionalAuth, validate({ params: z.object({ id: z.string().min(2).max(40) }) }), c.getOne);

router.post('/', protect, authorize('admin'), validate({ body: plantBody }), c.create);
router.patch('/:id', protect, staff, validate({ params: idParam, body: plantUpdate }), c.update);
router.delete('/:id', protect, authorize('admin'), validate({ params: idParam }), c.remove);
router.post(
  '/:id/verify',
  protect,
  staff,
  validate({
    params: idParam,
    body: z.object({
      status: z.enum(VERIFICATION),
      notes: z.string().max(2000).optional(),
      uncertainFields: z.array(z.string().max(80)).optional(),
    }),
  }),
  c.verify
);
router.post('/:id/images', protect, staff, validate({ params: idParam }), ...uploadImages('images', 6), c.addImages);
router.delete('/:id/images/:imageId', protect, staff, validate({ params: z.object({ id: objectId, imageId: objectId }) }), c.removeImage);

module.exports = router;
