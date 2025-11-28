/**
 * controllers/consumable.controller.js
 * Similaire à material.controller mais adapté aux consommables
 */
const { body, validationResult } = require('express-validator');
const Consumable = require('../models/consumable.model');

exports.list = async (req, res) => {
    try {
        const filter = {};
        if (req.query.idDepot) filter.idDepot = req.query.idDepot;
        const list = await Consumable.find(filter).sort({ name: 1 });
        res.json(list);
    } catch (err) {
        console.error('consumable list error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.create = [
    body('name').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { name, unit = 'pcs', quantity = 0, idDepot } = req.body;
            const c = await Consumable.create({ name, unit, quantity, idDepot });
            res.status(201).json(c);
        } catch (err) {
            console.error('consumable create error', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
];

exports.update = async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates.assignedQuantity;
        const c = await Consumable.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!c) return res.status(404).json({ message: 'Consommable non trouvé' });
        res.json(c);
    } catch (err) {
        console.error('consumable update error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.remove = async (req, res) => {
    try {
        const c = await Consumable.findByIdAndDelete(req.params.id);
        if (!c) return res.status(404).json({ message: 'Consommable non trouvé' });
        res.json({ message: 'Consommable supprimé' });
    } catch (err) {
        console.error('consumable delete error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
