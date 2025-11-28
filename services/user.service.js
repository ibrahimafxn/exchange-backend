/**
 * services/user.service.js
 * Service de gestion des utilisateurs FXN
 *
 * - CRUD utilisateurs
 * - Vérification unicité (email / phone / numSec / numSiret / username)
 * - Gestion des accès (username + password hashé)
 * - Affectation dépôt & véhicules
 * - Reset password
 */

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/user.model');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/* -------------------------------------------------------------------------- */
/*                                HELPERS UTILES                              */
/* -------------------------------------------------------------------------- */

/** Supprime les données sensibles */
function sanitize(u) {
    if (!u) return null;
    const obj = u.toObject ? u.toObject() : { ...u };
    delete obj.password;
    return obj;
}

/** Convertit erreur Mongo duplicate → message clair */
function handleDuplicate(err) {
    if (err && err.code === 11000) {
        const key = Object.keys(err.keyValue || {})[0];
        return new Error(`Le champ "${key}" existe déjà dans la base.`);
    }
    return err;
}

/** Vérifie validité ObjectId */
function isId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/* -------------------------------------------------------------------------- */
/*                                   SERVICE                                  */
/* -------------------------------------------------------------------------- */

module.exports = {

    /* ============================= CREATE ================================= */

    /**
     * createUser(data)
     * - Hash le password automatiquement
     * - Vérifie unicité des champs
     */
    async createUser(data = {}) {
        try {
            const payload = { ...data };

            if (!payload.password) {
                throw new Error("Password manquant pour la création utilisateur.");
            }

            payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS);

            const user = new User(payload);
            const saved = await user.save();

            return sanitize(saved);
        } catch (err) {
            throw handleDuplicate(err);
        }
    },

    /* ============================== READ ================================== */

    async findById(id) {
        if (!isId(id)) return null;
        const u = await User.findById(id).exec();
        return sanitize(u);
    },

    async findByEmail(email) {
        const u = await User.findOne({ email }).exec();
        return sanitize(u);
    },

    async findByUsername(username) {
        const u = await User.findOne({ username }).exec();
        return sanitize(u);
    },

    /* ============================== LIST ================================== */

    /**
     * list(filter, options)
     * - Recherche paginée + full text simple
     */
    async list(filter = {}, opts = {}) {
        const page = parseInt(opts.page || "1");
        const limit = parseInt(opts.limit || "25");
        const skip = (page - 1) * limit;

        const query = { ...filter };

        if (filter.q) {
            const r = new RegExp(filter.q, "i");
            query.$or = [
                { firstName: r },
                { lastName: r },
                { email: r },
                { phone: r },
                { username: r }
            ];
            delete query.q;
        }

        const [total, items] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .sort(opts.sort || { createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ]);

        return {
            total,
            page,
            limit,
            items: items.map(sanitize)
        };
    },

    /* ============================== UPDATE ================================ */

    async updateUser(id, data = {}) {
        if (!isId(id)) throw new Error("ID invalide.");

        // on évite la modification directe du password
        if (data.password) delete data.password;

        try {
            const updated = await User.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, runValidators: true }
            );

            return sanitize(updated);
        } catch (err) {
            throw handleDuplicate(err);
        }
    },

    /**
     * Change uniquement le mot de passe
     */
    async setPassword(id, password) {
        if (!isId(id)) throw new Error("ID invalide.");
        if (!password || password.length < 6) throw new Error("Mot de passe trop court.");

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        await User.findByIdAndUpdate(id, { $set: { password: hash } });
        return true;
    },

    /**
     * Comparaison password → login
     */
    async comparePassword(emailOrUsername, password) {
        const u = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        }).exec();

        if (!u) return { ok: false, reason: 'not_found' };

        const ok = await bcrypt.compare(password, u.password);
        if (!ok) return { ok: false, reason: 'bad_credentials' };

        return { ok: true, user: sanitize(u) };
    },

    /* ============================== DELETE ================================ */

    async deleteUser(id) {
        if (!isId(id)) throw new Error("ID invalide.");
        const res = await User.findByIdAndDelete(id);
        return sanitize(res);
    },

    /* =========================== UNICITÉ LOGIQUE ========================== */

    /**
     * Vérifie unicité pour validation frontend :
     * - email
     * - phone
     * - numSec
     * - numSiret
     * - username
     */
    async isUniqueUser(fields = {}, excludeId = null) {
        const keys = ["email", "phone", "numSec", "numSiret", "username"];

        const or = keys
            .filter(k => fields[k])
            .map(k => ({ [k]: fields[k] }));

        if (or.length === 0) return { ok: true, conflicts: {} };

        const query = excludeId && isId(excludeId)
            ? { $or: or, _id: { $ne: excludeId } }
            : { $or: or };

        const docs = await User.find(query).lean();

        const conflicts = {};
        for (const doc of docs) {
            for (const k of keys) {
                if (fields[k] && doc[k] === fields[k]) conflicts[k] = true;
            }
        }

        return { ok: Object.keys(conflicts).length === 0, conflicts };
    },

    /* ========================== GESTION DES ACCÈS ========================= */

    /**
     * giveAccess(userId, { username, password })
     * - pour créer un accès employé/technicien
     */
    async giveAccess(id, { username, password }) {
        if (!isId(id)) throw new Error("ID invalide.");
        if (!password) throw new Error("Password requis.");

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const updated = await User.findByIdAndUpdate(
            id,
            { $set: { username, password: hash } },
            { new: true }
        );

        return sanitize(updated);
    },

    /* ========================= AFFECTATIONS DÉPÔT ========================= */

    /**
     * Assigne un utilisateur (gestionnaire ou technicien) à un dépôt
     */
    async assignDepot(userId, depotId) {
        if (!isId(userId)) throw new Error("ID utilisateur invalide.");

        const updated = await User.findByIdAndUpdate(
            userId,
            { $set: { idDepot: depotId || null } },
            { new: true }
        );

        return sanitize(updated);
    },

    /* ======================= AFFECTATIONS VEHICULE ======================== */

    /**
     * Assigne un véhicule à un utilisateur
     */
    async assignVehicle(userId, vehicleId) {
        if (!isId(userId)) throw new Error("ID utilisateur invalide.");

        const updated = await User.findByIdAndUpdate(
            userId,
            { $set: { assignedVehicle: vehicleId || null } },
            { new: true }
        );

        return sanitize(updated);
    }
};
