/**
 * services/employee.service.js
 *
 * Fonctions métier RH relatives aux employés et à leurs documents.
 * - addDocumentTransactional : ajoute un document et, si besoin, met à jour l'état de conformité (ex : valid=false)
 * - listDocsForUser
 * - listExpiredDocs
 *
 * L'ajout d'un document peut toucher d'autres documents (ex: invalider l'ancien doc).
 * On propose une version transactionnelle pour ce cas.
 */

const mongoose = require('mongoose');
const EmployeeDoc = require('../models/employeeDoc.model');
const User = require('../models/user.model');

/**
 * Liste des documents pour un utilisateur
 */
async function listDocsForUser(userId) {
    return EmployeeDoc.find({ user: userId }).sort({ createdAt: -1 });
}

/**
 * Liste les documents expirés (<= referenceDate)
 */
async function listExpiredDocs(referenceDate = new Date()) {
    return EmployeeDoc.find({ expiryDate: { $lte: referenceDate } }).populate('user');
}

/**
 * Ajoute un document pour un utilisateur de façon transactionnelle.
 * Option : invalider les anciens documents du même type (par ex: remplacer un permis).
 *
 * @param {Object} payload { user, type, fileUrl, expiryDate, valid }
 * @param {Object} options { invalidatePreviousSameType: boolean }
 */
async function addDocumentTransactional(payload, options = {}) {
    const session = await mongoose.startSession();
    try {
        let result = null;
        await session.withTransaction(async () => {
            const user = await User.findById(payload.user).session(session);
            if (!user) throw new Error('Utilisateur introuvable');

            if (options.invalidatePreviousSameType) {
                await EmployeeDoc.updateMany(
                    { user: payload.user, type: payload.type, valid: true },
                    { $set: { valid: false } },
                    { session }
                );
            }

            const docArr = await EmployeeDoc.create([payload], { session });
            result = docArr[0];
        });

        return result;
    } catch (err) {
        console.error('addDocumentTransactional error', err.message || err);
        throw err;
    } finally {
        session.endSession();
    }
}

module.exports = { listDocsForUser, listExpiredDocs, addDocumentTransactional };
