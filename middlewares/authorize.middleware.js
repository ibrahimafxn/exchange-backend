/**
 * Vérifie que l'utilisateur possède le rôle requis.
 * allowedRoles = [] → juste vérifier que l'utilisateur est connecté.
 */
module.exports = function authorize(allowedRoles = []) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Utilisateur non authentifié' });

        if (allowedRoles.length && !allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        next();
    };
};
