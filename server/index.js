/**
 * =============================================================
 * SERVEUR BACKEND - API REST pour l'application comptable
 * =============================================================
 * 
 * Ce serveur Express.js expose des endpoints REST pour :
 * - Gérer les transactions (CRUD complet)
 * - Gérer les clients (CRUD complet)
 * 
 * Base de données : SQLite (locale, fichier database.db)
 * Port : 3001 (pour éviter le conflit avec Next.js sur 3000)
 * =============================================================
 */

import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import { transactionsRouter } from './routes/transactions.js';
import { clientsRouter } from './routes/clients.js';
import { stockVoyageRouter } from './routes/stock-voyage.js';
import { fournisseursRouter } from './routes/fournisseurs.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Permet les requêtes depuis le frontend Next.js
app.use(express.json()); // Parse les requêtes JSON

// Initialiser la base de données
initDatabase();

// Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/stock-voyage', stockVoyageRouter);
app.use('/api/fournisseurs', fournisseursRouter);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend API is running' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
  console.log(`📊 Base de données SQLite initialisée`);
});
