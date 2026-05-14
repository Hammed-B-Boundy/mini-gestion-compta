/**
 * =============================================================
 * ROUTES API POUR LE STOCK VOYAGE
 * =============================================================
 * 
 * Endpoints disponibles :
 * 
 * ENTREES :
 * - GET    /api/stock-voyage/entrees       - Liste toutes les entrées
 * - POST   /api/stock-voyage/entrees       - Crée une nouvelle entrée
 * 
 * SORTIES :
 * - GET    /api/stock-voyage/sorties       - Liste toutes les sorties
 * - POST   /api/stock-voyage/sorties       - Crée une nouvelle sortie
 * =============================================================
 */

import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const stockVoyageRouter = express.Router();

/**
 * GET /api/stock-voyage/entrees
 * Récupère toutes les entrées de stock
 */
stockVoyageRouter.get('/entrees', (req, res) => {
  try {
    const entrees = db.prepare('SELECT * FROM stock_entrees ORDER BY created_at DESC').all();
    res.json(entrees);
  } catch (error) {
    console.error('Erreur lors de la récupération des entrées:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des entrées' });
  }
});

/**
 * POST /api/stock-voyage/entrees
 * Crée une nouvelle entrée de stock
 */
stockVoyageRouter.post('/entrees', (req, res) => {
  try {
    const { nom, quantite } = req.body;

    // Validation
    if (!nom || typeof nom !== 'string' || nom.trim() === '') {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    if (quantite === undefined || typeof quantite !== 'number' || isNaN(quantite)) {
      return res.status(400).json({ error: 'La quantité doit être un nombre' });
    }

    const cleanName = nom.trim();
    // chercher entrée existante par nom
    const existing = db.prepare('SELECT * FROM stock_entrees WHERE nom = ?').get(cleanName);
    if (existing) {
      const updatedQty = existing.quantite + quantite;

      if (updatedQty <= 0) {
        // suppression si quantité tombe à zéro ou moins
        db.prepare('DELETE FROM stock_entrees WHERE id = ?').run(existing.id);
      } else {
        db.prepare('UPDATE stock_entrees SET quantite = ? WHERE id = ?').run(updatedQty, existing.id);
      }

      // enregistrer dans l'historique
      db.prepare(
        'INSERT INTO stock_entrees_history (entree_id, nom, quantite) VALUES (?, ?, ?)'
      ).run(existing.id, cleanName, quantite);

      // renvoyer l'état actuel (ou objet factice si supprimé)
      const updated = db.prepare('SELECT * FROM stock_entrees WHERE nom = ?').get(cleanName);
      if (updated) {
        return res.status(200).json(updated);
      } else {
        return res.status(200).json({ id: existing.id, nom: cleanName, quantite: 0 });
      }
    }

    // pas d'entrée existante : création normale
    const id = randomUUID();
    const stmt = db.prepare('INSERT INTO stock_entrees (id, nom, quantite) VALUES (?, ?, ?)');
    stmt.run(id, cleanName, quantite);

    // insérer aussi dans l'historique
    db.prepare(
      'INSERT INTO stock_entrees_history (entree_id, nom, quantite) VALUES (?, ?, ?)'
    ).run(id, cleanName, quantite);

    const newEntree = db.prepare('SELECT * FROM stock_entrees WHERE id = ?').get(id);
    
    res.status(201).json(newEntree);
  } catch (error) {
    console.error('Erreur lors de la création de l\'entrée:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l\'entrée' });
  }
});

/**
 * GET /api/stock-voyage/sorties
 * Récupère toutes les sorties de stock
 */
stockVoyageRouter.get('/sorties', (req, res) => {
  try {
    const sorties = db.prepare('SELECT * FROM stock_sorties ORDER BY created_at DESC').all();
    res.json(sorties);
  } catch (error) {
    console.error('Erreur lors de la récupération des sorties:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des sorties' });
  }
});

