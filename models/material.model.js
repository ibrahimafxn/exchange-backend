/**
 * models/Material.js
 * Matériel (outils, équipement).
 * - quantity: stock physique total au dépôt
 * - assignedQuantity: quantité actuellement attribuée aux techniciens
 */
const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {type: String, required: true},
  category: {
    type: String,
    enum: ['Outil', 'EPI'],
    default: 'Outil',
    required: true
  },
  quantity: {type: Number, default: 0}, // total en stock
  assignedQuantity: {type: Number, default: 0}, // quantité attribuée
  idDepot: {type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null}
}, {timestamps: true});

module.exports = mongoose.model('Material', materialSchema);
