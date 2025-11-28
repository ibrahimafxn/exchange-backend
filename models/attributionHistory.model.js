/**
 * models/AttributionHistory.js
 * Contient un snapshot de l'attribution (facilite audit / export)
 */
const mongoose = require('mongoose');

const histSchema = new mongoose.Schema({
    attribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribution' },
    snapshot: { type: Object, required: true }, // snapshot JSON de l'événement & données pertinentes
    note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AttributionHistory', histSchema);