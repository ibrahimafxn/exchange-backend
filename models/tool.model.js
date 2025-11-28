/**
 * models/Tool.js
 *
 * Modèle Mongoose pour les outils et équipements.
 * Chaque outil peut être associé à une catégorie (ex: outillage, sécurité),
 * et peut avoir un numéro de série unique (optionnel).
 */

const mongoose = require('mongoose');

const ToolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Outillage', 'Équipement de sécurité', 'Divers'], // adapte selon tes besoins
        default: 'Divers'
    },
    serial: {
        type: String,
        unique: true, // si présent, doit être unique
        sparse: true, // permet des serial vides
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index pour recherche rapide par catégorie et nom
ToolSchema.index({ category: 1, name: 1 });

// Middleware pre-save si besoin (ex: normaliser le nom)
ToolSchema.pre('save', function(next) {
    this.name = this.name.trim();
    if (this.serial) this.serial = this.serial.trim();
    next();
});

module.exports = mongoose.model('Tool', ToolSchema);
