import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const clientsRouter = express.Router();

function buildClientStats(client) {
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS totalTransactions,
      COALESCE(SUM(montant), 0) AS totalMontant,
      COALESCE(SUM(paye), 0) AS totalPaye,
      COALESCE(SUM(restant), 0) AS totalRestant
    FROM transactions
    WHERE clientId = ?
  `).get(client.id);

  return {
    id: client.id,
    nom: client.nom,
    totalTransactions: Number(stats.totalTransactions || 0),
    totalMontant: Number(stats.totalMontant || 0),
    totalPaye: Number(stats.totalPaye || 0),
    totalRestant: Number(stats.totalRestant || 0),
    created_at: client.created_at,
    updated_at: client.updated_at,
  };
}

clientsRouter.get('/', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY nom').all();
    res.json(clients.map(buildClientStats));
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients' });
  }
});

clientsRouter.get('/:id', (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json(buildClientStats(client));
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du client' });
  }
});

clientsRouter.post('/', (req, res) => {
  try {
    const nom = String(req.body.nom || '').trim();
    if (!nom) {
      return res.status(400).json({ error: 'Le nom du client est requis' });
    }

    const existing = db.prepare('SELECT * FROM clients WHERE nom = ?').get(nom);
    if (existing) {
      return res.status(409).json({ error: 'Un client avec ce nom existe déjà' });
    }

    const id = randomUUID();
    db.prepare('INSERT INTO clients (id, nom) VALUES (?, ?)').run(id, nom);
    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

    res.status(201).json(buildClientStats(newClient));
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du client' });
  }
});

clientsRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const nom = String(req.body.nom || '').trim();

    const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    if (!nom) {
      return res.status(400).json({ error: 'Le nom du client est requis' });
    }

    const duplicate = db.prepare('SELECT * FROM clients WHERE nom = ? AND id != ?').get(nom, id);
    if (duplicate) {
      return res.status(409).json({ error: 'Un autre client avec ce nom existe déjà' });
    }

    db.prepare(`
      UPDATE clients
      SET nom = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nom, id);

    const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    res.json(buildClientStats(updatedClient));
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du client' });
  }
});

clientsRouter.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du client' });
  }
});
