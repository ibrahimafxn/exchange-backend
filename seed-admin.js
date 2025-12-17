// seed-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user.model'); // adapte le chemin si besoin

async function run() {
    try {
        // 1. Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log('✅ Connecté à MongoDB');

        // 2. Vérifier s’il existe déjà un DIRIGEANT / ADMIN
        const existing = await User.findOne({
            role: { $in: ['DIRIGEANT', 'ADMIN'] }
        });

        if (existing) {
            console.log('⚠️ Un utilisateur avec rôle DIRIGEANT/ADMIN existe déjà :', existing.email);
            process.exit(0);
        }

        // 3. Définir les infos du premier compte
        const plainPassword = 'Admin123!'; // change ensuite dans l’UI
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        const user = new User({
            firstName: 'Admin',
            lastName: 'FXN',
            email: 'admin@fxn.local', // ton email de connexion
            phone: '',
            username: 'admin',
            password: passwordHash,
            role: 'DIRIGEANT',   // ou 'ADMIN'
            idDepot: null,
            assignedVehicle: null,
        });

        await user.save();
        console.log('✅ Utilisateur DIRIGEANT créé :');
        console.log('   Email   :', user.email);
        console.log('   Login   :', user.username);
        console.log('   Password:', plainPassword);
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur seed-admin:', err);
        process.exit(1);
    }
}

run();
