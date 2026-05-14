import express from "express"
import { randomUUID } from "crypto"
import { db } from "../database.js"

export const fournisseursRouter = express.Router()

function getLivraison(id) {
  return db.prepare(`
    SELECT
      l.*,
      COALESCE((SELECT SUM(montant) FROM fournisseur_paiements WHERE livraisonId = l.id), 0) AS paye,
      l.montant - COALESCE((SELECT SUM(montant) FROM fournisseur_paiements WHERE livraisonId = l.id), 0) AS restant,
      COALESCE((SELECT SUM(montant) FROM fournisseur_depenses WHERE livraisonId = l.id), 0) AS depenseMontant
    FROM fournisseur_livraisons l
    WHERE l.id = ?
  `).get(id)
}

function listLivraisons() {
  return db.prepare(`
    SELECT
      l.*,
      COALESCE((SELECT SUM(montant) FROM fournisseur_paiements WHERE livraisonId = l.id), 0) AS paye,
      l.montant - COALESCE((SELECT SUM(montant) FROM fournisseur_paiements WHERE livraisonId = l.id), 0) AS restant,
      COALESCE((SELECT SUM(montant) FROM fournisseur_depenses WHERE livraisonId = l.id), 0) AS depenseMontant,
      COALESCE((
        SELECT GROUP_CONCAT(motif, ', ')
        FROM fournisseur_depenses
        WHERE livraisonId = l.id
      ), '') AS depenseMotif
    FROM fournisseur_livraisons l
    ORDER BY l.created_at DESC
  `).all()
}

function saveHistory(livraisonId) {
  const item = getLivraison(livraisonId)
  if (!item) return

  db.prepare(`
    INSERT INTO fournisseur_livraisons_history (
      livraisonId,
      nomFournisseur,
      quantiteLivree,
      typeQuantite,
      quantiteExacte,
      prixUnitaire,
      montant,
      paye,
      restant,
      depenseMontant
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.nomFournisseur,
    item.quantiteLivree,
    item.typeQuantite,
    item.quantiteExacte,
    item.prixUnitaire,
    item.montant,
    item.paye,
    item.restant,
    item.depenseMontant
  )
}

function calculateBase(data) {
  const quantiteLivree = Number(data.quantiteLivree) || 0
  const prixUnitaire = Number(data.prixUnitaire) || 0
  const quantiteExacte = quantiteLivree
  const montant = quantiteExacte * prixUnitaire

  return {
    quantiteLivree,
    quantiteExacte,
    prixUnitaire,
    montant,
  }
}

fournisseursRouter.get("/", (req, res) => {
  try {
    res.json(listLivraisons())
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erreur serveur lors de la récupération des fournisseurs" })
  }
})

fournisseursRouter.post("/", (req, res) => {
  try {
    const { nomFournisseur, typeQuantite } = req.body

    if (!String(nomFournisseur || "").trim()) {
      return res.status(400).json({ error: "Le nom fournisseur est requis" })
    }

    if (!["Moyenne", "Gros"].includes(typeQuantite)) {
      return res.status(400).json({ error: "Le type quantité doit être Moyenne ou Gros" })
    }

    const id = randomUUID()
    const calculated = calculateBase(req.body)

    db.prepare(`
      INSERT INTO fournisseur_livraisons (
        id,
        nomFournisseur,
        quantiteLivree,
        typeQuantite,
        quantiteExacte,
        prixUnitaire,
        montant
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(nomFournisseur).trim(),
      calculated.quantiteLivree,
      typeQuantite,
      calculated.quantiteExacte,
      calculated.prixUnitaire,
      calculated.montant
    )

    const paye = Number(req.body.paye) || 0
    if (paye > 0) {
      db.prepare(`
        INSERT INTO fournisseur_paiements (id, livraisonId, montant)
        VALUES (?, ?, ?)
      `).run(randomUUID(), id, paye)
    }

    const depenseMontant = Number(req.body.depenseMontant) || 0
    const depenseMotif = String(req.body.depenseMotif || "").trim()
    if (depenseMontant > 0 || depenseMotif) {
      db.prepare(`
        INSERT INTO fournisseur_depenses (id, livraisonId, motif, montant)
        VALUES (?, ?, ?, ?)
      `).run(randomUUID(), id, depenseMotif, depenseMontant)
    }

    saveHistory(id)

    res.status(201).json(getLivraison(id))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erreur serveur lors de la création fournisseur" })
  }
})

