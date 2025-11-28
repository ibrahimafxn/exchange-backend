/**
 * Middleware global pour capturer toutes les erreurs
 * et renvoyer un JSON standardisé.
 */
module.exports = function errorHandler(err, req, res, next) {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erreur serveur inconnue';

    res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || null
    });
};
