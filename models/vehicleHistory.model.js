const mongoose = require('mongoose');

const vehicleHistorySchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    action: { type: String, enum: ['ASSIGN', 'RELEASE'], required: true },

    fromDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null },
    toDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null },

    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // snapshots utiles pour audit/debug
    snapshotBefore: { type: Object, default: null },
    snapshotAfter: { type: Object, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VehicleHistory', vehicleHistorySchema);
