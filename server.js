/**
 * server.js
 * Point d'entrée de l'API FXN
 *
 * - Charge la configuration
 * - Connecte MongoDB
 * - Monte les routes
 * - Démarre le serveur
 */

require('dotenv').config();

const cookieParser = require('cookie-parser'); // <--- ajouté
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// Connexion à la base MongoDB
connectDB().then(r => console.log('Connected to DB'));

// Middlewares globaux
app.use(helmet()); // sécurité HTTP headers
app.use(morgan('dev'));
// CORS: autoriser credentials si front <> back
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
  credentials: true
}));
app.options('*', cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
    credentials: true
}));
app.use(express.json({ limit: '5mb' })); // body parser
app.use(morgan('dev')); // logs HTTP
app.use(express.json());
app.use(cookieParser());

// Routes admin
app.use('/api/admin', require('./routes/admin.routes'));
// Routes API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/depots', require('./routes/depot.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/materials', require('./routes/material.routes'));
app.use('/api/consumables', require('./routes/consumable.routes'));
app.use('/api/vehicles', require('./routes/vehicle.routes'));
app.use('/api/attributions', require('./routes/attribution.routes'));
app.use('/api/hr', require('./routes/hr.routes'));
// Health check simple
app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));
// Route test
app.get('/api', (req, res) => {
  res.json({ message: 'API FXN fonctionne !' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`FXN API running on http://localhost:${PORT}`);
});

const errorHandler = require('./middlewares/errorHandler.middleware');
app.use(errorHandler);
