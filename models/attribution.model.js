/**
 * models/Attribution.js
 * Stocke les événements d'attribution / reprise / sortie / ajout / perte.
 * resourceType: 'MATERIAL' | 'CONSUMABLE' | 'VEHICLE'
 */
const mongoose = require('mongoose');

const attributionSchema = new mongoose.Schema({
    resourceType: { type: String, enum: ['MATERIAL', 'CONSUMABLE', 'VEHICLE'], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'resourceModel' },
    resourceModel: { type: String, required: true, enum: ['Material', 'Consumable', 'Vehicle'] }, // refPath
    quantity: { type: Number, default: 1 },
    fromDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, enum: ['ATTRIBUTION', 'REPRISE', 'AJOUT', 'SORTIE', 'PERTE'], required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Attribution', attributionSchema);
