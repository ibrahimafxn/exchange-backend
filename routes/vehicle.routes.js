const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ROLES = require('../config/roles');

const ctrl = require('../controllers/vehicle.controller');

router.get('/', auth, authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]), ctrl.list);
router.get('/:id', auth, authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]), ctrl.getById);

router.post('/', auth, authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]), ctrl.createValidators, ctrl.create);
router.put('/:id', auth, authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]), ctrl.update);
router.delete('/:id', auth, authorize([ROLES.ADMIN, ROLES.DIRIGEANT]), ctrl.remove);

// transactions avec historique
router.put('/:id/assign', auth, authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]), ctrl.assignValidators, ctrl.assign);
router.put('/:id/release', auth, authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]), ctrl.releaseValidators, ctrl.release);

router.get('/:id/history', auth, authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.history
);


module.exports = router;
