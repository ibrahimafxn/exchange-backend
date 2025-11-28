/**
 * models/EmployeeDoc.js
 * Documents RH pour un employé (permis, identité, formation)
 */
const mongoose = require('mongoose');

const docSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // ex: 'CNI', 'PERMIS', 'DIPLOMA'
    fileUrl: { type: String, required: true }, // stockage externe (Firebase Storage, S3, etc.)
    expiryDate: { type: Date, default: null },
    valid: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeDoc', docSchema);
