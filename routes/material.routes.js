const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const validateObjectId = require('../middlewares/validateObjectId.middleware');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const MaterialService = require('../services/material.service');
const ROLES = require('../config/roles');

router.get(
  '/',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.GESTION_DEPOT]),
  asyncHandler(async (req, res) => {
    const list = await MaterialService.listMaterials();
    res.json({ success: true, data: list });
  })
);

router.put(
  '/:id/adjust',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.GESTION_DEPOT]),
  validateObjectId('id'),
  asyncHandler(async (req, res) => {
    const { delta, action, author, createAttribution } = req.body;
    const result = await MaterialService.adjustQuantityTransactional(req.params.id, delta, {
      action,
      author,
      createAttribution,
    });
    res.json({ success: true, data: result });
  })
);

module.exports = router;
