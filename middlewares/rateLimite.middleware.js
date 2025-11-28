/**
 * middleware/rateLimiter.js
 * Exemple simple pour éviter les attaques par force brute
 */
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requêtes par IP
    message: 'Trop de requêtes, réessayez plus tard.'
});

module.exports = apiLimiter;
