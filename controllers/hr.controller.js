/**
 * controllers/hr.controller.js
 * Gestion des documents RH (EmployeeDoc)
 * NOTE: le stockage des fichiers se fait via un stockage externe (Firebase Storage, S3) :
 * - Le frontend upload directement vers le stockage ou vers un endpoint signé.
 * - Ici nous stockons simplement les métadonnées (fileUrl, expiryDate).
 */
const { body, validationResult } = require('express-validator');
const EmployeeDoc = require('../models/employeeDoc.model');

exports.createDoc = [
    body('user').notEmpty(),
    body('type').notEmpty(),
    body('fileUrl').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const doc = await EmployeeDoc.create(req.body);
            res.status(201).json(doc);
        } catch (err) {
            console.error('create doc error', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
];

exports.listDocs = async (req, res) => {
    try {
        const filter = {};
        if (req.query.user) filter.user = req.query.user;
        const docs = await EmployeeDoc.find(filter).sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        console.error('list docs error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.remove = async (req, res) => {
    try {
        const d = await EmployeeDoc.findByIdAndDelete(req.params.id);
        if (!d) return res.status(404).json({ message: 'Document non trouvé' });
        res.json({ message: 'Document supprimé' });
    } catch (err) {
        console.error('delete doc error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
