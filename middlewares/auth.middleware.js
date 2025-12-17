// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.slice(7).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // aligné avec signAccessToken(user) => sub
    const user = await User.findById(payload.sub).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    // si tu veux gérer un flag global d’autorisation, tu peux mettre :
    // if (user.isAllowed === false) {
    //   return res.status(403).json({ message: 'Accès interdit' });
    // }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};
