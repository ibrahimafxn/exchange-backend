const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/attribution.controller');

router.post('/', auth, authorize(['ADMIN','DIRIGEANT','GESTION_DEPOT']), ctrl.createAttribution);
router.get('/', auth, authorize(), ctrl.list);
router.get('/history', auth, authorize(), ctrl.history);

module.exports = router;
