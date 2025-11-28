// middlewares/verifyAccessToken.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async function verifyAccessToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Token manquant' });

    const token = auth.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-password');
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
    if (!user.isAllowed) return res.status(403).json({ message: 'Accès interdit' });

    req.user = user; // attach user object
    next();
  } catch (err) {
    console.error('verifyAccessToken error', err);
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};
