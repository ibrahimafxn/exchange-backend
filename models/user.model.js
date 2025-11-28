/**
 * models/User.js
 * Schéma utilisateur pour FXN
 * - role: DIRIGEANT | ADMIN | GESTION_DEPOT | TECHNICIEN
 * - idDepot: référence optionnelle vers Depot (gestionnaire / technicien affecté)
 * - assignedVehicle: véhicule actuellement attribué (nullable)
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    username: { type: String, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['DIRIGEANT', 'ADMIN', 'GESTION_DEPOT', 'TECHNICIEN'],
        default: 'TECHNICIEN'
    },
    idDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    // champs RH utiles
    numSec: { type: String, trim: true },
    numSiret: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
