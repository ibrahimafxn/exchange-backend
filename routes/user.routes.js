// user.routes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ROLES = require('../config/roles');

// Vérif d’unicité : peut rester public ou être protégé selon ton besoin
router.post('/is-unique', UserController.isUnique);

// Création (ex : admin ou dirigeant uniquement)
router.post(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  UserController.createValidators,
  UserController.create
);

// Liste
router.get(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  UserController.list
);

// Get by id
// (la ligne est abrégée dans ton fichier original, mais l’idée est la même)
router.get(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  UserController.getById // adapte au vrai nom de ta méthode
);

// Delete
router.delete(
  '/:id',
  auth,
  authorize([ROLES.ADMIN]),
  UserController.remove
);

// Password change (l’utilisateur lui-même ou un admin – à adapter plus tard)
router.put(
  '/:id/password',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  UserController.setPassword
);

// Give access
router.post(
  '/:id/give-access',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  UserController.giveAccess
);

// Assign depot / vehicle
router.post(
  '/:id/assign-depot',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  UserController.assignDepot
);

router.post(
  '/:id/assign-vehicle',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  UserController.assignVehicle
);

module.exports = router;
