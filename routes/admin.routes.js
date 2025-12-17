const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const adminController = require('../controllers/admin.controller');
const ROLES = require('../config/roles');

// Exemple sur les extraits visibles :

router.get(
  '/dashboard',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  asyncHandler(adminController.getDashboardStats)
);

// ... idem pour toutes les routes admin ...

router.get(
  '/history',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  asyncHandler(adminController.getHistory)
);

router.get(
  '/history/export',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  asyncHandler(adminController.exportHistoryExcel)
);

module.exports = router;
