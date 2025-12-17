// controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const tokenService = require('../services/token.service');

const ACCESS_TOKEN_TTL = '15m';                  // ex: 15 minutes
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;    // 30 jours en secondes


/**
 * POST /auth/login
 * body: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    // Access token
    const accessToken = signAccessToken(user);

    // Refresh token
    const refreshToken = generateRefreshTokenString();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

    await tokenService.saveRefreshToken({
      token: refreshToken,
      userId: user._id,
      role: user.role,
      expiresAt,
    });

    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: buildUserPayload(user),
    });
  } catch (err) {
    next(err);
  }
};


/**
 * POST /auth/refresh
 * Utilise le cookie httpOnly "refreshToken"
 */
exports.refresh = async (req, res, next) => {
  try {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) {
      return res.status(401).json({ message: 'Refresh token manquant.' });
    }

    const stored = await tokenService.findByToken(oldToken);
    if (!stored) {
      return res.status(401).json({ message: 'Refresh token invalide.' });
    }

    // Vérifier expiration
    if (stored.expiresAt && stored.expiresAt.getTime() < Date.now()) {
      // tu peux aussi nettoyer en BDD ici
      return res.status(401).json({ message: 'Refresh token expiré.' });
    }

      const user = await User.findById(stored.user);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    // Nouveau access token
    const accessToken = signAccessToken(user);

    // Rotation du refresh token (optionnelle mais mieux)
    const newRefreshToken = generateRefreshTokenString();
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

    await tokenService.replaceRefreshToken(oldToken, newRefreshToken, newExpiresAt);

    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      accessToken,
      user: buildUserPayload(user),
    });
  } catch (err) {
    next(err);
  }
};


/**
 * POST /auth/logout
 * Supprime le refresh token courant.
 */
exports.logout = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            await tokenService.invalidateToken(token);
        }
        res.clearCookie('refreshToken', {
            path: process.env.REFRESH_COOKIE_PATH || '/api/auth/refresh',
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        return res.json({ message: 'Logged out' });
    } catch (err) {
        next(err);
    }
};


/**
 * Génère un JWT d'accès court terme.
 * Payload aligné avec ton auth.middleware (sub).
 */
function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

/**
 * Génère une chaîne aléatoire pour le refresh token.
 * (ici pas un JWT, juste un token opaque, ce qui est bien pour la sécu)
 */
function generateRefreshTokenString() {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Construit l’objet user renvoyé au front.
 * Bien aligné avec ton User schema.
 */
function buildUserPayload(user) {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    idDepot: user.idDepot,
    assignedVehicle: user.assignedVehicle,
  };
}

/**
 * Pose le cookie refreshToken sur la réponse.
 */
function cookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';

    // Si en prod ton front et ton back sont sur des domaines différents:
    // sameSite doit être 'none' ET secure true (HTTPS obligatoire).
    // Ici je te mets une config safe pour dev/local, et prod adaptable.
    const sameSite = isProd ? 'none' : 'lax';

    return {
        httpOnly: true,
        secure: isProd, // en local => false, en prod => true (HTTPS)
        sameSite,
        path: process.env.REFRESH_COOKIE_PATH || '/api/auth/refresh',
        maxAge: REFRESH_TOKEN_TTL * 1000
    };
}

function setRefreshTokenCookie(res, refreshToken) {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: process.env.REFRESH_COOKIE_PATH || '/api/auth/refresh',
        maxAge: REFRESH_TOKEN_TTL * 1000
    });
}


