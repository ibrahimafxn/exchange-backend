const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const validateObjectId = require('../middlewares/validateObjectId.middleware');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const MaterialService = require('../services/material.service');

// GET /materials
router.get(
    '/',
    authenticate,
    authorize(['ADMIN', 'gestionnaire']),
    asyncHandler(async (req, res) => {
        const list = await MaterialService.listMaterials();
        res.json({ success: true, data: list });
    })
);

// POST /materials
router.post(
    '/',
    authenticate,
    authorize(['admin', 'gestionnaire']),
    asyncHandler(async (req, res) => {
        const m = await MaterialService.createMaterial(req.body);
        res.json({ success: true, data: m });
    })
);

// PUT /materials/:id/adjust
router.put(
    '/:id/adjust',
    authenticate,
    authorize(['admin', 'gestionnaire']),
    validateObjectId('id'),
    asyncHandler(async (req, res) => {
        const { delta, action, author, createAttribution } = req.body;
        const result = await MaterialService.adjustQuantityTransactional(req.params.id, delta, {
            action,
            author,
            createAttribution
        });
        res.json({ success: true, data: result });
    })
);

module.exports = router;
