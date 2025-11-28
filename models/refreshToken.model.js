const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  userAgent: String,
  ip: String
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // cleanup automatique

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
