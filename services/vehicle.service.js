// services/vehicle.service.js
const mongoose = require('mongoose');
const Vehicle = require('../models/vehicle.model');
const Attribution = require('../models/attribution.model');
const AttributionHistory = require('../models/attributionHistory.model');

/**
 * Assigne un véhicule à un technicien (transaction + historique)
 */
async function assignVehicleTransactional(vehicleId, techId, author = null, note = null) {
  const session = await mongoose.startSession();
  try {
    let result = null;

    await session.withTransaction(async () => {
      const v = await Vehicle.findById(vehicleId).session(session);
      if (!v) throw new Error('Véhicule introuvable');

      // Snapshot BEFORE
      const before = v.toObject();

      // règles simples
      if (v.assignedTo) throw new Error('Véhicule déjà assigné');
      v.assignedTo = techId;
      // le véhicule n'est plus "au dépôt" si utilisé
      // (tu peux décider de garder idDepot, mais généralement on le retire)
      v.idDepot = null;

      await v.save({ session });

      const attrib = await Attribution.create([{
        resourceType: 'VEHICLE',
        resourceId: v._id,
        resourceModel: 'Vehicle',
        quantity: 1,
        fromDepot: before.idDepot || null,
        toUser: techId,
        action: 'ATTRIBUTION',
        author,
        note
      }], { session });

      await AttributionHistory.create([{
        attribution: attrib[0]._id,
        snapshot: {
          action: 'ASSIGN_VEHICLE',
          before,
          after: v.toObject(),
          author,
          note,
          timestamp: new Date()
        }
      }], { session });

      result = { vehicle: v, attribution: attrib[0] };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Libère un véhicule et le remet dans un dépôt (transaction + historique)
 */
async function releaseVehicleTransactional(vehicleId, depotId, author = null, note = null) {
  const session = await mongoose.startSession();
  try {
    let result = null;

    await session.withTransaction(async () => {
      const v = await Vehicle.findById(vehicleId).session(session);
      if (!v) throw new Error('Véhicule introuvable');

      const before = v.toObject();

      if (!v.assignedTo) throw new Error('Véhicule non assigné');

      const previousUser = v.assignedTo;
      v.assignedTo = null;
      v.idDepot = depotId;

      await v.save({ session });

      const attrib = await Attribution.create([{
        resourceType: 'VEHICLE',
        resourceId: v._id,
        resourceModel: 'Vehicle',
        quantity: 1,
        fromDepot: before.idDepot || null,
        toUser: previousUser,
        action: 'REPRISE',
        author,
        note
      }], { session });

      await AttributionHistory.create([{
        attribution: attrib[0]._id,
        snapshot: {
          action: 'RELEASE_VEHICLE',
          before,
          after: v.toObject(),
          author,
          note,
          timestamp: new Date()
        }
      }], { session });

      result = { vehicle: v, attribution: attrib[0] };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

async function listHistoryByVehicle(vehicleId, opts = {}) {
  const page = parseInt(String(opts.page || '1'), 10);
  const limit = parseInt(String(opts.limit || '25'), 10);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;
  const skip = (safePage - 1) * safeLimit;

  const filter = { resourceType: 'VEHICLE', resourceId: vehicleId };

  const [total, items] = await Promise.all([
    Attribution.countDocuments(filter),
    Attribution.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean()
  ]);

  return { total, page: safePage, limit: safeLimit, items };
}

module.exports = {
  assignVehicleTransactional,
  releaseVehicleTransactional,
  listHistoryByVehicle,
};


module.exports = {
  assignVehicleTransactional,
  releaseVehicleTransactional,
};
