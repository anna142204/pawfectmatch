# PawfectMatch 🐾

Application web complète de mise en relation pour l'adoption d'animaux, permettant aux adoptants de trouver leur compagnon idéal et aux propriétaires/refuges de gérer leurs animaux à l'adoption.

<details>
<summary><strong>⚡️ Guide de démarrage rapide</strong></summary>

## ⚡️ Guide de démarrage rapide

```bash
git clone https://github.com/HEIG-VD/pawfectmatch.git
cd pawfectmatch

# 1) Installer les dépendances
npm install

# 2) Copier la configuration et renseigner Cloudinary
cp .env.example .env
# Éditez .env et complétez CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET

# 3) Démarrer MongoDB (en local)
mongod  # ou brew services start mongodb-community

# 4) (Optionnel) Peupler la base avec des données de test
cd server && node seed-animals-users.js && cd ..

# 5) Lancer backend et frontend
npm run backend   # backend sur http://localhost:8989
npm run dev       # frontend sur http://localhost:5173
```

**Comptes de test (si vous avez seedé) :**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Adoptant | `alice@adopter.ch` | `password123` |
| Adoptant | `ben@adopter.ch` | `password123` |
| Propriétaire | `seb@particulier.ch` | `password123` |
| Refuge | `marc@refuge.ch` | `password123` |

</details>

## 📋 Table des matières

