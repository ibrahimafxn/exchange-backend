/**
 * services/depot.service.js
 *
 * Gestion métier des dépôts :
 * - createDepot
 * - listDepots
 * - transferResourceTransactional : transfert atomique d'une quantité d'une ressource
 *   (Material ou Consumable) entre deux dépôts.
 *
 * NOTE: transferResourceTransactional suppose que la ressource a un champ idDepot
 *       qui indique le dépôt courant. L'opération décrémente la quantité dans le dépôt source
 *       et incrémente (ou crée) une ressource équivalente au dépôt cible.
 */

const mongoose = require('mongoose');
const Depot = require('../models/depot.model');
const Material = require('../models/material.model');
const Consumable = require('../models/consumable.model');

/**
 * Crée un dépôt
 */
async function createDepot(payload) {
    return Depot.create(payload);
}

/**
 * Liste les dépôts
 */
async function listDepots(filter = {}) {
    return Depot.find(filter).sort({ name: 1 });
}

/**
 * Transfert de ressource entre dépôts (transactionnel)
 *
 * @param {'Material'|'Consumable'} resourceModelName
 * @param {String} resourceId
 * @param {String} fromDepotId
 * @param {String} toDepotId
 * @param {Number} quantity
 * @param {Object} options
 */
async function transferResourceTransactional(resourceModelName, resourceId, fromDepotId, toDepotId, quantity, options = {}) {
    const session = await mongoose.startSession();
    try {
        let result = null;
        await session.withTransaction(async () => {
            const Model = resourceModelName === 'Material' ? Material : Consumable;
            const resource = await Model.findById(resourceId).session(session);
            if (!resource) throw new Error(`${resourceModelName} introuvable`);

            if ((resource.idDepot || '').toString() !== fromDepotId.toString()) {
                throw new Error('La ressource n\'appartient pas au dépôt source fourni');
            }

            if ((resource.quantity || 0) < quantity) throw new Error('Stock insuffisant pour transfert');

            // Décrémenter la quantité dans la ressource source
            resource.quantity = (resource.quantity || 0) - quantity;
            await resource.save({ session });

            // Tenter de trouver une ressource identique au dépôt cible (par name/category/serial)
            const matchQuery = { name: resource.name };
            if (resource.serial) matchQuery.serial = resource.serial;
            matchQuery.idDepot = toDepotId;

            let dest = await Model.findOne(matchQuery).session(session);
            if (!dest) {
                // créer une nouvelle entrée dans le dépôt cible
                dest = await Model.create([{
                    name: resource.name,
                    category: resource.category,
                    serial: resource.serial || undefined,
                    quantity: quantity,
                    assignedQuantity: 0,
                    idDepot: toDepotId
                }], { session });
                dest = dest[0];
            } else {
                dest.quantity = (dest.quantity || 0) + quantity;
                await dest.save({ session });
            }

            result = { from: resource, to: dest };
        });

        return result;
    } catch (err) {
        console.error('transferResourceTransactional error', err.message || err);
        throw err;
    } finally {
        session.endSession();
    }
}

module.exports = {
    createDepot,
    listDepots,
    transferResourceTransactional
};
