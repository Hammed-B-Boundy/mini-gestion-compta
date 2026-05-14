# Backend API - Application de Gestion Comptable

Ce backend Node.js/Express fournit une API REST pour gérer les transactions et les clients de l'application comptable.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ installé
- npm ou pnpm installé

### Installation

1. Installer les dépendances :
```bash
cd server
npm install
# ou
pnpm install
```

### Démarrage

```bash
npm start
# ou pour le mode développement avec rechargement automatique
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

## 📡 Endpoints API

### Transactions

- `GET /api/transactions` - Liste toutes les transactions
- `GET /api/transactions/:id` - Récupère une transaction par ID
- `POST /api/transactions` - Crée une nouvelle transaction
- `PUT /api/transactions/:id` - Met à jour une transaction
- `DELETE /api/transactions/:id` - Supprime une transaction

**Exemple de création de transaction :**
```json
POST /api/transactions
{
  "nomClient": "Entreprise ABC",
  "nombre": 100,
  "prixUnitaire": 500,
  "paye": 30000,
  "depenseMotif": "Transport",
  "depenseMontant": 5000
}
```

### Clients

- `GET /api/clients` - Liste tous les clients avec statistiques
- `GET /api/clients/:id` - Récupère un client par ID
- `POST /api/clients` - Crée un nouveau client
- `PUT /api/clients/:id` - Met à jour un client
- `DELETE /api/clients/:id` - Supprime un client

**Exemple de création de client :**
```json
POST /api/clients
{
  "nom": "Entreprise ABC"
}
```

## 🗄️ Base de données

La base de données SQLite est créée automatiquement dans le fichier `server/database.db` lors du premier démarrage.

### Schéma

**Table `clients` :**
- `id` (TEXT, PRIMARY KEY)
- `nom` (TEXT, UNIQUE, NOT NULL)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

**Table `transactions` :**
- `id` (TEXT, PRIMARY KEY)
- `nomClient` (TEXT, FOREIGN KEY -> clients.nom)
- `nombre` (INTEGER)
- `prixUnitaire` (INTEGER)
- `montant` (INTEGER, calculé automatiquement)
- `paye` (INTEGER)
- `restant` (INTEGER, calculé automatiquement)
- `depenseMotif` (TEXT)
- `depenseMontant` (INTEGER)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

## 🔧 Configuration

Le port du serveur peut être configuré via la variable d'environnement `PORT` :
```bash
PORT=3001 npm start
```

Par défaut, le serveur écoute sur le port 3001.

## 📝 Notes

- Les calculs de `montant` et `restant` sont effectués automatiquement côté serveur
- La création d'une transaction crée automatiquement le client s'il n'existe pas
- La suppression d'un client supprime également toutes ses transactions (CASCADE)
