/**
 * routes/consumable.routes.js
 * Routes consommables (protégées)
 */
const router = require('express').Router();

const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ROLES = require('../config/roles');

const ctrl = require('../controllers/consumable.controller');
const { reserveConsumableTransactional } = require('../services/consumable.service');

/**
 * LIST (paginée)
 * - admin/dirigeant/gestion_depot
 */
router.get(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.list
);

/**
 * CREATE
 */
router.post(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.createValidators,
  ctrl.create
);

/**
 * UPDATE
 */
router.put(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.updateValidators,
  ctrl.update
);

/**
 * DELETE
 * (si tu veux garder ADMIN+DIRIGEANT comme avant, ok)
 */
router.delete(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  ctrl.remove
);

/**
 * RESERVE (tu gardes ton endpoint custom)
 */
router.post(
  '/reserve',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  async (req, res) => {
    try {
      const { consumableId, qty, toUser, fromDepot, author } = req.body;
      const result = await reserveConsumableTransactional(consumableId, qty, toUser, fromDepot, author);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error('consumable.reserve error', err);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// Détail
router.get(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.getById
);

module.exports = router;
