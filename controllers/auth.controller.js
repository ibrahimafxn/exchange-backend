const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');

const ACCESS_TOKEN_TTL = '15m';    // régler selon besoin
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // en secondes (ex: 30 jours)

function signAccessToken(user) {
  return jwt.sign({
    sub: user._id.toString(),
    role: user.role,
    email: user.email
  }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken() {
  // random string; jwt could be used but un-encoded random is fine
  return require('crypto').randomBytes(64).toString('hex');
}

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
  if (!user.isAllowed) return res.status(403).json({ message: 'Accès interdit' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });

  const accessToken = signAccessToken(user);
  const refreshTokenString = signRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

  await RefreshToken.create({
    token: refreshTokenString,
    user: user._id,
    expiresAt,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // set refresh token as HttpOnly cookie
  res.cookie('refreshToken', refreshTokenString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt
  });

  res.json({
    accessToken,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, depotId: user.depotId }
  });
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'Refresh token manquant' });

  const stored = await RefreshToken.findOne({ token }).populate('user');
  if (!stored) return res.status(401).json({ message: 'Refresh token invalide' });
  if (stored.expiresAt < new Date()) {
    await stored.deleteOne();
    return res.status(401).json({ message: 'Refresh token expiré' });
  }

  const user = stored.user;
  if (!user || !user.isAllowed) return res.status(403).json({ message: 'Utilisateur invalide' });

  // rotation optionnelle: créer nouveau refresh token et supprimer l'ancien
  const newRefresh = signRefreshToken();
  const newExpires = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);
  stored.token = newRefresh;
  stored.expiresAt = newExpires;
  stored.userAgent = req.get('User-Agent');
  stored.ip = req.ip;
  await stored.save();

  res.cookie('refreshToken', newRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: newExpires
  });

  const accessToken = signAccessToken(user);
  res.json({ accessToken, user: { _id: user._id, name: user.name, role: user.role, depotId: user.depotId } });
};

exports.logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await RefreshToken.deleteOne({ token });
    res.clearCookie('refreshToken');
  }
  res.json({ message: 'Logged out' });
};
