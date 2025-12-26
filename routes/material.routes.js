// routes/material.routes.js
const router = require('express').Router();

const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ROLES = require('../config/roles');

const MaterialController = require('../controllers/material.controller');

// LIST (paginée + filtres)
router.get(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  MaterialController.list
);

// GET BY ID
router.get(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  MaterialController.get
);

// CREATE
router.post(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  MaterialController.create
);

// UPDATE
router.put(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  MaterialController.update
);

// DELETE (souvent plus restrictif)
router.delete(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  MaterialController.remove
);

module.exports = router;
