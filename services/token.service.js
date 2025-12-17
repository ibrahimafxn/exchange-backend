// services/token.service.js
const RefreshToken = require('../models/refreshToken.model');

/**
 * Simple service pour manipuler les refresh tokens.
 * (le schéma attend `user`, pas `userId`)
 */

async function saveRefreshToken({ token, userId, expiresAt, role, userAgent, ip }) {
    const doc = new RefreshToken({
        token,
        user: userId,          // ✅ IMPORTANT: user (ObjectId)
        expiresAt,
        // champs optionnels du schéma
        userAgent,
        ip
    });
    return doc.save();
}

async function findByToken(token) {
    // ✅ pas lean si tu veux accéder à rec.user (ObjectId) et rec.save,
    // mais lean est OK si tu ne modifies pas l'objet.
    return RefreshToken.findOne({ token });
}

async function invalidateToken(token) {
    return RefreshToken.deleteOne({ token });
}

/**
 * replaceRefreshToken(oldToken, newToken, newExpiresAt)
 * - remplace le token de manière simple (non-transactionnelle)
 */
async function replaceRefreshToken(oldToken, newToken, newExpiresAt) {
    const rec = await RefreshToken.findOne({ token: oldToken });
    if (!rec) throw new Error('refresh token not found');

    const user = rec.user;

    // delete old
    await RefreshToken.deleteOne({ token: oldToken });

    // save new
    const doc = new RefreshToken({
        token: newToken,
        user,                 // ✅ IMPORTANT
        expiresAt: newExpiresAt
    });

    return doc.save();
}

module.exports = {
    saveRefreshToken,
    findByToken,
    invalidateToken,
    replaceRefreshToken
};
