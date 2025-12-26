const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, trim: true, unique: true },
    brand: { type: String, trim: true, default: undefined },
    model: { type: String, trim: true, default: undefined},
    year: { type: Number, default: undefined },
    state: { type: String, default: undefined },

    // Dépôt où il se trouve si non assigné
    idDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: undefined },

    // Technicien en utilisation
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: undefined },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: undefined },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
