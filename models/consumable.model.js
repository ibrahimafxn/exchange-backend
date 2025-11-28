/**
 * models/Consumable.js
 * Consommables (câbles, connecteurs...). Similaire à Material mais principalement géré par quantité.
 */
const mongoose = require('mongoose');

const consumableSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unit: { type: String, default: 'pcs' }, // unité
    quantity: { type: Number, default: 0 },
    assignedQuantity: { type: Number, default: 0 },
    idDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Consumable', consumableSchema);
