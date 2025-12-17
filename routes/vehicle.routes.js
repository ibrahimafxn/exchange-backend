const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/vehicle.controller');
const ROLES = require('../config/roles');

router.get('/', auth, authorize(), ctrl.list);

router.post(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.create
);

router.get('/:id', auth, authorize(), ctrl.get);

router.put(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.update
);

router.delete(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  ctrl.remove
);

module.exports = router;
