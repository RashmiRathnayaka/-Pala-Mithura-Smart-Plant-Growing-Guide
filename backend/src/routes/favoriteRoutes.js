const router = require('express').Router();
const c = require('../controllers/plantController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { idParam } = require('../validators/common');

router.use(protect);
router.get('/', c.listFavorites);
router.post('/:id', validate({ params: idParam }), c.addFavorite);
router.delete('/:id', validate({ params: idParam }), c.removeFavorite);

module.exports = router;
