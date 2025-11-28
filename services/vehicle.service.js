/**
 * services/vehicle.service.js (transactionnel)
 * - assignVehicleTransactional(vehicleId, techId, author)
 * - releaseVehicleTransactional(vehicleId, depotId, author)
 */

const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Attribution = require('../models/Attribution');
const AttributionHistory = require('../models/AttributionHistory');

async function assignVehicleTransactional(vehicleId, techId, author = null) {
  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      const vehicle = await Vehicle.findById(vehicleId).session(session);
      if (!vehicle) throw new Error('Véhicule introuvable');

      const user = await User.findById(techId).session(session);
      if (!user) throw new Error('Technicien introuvable');

      // Mise à jour matérialisée
      vehicle.idTech = techId;
      vehicle.idDepot = null;
      await vehicle.save({ session });

      // Mettre à jour l'utilisateur (assignedVehicle) — optionnel selon ton modèle
      user.assignedVehicle = vehicle._id;
      await user.save({ session });

      // Créer Attribution + History
      const attrib = await Attribution.create([{
        resourceType: 'VEHICLE',
        resourceId: vehicle._id,
        resourceModel: 'Vehicle',
        quantity: 1,
        fromDepot: null,
        toUser: techId,
        action: 'ATTRIBUTION',
        author
      }], { session });

      await AttributionHistory.create([{
        attribution: attrib[0]._id,
        snapshot: {
          attribution: attrib[0].toObject(),
          resourceAfter: vehicle.toObject(),
          timestamp: new Date()
        }
      }], { session });

      result = { vehicle, user, attribution: attrib[0] };
    });
    return result;
  } catch (err) {
    console.error('assignVehicleTransactional error', err.message || err);
    throw err;
  } finally {
    session.endSession();
  }
}

async function releaseVehicleTransactional(vehicleId, depotId, author = null) {
  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      const vehicle = await Vehicle.findById(vehicleId).session(session);
      if (!vehicle) throw new Error('Véhicule introuvable');

      // Téchnicien précédent (si présent) à mettre à jour
      const previousTechId = vehicle.idTech;
      if (previousTechId) {
        const prevUser = await User.findById(previousTechId).session(session);
        if (prevUser) {
          prevUser.assignedVehicle = null;
          await prevUser.save({ session });
        }
      }

      vehicle.idTech = null;
      vehicle.idDepot = depotId;
      await vehicle.save({ session });

      // Créer Attribution 'REPRISE'
      const attrib = await Attribution.create([{
        resourceType: 'VEHICLE',
        resourceId: vehicle._id,
        resourceModel: 'Vehicle',
        quantity: 1,
        fromDepot: depotId,
        toUser: null,
        action: 'REPRISE',
        author
      }], { session });

      await AttributionHistory.create([{
        attribution: attrib[0]._id,
        snapshot: {
          attribution: attrib[0].toObject(),
          resourceAfter: vehicle.toObject(),
          timestamp: new Date()
        }
      }], { session });

      result = { vehicle, attribution: attrib[0] };
    });
    return result;
  } catch (err) {
    console.error('releaseVehicleTransactional error', err.message || err);
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = { assignVehicleTransactional, releaseVehicleTransactional };