// endpoint d'historique global (ou filtré) des sorties
stockVoyageRouter.get('/sorties/history', (req, res) => {
  try {
    let history;
    if (req.query.nom) {
      history = db
        .prepare('SELECT * FROM stock_sorties_history WHERE nom = ? ORDER BY saved_at DESC')
        .all(req.query.nom);
    } else {
      history = db.prepare('SELECT * FROM stock_sorties_history ORDER BY saved_at DESC').all();
    }
    res.json(history);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des sorties:', error);
    res.json([]);
  }
});

// endpoint d'historique global (ou filtré) des entrées
stockVoyageRouter.get('/entrees/history', (req, res) => {
  try {
    let history;
    if (req.query.nom) {
      history = db
        .prepare('SELECT * FROM stock_entrees_history WHERE nom = ? ORDER BY saved_at DESC')
        .all(req.query.nom);
    } else {
      history = db.prepare('SELECT * FROM stock_entrees_history ORDER BY saved_at DESC').all();
    }
    res.json(history);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des entrées:', error);
    res.json([]);
  }
});

// suppression d'une entrée (et réduction à zéro si on veut)
stockVoyageRouter.delete('/entrees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const entree = db.prepare('SELECT * FROM stock_entrees WHERE id = ?').get(id);
    if (!entree) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }
    // enregistrer la suppression dans l'historique (quantité négative ou 0)
    db.prepare(
      'INSERT INTO stock_entrees_history (entree_id, nom, quantite) VALUES (?, ?, ?)'
    ).run(id, entree.nom, -entree.quantite);

    db.prepare('DELETE FROM stock_entrees WHERE id = ?').run(id);
    res.status(204).end();
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'entrée:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'entrée' });
  }
});

/**
 * POST /api/stock-voyage/sorties
 * Crée une nouvelle sortie de stock
 */
stockVoyageRouter.post('/sorties', (req, res) => {
  try {
    const { nom, quantite, entreeId } = req.body;

    // Validation
    if (!nom || typeof nom !== 'string' || nom.trim() === '') {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    if (!quantite || typeof quantite !== 'number' || quantite <= 0) {
      return res.status(400).json({ error: 'La quantité doit être un nombre positif' });
    }

    if (!entreeId || typeof entreeId !== 'string') {
      return res.status(400).json({ error: 'L\'identifiant de l\'entrée est requis' });
    }

    // Récupérer l'entrée de stock correspondante
    const entree = db.prepare('SELECT * FROM stock_entrees WHERE id = ?').get(entreeId);
    if (!entree) {
      return res.status(404).json({ error: 'Entrée de stock non trouvée' });
    }

    // Vérifier que la quantité demandée ne dépasse pas la quantité disponible
    if (quantite > entree.quantite) {
      return res.status(400).json({
        error: `La quantité à retirer (${quantite}) ne peut pas être supérieure à la quantité disponible (${entree.quantite})`,
      });
    }

    // Mettre à jour la quantité restante dans l'entrée de stock
    const remaining = entree.quantite - quantite;
    if (remaining <= 0) {
      // retirer de la liste si zéro
      db.prepare('DELETE FROM stock_entrees WHERE id = ?').run(entreeId);
    } else {
      db.prepare('UPDATE stock_entrees SET quantite = ? WHERE id = ?').run(remaining, entreeId);
    }

    // Générer un ID unique
    const id = randomUUID();

    // Insérer la sortie
    const stmt = db.prepare('INSERT INTO stock_sorties (id, nom, quantite) VALUES (?, ?, ?)');
    stmt.run(id, nom.trim(), quantite);

    // Récupérer la sortie créée
    const newSortie = db.prepare('SELECT * FROM stock_sorties WHERE id = ?').get(id);

    // Historiser la sortie
    try {
      const insertHistory = db.prepare(`
        INSERT INTO stock_sorties_history (sortie_id, nom, quantite)
        VALUES (?, ?, ?)
      `);
      insertHistory.run(newSortie.id, newSortie.nom, newSortie.quantite);
    } catch (historyErr) {
      console.error('Erreur lors de la sauvegarde de l\'historique de sortie:', historyErr);
    }

    res.status(201).json(newSortie);
  } catch (error) {
    console.error('Erreur lors de la création de la sortie:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la sortie' });
  }
});
