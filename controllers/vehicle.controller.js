// controllers/vehicle.controller.js
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Vehicle = require('../models/vehicle.model');
const vehicleSvc = require('../services/vehicle.service');

function isId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
}

// GET /api/vehicles?q=&depot|idDepot=&page=&limit=
exports.list = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '25'), 10);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;
    const skip = (safePage - 1) * safeLimit;

    const depot = String(req.query.depot || req.query.idDepot || '').trim();

    /** @type {{[key:string]: unknown}} */
    const filter = {};

    if (depot) filter.idDepot = depot;

    if (q) {
      const r = new RegExp(q, 'i');
      filter.$or = [
        { plateNumber: r },
        { brand: r },
        { model: r },
      ];
    }

    const [total, items] = await Promise.all([
      Vehicle.countDocuments(filter),
      Vehicle.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('idDepot', 'name city')
        .populate('assignedTo', 'firstName lastName email role')
        .lean()
    ]);

    return res.json({
      success: true,
      data: { total, page: safePage, limit: safeLimit, items }
    });
  } catch (err) {
    console.error('vehicle.list error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ success: false, message: 'ID invalide' });

    const doc = await Vehicle.findById(id)
      .populate('idDepot', 'name city')
      .populate('assignedTo', 'firstName lastName email role')
      .lean();

    if (!doc) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('vehicle.getById error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.createValidators = [
  body('plateNumber').isString().trim().notEmpty().withMessage('plateNumber requis'),
  body('brand').optional().isString().trim(),
  body('model').optional().isString().trim(),
  body('year').optional().isInt({ min: 1900, max: 2100 }).toInt(),
  body('idDepot').optional().isString().trim(),
];

exports.create = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const exists = await Vehicle.findOne({ plateNumber: req.body.plateNumber }).lean();
    if (exists) return res.status(400).json({ success: false, message: 'Plaque déjà utilisée' });

    const created = await Vehicle.create({
      plateNumber: req.body.plateNumber,
      brand: req.body.brand ?? '',
      model: req.body.model ?? '',
      year: typeof req.body.year === 'number' ? req.body.year : undefined,
      idDepot: req.body.idDepot ?? undefined,
      createdBy: req.user?.id ?? undefined,
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('vehicle.create error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ success: false, message: 'ID invalide' });

    const updates = { ...req.body };
    // sécurité: éviter modifications directes de l’état transactionnel
    delete updates.assignedTo;

    const updated = await Vehicle.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('vehicle.update error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ success: false, message: 'ID invalide' });

    const deleted = await Vehicle.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });

    return res.json({ success: true, data: { _id: id } });
  } catch (err) {
    console.error('vehicle.remove error', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/vehicles/:id/assign
exports.assignValidators = [
  body('techId').isString().trim().notEmpty().withMessage('techId requis'),
];

// PUT /api/vehicles/:id/release
exports.releaseValidators = [
  body('depotId').isString().trim().notEmpty().withMessage('depotId requis'),
];

// controllers/vehicle.controller.js

exports.assign = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const result = await vehicleSvc.assignVehicleTransactional(
      req.params.id,
      req.body.techId,
      req.user?.id ?? null
    );

    // ✅ data = Vehicle
    return res.json({
      success: true,
      data: result.vehicle,
      meta: { attributionId: result.attribution?._id ?? null }
    });
  } catch (err) {
    console.error('vehicle.assign error', err);
    return res.status(400).json({ success: false, message: err.message || 'Erreur assignation' });
  }
};

exports.release = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const result = await vehicleSvc.releaseVehicleTransactional(
      req.params.id,
      req.body.depotId,
      req.user?.id ?? null
    );

    // ✅ data = Vehicle
    return res.json({
      success: true,
      data: result.vehicle,
      meta: { attributionId: result.attribution?._id ?? null }
    });
  } catch (err) {
    console.error('vehicle.release error', err);
    return res.status(400).json({ success: false, message: err.message || 'Erreur reprise' });
  }
};

// GET /api/vehicles/:id/history?page=&limit=
exports.history = async (req, res) => {
  try {
    const page = String(req.query.page || '1');
    const limit = String(req.query.limit || '25');

    const result = await vehicleSvc.listHistoryByVehicle(req.params.id, { page, limit });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('vehicle.history error', err);
    return res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
};
