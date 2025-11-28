// services/token.service.js
const RefreshToken = require('../models/refreshToken.model');

/**
 * Simple service pour manipuler les refresh tokens.
 * Pour production : ajoute hashing + TTL index + transactions si possible.
 */

async function saveRefreshToken({ token, userId, expiresAt, role }) {
  const doc = new RefreshToken({ token, userId, expiresAt, role });
  return doc.save();
}

async function findByToken(token) {
  return RefreshToken.findOne({ token }).lean();
}

async function invalidateToken(token) {
  return RefreshToken.deleteOne({ token });
}

/**
 * replaceRefreshToken(oldToken, newData)
 * - supprime l'ancien token et enregistre le nouveau
 * - implémentation simple (non-transactionnelle)
 */
async function replaceRefreshToken(oldToken, { token: newToken, expiresAt }) {
  const rec = await RefreshToken.findOne({ token: oldToken });
  if (!rec) throw new Error('refresh token not found');
  const userId = rec.userId;
  const role = rec.role;
  // delete old
  await RefreshToken.deleteOne({ token: oldToken });
  // save new
  const doc = new RefreshToken({ token: newToken, userId, role, expiresAt });
  return doc.save();
}

module.exports = {
  saveRefreshToken,
  findByToken,
  invalidateToken,
  replaceRefreshToken
};
