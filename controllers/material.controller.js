/**
 * controllers/material.controller.js
 * CRUD Matériels (outils, équipements)
 * ✔ pagination
 * ✔ recherche q
 * ✔ filtre depot / idDepot
 * ✔ format API standard { success, data }
 */

const { body, validationResult } = require('express-validator');
const Material = require('../models/material.model');

/* -------------------------------------------------------------------------- */
/*                                   LIST                                     */
/* -------------------------------------------------------------------------- */
exports.list = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '25'), 10);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;
    const skip = (safePage - 1) * safeLimit;

    // compat: ?depot=... ou ?idDepot=...
    const depot = String(req.query.depot || req.query.idDepot || '').trim();

    const filter = {};

    if (depot) {
      filter.idDepot = depot;
    }

    if (q) {
      const r = new RegExp(q, 'i');
      filter.$or = [
        { name: r },
        { category: r },
        { serial: r }
      ];
    }

    const [total, items] = await Promise.all([
      Material.countDocuments(filter),
      Material.find(filter)
        .sort({ createdAt: -1, name: 1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
    ]);

    return res.json({
      success: true,
      data: {
        total,
        page: safePage,
        limit: safeLimit,
        items
      }
    });
  } catch (err) {
    console.error('material.list error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                                  GET BY ID                                 */
/* -------------------------------------------------------------------------- */
exports.get = async (req, res) => {
  try {
    const mat = await Material.findById(req.params.id).lean();
    if (!mat) {
      return res.status(404).json({
        success: false,
        message: 'Matériel non trouvé'
      });
    }

    return res.json({
      success: true,
      data: mat
    });
  } catch (err) {
    console.error('material.get error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                                   CREATE                                   */
/* -------------------------------------------------------------------------- */
exports.create = [
  body('name').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const { name, category, serial, quantity = 0, idDepot } = req.body;

      const mat = await Material.create({
        name,
        category,
        serial,
        quantity,
        idDepot
      });

      return res.status(201).json({
        success: true,
        data: mat
      });
    } catch (err) {
      console.error('material.create error', err);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
];

/* -------------------------------------------------------------------------- */
/*                                   UPDATE                                   */
/* -------------------------------------------------------------------------- */
exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };

    // sécurité : on ne touche pas aux champs sensibles ici
    delete updates.assignedQuantity;

    const mat = await Material.findByIdAndUpdate(
      req.params.id,{ $set: updates },{ new: true});

    if (!mat) {
      return res.status(404).json({
        success: false,
        message: 'Matériel non trouvé'
      });
    }

    return res.json({
      success: true,
      data: mat
    });
  } catch (err) {
    console.error('material.update error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */
exports.remove = async (req, res) => {
  try {
    const mat = await Material.findByIdAndDelete(req.params.id);
    if (!mat) {
      return res.status(404).json({
        success: false,
        message: 'Matériel non trouvé'
      });
    }

    return res.json({
      success: true,
      message: 'Matériel supprimé'
    });
  } catch (err) {
    console.error('material.delete error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
