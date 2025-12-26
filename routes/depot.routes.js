const express = require('express');
const router = express.Router();

const DepotController = require('../controllers/depot.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ROLES = require('../config/roles');

// LIST (admin/dirigeant)
router.get(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  DepotController.list
);

// CREATE
router.post(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  DepotController.createValidators,
  DepotController.create
);

// UPDATE
router.put(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  DepotController.idParamValidator,
  DepotController.updateValidators,
  DepotController.update
);

// DELETE
router.delete(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  DepotController.idParamValidator,
  DepotController.remove
);

// DETAIL (mettre en dernier)
router.get(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  DepotController.idParamValidator,
  DepotController.getById
);

// ASSIGN-MANAGER
router.post(
  '/:id/assign-manager',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  DepotController.assignManager
);

// Get depot stats
router.get(
  '/:id/stats',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  DepotController.stats
);


module.exports = router;
