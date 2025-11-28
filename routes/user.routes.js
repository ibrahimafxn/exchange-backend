// routes/user.routes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const verifyAccessToken = require('../middlewares/verifyAccessToken.middleware'); // si protégé

// Public route for uniqueness check (could be protected depending needs)
router.post('/is-unique', UserController.isUnique);

// Create (protected)
router.post('/', /* verifyAccessToken, */ UserController.createValidators, UserController.create);

// List + query
router.get('/', /* verifyAccessToken, */ UserController.list);

// Get by id
router.get('/:id', /* verifyAccessToken, */ UserController.getById);

// Get by email (optional)
router.get('/email/:email', /* verifyAccessToken, */ UserController.getByEmail);

// Update
router.put('/:id', /* verifyAccessToken, */ UserController.update);

// Delete
router.delete('/:id', /* verifyAccessToken, */ UserController.remove);

// Password change
router.put('/:id/password', /* verifyAccessToken, */ UserController.setPassword);

// Give access (create username/password)
router.post('/:id/give-access', /* verifyAccessToken, */ UserController.giveAccess);

// Assign depot / vehicle
router.post('/:id/assign-depot', /* verifyAccessToken, */ UserController.assignDepot);
router.post('/:id/assign-vehicle', /* verifyAccessToken, */ UserController.assignVehicle);

module.exports = router;
