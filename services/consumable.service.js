/**
 * services/consumable.service.js
 * reserveConsumableTransactional(consumableId, qty, toUser, fromDepot, author)
 * - Vérifie le stock
 * - Met à jour assignedQuantity
 * - Crée Attribution + AttributionHistory
 */

const mongoose = require('mongoose');
const Consumable = require('../models/consumable.model');
const Attribution = require('../models/attribution.model');
const AttributionHistory = require('../models/attributionHistory.model');

async function reserveConsumableTransactional(consumableId, qty, toUser = null, fromDepot = null, author = null) {
  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      const c = await Consumable.findById(consumableId).session(session);
      if (!c) throw new Error('Consommable introuvable');
      const available = (c.quantity || 0) - (c.assignedQuantity || 0);
      if (available < qty) throw new Error('Stock insuffisant pour la réservation');

      c.assignedQuantity = (c.assignedQuantity || 0) + qty;
      await c.save({ session });

      const attrib = await Attribution.create([{
        resourceType: 'CONSUMABLE',
        resourceId: c._id,
        resourceModel: 'Consumable',
        quantity: qty,
        fromDepot,
        toUser,
        action: 'ATTRIBUTION',
        author
      }], { session });

      await AttributionHistory.create([{
        attribution: attrib[0]._id,
        snapshot: {
          attribution: attrib[0].toObject(),
          resourceAfter: c.toObject(),
          timestamp: new Date()
        }
      }], { session });

      result = { consumable: c, attribution: attrib[0] };
    });
    return result;
  } catch (err) {
    console.error('reserveConsumableTransactional error', err.message || err);
    throw err;
  } finally {
    await session.endSession();
  }
}

module.exports = { reserveConsumableTransactional };
