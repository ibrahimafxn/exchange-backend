/**
 * controllers/attribution.controller.js
 * Endpoint pour créer une attribution ou reprise via le service métier.
 */
const { body, validationResult } = require('express-validator');
const attributionService = require('../services/attribution.service');
const Attribution = require('../models/attribution.model');
const AttributionHistory = require('../models/attributionHistory.model');

/**
 * POST /api/attributions
 * Body:
 * {
 *   resourceType: 'MATERIAL'|'CONSUMABLE'|'VEHICLE',
 *   resourceId,
 *   quantity,
 *   fromDepot,
 *   toUser,
 *   action: 'ATTRIBUTION'|'REPRISE'|'AJOUT'|'SORTIE'|'PERTE',
 *   note
 * }
 */
exports.createAttribution = [
    body('resourceType').notEmpty(),
    body('resourceId').notEmpty(),
    body('action').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const params = {
                resourceType: req.body.resourceType,
                resourceId: req.body.resourceId,
                quantity: req.body.quantity || 1,
                fromDepot: req.body.fromDepot || null,
                toUser: req.body.toUser || null,
                action: req.body.action,
                author: req.user ? req.user._id : null,
                note: req.body.note || ''
            };

            const attribution = await attributionService.createAttribution(params);
            res.status(201).json(attribution);
        } catch (err) {
            console.error('createAttribution error', err.message || err);
            res.status(400).json({ message: err.message || 'Erreur attribution' });
        }
    }
];

/**
 * GET /api/attributions
 * Retourne les attributions (possible filtre par toUser, resourceType)
 */
exports.list = async (req, res) => {
    try {
        const filter = {};
        if (req.query.toUser) filter.toUser = req.query.toUser;
        if (req.query.resourceType) filter.resourceType = req.query.resourceType;
        const list = await Attribution.find(filter).sort({ createdAt: -1 }).limit(500);
        res.json(list);
    } catch (err) {
        console.error('attribution list error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * GET /api/attributions/history
 * Retourne l'historique (snapshots) — possibilité d'ajouter filtres
 */
exports.history = async (req, res) => {
    try {
        const filter = {};
        if (req.query.author) filter['snapshot.attribution.author'] = req.query.author;
        const list = await AttributionHistory.find(filter).sort({ createdAt: -1 }).limit(500);
        res.json(list);
    } catch (err) {
        console.error('attribution history error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
