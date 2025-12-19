// models/depot.model.js
const mongoose = require('mongoose');

const depotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },

    // optionnel : gestionnaire affecté
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

// Optionnel : si tu veux éviter des doublons de noms
 depotSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Depot', depotSchema);
