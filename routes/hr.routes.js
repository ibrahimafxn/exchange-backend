const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/hr.controller');

router.post('/docs', auth, authorize(['ADMIN','DIRIGEANT','GESTION_DEPOT']), ctrl.createDoc);
router.get('/docs', auth, authorize(['ADMIN','DIRIGEANT','GESTION_DEPOT']), ctrl.listDocs);
router.delete('/docs/:id', auth, authorize(['ADMIN','DIRIGEANT']), ctrl.remove);

module.exports = router;
