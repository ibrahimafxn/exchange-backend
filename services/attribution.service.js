/**
 * services/attribution.service.js
 * Version transactionnelle : garantit l'atomicité entre
 * - mise à jour de la ressource (Material/Consumable/Vehicle)
 * - création de l'Attribution
 * - création de l'AttributionHistory (snapshot)
 *
 * Utilise session mongoose pour s'assurer que tout est commité ou annulé.
 */

const mongoose = require('mongoose');
const Material = require('../models/material.model');
const Consumable = require('../models/consumable.model');
const Vehicle = require('../models/vehicle.model');
const Attribution = require('../models/attribution.model');
const AttributionHistory = require('../models/attributionHistory.model');

const resourceMap = {
  MATERIAL: { model: Material, modelName: 'Material' },
  CONSUMABLE: { model: Consumable, modelName: 'Consumable' },
  VEHICLE: { model: Vehicle, modelName: 'Vehicle' }
};

/**
 * createAttributionTransaction
 * params: {
 *   resourceType, resourceId, quantity = 1,
 *   fromDepot = null, toUser = null,
 *   action, author = null, note = ''
 * }
 *
 * Retourne l'objet Attribution (créé) si OK.
 */
async function createAttributionTransaction(params) {
  const {
    resourceType, resourceId, quantity = 1, fromDepot = null, toUser = null,
    action, author = null, note = ''
  } = params;

  if (!resourceType || !resourceId || !action) {
    throw new Error('Paramètres manquants pour createAttributionTransaction');
  }

  const map = resourceMap[resourceType];
  if (!map) throw new Error('Type de ressource inconnu');

  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      // 1) Charger et verrouiller la ressource dans la transaction
      const Model = map.model;
      const resource = await Model.findById(resourceId).session(session);
      if (!resource) throw new Error(`${map.modelName} introuvable`);

      // 2) Appliquer la logique métier selon type/action
      if (resourceType === 'MATERIAL' || resourceType === 'CONSUMABLE') {
        if (action === 'ATTRIBUTION') {
          const available = (resource.quantity || 0) - (resource.assignedQuantity || 0);
          if (available < quantity) throw new Error('Stock insuffisant');
          resource.assignedQuantity = (resource.assignedQuantity || 0) + quantity;
        } else if (action === 'REPRISE') {
          resource.assignedQuantity = Math.max(0, (resource.assignedQuantity || 0) - quantity);
        } else if (action === 'AJOUT') {
          resource.quantity = (resource.quantity || 0) + quantity;
        } else if (action === 'SORTIE' || action === 'PERTE') {
          resource.quantity = Math.max(0, (resource.quantity || 0) - quantity);
          resource.assignedQuantity = Math.min(resource.assignedQuantity || 0, resource.quantity);
        }
        // sauvegarde dans la session
        await resource.save({ session });
      } else if (resourceType === 'VEHICLE') {
        if (action === 'ATTRIBUTION') {
          // met à jour idTech/idDepot
          resource.idTech = toUser;
          resource.idDepot = null;
        } else if (action === 'REPRISE') {
          resource.idTech = null;
          resource.idDepot = fromDepot || resource.idDepot;
        }
        await resource.save({ session });
      }

      // 3) Créer l'attribution dans la session
      const attribution = await Attribution.create([{
        resourceType,
        resourceId,
        resourceModel: map.modelName,
        quantity,
        fromDepot,
        toUser,
        action,
        author,
        note
      }], { session });

      // 4) Créer l'historique (snapshot) dans la session
      // snapshot : on prend l'état after et une référence à l'attribution
      await AttributionHistory.create([{
        attribution: attribution[0]._id,
        snapshot: {
          attribution: attribution[0].toObject(),
          resourceAfter: resource.toObject(),
          timestamp: new Date()
        },
        note
      }], { session });

      result = attribution[0];
    }, {
      // options: read/write concern - on peut ajuster si nécessaire
      readPreference: 'primary'
    });

    return result;
  } catch (err) {
    // err contient la raison de l'échec, la transaction a été rollbackée automatiquement par withTransaction
    console.error('createAttributionTransaction error', err.message || err);
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = { createAttributionTransaction };
