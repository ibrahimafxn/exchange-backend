/**
 * controllers/consumable.controller.js
 * Contrôleur consommables (format standard API)
 *
 * Format de réponse :
 * - OK  : { success: true, data: ... }
 * - KO  : { success: false, message, errors? }
 */
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Consumable = require('../models/consumable.model');

/* -----------------------------
 * Helpers
 * ----------------------------- */

/** Vérifie ObjectId Mongo */
function isId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** Validation express-validator → 400 standard */
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
}

/* -----------------------------
 * GET /api/consumables
 * Query: q, page, limit, depot|idDepot
 * Réponse: { success:true, data:{ total,page,limit,items } }
 * ----------------------------- */
// controllers/consumable.controller.js

exports.list = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '25'), 10);
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;
    const skip = (safePage - 1) * safeLimit;

    // compat: accepte ?depot=... ou ?idDepot=...
    const depot = String(req.query.depot || req.query.idDepot || '').trim();

    /** @type {{[key:string]: any}} */
    const filter = {};

    // Filtre dépôt (si fourni)
    if (depot) {
      // ton schema consumable a "idDepot"
      filter.idDepot = depot;
    }

    // Recherche texte simple
    if (q) {
      const r = new RegExp(q, 'i');
      filter.$or = [
        { name: r },
        { unit: r },
        // tu peux ajouter ici d'autres champs si besoin (ref, fournisseur, etc.)
      ];
    }

    const [total, items] = await Promise.all([
      Consumable.countDocuments(filter),

      Consumable.find(filter)
        .sort({ createdAt: -1, name: 1 })
        .skip(skip)
        .limit(safeLimit)

        // ✅ IMPORTANT : populate du dépôt pour avoir le nom côté front
        // => idDepot devient un objet { _id, name, city } (au lieu d'une string)
        .populate('idDepot', 'name city')

        // ✅ lean() après populate : renvoie des objets JS simples
        .lean()
    ]);

    return res.json({
      success: true,
      data: { total, page: safePage, limit: safeLimit, items }
    });
  } catch (err) {
    console.error('consumable.list error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* -----------------------------
 * POST /api/consumables
 * Body: name (required), unit?, quantity?, minQuantity?, idDepot?
 * ----------------------------- */
exports.createValidators = [
  body('name').isString().trim().notEmpty().withMessage('name requis'),
  body('unit').optional().isString().trim(),
  body('quantity').optional().isInt({ min: 0 }).toInt(),
  body('minQuantity').optional().isInt({ min: 0 }).toInt(),
  body('idDepot').optional().isString().trim()
];

exports.create = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const payload = {
      name: req.body.name,
      unit: req.body.unit ?? 'pcs',
      quantity: req.body.quantity ?? 0,
      minQuantity: req.body.minQuantity ?? 0,
      idDepot: req.body.idDepot ?? null
    };

    const created = await Consumable.create(payload);

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('consumable.create error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* -----------------------------
 * PUT /api/consumables/:id
 * ----------------------------- */
exports.updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('unit').optional().isString().trim(),
  body('quantity').optional().isInt({ min: 0 }).toInt(),
  body('minQuantity').optional().isInt({ min: 0 }).toInt(),
  body('idDepot').optional().isString().trim()
];

exports.update = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const id = req.params.id;
    if (!isId(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // sécurité: on interdit certains champs si tu en as (ex assignedQuantity)
    const updates = { ...req.body };
    delete updates.assignedQuantity;

    const updated = await Consumable.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Consommable non trouvé' });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('consumable.update error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* -----------------------------
 * DELETE /api/consumables/:id
 * ----------------------------- */
exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isId(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const deleted = await Consumable.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Consommable non trouvé' });

    return res.json({ success: true, data: { _id: id } });
  } catch (err) {
    console.error('consumable.remove error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/consumables/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Consumable.findById(id)
      // ✅ pour récupérer le nom du dépôt directement
      .populate('idDepot', 'name city')
      .lean();

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Consommable non trouvé' });
    }

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('consumable.getById error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

