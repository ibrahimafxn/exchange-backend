const asyncHandler = require('../middlewares/asyncHandler.middleware');
const User = require('../models/user.model');
const Depot = require('../models/depot.model');
const Material = require('../models/material.model');
const Vehicle = require('../models/vehicle.model');
const Consumable = require('../models/consumable.model');
const ResourceMovement = require('../models/resourceMovement.model');

// -----------------------------
// DASHBOARD
// -----------------------------
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  const depotCount = await Depot.countDocuments();
  const materialCount = await Material.countDocuments();
  const vehicleCount = await Vehicle.countDocuments();
  const consumableCount = await Consumable.countDocuments();

  res.json({
    users: userCount,
    depots: depotCount,
    materials: materialCount,
    vehicles: vehicleCount,
    consumables: consumableCount
  });
});

// -----------------------------
// UTILISATEURS
// -----------------------------
exports.getUsers = asyncHandler(async (req, res) => {
  const { search, role, depot } = req.query;
  const filter = {};

  if (search) filter.$or = [
    { name: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
    { phone: new RegExp(search, 'i') }
  ];
  if (role) filter.role = role;
  if (depot) filter.depotId = depot;

  const users = await User.find(filter);
  res.json(users);
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.idUser);
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  res.json(user);
});

exports.createUser = asyncHandler(async (req, res) => {
  const newUser = await User.create(req.body);
  res.status(201).json(newUser);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(req.params.idUser, req.body, { new: true });
  res.json(updatedUser);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.idUser);
  res.json({ message: 'Utilisateur supprimé' });
});

// -----------------------------
// DEPOTS
// -----------------------------
exports.getDepots = asyncHandler(async (req, res) => {
  const depots = await Depot.find();
  res.json(depots);
});

exports.createDepot = asyncHandler(async (req, res) => {
  const newDepot = await Depot.create(req.body);
  res.status(201).json(newDepot);
});

exports.updateDepot = asyncHandler(async (req, res) => {
  const updatedDepot = await Depot.findByIdAndUpdate(req.params.depotId, req.body, { new: true });
  res.json(updatedDepot);
});

exports.deleteDepot = asyncHandler(async (req, res) => {
  await Depot.findByIdAndDelete(req.params.depotId);
  res.json({ message: 'Dépôt supprimé' });
});

// -----------------------------
// RESSOURCES
// -----------------------------
exports.getResources = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { depotId } = req.query;
  let Model;

  switch (type) {
    case 'materials': Model = Material; break;
    case 'vehicles': Model = Vehicle; break;
    case 'consumables': Model = Consumable; break;
    default: return res.status(400).json({ message: 'Type de ressource invalide' });
  }

  const filter = depotId ? { depotId } : {};
  const resources = await Model.find(filter);
  res.json(resources);
});

exports.createResource = asyncHandler(async (req, res) => {
  const { type } = req.params;
  let Model;

  switch (type) {
    case 'materials': Model = Material; break;
    case 'vehicles': Model = Vehicle; break;
    case 'consumables': Model = Consumable; break;
    default: return res.status(400).json({ message: 'Type de ressource invalide' });
  }

  const newResource = await Model.create(req.body);
  res.status(201).json(newResource);
});

exports.updateResource = asyncHandler(async (req, res) => {
  const { type, resourceId } = req.params;
  let Model;

  switch (type) {
    case 'materials': Model = Material; break;
    case 'vehicles': Model = Vehicle; break;
    case 'consumables': Model = Consumable; break;
    default: return res.status(400).json({ message: 'Type de ressource invalide' });
  }

  const updatedResource = await Model.findByIdAndUpdate(resourceId, req.body, { new: true });
  res.json(updatedResource);
});

exports.deleteResource = asyncHandler(async (req, res) => {
  const { type, resourceId } = req.params;
  let Model;

  switch (type) {
    case 'materials': Model = Material; break;
    case 'vehicles': Model = Vehicle; break;
    case 'consumables': Model = Consumable; break;
    default: return res.status(400).json({ message: 'Type de ressource invalide' });
  }

  await Model.findByIdAndDelete(resourceId);
  res.json({ message: 'Ressource supprimée' });
});

// -----------------------------
// HISTORIQUE / MOUVEMENTS
// -----------------------------
exports.getHistory = asyncHandler(async (req, res) => {
  const { userId, depotId, type, fromDate, toDate } = req.query;
  const filter = {};

  if (userId) filter.toUser = userId;
  if (depotId) filter.fromDepot = depotId;
  if (type) filter.resourceType = type.toUpperCase();
  if (fromDate || toDate) filter.timestamp = {};
  if (fromDate) filter.timestamp.$gte = new Date(fromDate);
  if (toDate) filter.timestamp.$lte = new Date(toDate);

  const history = await ResourceMovement.find(filter).sort({ timestamp: -1 }).populate('author toUser fromDepot resourceId');
  res.json(history);
});

exports.exportHistoryExcel = asyncHandler(async (req, res) => {
  // Ici tu peux utiliser exceljs ou autre pour générer le fichier
  res.status(501).json({ message: 'Export Excel non implémenté pour le moment' });
});
