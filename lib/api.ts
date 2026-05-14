/**
 * =============================================================
 * CLIENT API POUR LE BACKEND
 * =============================================================
 * 
 * Ce fichier contient toutes les fonctions pour communiquer
 * avec le backend Node.js via des requêtes HTTP.
 * =============================================================
 */

import type { Entry, EntryFormData } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Interface pour un client avec ses statistiques
 */
export interface Client {
  id: string;
  nom: string;
  totalTransactions: number;
  totalMontant: number;
  totalPaye: number;
  totalRestant: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fonction utilitaire pour gérer les erreurs HTTP
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(error.error || `Erreur HTTP: ${response.status}`);
  }
  return response.json();
}

// =============================================================
// API TRANSACTIONS
// =============================================================

/**
 * Récupère toutes les transactions
 */
export async function getTransactions(): Promise<Entry[]> {
  const response = await fetch(`${API_BASE_URL}/transactions`);
  return handleResponse<Entry[]>(response);
}

/**
 * Récupère une transaction par son ID
 */
export async function getTransaction(id: string): Promise<Entry> {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`);
  return handleResponse<Entry>(response);
}

/**
 * Crée une nouvelle transaction
 */
export async function createTransaction(data: EntryFormData): Promise<Entry> {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Entry>(response);
}

/**
 * Met à jour une transaction existante
 */
export async function updateTransaction(id: string, data: EntryFormData): Promise<Entry> {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Entry>(response);
}

/**
 * Supprime une transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(error.error || `Erreur HTTP: ${response.status}`);
  }
}

/**
 * Récupère l'historique des versions précédentes d'une transaction
 */
export async function getTransactionHistory(id: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}/history`);
  return handleResponse<any>(response);
}

// =============================================================
// API CLIENTS
// =============================================================

/**
 * Récupère tous les clients avec leurs statistiques
 */
export async function getClients(): Promise<Client[]> {
  const response = await fetch(`${API_BASE_URL}/clients`);
  return handleResponse<Client[]>(response);
}

/**
 * Récupère un client par son ID
 */
export async function getClient(id: string): Promise<Client> {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`);
  return handleResponse<Client>(response);
}

/**
 * Crée un nouveau client
 */
export async function createClient(nom: string): Promise<Client> {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nom }),
  });
  return handleResponse<Client>(response);
}

/**
 * Met à jour un client existant
 */
export async function updateClient(id: string, nom: string): Promise<Client> {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nom }),
  });
  return handleResponse<Client>(response);
}

/**
 * Supprime un client
 */
export async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(error.error || `Erreur HTTP: ${response.status}`);
  }
}

// =============================================================
// API STOCK VOYAGE
// =============================================================

/**
 * Interface pour une entrée de stock
 */
export interface StockEntree {
  id: string;
  nom: string;
  quantite: number;
  created_at?: string;
}

/**
 * Interface pour une sortie de stock
 */
export interface StockSortie {
  id: string;
  nom: string;
  quantite: number;
  created_at?: string;
}

/**
 * Récupère toutes les entrées de stock
 */
export async function getStockEntrees(): Promise<StockEntree[]> {
  const response = await fetch(`${API_BASE_URL}/stock-voyage/entrees`);
  return handleResponse<StockEntree[]>(response);
}

/**
 * Crée une nouvelle entrée de stock
 */
export async function createStockEntree(data: { nom: string; quantite: number }): Promise<StockEntree> {
  const response = await fetch(`${API_BASE_URL}/stock-voyage/entrees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<StockEntree>(response);
}

/**
 * Récupère toutes les sorties de stock
 */
export async function getStockSorties(): Promise<StockSortie[]> {
  const response = await fetch(`${API_BASE_URL}/stock-voyage/sorties`);
  return handleResponse<StockSortie[]>(response);
}

/**
 * Récupère l'historique global des sorties de stock voyage
 */
export async function getStockSortiesHistory(name?: string): Promise<any[]> {
  const url = new URL(`${API_BASE_URL}/stock-voyage/sorties/history`);
  if (name) {
    url.searchParams.append('nom', name);
  }
  const response = await fetch(url.toString());
  return handleResponse<any[]>(response);
}

/**
 * Crée une nouvelle sortie de stock
 */
export async function createStockSortie(data: {
  nom: string;
  quantite: number;
  entreeId: string;
}): Promise<StockSortie> {
  const response = await fetch(`${API_BASE_URL}/stock-voyage/sorties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<StockSortie>(response);
}

export async function getStockEntreesHistory(name?: string): Promise<any[]> {
  const url = new URL(`${API_BASE_URL}/stock-voyage/entrees/history`);
  if (name) {
    url.searchParams.append('nom', name);
  }
  const response = await fetch(url.toString());
  return handleResponse<any[]>(response);
}

export async function deleteStockEntree(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/stock-voyage/entrees/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(err.error || `Erreur HTTP ${response.status}`);
  }
}


import type {
  FournisseurLivraison,
  FournisseurLivraisonFormData,
} from "./types"


export async function getFournisseurs(): Promise<FournisseurLivraison[]> {
  const response = await fetch(`${API_BASE_URL}/fournisseurs`)
  return handleResponse<FournisseurLivraison[]>(response)
}

export async function getFournisseur(id: string): Promise<FournisseurLivraison> {
  const response = await fetch(`${API_BASE_URL}/fournisseurs/${id}`)
  return handleResponse<FournisseurLivraison>(response)
}

export async function createFournisseurLivraison(
  data: FournisseurLivraisonFormData
): Promise<FournisseurLivraison> {
  const response = await fetch(`${API_BASE_URL}/fournisseurs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  return handleResponse<FournisseurLivraison>(response)
}

export async function updateFournisseurLivraison(
  id: string,
  data: FournisseurLivraisonFormData
): Promise<FournisseurLivraison> {
  const response = await fetch(`${API_BASE_URL}/fournisseurs/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  return handleResponse<FournisseurLivraison>(response)
}

export async function deleteFournisseurLivraison(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/fournisseurs/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erreur serveur" }))
    throw new Error(error.error || `Erreur HTTP: ${response.status}`)
  }
}

export async function addFournisseurPaiement(
  id: string,
  montant: number
): Promise<FournisseurLivraison> {
  const response = await fetch(`${API_BASE_URL}/fournisseurs/${id}/paiements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ montant }),
  })

  return handleResponse<FournisseurLivraison>(response)
}

export async function addFournisseurDepense(
  id: string,
  data: { motif: string; montant: number }
): Promise<FournisseurLivraison> {
  const response = await fetch(`${API_BASE_URL}/fournisseurs/${id}/depenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  return handleResponse<FournisseurLivraison>(response)
}

export async function getFournisseurHistory(id: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/fournisseurs/${id}/history`)
  return handleResponse<any>(response)
}