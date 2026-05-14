import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const transactionsRouter = express.Router();

function getTransactionWithClientById(id) {
  return db.prepare(`
    SELECT
      t.*, 
      c.nom AS nomClient
    FROM transactions t
    LEFT JOIN clients c ON c.id = t.clientId
    WHERE t.id = ?
  `).get(id);
}

function listTransactions() {
  return db.prepare(`
    SELECT
      t.*, 
      c.nom AS nomClient
    FROM transactions t
    LEFT JOIN clients c ON c.id = t.clientId
    ORDER BY t.created_at DESC, t.updated_at DESC
  `).all();
}

function resolveOrCreateClient(clientIdentifier) {
  const rawValue = String(clientIdentifier || '').trim();
  if (!rawValue) {
    throw new Error('Le client est requis');
  }

  const findById = db.prepare('SELECT * FROM clients WHERE id = ?');
  const findByName = db.prepare('SELECT * FROM clients WHERE nom = ?');
  const insertClient = db.prepare('INSERT INTO clients (id, nom) VALUES (?, ?)');

  let client = findById.get(rawValue);
  if (client) {
    return client;
  }

  client = findByName.get(rawValue);
  if (client) {
    return client;
  }

  const id = randomUUID();
  insertClient.run(id, rawValue);
  return findById.get(id);
}

function insertTransactionHistory(snapshot) {
  const stmt = db.prepare(`
    INSERT INTO transactions_history (
      transaction_id,
      nomClient,
      nombre,
      prixUnitaire,
      montant,
      paye,
      restant,
      depenseMotif,
      depenseMontant,
      original_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    snapshot.id,
    snapshot.nomClient || '',
    snapshot.nombre || 0,
    snapshot.prixUnitaire || 0,
    snapshot.montant || 0,
    snapshot.paye || 0,
    snapshot.restant || 0,
    snapshot.depenseMotif || '',
    snapshot.depenseMontant || 0,
    snapshot.updated_at || snapshot.created_at || null
  );
}

transactionsRouter.get('/', (req, res) => {
  try {
    res.json(listTransactions());
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des transactions' });
  }
});

transactionsRouter.get('/:id', (req, res) => {
  try {
    const transaction = getTransactionWithClientById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Erreur lors de la récupération de la transaction:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la transaction' });
  }
});

transactionsRouter.post('/', (req, res) => {
  try {
    const {
      clientId,
      nombre = 0,
      prixUnitaire = 0,
      paye = 0,
      depenseMotif = '',
      depenseMontant = 0,
    } = req.body;

    const client = resolveOrCreateClient(clientId);

    const safeNombre = Number(nombre) || 0;
    const safePrixUnitaire = Number(prixUnitaire) || 0;
    const safePaye = Number(paye) || 0;
    const safeDepenseMontant = Number(depenseMontant) || 0;

    const montant = safeNombre * safePrixUnitaire;
    const restant = Math.max(0, montant - safePaye);
    const id = randomUUID();

    db.prepare(`
      INSERT INTO transactions (
        id, clientId, nombre, prixUnitaire, montant,
        paye, restant, depenseMotif, depenseMontant
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      client.id,
      safeNombre,
      safePrixUnitaire,
      montant,
      safePaye,
      restant,
      String(depenseMotif || '').trim(),
      safeDepenseMontant
    );

    const newTransaction = getTransactionWithClientById(id);
    insertTransactionHistory(newTransaction);

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur lors de la création de la transaction' });
  }
});

transactionsRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      clientId,
      nombre,
      prixUnitaire,
      paye,
      depenseMotif,
      depenseMontant,
    } = req.body;

    const existing = getTransactionWithClientById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    insertTransactionHistory(existing);

    const client = resolveOrCreateClient(clientId || existing.clientId);
    const safeNombre = Number(nombre ?? existing.nombre) || 0;
    const safePrixUnitaire = Number(prixUnitaire ?? existing.prixUnitaire) || 0;
    const safeDeltaPaye = Number(paye) || 0;
    const safeDepenseMontant = Number(depenseMontant ?? existing.depenseMontant) || 0;

    const montant = safeNombre * safePrixUnitaire;
    const newPaye = Number(existing.paye || 0) + safeDeltaPaye;
    const restant = Math.max(0, montant - newPaye);

    db.prepare(`
      UPDATE transactions SET
        clientId = ?,
        nombre = ?,
        prixUnitaire = ?,
        montant = ?,
        paye = ?,
        restant = ?,
        depenseMotif = ?,
        depenseMontant = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      client.id,
      safeNombre,
      safePrixUnitaire,
      montant,
      newPaye,
      restant,
      String(depenseMotif ?? existing.depenseMotif ?? '').trim(),
      safeDepenseMontant,
      id
    );

    res.json(getTransactionWithClientById(id));
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la transaction:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur lors de la mise à jour de la transaction' });
  }
});

transactionsRouter.get('/:id/history', (req, res) => {
  try {
    const existing = getTransactionWithClientById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    const history = db.prepare(`
      SELECT *
      FROM transactions_history
      WHERE transaction_id = ?
      ORDER BY saved_at DESC, history_id DESC
    `).all(req.params.id);

    const fields = [
      'nomClient',
      'nombre',
      'prixUnitaire',
      'montant',
      'paye',
      'restant',
      'depenseMotif',
      'depenseMontant',
    ];

    const computeDiff = (fromObj, toObj) => {
      const diff = {};
      for (const field of fields) {
        if (String(fromObj?.[field] ?? '') !== String(toObj?.[field] ?? '')) {
          diff[field] = {
            from: fromObj?.[field],
            to: toObj?.[field],
          };
        }
      }
      return diff;
    };

    const annotated = history.map((item, index) => {
      const next = index === 0 ? existing : history[index - 1];
      return {
        ...item,
        diffToNext: computeDiff(item, next),
      };
    });

    res.json({ current: existing, history: annotated });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'historique" });
  }
});

transactionsRouter.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM transactions WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression de la transaction:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de la transaction' });
  }
});