fournisseursRouter.put("/:id", (req, res) => {
  try {
    const existing = getLivraison(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: "Livraison fournisseur non trouvée" })
    }

    saveHistory(req.params.id)

    const nomFournisseur = String(req.body.nomFournisseur ?? existing.nomFournisseur).trim()
    const typeQuantite = req.body.typeQuantite ?? existing.typeQuantite

    if (!["Moyenne", "Gros"].includes(typeQuantite)) {
      return res.status(400).json({ error: "Le type quantité doit être Moyenne ou Gros" })
    }

    const calculated = calculateBase({
      quantiteLivree: req.body.quantiteLivree ?? existing.quantiteLivree,
      prixUnitaire: req.body.prixUnitaire ?? existing.prixUnitaire,
    })

    db.prepare(`
      UPDATE fournisseur_livraisons SET
        nomFournisseur = ?,
        quantiteLivree = ?,
        typeQuantite = ?,
        quantiteExacte = ?,
        prixUnitaire = ?,
        montant = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      nomFournisseur,
      calculated.quantiteLivree,
      typeQuantite,
      calculated.quantiteExacte,
      calculated.prixUnitaire,
      calculated.montant,
      req.params.id
    )

    res.json(getLivraison(req.params.id))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erreur serveur lors de la modification fournisseur" })
  }
})

fournisseursRouter.post("/:id/paiements", (req, res) => {
  try {
    const existing = getLivraison(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: "Livraison fournisseur non trouvée" })
    }

    const montant = Number(req.body.montant) || 0
    if (montant <= 0) {
      return res.status(400).json({ error: "Le montant payé doit être supérieur à 0" })
    }

    saveHistory(req.params.id)

    db.prepare(`
      INSERT INTO fournisseur_paiements (id, livraisonId, montant)
      VALUES (?, ?, ?)
    `).run(randomUUID(), req.params.id, montant)

    res.status(201).json(getLivraison(req.params.id))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erreur serveur lors de l'ajout du paiement" })
  }
})

fournisseursRouter.post("/:id/depenses", (req, res) => {
  try {
    const existing = getLivraison(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: "Livraison fournisseur non trouvée" })
    }

    const motif = String(req.body.motif || "").trim()
    const montant = Number(req.body.montant) || 0

    if (!motif) {
      return res.status(400).json({ error: "Le motif est requis" })
    }

    if (montant <= 0) {
      return res.status(400).json({ error: "Le montant dépense doit être supérieur à 0" })
    }

    saveHistory(req.params.id)

    db.prepare(`
      INSERT INTO fournisseur_depenses (id, livraisonId, motif, montant)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), req.params.id, motif, montant)

    res.status(201).json(getLivraison(req.params.id))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erreur serveur lors de l'ajout de la dépense" })
  }
})

fournisseursRouter.get("/:id/history", (req, res) => {
  try {
    const current = getLivraison(req.params.id)
    if (!current) {
      return res.status(404).json({ error: "Livraison fournisseur non trouvée" })
    }

    const history = db.prepare(`
      SELECT *
      FROM fournisseur_livraisons_history
      WHERE livraisonId = ?
      ORDER BY saved_at DESC, history_id DESC
    `).all(req.params.id)

    res.json({ current, history })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'historique" })
  }
})

fournisseursRouter.delete("/:id", (req, res) => {
  try {
    const existing = getLivraison(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: "Livraison fournisseur non trouvée" })
    }

    db.prepare(`DELETE FROM fournisseur_livraisons WHERE id = ?`).run(req.params.id)
    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erreur serveur lors de la suppression" })
  }
})