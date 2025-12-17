// controllers/user.controller.js
const { validationResult, body } = require('express-validator');
const UserService = require('../services/user.service');

/**
 * Controller pour gérer les utilisateurs.
 * Chaque méthode renvoie JSON { success: true, data } ou status d'erreur.
 */

/* Validation shareable (ex: used in routes) */
exports.createValidators = [
  body('firstName').isString().notEmpty(),
  body('email').isEmail(),
    body('password')
        .optional({ checkFalsy: true })
        .isLength({ min: 6 })
];

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
}

/* ------------------------- CREATE ------------------------- */
exports.create = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;

  try {
    const payload = req.body;
    const created = await UserService.createUser(payload);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('user.create error', err);
    res.status(400).json({ success: false, message: err.message || 'Erreur création utilisateur' });
  }
};

/* ------------------------- READ --------------------------- */
exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await UserService.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('user.getById error', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await UserService.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('user.getByEmail error', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* ------------------------- LIST --------------------------- */
exports.list = async (req, res) => {
  try {
    const filter = {};
    const q = req.query.q || req.query.search;
    if (q) filter.q = q;
    if (req.query.role) filter.role = req.query.role;

    const opts = {
      page: req.query.page || 1,
      limit: req.query.limit || 25,
      sort: req.query.sort || { createdAt: -1 }
    };

    const result = await UserService.list(filter, opts);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('user.list error', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* ------------------------- UPDATE ------------------------- */
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const updated = await UserService.updateUser(id, payload);
    if (!updated) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('user.update error', err);
    res.status(400).json({ success: false, message: err.message || 'Erreur mise à jour' });
  }
};

/* ------------------------- DELETE ------------------------- */
exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await UserService.deleteUser(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, data: deleted });
  } catch (err) {
    console.error('user.remove error', err);
    res.status(500).json({ success: false, message: 'Erreur suppression' });
  }
};

/* ----------------------- PASSWORD ------------------------- */
exports.setPassword = async (req, res) => {
  try {
    const id = req.params.id;
    const { password } = req.body;
    await UserService.setPassword(id, password);
    res.json({ success: true });
  } catch (err) {
    console.error('user.setPassword error', err);
    res.status(400).json({ success: false, message: err.message || 'Erreur mise à jour password' });
  }
};

/* -------------------- UNIQUE CHECK ------------------------ */
exports.isUnique = async (req, res) => {
  try {
    const fields = req.body || {};
    const excludeId = req.query.excludeId || null;
    const result = await UserService.isUniqueUser(fields, excludeId);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('user.isUnique error', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* --------------------- GIVE ACCESS ------------------------ */
exports.giveAccess = async (req, res) => {
  try {
    const id = req.params.id;
    const { username, password } = req.body;
    const updated = await UserService.giveAccess(id, { username, password });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('user.giveAccess error', err);
    res.status(400).json({ success: false, message: err.message || 'Erreur giveAccess' });
  }
};

/* --------------------- ASSIGN DEPOT ----------------------- */
exports.assignDepot = async (req, res) => {
  try {
    const id = req.params.id;
    const { depotId } = req.body;
    const updated = await UserService.assignDepot(id, depotId);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('user.assignDepot error', err);
    res.status(400).json({ success: false, message: err.message || 'Erreur assign depot' });
  }
};

/* -------------------- ASSIGN VEHICLE ---------------------- */
exports.assignVehicle = async (req, res) => {
  try {
    const id = req.params.id;
    const { vehicleId } = req.body;
    const updated = await UserService.assignVehicle(id, vehicleId);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('user.assignVehicle error', err);
    res.status(400).json({ success: false, message: err.message || 'Erreur assign vehicle' });
  }
};
