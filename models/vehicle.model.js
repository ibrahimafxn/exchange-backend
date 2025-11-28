/**
 * models/Vehicle.js
 * Véhicule exploitable par la société. La plaque (plate) doit être unique.
 */
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    plate: { type: String, required: true, unique: true, trim: true },
    model: { type: String, trim: true },
    km: { type: Number, default: 0 },
    idDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null },
    idTech: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // technicien qui a le véhicule
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
