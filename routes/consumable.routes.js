const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/consumable.controller');
const ROLES = require('../config/roles');
const { reserveConsumableTransactional } = require('../services/consumable.service');

router.get('/', auth, authorize(), ctrl.list);

router.post(
  '/',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.create
);

router.put(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT, ROLES.GESTION_DEPOT]),
  ctrl.update
);

router.delete(
  '/:id',
  auth,
  authorize([ROLES.ADMIN, ROLES.DIRIGEANT]),
  ctrl.remove
);

router.post(
  '/reserve',
  auth,
  authorize(['ADMIN','DIRIGEANT','GESTION_DEPOT']),
  async (req, res) => {
    try {
      const { consumableId, qty, toUser, fromDepot, author } = req.body;
      const result = await reserveConsumableTransactional(consumableId, qty, toUser, fromDepot, author);
      res.json(result);
    } catch (err) {
      console.error('reserve error', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);


module.exports = router;
