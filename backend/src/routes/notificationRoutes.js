const router = require('express').Router();
const { Notification } = require('../models');
const ApiError = require('../utils/ApiError');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { idParam } = require('../validators/common');

router.use(protect);

router.get('/', async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.readAt = null;
  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const unread = await Notification.countDocuments({ user: req.user._id, readAt: null });
  res.json({ success: true, items, unread });
});

router.get('/unread-count', async (req, res) => {
  res.json({ success: true, unread: await Notification.countDocuments({ user: req.user._id, readAt: null }) });
});

router.patch('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ success: true });
});

router.patch('/:id/read', validate({ params: idParam }), async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.valid.params.id, user: req.user._id },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!n) throw ApiError.notFound('Notification not found');
  res.json({ success: true, notification: n });
});

module.exports = router;
