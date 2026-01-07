# PawfectMatch API

Une API RESTful pour connecter les adoptants d'animaux avec les animaux disponibles à l'adoption, implémentée avec [Express][express] et [MongoDB][mongo].

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Prérequis](#prérequis)
- [Guide de démarrage rapide](#guide-de-démarrage-rapide)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Configuration](#configuration)
- [Fonctionnalités de l'application](#fonctionnalités-de-lapplication)
- [Ressources API](#ressources-api)
- [Documentation API](#documentation-api)
- [Support WebSocket](#support-websocket)
- [Tests automatisés](#tests-automatisés)
- [Dépannage](#dépannage)
- [Déploiement en production](#déploiement-en-production)
- [Licence](#licence)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Prérequis

- [Node.js][node] 18.x ou supérieur
- [MongoDB][mongo] 7.x ou 8.x (local ou distant)
- [npm][npm] 9.x ou supérieur
- Compte [Cloudinary][cloudinary] (pour la fonctionnalité d'upload d'images)

## Guide de démarrage rapide

Pour faire fonctionner l'application rapidement :

```bash
# 1. Clonez et installez
git clone https://github.com/HEIG-VD/pawfectmatch.git
cd pawfectmatch
npm install

# 2. Copiez le fichier d'environnement et ajoutez les identifiants Cloudinary
cp .env.example .env
# Modifiez le fichier .env avec vos identifiants Cloudinary

# 3. Démarrez MongoDB (s'il n'est pas déjà en cours d'exécution)
mongod  # Ou : brew services start mongodb-community (macOS)

# 4. Seedez la base de données avec des données d'exemple (optionnel)
cd server
node seed-animals-users.js
cd ..

# 5. Démarrez le backend et le frontend
# Terminal 1:
npm run backend

# Terminal 2:
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) dans votre navigateur et
matchez avec vos animaux préférés !

### Identifiants d'exemple

Si vous avez peuplé la base de données, vous pouvez utiliser ces comptes de test :

**Adoptants :**

- Email : `adopter1@example.com` | Mot de passe : `password123`
- Email : `adopter2@example.com` | Mot de passe : `password123`

**Propriétaires :**

- Email : `owner1@example.com` | Mot de passe : `password123`
- Email : `refuge@example.com` | Mot de passe : `password123`

## Installation

```bash
git clone https://github.com/HEIG-VD/pawfectmatch.git
cd pawfectmatch
```

### 2. Installez les dépendances

```bash
npm install
```

### 3. Configurez les variables d'environnement

Copiez le fichier `.env.example` vers `.env` et mettez-le à jour avec votre configuration :

```bash
cp .env.example .env
```

Modifiez le fichier `.env` avec vos paramètres (voir la section [Configuration](#configuration) ci-dessous)

### 4. Démarrez MongoDB

Assurez-vous que MongoDB est en cours d'exécution sur votre système :

```bash
# Sur macOS avec Homebrew
brew services start mongodb-community

# Ou démarrez MongoDB manuellement
mongod
```

Pour plus d'informations sur la configuration de MongoDB, consultez la [documentation MongoDB][mongo-setup].

### 5. (Optionnel) Peuplez la base de données avec des données d'exemple

Pour remplir la base de données avec des utilisateurs, animaux et correspondances d'exemple :

```bash
# Depuis le répertoire du serveur
cd server
node seed-animals-users.js
```

Cela crée :

- Des adoptants et propriétaires d'exemple
- Des animaux d'exemple avec caractéristiques
- Des correspondances d'exemple pour la démonstration

## Utilisation

### Mode développement (Stack complète)

```bash
# Terminal 1 : Démarrez le serveur backend avec rechargement à chaud
npm run backend
```

L'API backend sera disponible à [http://localhost:8989](http://localhost:8989)

```bash
# Terminal 2 : Démarrez le frontend (serveur de développement Vite)
npm run dev
```

Le frontend sera disponible à [http://localhost:5173](http://localhost:5173) (ou le port affiché dans votre terminal)

### Construction de production

```bash
# Construisez le frontend
npm run build

# Démarrez le backend pour la production
npm run backend
```

### Scripts utiles

```bash
# Exécutez les tests automatisés
npm test

# Exécutez les tests avec rapport de couverture
npm run test:coverage

# Exécutez les tests en mode surveillance
npm run test:watch

# Créez un compte administrateur (si vous utilisez le panneau d'administration)
npm run create-admin
```

## Configuration

### Variables d'environnement

Créez un fichier `.env` dans le répertoire racine avec les variables suivantes :

```env
# Connexion MongoDB
DATABASE_URL=mongodb://localhost/pawfectmatch

# Configuration du serveur
BACKEND_PORT=8989
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Configuration WebSocket (Frontend)
VITE_WS_HOST=localhost
VITE_WS_PORT=8989
VITE_WS_PROTOCOL=ws

# Upload d'images Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Compte administrateur (pour l'initialisation)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123!
```

### Détails de configuration

| Variable                | Description                                       | Par défaut                         | Requis                 |
| ----------------------- | ------------------------------------------------- | ---------------------------------- | ---------------------- |
| `DATABASE_URL`          | Chaîne de connexion MongoDB                       | `mongodb://localhost/pawfectmatch` | Non                    |
| `BACKEND_PORT`          | Port du serveur                                   | `8989`                             | Non                    |
| `JWT_SECRET`            | Clé secrète pour les jetons JWT (changez en prod) | -                                  | Oui                    |
| `JWT_EXPIRES_IN`        | Durée d'expiration du jeton JWT                   | `7d`                               | Non                    |
| `VITE_WS_HOST`          | Hôte WebSocket pour le frontend                   | `localhost`                        | Non                    |
| `VITE_WS_PORT`          | Port WebSocket                                    | `8989`                             | Non                    |
| `VITE_WS_PROTOCOL`      | Protocole WebSocket                               | `ws` (ou `wss` pour la production) | Non                    |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary                           | -                                  | Oui (pour les uploads) |
| `CLOUDINARY_API_KEY`    | Clé API Cloudinary                                | -                                  | Oui (pour les uploads) |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary                             | -                                  | Oui (pour les uploads) |
| `ADMIN_EMAIL`           | Email de l'utilisateur administrateur             | -                                  | Non                    |
| `ADMIN_PASSWORD`        | Mot de passe de l'utilisateur administrateur      | -                                  | Non                    |

### Configuration de Cloudinary

Pour activer les uploads d'images, vous avez besoin d'un compte Cloudinary :

1. Inscrivez-vous à [https://cloudinary.com](https://cloudinary.com)
2. Allez sur votre [Tableau de bord](https://cloudinary.com/console)
3. Copiez votre **Nom du cloud**, **Clé API** et **Secret API**
4. Ajoutez-les à votre fichier `.env`

### Utilisation d'une MongoDB distante

Si vous souhaitez utiliser une instance MongoDB distante (par exemple, MongoDB Atlas) :

```env
DATABASE_URL=mongodb+srv://username:password@cluster0.mongodb.net/pawfectmatch?retryWrites=true&w=majority
```

### Configuration locale de MongoDB

**macOS :**

```bash
# Installez MongoDB avec Homebrew
brew install mongodb-community

# Démarrez le service MongoDB
brew services start mongodb-community

# Arrêtez le service MongoDB
brew services stop mongodb-community
```

**Windows :**

- Téléchargez et installez depuis [MongoDB Community](https://www.mongodb.com/try/download/community)
- MongoDB démarrera automatiquement

**Linux (Ubuntu/Debian) :**

```bash
# Installez MongoDB
sudo apt-get install -y mongodb

# Démarrez le service MongoDB
sudo systemctl start mongodb
```

### Configurations d'exemple

**Développement (MongoDB local) :**

```env
# Base de données locale sur votre ordinateur
DATABASE_URL=mongodb://localhost/pawfectmatch

# Port local (8989)
BACKEND_PORT=8989

# Clé secrète simple pour développement (À CHANGER EN PRODUCTION !)
JWT_SECRET=dev-secret-key-change-in-production

# WebSocket en HTTP (pas sécurisé, ok en local)
VITE_WS_PROTOCOL=ws

# Identifiants Cloudinary (remplacez par les vôtres)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Production (MongoDB distant & SSL) :**

```env
# Base de données hébergée sur MongoDB Atlas (serveur distant)
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/pawfectmatch

# Port HTTPS standard (443) pour sécurité
BACKEND_PORT=443

# Clé secrète très sécurisée et complexe en production
JWT_SECRET=your-very-secure-random-key-here

# WebSocket sécurisé avec chiffrement SSL/TLS
VITE_WS_PROTOCOL=wss

# Identifiants Cloudinary (mêmes que développement)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Explications des différences :

| Paramètre            | Développement             | Production          | Pourquoi ?                                                |
| -------------------- | ------------------------- | ------------------- | --------------------------------------------------------- |
| **DATABASE_URL**     | `mongodb://localhost/...` | `mongodb+srv://...` | En dev, DB locale; en prod, DB cloud sécurisée            |
| **BACKEND_PORT**     | `8989`                    | `443`               | 8989 = port de dev; 443 = port HTTPS standard             |
| **JWT_SECRET**       | Simple                    | Très complexe       | En dev, pas grave; en prod, pour sécurité maximale        |
| **VITE_WS_PROTOCOL** | `ws`                      | `wss`               | ws = non sécurisé (ok local); wss = sécurisé avec SSL/TLS |
| **CLOUDINARY\_\***   | Vos identifiants          | Vos identifiants    | Identiques (l'upload d'images fonctionne pareil)          |

## Ressources API

Cette API vous permet de travailler avec les ressources suivantes :

### Ressources principales

- **Adoptants** - Utilisateurs cherchant à adopter des animaux

  - S'inscrire en tant qu'adoptant
  - Parcourir et filtrer les adoptants
  - Mettre à jour le profil d'adoptant
  - Supprimer le compte d'adoptant

- **Propriétaires** - Utilisateurs proposant des animaux à l'adoption

  - S'inscrire en tant que propriétaire
  - Parcourir et filtrer les propriétaires
  - Mettre à jour le profil du propriétaire
  - Supprimer le compte propriétaire (s'il n'y a pas d'animaux associés)

- **Animaux** - Animaux de compagnie disponibles à l'adoption

  - Créer et gérer les annonces d'animaux
  - Parcourir les animaux avec filtrage (espèce, ville, nom)
  - Mettre à jour les informations et la disponibilité des animaux
  - Supprimer les annonces d'animaux

- **Correspondances** - Connexions entre adoptants et animaux
  - Créer des correspondances entre adoptants et animaux
  - Gérer le statut des correspondances (actif/inactif)
  - Échanger des messages dans une discussion de correspondance
  - Consulter l'historique des discussions

### Ressources connexes

- **Images** - Gestion des uploads d'images

  - Télécharger une ou plusieurs images (jusqu'à 10 fichiers)
  - Supprimer des images

- **Admin** - Points de terminaison administratifs
  - Récupérer les statistiques API (utilisateurs totaux, animaux, correspondances)

## Fonctionnalités de l'application

### Pour les adoptants

- **Parcourir les animaux** - Parcourez les animaux disponibles avec des recommandations intelligentes basées sur vos préférences
- **Détails des animaux** - Voir les informations détaillées sur chaque animal (photos, caractéristiques, informations du propriétaire)
- **Like/Correspondance** - Aimez les animaux pour exprimer votre intérêt et créer une correspondance
- **Demandes** - Consulter toutes vos demandes d'adoption et leur statut (en attente, validée, adoptée, refusée)
- **Messages** - Messagerie en temps réel avec les propriétaires via WebSocket
- **Profil utilisateur** - Gérez votre profil, vos préférences et votre historique d'adoption
- **Vue carte** - Voir les emplacements des animaux sur une carte interactive

### Pour les propriétaires

- **Créer des annonces d'animaux** - Ajoutez de nouveaux animaux avec photos, caractéristiques et descriptions
- **Gérer les animaux** - Modifiez, mettez à jour la disponibilité et gérez toutes vos annonces
- **Demandes** - Voir et gérer les demandes d'adoption des adoptants
- **Notifications en temps réel** - Recevez des notifications instantanées quand les adoptants aiment ou créent une correspondance avec vos animaux
- **Messagerie** - Communiquez directement avec les adoptants intéressés
- **Profil utilisateur** - Gérez votre profil d'organisation/personnel

### Technologie principale

- **Frontend** - Vue 3 avec Vite pour un développement rapide
- **Backend** - Express.js avec Node.js
- **Base de données** - MongoDB avec Mongoose ORM
- **Communication en temps réel** - Support WebSocket avec WsMini
- **Authentification** - Authentification sécurisée basée sur JWT
- **Stockage d'images** - Cloudinary pour les uploads et la gestion des images

## Documentation API

La documentation API complète est disponible dans la [spécification OpenAPI](openapi.yml).

Vous pouvez voir la documentation interactive en utilisant :

1. **Swagger UI** - Copiez le contenu de `openapi.yml` vers https://editor.swagger.io/
2. **ReDoc** - Consultez https://redocly.github.io/redoc/ (collez le YAML)

### Caractéristiques principales

- **Authentification** - Authentification par jeton JWT pour les points de terminaison sécurisés
- **Pagination** - Tous les points de terminaison de liste supportent la pagination avec les paramètres `page` et `limit`
- **Filtrage** - Filtrez les ressources par divers critères (firstName, lastName, email, city, species, etc.)
- **Gestion des erreurs** - Réponses d'erreur complètes avec codes de statut HTTP appropriés
- **Validation** - Validation des données de requête avec messages d'erreur détaillés

## Support WebSocket

Cette application utilise [WsMini][wsmini] - une bibliothèque WebSocket légère pour la communication en temps réel.

### Fonctionnalités en temps réel

- **Notifications en direct** - Les propriétaires reçoivent des notifications instantanées quand les adoptants aiment leurs animaux
- **Messagerie en direct** - Chat en temps réel entre adoptants et propriétaires
- **Mises à jour des correspondances** - Les changements de statut sont reflétés immédiatement à tous les clients connectés

Pour plus d'informations sur WsMini, consultez la [documentation officielle][wsmini].

## Tests automatisés

Cette application inclut une suite de tests automatisés utilisant [Jest][jest] et [SuperTest][supertest].

### Exécuter les tests

```bash
# Exécutez tous les tests
npm test

# Exécutez les tests avec rapport de couverture
npm run test:coverage

# Exécutez les tests en mode surveillance (auto-exécution lors des modifications)
npm run test:watch
```

### Base de données de test

Les tests utilisent automatiquement une base de données MongoDB séparée à `mongodb://127.0.0.1/pawfectmatch-test` pour éviter d'affecter vos données de développement.

### Structure des tests

- `server/spec/adopter.spec.js` - Tests API des adoptants
- `server/spec/animal.spec.js` - Tests API des animaux
- `server/spec/owner.spec.js` - Tests API des propriétaires
- `server/spec/match.spec.js` - Tests de correspondance et de messagerie

## Dépannage

### Problèmes de connexion MongoDB

**Erreur : `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`**

MongoDB n'est pas en cours d'exécution. Démarrez-le avec :

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Windows
# Démarrez le service MongoDB à partir de l'application Services
```

### Port déjà utilisé

**Erreur : `Error: listen EADDRINUSE: address already in use :::8989`**

Une autre application utilise le port 8989. Vous pouvez soit :

- Arrêter l'autre application
- Changer le port dans `.env` : `BACKEND_PORT=3000`

### L'upload Cloudinary échoue

**Erreur : `Unauthorized to access resource`**

Vérifiez vos identifiants Cloudinary dans `.env` :

- Vérifiez que `CLOUDINARY_CLOUD_NAME` est correct
- Vérifiez que `CLOUDINARY_API_KEY` est correct
- Vérifiez que `CLOUDINARY_API_SECRET` est correct

### Problèmes de connexion WebSocket

**Le frontend ne peut pas se connecter à WebSocket**

Vérifiez votre fichier `.env` :

```env
VITE_WS_HOST=localhost  # Doit correspondre à l'hôte de votre backend
VITE_WS_PORT=8989       # Doit correspondre à votre BACKEND_PORT
VITE_WS_PROTOCOL=ws     # Utilisez 'wss' pour HTTPS
```

### Les tests échouent avec erreur de base de données

Videz la base de données de test et réessayez :

```bash
# La base de données de test est automatiquement nettoyée avant chaque suite de tests
# Si les problèmes persistent, supprimez la base de données de test manuellement :
# mongo pawfectmatch-test --eval "db.dropDatabase()"

npm test
```

## Déploiement en production

### Avant de mettre en ligne

1. **Changez la clé secrète JWT**

   ```env
   JWT_SECRET=your-very-secure-random-key-here
   ```

2. **Utilisez une MongoDB distante**

   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/pawfectmatch
   ```

3. **Mettez à jour le protocole WebSocket**

   ```env
   VITE_WS_PROTOCOL=wss  # WebSocket sécurisé
   ```

4. **Construisez le frontend**

   ```bash
   npm run build
   ```

5. **Définissez NODE_ENV**
   ```env
   NODE_ENV=production
   ```

### Variables d'environnement pour la production

```env
DATABASE_URL=<your-mongodb-atlas-url>
BACKEND_PORT=443
NODE_ENV=production
JWT_SECRET=<your-secure-secret>
JWT_EXPIRES_IN=7d
VITE_WS_HOST=<your-domain.com>
VITE_WS_PORT=443
VITE_WS_PROTOCOL=wss
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

[express]: https://expressjs.com
[jest]: https://jestjs.io
[mongo]: https://www.mongodb.com
[mongo-setup]: https://docs.mongodb.com/manual/installation/
[cloudinary]: https://cloudinary.com
[node]: https://nodejs.org
[npm]: https://www.npmjs.com
[supertest]: https://github.com/visionmedia/supertest#readme
[wsmini]: https://github.com/Chabloz/WsMini
