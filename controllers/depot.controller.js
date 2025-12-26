const { validationResult, body, param } = require('express-validator');
const mongoose = require('mongoose');
const Depot = require('../models/depot.model');
const User = require('../models/user.model');
const Consumable = require('../models/consumable.model');
const Material = require('../models/material.model');
const Vehicle = require('../models/vehicle.model');

/* -------------------------------------------------
   Helpers
------------------------------------------------- */

/** Retourne true si ObjectId valide */
function isObjectId(v) {
  return mongoose.Types.ObjectId.isValid(v);
}

/** Réponse 400 standard pour validations */
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  return null;
}

/** Nettoyage simple (trim + fallback) */
function toStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/* -------------------------------------------------
   Validators (exportables pour routes)
------------------------------------------------- */

/**
 * Validation : :id
 */
exports.idParamValidator = [
  param('id')
    .custom(v => isObjectId(v))
    .withMessage('ID depot invalide')
];

/**
 * Validation CREATE
 * - name requis
 * - managerId optionnel (ObjectId ou null/'')
 */
exports.createValidators = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom du dépôt est requis (min 2 caractères).'),

  body('city').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('phone').optional().isString().trim(),

  body('managerId')
    .optional({ nullable: true })
    .custom(v => v === '' || v === null || isObjectId(v))
    .withMessage('managerId doit être un ObjectId valide, vide ou null.')
];

/**
 * Validation UPDATE
 * - champs optionnels
 * - si name présent => min 2
 * - managerId optionnel
 */
exports.updateValidators = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom du dépôt doit faire au moins 2 caractères.'),

  body('city').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('phone').optional().isString().trim(),

  body('managerId')
    .optional({ nullable: true })
    .custom(v => v === '' || v === null || isObjectId(v))
    .withMessage('managerId doit être un ObjectId valide, vide ou null.')
];

/* -------------------------------------------------
   Controllers
------------------------------------------------- */

/**
 * GET /api/depots?q=&page=&limit=
 * Liste paginée + search + populate manager
 */
exports.list = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '25', 10), 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (q) {
      const r = new RegExp(q, 'i');
      filter.$or = [{ name: r }, { city: r }, { address: r }, { phone: r }];
    }

    const [total, items] = await Promise.all([
      Depot.countDocuments(filter),
      Depot.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('managerId', 'firstName lastName email role')
        .lean()
    ]);

    res.json({ success: true, data: { total, page, limit, items } });
  } catch (err) {
    console.error('depot.list error', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /api/depots/:id
 */
exports.getById = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;

  try {
    const id = req.params.id;

    const depot = await Depot.findById(id)
      .populate('managerId', 'firstName lastName email role')
      .lean();

    if (!depot) return res.status(404).json({ success: false, message: 'Dépôt introuvable' });

    res.json({ success: true, data: depot });
  } catch (err) {
    console.error('depot.getById error', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * POST /api/depots
 */
exports.create = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;

  try {
    const payload = req.body || {};

    const created = await Depot.create({
      name: toStr(payload.name),
      city: toStr(payload.city),
      address: toStr(payload.address),
      phone: toStr(payload.phone),
      managerId: payload.managerId ? payload.managerId : null
    });

    // (optionnel) renvoyer le depot avec populate
    const populated = await Depot.findById(created._id)
      .populate('managerId', 'firstName lastName email role')
      .lean();

    res.status(201).json({ success: true, data: populated || created });
  } catch (err) {
    console.error('depot.create error', err);

    // duplicate name (index unique)
    if (err && err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Un dépôt avec ce nom existe déjà.' });
    }

    res.status(400).json({ success: false, message: err.message || 'Erreur création dépôt' });
  }
};

/**
 * PUT /api/depots/:id
 */
exports.update = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;

  try {
    const id = req.params.id;
    const payload = req.body || {};

    // Construction d'un $set propre (pas de undefined)
    const set = {};
    if (payload.name !== undefined) set.name = toStr(payload.name);
    if (payload.city !== undefined) set.city = toStr(payload.city);
    if (payload.address !== undefined) set.address = toStr(payload.address);
    if (payload.phone !== undefined) set.phone = toStr(payload.phone);
    if (payload.managerId !== undefined) set.managerId = payload.managerId ? payload.managerId : null;

    const updated = await Depot.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true, runValidators: true }
    )
      .populate('managerId', 'firstName lastName email role')
      .lean();

    if (!updated) return res.status(404).json({ success: false, message: 'Dépôt introuvable' });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('depot.update error', err);

    if (err && err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Un dépôt avec ce nom existe déjà.' });
    }

    res.status(400).json({ success: false, message: err.message || 'Erreur mise à jour dépôt' });
  }
};

/**
 * DELETE /api/depots/:id
 */
exports.remove = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;

  try {
    const id = req.params.id;

    const deleted = await Depot.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'Dépôt introuvable' });

    res.json({ success: true, data: deleted });
  } catch (err) {
    console.error('depot.remove error', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ASSIGN-MANAGER
exports.assignManager = async (req, res) => {
  try {
    const depotId = req.params.id;
    const { managerId } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(depotId)) {
      return res.status(400).json({ success: false, message: 'ID dépôt invalide' });
    }

    // managerId peut être null => retrait
    if (managerId !== null && !mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ success: false, message: 'ID gestionnaire invalide' });
    }

    // Si on affecte quelqu’un : il doit exister + être GESTION_DEPOT
    if (managerId) {
      const manager = await User.findById(managerId).select('_id role').lean();
      if (!manager) {
        return res.status(404).json({ success: false, message: 'Gestionnaire introuvable' });
      }
      if (manager.role !== 'GESTION_DEPOT') {
        return res.status(400).json({
          success: false,
          message: 'Le gestionnaire doit avoir le rôle GESTION_DEPOT'
        });
      }
    }

    const updated = await Depot.findByIdAndUpdate(
      depotId,
      { $set: { managerId: managerId || null } },
      { new: true, runValidators: true }
    )
      .populate('managerId', 'firstName lastName email role')
      .lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Dépôt introuvable' });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('depot.assignManager error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// stats du dépôt
exports.stats = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID dépôt invalide' });
    }

    const depotExists = await Depot.exists({ _id: id });
    if (!depotExists) {
      return res.status(404).json({ success: false, message: 'Dépôt introuvable' });
    }

    const [consumablesCount, materialsCount, vehiclesCount, techniciansCount] = await Promise.all([
      Consumable.countDocuments({ idDepot: id }),
      Material.countDocuments({ idDepot: id }),
      Vehicle.countDocuments({ idDepot: id }),
      User.countDocuments({ idDepot: id, role: 'TECHNICIEN' }),
    ]);

    return res.json({
      success: true,
      data: {
        consumables: consumablesCount,
        materials: materialsCount,
        vehicles: vehiclesCount,
        technicians: techniciansCount,
      },
    });
  } catch (err) {
    console.error('depot.stats error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
