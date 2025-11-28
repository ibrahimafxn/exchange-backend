// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

// Import du contrôleur admin (à créer dans controllers/admin.controller.js)
const adminController = require('../controllers/admin.controller');

// ---------------------------
// DASHBOARD
// ---------------------------
router.get(
  '/dashboard',
  auth, // vérifie que l'utilisateur est connecté
  authorize(['admin', 'dirigeant']), // accès restreint aux rôles
  asyncHandler(adminController.getDashboardStats)
);

// ---------------------------
// UTILISATEURS
// ---------------------------
router.get(
  '/users',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.getUsers)
);

router.get(
  '/users/:idUser',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.getUserById)
);

router.post(
  '/users',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.createUser)
);

router.put(
  '/users/:idUser',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.updateUser)
);

router.delete(
  '/users/:idUser',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.deleteUser)
);

// ---------------------------
// DEPOTS
// ---------------------------
router.get(
  '/depots',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.getDepots)
);

router.post(
  '/depots',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.createDepot)
);

router.put(
  '/depots/:idDepot',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.updateDepot)
);

router.delete(
  '/depots/:idDepot',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.deleteDepot)
);

// ---------------------------
// RESSOURCES
// ---------------------------
// type = materials | vehicles | consumables
router.get(
  '/resources/:type',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.getResources)
);

router.post(
  '/resources/:type',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.createResource)
);

router.put(
  '/resources/:type/:resourceId',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.updateResource)
);

router.delete(
  '/resources/:type/:resourceId',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.deleteResource)
);

// ---------------------------
// HISTORIQUE / MOUVEMENTS
// ---------------------------
router.get(
  '/history',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.getHistory)
);

router.get(
  '/history/export',
  auth,
  authorize(['admin', 'dirigeant']),
  asyncHandler(adminController.exportHistoryExcel)
);

module.exports = router;
