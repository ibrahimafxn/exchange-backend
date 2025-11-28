const mongoose = require('mongoose');

const resourceMovementSchema = new mongoose.Schema({
  resourceType: { type: String, enum: ['MATERIAL', 'VEHICLE', 'CONSUMABLE'], required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'resourceModel' },
  resourceModel: { type: String, enum: ['Material', 'Vehicle', 'Consumable'], required: true },
  action: { type: String, enum: ['AJOUT', 'ATTRIBUTION', 'REPRISE', 'SUPPRESSION'], required: true },
  quantity: { type: Number, default: 1 },
  fromDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  snapshotBefore: { type: mongoose.Schema.Types.Mixed },
  snapshotAfter: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('ResourceMovement', resourceMovementSchema);
