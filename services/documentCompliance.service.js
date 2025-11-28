
/**
 * services/documentCompliance.service.js
 *
 * Logique pour la conformité administrative :
 * - checkUserCompliance(userId, requiredTypes)
 * - generateComplianceReport(requiredTypes, options)
 *
 * Ne nécessite pas obligatoirement de transaction (lecture majoritaire), mais on inclut
 * des opérations de lecture optimisées et claires.
 */

const EmployeeDoc = require('../models/employeeDoc.model');
const User = require('../models/user.model');

/**
 * Vérifie si un utilisateur possède les types requis (ex: ['CNI','PERMIS'])
 * Renvoie { ok: boolean, missing: [types manquants], details: [doc objects] }
 */
async function checkUserCompliance(userId, requiredTypes = []) {
    const docs = await EmployeeDoc.find({ user: userId, valid: true });
    const typesPresent = new Set(docs.map(d => d.type));
    const missing = requiredTypes.filter(t => !typesPresent.has(t));
    return {
        ok: missing.length === 0,
        missing,
        details: docs
    };
}

/**
 * Génère un rapport de conformité pour tous les utilisateurs (ou filtre)
 * - requiredTypes: tableau des types que chaque utilisateur doit posséder
 * - options: { activeOnly: boolean, expiryWithinDays: number }
 */
async function generateComplianceReport(requiredTypes = [], options = {}) {
    // Récupérer tous les utilisateurs (ou appliquer un filtre si fourni)
    const users = await User.find({}); // possibilité d'ajouter filtres via options

    const report = [];
    // Pour éviter N+1, on peut récupérer tous les documents valides et grouper par user
    const docs = await EmployeeDoc.find({ valid: true }).lean();
    const docsByUser = docs.reduce((acc, doc) => {
        acc[doc.user] = acc[doc.user] || [];
        acc[doc.user].push(doc);
        return acc;
    }, {});

    const now = new Date();
    for (const u of users) {
        const userDocs = docsByUser[u._id] || [];
        const typesPresent = new Set(userDocs.map(d => d.type));
        const missing = requiredTypes.filter(t => !typesPresent.has(t));
        const expired = userDocs.filter(d => d.expiryDate && new Date(d.expiryDate) <= now);
        report.push({
            user: { id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email },
            ok: missing.length === 0 && expired.length === 0,
            missing,
            expired
        });
    }

    return report;
}

module.exports = { checkUserCompliance, generateComplianceReport };
