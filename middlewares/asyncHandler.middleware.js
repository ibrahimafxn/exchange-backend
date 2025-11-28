/**
 * Wrapper pour capturer automatiquement les erreurs async
 * et les passer au middleware errorHandler.
 */
module.exports = function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
