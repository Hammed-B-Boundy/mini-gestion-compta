/**
 * =============================================================
 * FICHIER: lib/types.ts
 * =============================================================
 *
 * CE FICHIER DÉFINIT LES "TYPES" DE DONNÉES DE NOTRE APPLICATION.
 *
 * En TypeScript, un "type" ou une "interface" est comme un plan
 * qui décrit la forme d'un objet. C'est comme dire :
 * "Un client DOIT avoir un nom (texte), un nombre (chiffre), etc."
 *
 * Cela nous aide à :
 * 1. Éviter les erreurs (ex: mettre du texte là où on attend un nombre)
 * 2. Avoir l'auto-complétion dans l'éditeur de code
 * 3. Documenter la structure de nos données
 * =============================================================
 */

/**
 * Interface "Entry" — représente UNE LIGNE dans notre tableau comptable.
 *
 * Chaque entrée contient les informations d'une transaction client :
 * - Qui est le client ?
 * - Combien de produits ?
 * - À quel prix unitaire ?
 * - Combien a-t-il payé ?
 * - Y a-t-il des dépenses liées ?
 */
export interface Entry {
  // "id" est un identifiant unique pour chaque entrée.
  // On utilise "string" car on va générer un identifiant aléatoire.
  id: string

  // L'id technique du client en base
  clientId: string

  // Le nom affichable du client (renvoyé par l'API)
  nomClient: string

  // Le nombre de produits — c'est un nombre entier (number)
  nombre: number

  // Le prix d'un seul produit en FCFA — c'est un nombre entier
  prixUnitaire: number

  // "montant" sera calculé automatiquement : nombre × prixUnitaire
  // On le stocke quand même pour faciliter l'affichage
  montant: number

  // Le montant que le client a déjà payé
  paye: number

  // "restant" sera calculé automatiquement : montant - payé
  restant: number

  // Le motif (la raison) de la dépense — du texte
  depenseMotif: string

  // Le montant de la dépense — un nombre
  depenseMontant: number

  // Ajout des champs de date
  created_at?: string
  updated_at?: string
}

/**
 * Interface "EntryFormData" — les données du FORMULAIRE.
 *
 * C'est similaire à Entry mais SANS les champs calculés automatiquement
 * (montant et restant), car l'utilisateur ne les saisit pas.
 * On les calculera nous-mêmes dans le code.
 */
export interface EntryFormData {
  clientId: string
  nombre: number
  prixUnitaire: number
  paye: number
  depenseMotif: string
  depenseMontant: number
}


export type TypeQuantiteFournisseur = "Moyenne" | "Gros"

export interface FournisseurLivraison {
  id: string
  nomFournisseur: string
  quantiteLivree: number
  typeQuantite: TypeQuantiteFournisseur
  quantiteExacte: number
  prixUnitaire: number
  montant: number
  paye: number
  restant: number
  depenseMotif?: string
  depenseMontant: number
  created_at?: string
  updated_at?: string
}

export interface FournisseurLivraisonFormData {
  nomFournisseur: string
  quantiteLivree: number
  typeQuantite: TypeQuantiteFournisseur
  prixUnitaire: number
  paye: number
  depenseMotif?: string
  depenseMontant: number
}