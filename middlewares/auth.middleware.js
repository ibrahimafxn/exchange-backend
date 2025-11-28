/**
 * Vérifie que la requête possède un JWT valide.
 * Attache l'utilisateur (sans password) sur req.user.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async function auth(req, res, next) {
    try {
        const authHeader = req.header('Authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) return res.status(401).json({ message: 'Token manquant' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error', err);
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};
