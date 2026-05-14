import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.db');

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

function tableExists(tableName) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);
  return !!row;
}

function ensureBaseTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      nombre INTEGER NOT NULL DEFAULT 0,
      prixUnitaire INTEGER NOT NULL DEFAULT 0,
      montant INTEGER NOT NULL DEFAULT 0,
      paye INTEGER NOT NULL DEFAULT 0,
      restant INTEGER NOT NULL DEFAULT 0,
      depenseMotif TEXT DEFAULT '',
      depenseMontant INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
    )
  `)
      
  

  db.exec(`
    CREATE TABLE IF NOT EXISTS fournisseur_livraisons (
      id TEXT PRIMARY KEY,
      nomFournisseur TEXT NOT NULL,
      quantiteLivree INTEGER NOT NULL DEFAULT 0,
      typeQuantite TEXT NOT NULL CHECK(typeQuantite IN ('Moyenne', 'Gros')),
      quantiteExacte INTEGER NOT NULL DEFAULT 0,
      prixUnitaire INTEGER NOT NULL DEFAULT 0,
      montant INTEGER NOT NULL DEFAULT 0,
      paye INTEGER NOT NULL DEFAULT 0,
      restant INTEGER NOT NULL DEFAULT 0,
      depenseMotif TEXT DEFAULT '',
      depenseMontant INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS fournisseur_paiements (
      id TEXT PRIMARY KEY,
      livraisonId TEXT NOT NULL,
      montant INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (livraisonId) REFERENCES fournisseur_livraisons(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS fournisseur_depenses (
      id TEXT PRIMARY KEY,
      livraisonId TEXT NOT NULL,
      motif TEXT NOT NULL DEFAULT '',
      montant INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (livraisonId) REFERENCES fournisseur_livraisons(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS fournisseur_livraisons_history (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      livraisonId TEXT NOT NULL,
      nomFournisseur TEXT NOT NULL,
      quantiteLivree INTEGER NOT NULL DEFAULT 0,
      typeQuantite TEXT NOT NULL,
      quantiteExacte INTEGER NOT NULL DEFAULT 0,
      prixUnitaire INTEGER NOT NULL DEFAULT 0,
      montant INTEGER NOT NULL DEFAULT 0,
      paye INTEGER NOT NULL DEFAULT 0,
      restant INTEGER NOT NULL DEFAULT 0,
      depenseMontant INTEGER NOT NULL DEFAULT 0,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (livraisonId) REFERENCES fournisseur_livraisons(id) ON DELETE CASCADE
    )
  `)
}

function migrateTransactionsTableIfNeeded() {
  if (!tableExists('transactions')) {
    return;
  }

  const hasClientId = hasColumn('transactions', 'clientId');
  const hasNomClient = hasColumn('transactions', 'nomClient');

  if (!hasClientId) {
    db.exec(`ALTER TABLE transactions ADD COLUMN clientId TEXT`);
  }

  if (hasNomClient) {
    const legacyRows = db
      .prepare(`SELECT id, nomClient FROM transactions WHERE clientId IS NULL OR TRIM(clientId) = ''`)
      .all();

    const findClientByName = db.prepare(`SELECT id, nom FROM clients WHERE nom = ?`);
    const insertClient = db.prepare(`INSERT INTO clients (id, nom) VALUES (?, ?)`);
    const updateTransactionClient = db.prepare(`UPDATE transactions SET clientId = ? WHERE id = ?`);

    const transaction = db.transaction((rows) => {
      for (const row of rows) {
        const clientName = String(row.nomClient || '').trim();
        if (!clientName) continue;

        let client = findClientByName.get(clientName);
        if (!client) {
          const newClientId = randomUUID();
          insertClient.run(newClientId, clientName);
          client = { id: newClientId, nom: clientName };
        }

        updateTransactionClient.run(client.id, row.id);
      }
    });

    transaction(legacyRows);
  }

}

function ensureHistoryTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_entrees (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      quantite INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_sorties (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      quantite INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_sorties_history (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sortie_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      quantite INTEGER NOT NULL DEFAULT 0,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sortie_id) REFERENCES stock_sorties(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_entrees_history (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      entree_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      quantite INTEGER NOT NULL DEFAULT 0,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entree_id) REFERENCES stock_entrees(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions_history (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT NOT NULL,
      nomClient TEXT NOT NULL,
      nombre INTEGER NOT NULL DEFAULT 0,
      prixUnitaire INTEGER NOT NULL DEFAULT 0,
      montant INTEGER NOT NULL DEFAULT 0,
      paye INTEGER NOT NULL DEFAULT 0,
      restant INTEGER NOT NULL DEFAULT 0,
      depenseMotif TEXT DEFAULT '',
      depenseMontant INTEGER NOT NULL DEFAULT 0,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      original_updated_at DATETIME,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_clientId ON transactions(clientId)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_entrees_history_entree_id ON stock_entrees_history(entree_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_sorties_history_sortie_id ON stock_sorties_history(sortie_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_history_transaction_id ON transactions_history(transaction_id)
  `);
}

export function initDatabase() {
  console.log('📦 Initialisation de la base de données...');
  ensureBaseTables();
  migrateTransactionsTableIfNeeded();
  ensureHistoryTables();
  console.log('✅ Base de données initialisée avec succès');
}

export function closeDatabase() {
  db.close();
  console.log('🔒 Connexion à la base de données fermée');
}
