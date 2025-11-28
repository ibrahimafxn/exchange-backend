/**
 * services/tool.service.js
 *
 * Catalogue d'outils (lecture / création).
 * Plus léger : aucune transaction nécessaire ici car on n'écrit qu'un document à la fois.
 */

const Tool = require('../models/tool.model.js');

/**
 * Récupère la liste des outils
 */
async function listTools(filter = {}) {
    return Tool.find(filter).sort({ name: 1 });
}

/**
 * Crée un outil (utilisé par l'init ou l'admin)
 */
async function createTool(payload) {
    return Tool.create(payload);
}

module.exports = { listTools, createTool };
