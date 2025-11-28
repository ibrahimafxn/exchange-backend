/**
 * config/db.js
 * Connexion à MongoDB via mongoose
 */
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI non défini dans .env');
        await mongoose.connect(uri, {
            // options par défaut compatibles avec Mongoose 7+
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('Erreur connexion MongoDB:', err.message || err);
        process.exit(1);
    }
};

module.exports = connectDB;
