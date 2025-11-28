/**
 * models/Depot.js
 * Représente un dépôt physique / stock
 */
const mongoose = require('mongoose');

const depotSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Depot', depotSchema);
