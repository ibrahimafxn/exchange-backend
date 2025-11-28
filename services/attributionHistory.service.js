/**
 * services/attributionHistory.service.js
 *
 * Accès et filtres sur l'historique d'attributions
 * (lecture majoritairement, donc pas transactionnel)
 */

const AttributionHistory = require('../models/attribution.model');

/**
 * Liste l'historique avec filtres possibles
 */
async function listHistory(filter = {}, limit = 500, skip = 0) {
    return AttributionHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

/**
 * Récupère l'historique pour une attribution donnée
 */
async function getHistoryByAttributionId(attributionId) {
    return AttributionHistory.findOne({ attribution: attributionId });
}

module.exports = { listHistory, getHistoryByAttributionId };
