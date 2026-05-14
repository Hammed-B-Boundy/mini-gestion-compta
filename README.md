# Application de Gestion Comptable

Application web de gestion comptable avec frontend Next.js et backend Node.js/Express.

## 🏗️ Structure du projet

```
react-accounting-dashboard/
├── app/                    # Pages Next.js (frontend)
│   ├── page.tsx           # Dashboard principal
│   ├── transactions/      # Page de gestion des transactions
│   └── clients/           # Page de gestion des clients
├── components/            # Composants React réutilisables
├── lib/                   # Utilitaires et types
│   ├── types.ts          # Types TypeScript
│   └── api.ts            # Client API pour le backend
└── server/               # Backend Node.js/Express
    ├── index.js          # Point d'entrée du serveur
    ├── database.js       # Configuration SQLite
    └── routes/           # Routes API
        ├── transactions.js
        └── clients.js
```

## 🚀 Démarrage

### 1. Installer les dépendances du frontend

```bash
pnpm install
# ou
npm install
```

### 2. Installer les dépendances du backend

```bash
cd server
npm install
# ou
pnpm install
cd ..
```

### 3. Démarrer le backend

Dans un terminal, depuis le dossier `server` :

```bash
npm start
# ou pour le développement avec rechargement automatique
npm run dev
```

Le backend démarre sur `http://localhost:3001`

### 4. Démarrer le frontend

Dans un autre terminal, depuis la racine du projet :

```bash
pnpm dev
# ou
npm run dev
```

Le frontend démarre sur `http://localhost:3000`

## 📋 Fonctionnalités

### Transactions
- ✅ Liste toutes les transactions
- ✅ Ajouter une nouvelle transaction
- ✅ Modifier une transaction existante
- ✅ Supprimer une transaction
- ✅ Recherche par nom de client
- ✅ Calcul automatique du montant et du restant

### Clients
- ✅ Liste tous les clients avec statistiques
- ✅ Ajouter un nouveau client
- ✅ Modifier un client existant
- ✅ Supprimer un client (et ses transactions)
- ✅ Recherche par nom
- ✅ Statistiques automatiques (total transactions, montants, etc.)

## 🗄️ Base de données

La base de données SQLite est créée automatiquement dans `server/database.db` lors du premier démarrage du backend.

Les données sont persistantes et conservées entre les redémarrages.

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet pour configurer l'URL de l'API :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Par défaut, le frontend utilise `http://localhost:3001/api`.

## 📝 Notes

- Le backend doit être démarré avant le frontend
- Les calculs (montant, restant) sont effectués automatiquement côté serveur
- La création d'une transaction crée automatiquement le client s'il n'existe pas
- La suppression d'un client supprime également toutes ses transactions
