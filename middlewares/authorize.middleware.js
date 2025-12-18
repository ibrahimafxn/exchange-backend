/**
 * Vérifie que l'utilisateur possède le rôle requis.
 * allowedRoles = [] → juste vérifier que l'utilisateur est connecté.
 */
// middlewares/authorize.middleware.js
module.exports = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    next();
  };
};
