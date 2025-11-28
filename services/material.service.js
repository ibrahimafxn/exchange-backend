/**
 * services/material.service.js
 *
 * Logique métier pour les matériels (outils / équipements).
 * - createMaterial
 * - adjustQuantityTransactional : modification atomique de la quantité,
 *   création d'une Attribution + AttributionHistory si nécessaire.
 *
 * Utilise transactions pour garantir que la mise à jour du stock et la création
 * d'objets d'historique se font atomiquement.
 */

const mongoose = require('mongoose');
const Material = require('../models/material.model');
const Attribution = require('../models/attribution.model');
const AttributionHistory = require('../models/attributionHistory.model');

async function createMaterial(payload) {
    // Crée simplement un matériel
    return Material.create(payload);
}

/**
 * Ajuste la quantité d'un matériel de façon transactionnelle.
 * - delta peut être positif (AJOUT) ou négatif (SORTIE/PERTE)
 * - si createAttribution === true, on crée une attribution correspondante
 *
 * @param {String} materialId
 * @param {Number} delta
 * @param {Object} options { author, action: 'AJOUT'|'SORTIE'|'PERTE', createAttribution: boolean, quantityForAttribution }
 */
async function adjustQuantityTransactional(materialId, delta, options = {}) {
    const session = await mongoose.startSession();
    try {
        let result = null;
        await session.withTransaction(async () => {
            const material = await Material.findById(materialId).session(session);
            if (!material) throw new Error('Matériel introuvable');

            // Calculer nouvelle quantité
            material.quantity = Math.max(0, (material.quantity || 0) + delta);

            // Si on réduit en dessous de assignedQuantity, on l'ajuste
            if ((material.assignedQuantity || 0) > material.quantity) {
                material.assignedQuantity = material.quantity;
            }

            await material.save({ session });

            // Créer attribution si demandé (ex: AJOUT/SORTIE/PERTE)
            if (options.createAttribution) {
                const qty = options.quantityForAttribution != null ? options.quantityForAttribution : Math.abs(delta);
                const attribArr = await Attribution.create([{
                    resourceType: 'MATERIAL',
                    resourceId: material._id,
                    resourceModel: 'Material',
                    quantity: qty,
                    fromDepot: options.fromDepot || null,
                    toUser: options.toUser || null,
                    action: options.action || (delta >= 0 ? 'AJOUT' : 'SORTIE'),
                    author: options.author || null,
                    note: options.note || ''
                }], { session });

                // snapshot historique
                await AttributionHistory.create([{
                    attribution: attribArr[0]._id,
                    snapshot: {
                        attribution: attribArr[0].toObject(),
                        resourceAfter: material.toObject(),
                        timestamp: new Date()
                    },
                    note: options.note || ''
                }], { session });

                result = { material, attribution: attribArr[0] };
            } else {
                result = { material };
            }
        });

        return result;
    } catch (err) {
        console.error('adjustQuantityTransactional error', err.message || err);
        throw err;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    createMaterial,
    adjustQuantityTransactional
};
