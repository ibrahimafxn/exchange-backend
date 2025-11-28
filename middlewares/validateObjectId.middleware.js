/**
 * Vérifie que l'ID passé en paramètre est un ObjectId MongoDB valide.
 */
const mongoose = require('mongoose');

module.exports = function validateObjectId(paramName) {
    return (req, res, next) => {
        if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
            return res.status(400).json({ message: `ID invalide pour ${paramName}` });
        }
        next();
    };
};
