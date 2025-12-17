const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/hr.controller');
const ROLES = require('../config/roles');

router.post(
  '/docs',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.createDoc
);

router.get(
  '/docs',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.listDocs
);

router.delete(
  '/docs/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  ctrl.remove
);

module.exports = router;
