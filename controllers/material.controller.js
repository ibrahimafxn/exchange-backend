/**
 * controllers/material.controller.js
 * CRUD Matériels (outils, équipements)
 */
const { body, validationResult } = require('express-validator');
const Material = require('../models/material.model');

exports.list = async (req, res) => {
    try {
        const filter = {};
        if (req.query.idDepot) filter.idDepot = req.query.idDepot;
        if (req.query.name) filter.name = new RegExp(req.query.name, 'i');
        const mats = await Material.find(filter).sort({ name: 1 });
        res.json(mats);
    } catch (err) {
        console.error('material list error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.get = async (req, res) => {
    try {
        const mat = await Material.findById(req.params.id);
        if (!mat) return res.status(404).json({ message: 'Matériel non trouvé' });
        res.json(mat);
    } catch (err) {
        console.error('material get error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.create = [
    body('name').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { name, category, serial, quantity = 0, idDepot } = req.body;
            const mat = await Material.create({ name, category, serial, quantity, idDepot });
            res.status(201).json(mat);
        } catch (err) {
            console.error('material create error', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
];

exports.update = async (req, res) => {
    try {
        const updates = { ...req.body };
        // Protéger assignedQuantity contre écrasement inattendu
        delete updates.assignedQuantity;
        const mat = await Material.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!mat) return res.status(404).json({ message: 'Matériel non trouvé' });
        res.json(mat);
    } catch (err) {
        console.error('material update error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.remove = async (req, res) => {
    try {
        const mat = await Material.findByIdAndDelete(req.params.id);
        if (!mat) return res.status(404).json({ message: 'Matériel non trouvé' });
        res.json({ message: 'Matériel supprimé' });
    } catch (err) {
        console.error('material delete error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
