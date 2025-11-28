/**
 * controllers/vehicle.controller.js
 * CRUD Véhicules + assignation simple
 */
const { body, validationResult } = require('express-validator');
const Vehicle = require('../models/vehicle.model');

exports.list = async (req, res) => {
    try {
        const filter = {};
        if (req.query.idDepot) filter.idDepot = req.query.idDepot;
        const list = await Vehicle.find(filter).sort({ plate: 1 });
        res.json(list);
    } catch (err) {
        console.error('vehicle list error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.get = async (req, res) => {
    try {
        const v = await Vehicle.findById(req.params.id);
        if (!v) return res.status(404).json({ message: 'Véhicule non trouvé' });
        res.json(v);
    } catch (err) {
        console.error('vehicle get error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.create = [
    body('plate').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { plate, model, km = 0, idDepot } = req.body;
            const exists = await Vehicle.findOne({ plate });
            if (exists) return res.status(400).json({ message: 'Plaque déjà utilisée' });
            const v = await Vehicle.create({ plate, model, km, idDepot });
            res.status(201).json(v);
        } catch (err) {
            console.error('vehicle create error', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
];

exports.update = async (req, res) => {
    try {
        const updates = { ...req.body };
        const v = await Vehicle.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!v) return res.status(404).json({ message: 'Véhicule non trouvé' });
        res.json(v);
    } catch (err) {
        console.error('vehicle update error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.remove = async (req, res) => {
    try {
        const v = await Vehicle.findByIdAndDelete(req.params.id);
        if (!v) return res.status(404).json({ message: 'Véhicule non trouvé' });
        res.json({ message: 'Véhicule supprimé' });
    } catch (err) {
        console.error('vehicle delete error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