- [Guide de démarrage rapide](#️-guide-de-démarrage-rapide)
- [Aperçu](#-aperçu)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Structure du projet](#-structure-du-projet)
- [Fonctionnalités](#-fonctionnalités)
- [API & Documentation](#-api--documentation)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Équipe](#-équipe)


## 🎯 Aperçu

PawfectMatch est une plateforme moderne qui facilite l'adoption d'animaux en connectant adoptants et propriétaires à travers une interface intuitive de type "swipe", des notifications en temps réel et un système de messagerie instantanée.

**Démo en ligne :** [pawfectmatch-ix6g.onrender.com](https://pawfectmatch-ix6g.onrender.com/)

## 🛠 Technologies

### Backend
- **Node.js** 18+ & **Express.js** - API RESTful
- **MongoDB** 7/8 - Base de données NoSQL
- **JWT** - Authentification sécurisée
- **WsMini** - Communication WebSocket temps réel
- **Cloudinary** - Stockage et gestion d'images

### Frontend
- **Vue 3** - Framework JavaScript progressif
- **Vite** - Build tool ultra-rapide
- **Vue Router** - Routage SPA

### Tests
- **Jest** - Framework de tests JavaScript
- **SuperTest** - Tests d'API HTTP

## ✅ Prérequis

- **Node.js** ≥ 18.x ([Télécharger](https://nodejs.org))
- **npm** ≥ 9.x (inclus avec Node.js)
- **MongoDB** 7.x ou 8.x ([Guide d'installation](https://docs.mongodb.com/manual/installation/))
- **Compte Cloudinary** (gratuit) pour l'upload d'images ([S'inscrire](https://cloudinary.com))


## 🚀 Installation

### 1. Clonez le dépôt

```bash
git clone https://github.com/HEIG-VD/pawfectmatch.git
cd pawfectmatch
```

### 2. Installez les dépendances

```bash
npm install
```

### 3. Configuration

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

**Configuration complète (.env prêt à copier)** :

```env
# MongoDB
# Base de données
DATABASE_URL=mongodb://localhost/pawfectmatch

# Serveur
BACKEND_PORT=8989
NODE_ENV=development

# Authentification
JWT_SECRET=votre-clé-secrète-sécurisée
JWT_EXPIRES_IN=7d

# WebSocket (Frontend)
VITE_WS_HOST=localhost
VITE_WS_PORT=8989
VITE_WS_PROTOCOL=ws

# Cloudinary (Upload d'images)
CLOUDINARY_CLOUD_NAME=votre-cloud-name
CLOUDINARY_API_KEY=votre-api-key
CLOUDINARY_API_SECRET=votre-api-secret

# Admin (créé automatiquement au démarrage si défini)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=MotDePasseSecurise123!
ADMIN_NAME=Administrator
```

> **Obtenir vos identifiants Cloudinary :** Connectez-vous à votre [Dashboard Cloudinary](https://cloudinary.com/console) et copiez les identifiants affichés.

> **Création automatique de l'admin (optionnel) :** Si vous définissez `ADMIN_EMAIL` et `ADMIN_PASSWORD`, un compte administrateur sera créé automatiquement au démarrage du serveur.

#### Descriptions des variables

| Variable | Description | Valeur par défaut | Requis |
|----------|-------------|-------------------|---------|
| `DATABASE_URL` | URL de connexion MongoDB | `mongodb://localhost/pawfectmatch` | ✅ |
| `BACKEND_PORT` | Port du serveur (utile uniquement sur VPS/serveur propre) | `8989` | Non |
| `NODE_ENV` | Environnement (`development` ou `production`) | `development` | Non |
| `JWT_SECRET` | Clé secrète pour les tokens JWT | - | ✅ |
| `JWT_EXPIRES_IN` | Durée de validité des tokens | `7d` | Non |
| `VITE_WS_HOST` | Hôte WebSocket | `localhost` | Non |
| `VITE_WS_PORT` | Port WebSocket | `8989` | Non |
| `VITE_WS_PROTOCOL` | Protocole WebSocket | `ws` (dev) / `wss` (prod) | Non |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary | - | ✅ |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | - | ✅ |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | - | ✅ |
| `ADMIN_EMAIL` | Email de l'administrateur (créé au démarrage si défini) | - | Non |
| `ADMIN_PASSWORD` | Mot de passe de l'administrateur | - | Non |
| `ADMIN_NAME` | Nom de l'administrateur | `Administrator` | Non |

### 4. Démarrez MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Ou manuellement
mongod
```

### 5. (Optionnel) Données d'exemple

Peuplez la base de données avec des utilisateurs et animaux de test :

```bash
cd server
node seed-animals-users.js
cd ..
```

**Comptes de test créés :**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Adoptant | `alice@adopter.ch` | `password123` |
| Adoptant | `ben@adopter.ch` | `password123` |
| Propriétaire | `seb@particulier.ch` | `password123` |
| Refuge | `marc@refuge.ch` | `password123` |

## 🎮 Utilisation

### Développement

Lancez le backend et le frontend simultanément :

```bash
# Terminal 1 - Backend (API + WebSocket)
npm run backend

# Terminal 2 - Frontend (Vite dev server)
npm run dev
```

**Accédez à l'application :**
- Frontend : [http://localhost:5173](http://localhost:5173)
- API Backend : [http://localhost:8989](http://localhost:8989)

### Production

```bash
# 1. Build du frontend
npm run build

# 2. Démarrage du serveur
npm run backend
```

### Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run backend` | Démarre le serveur backend avec nodemon |
| `npm run dev` | Démarre le serveur de développement Vite |
| `npm run build` | Build de production du frontend |
| `npm run preview` | Prévisualise le build de production |
| `npm test` | Lance tous les tests |
| `npm run test:watch` | Tests en mode surveillance |
| `npm run test:coverage` | Tests avec rapport de couverture |

## 📂 Structure du projet

```
pawfectmatch/
├── public/              # Fichiers statiques
├── server/              # Backend Express
│   ├── api/            # Routes API
│   ├── config/         # Configuration (Cloudinary, etc.)
│   ├── models/         # Modèles Mongoose
│   ├── spec/           # Tests unitaires
│   ├── store/          # Store WebSocket
│   ├── utils/          # Utilitaires (geocoder, cookies)
│   └── app.mjs         # Point d'entrée du serveur
├── src/                 # Frontend Vue 3
│   ├── assets/         # Images et ressources
│   ├── components/     # Composants réutilisables
│   ├── composables/    # Composables Vue
│   ├── constants/      # Constantes de l'application
│   ├── router/         # Configuration Vue Router
│   ├── store/          # Stores
│   ├── utils/          # Utilitaires frontend
│   ├── views/          # Pages de l'application
│   ├── App.vue         # Composant racine
│   └── main.js         # Point d'entrée frontend
├── .env                 # Variables d'environnement (à créer)
├── openapi.yml         # Documentation API OpenAPI
├── package.json        # Dépendances et scripts
└── vite.config.js      # Configuration Vite
```

## ✨ Fonctionnalités

### Pour les adoptants 🏠

- **Swipe intelligent** - Parcourez les animaux avec des recommandations basées sur vos préférences
- **Profil détaillé** - Consultez les informations complètes sur chaque animal (photos, caractéristiques, localisation)
- **Système de match** - Likez les animaux qui vous intéressent et créez des connexions
- **Gestion des demandes** - Suivez toutes vos demandes d'adoption (en attente, validées, refusées)
- **Messagerie temps réel** - Communiquez instantanément avec les propriétaires
- **Vue carte interactive** - Visualisez les refuges/propriétaires disponibles sur une carte géographique
- **Notifications** - Recevez des alertes dans l'app lors de nouveaux matchs 

### Pour les propriétaires/refuges 🐕

- **Gestion d'animaux** - Créez et gérez les profils de vos animaux à l'adoption
- **Upload d'images** - Ajoutez jusqu'à 10 photos par animal
- **Demandes d'adoption** - Consultez et gérez toutes les demandes reçues
- **Messagerie** - Échangez avec les adoptants intéressés

### Pour les administrateurs 👨‍💼

- **Dashboard** - Statistiques globales de la plateforme
- **Gestion des utilisateurs** - Supervision des comptes
- **Modération** - Gestion du contenu de la plateforme

## 📡 API & Documentation

### Ressources principales

| Ressource | Description | Points de terminaison |
|-----------|-------------|----------------------|
| **Auth** | Inscription / connexion / déconnexion | `POST /api/auth/register/adopter`, `POST /api/auth/register/owner`, `POST /api/auth/login`, `POST /api/auth/logout` |
| **Adopter** | Gestion des adoptants | `GET /api/adopters`, `GET /api/adopters/:id`, `PUT /api/adopters/:id`, `DELETE /api/adopters/:id` |
| **Owner** | Gestion des propriétaires | `GET /api/owners`, `GET /api/owners/:id`, `PUT /api/owners/:id`, `DELETE /api/owners/:id` |
| **Animal** | Gestion des animaux | `GET /api/animals`, `GET /api/animals/:id`, `POST /api/animals`, `PUT /api/animals/:id`, `DELETE /api/animals/:id` |
| **Match** | Matches, notifications, discussion | `GET /api/matches`, `GET /api/matches/pending-notifications`, `GET /api/matches/:id`, `POST /api/matches`, `PUT /api/matches/:id`, `PATCH /api/matches/:id/adopt`, `DELETE /api/matches/:id`, `POST /api/matches/:id/messages`, `GET /api/matches/:id/discussion` |
| **Images** | Upload / suppression d'images | `POST /api/images/:type`, `DELETE /api/images` |
| **Admin** | Statistiques globales | `GET /api/admin/stats` |

### Documentation interactive

La documentation API complète est disponible en format OpenAPI dans [`openapi.yml`](openapi.yml).

**Visualisation interactive :**
1. **Swagger UI** - Copiez le contenu d'`openapi.yml` sur [editor.swagger.io](https://editor.swagger.io/)
2. **ReDoc** - Utilisez [Redocly](https://redocly.github.io/redoc/)

### Fonctionnalités API

- **Authentification JWT** - Sécurisation des endpoints
- **Pagination** - Paramètres `page` et `limit` sur les listes
- **Filtrage** - Recherche par nom, ville, espèce, etc.
- **Validation** - Validation complète des données
- **Gestion d'erreurs** - Codes HTTP appropriés et messages détaillés

### WebSocket (Temps réel)

L'application utilise [WsMini](https://github.com/Chabloz/WsMini) pour la communication temps réel :

- **Notifications instantanées** - Alertes de nouveaux matchs
- **Messagerie en direct** - Chat en temps réel entre utilisateurs
- **Mises à jour live** - Synchronisation automatique des états

## 🧪 Tests

### Exécuter les tests

```bash
# Tous les tests
npm test

# Mode surveillance (re-exécute au changement)
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

### Structure des tests

- `server/spec/adopter.spec.js` - Tests API des adoptants
- `server/spec/owner.spec.js` - Tests API des propriétaires
- `server/spec/animal.spec.js` - Tests API des animaux
- `server/spec/match.spec.js` - Tests de match et messagerie

> 💡 Les tests utilisent automatiquement une base de données séparée (`pawfectmatch-test`) pour ne pas affecter vos données de développement.

## 🚀 Déploiement

### Checklist pré-déploiement

- [ ] Changez `JWT_SECRET` pour une valeur sécurisée aléatoire
- [ ] Configurez MongoDB distant (ex: MongoDB Atlas)
- [ ] Utilisez `VITE_WS_PROTOCOL=wss` pour WebSocket sécurisé
- [ ] Définissez `NODE_ENV=production`
- [ ] Configurez les variables d'environnement sur votre plateforme
- [ ] Buildez le frontend : `npm run build`

### Configuration production

```env
# Production
NODE_ENV=production

# MongoDB Atlas (remplacez par votre vraie URL depuis MongoDB Atlas)
DATABASE_URL=mongodb+srv://username:password@votre-cluster.mongodb.net/pawfectmatch

# JWT (générez une clé aléatoire sécurisée)
JWT_SECRET=clé-aléatoire-ultra-sécurisée-64-caractères-minimum

# WebSocket (remplacez par votre domaine)
VITE_WS_PROTOCOL=wss
VITE_WS_HOST=votredomaine.com
VITE_WS_PORT=443

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre-cloud-name
CLOUDINARY_API_KEY=votre-api-key
CLOUDINARY_API_SECRET=votre-api-secret
```

### Plateformes recommandées

- **Backend** : Heroku, Railway, Render, DigitalOcean
- **Base de données** : MongoDB Atlas (gratuit jusqu'à 512MB)
- **Images** : Cloudinary (gratuit jusqu'à 25GB)

## 👥 Équipe

Projet réalisé dans le cadre des cours de **ArchiOWeb** (back-end) et **DévMobil** (front-end) à la HEIG-VD.

**Développement :**
- Anna Tranchida
- Doriane Rosset
- Agathe Makumbi
- Christel Espinasse

---

<p align="center">
  Fait avec ❤️ pour les animaux qui cherchent un foyer 🐾
</p>
