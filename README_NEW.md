# PawfectMatch API

API REST pour connecter des adoptants avec des animaux disponibles à l’adoption.

## Prérequis

- Node.js 18+
- MongoDB 7/8
- npm 9+
- Compte Cloudinary (upload d’images)

## Démarrage rapide

```bash
git clone https://github.com/HEIG-VD/pawfectmatch.git
cd pawfectmatch
npm install

cp .env.example .env
# Renseignez Cloudinary dans .env

# Démarrez MongoDB si besoin
mongod

# (Optionnel) Seed
cd server
node seed-animals-users.js
cd ..

# Frontend + backend (2 terminaux)
npm run backend
npm run dev
Frontend : http://localhost:5173

API : http://localhost:8989

# Comptes de test (si seed)
adopter1@example.com / password123

adopter2@example.com / password123

owner1@example.com / password123

refuge@example.com / password123

# Configuration
Créez/complétez .env à la racine :

# env
## Copier le code :
DATABASE_URL=mongodb://localhost/pawfectmatch
BACKEND_PORT=8989

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

VITE_WS_HOST=localhost
VITE_WS_PORT=8989
VITE_WS_PROTOCOL=ws

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

En production : utilisez un JWT_SECRET robuste, une DB distante (mongodb+srv://...) et VITE_WS_PROTOCOL=wss.

# Scripts
bash
## Copier le code :
npm test
npm run test:coverage
npm run test:watch
npm run create-admin

# Documentation API
La spécification OpenAPI est dans openapi.yml (import dans Swagger/Redoc).

# WebSocket
Temps réel (notifications + chat) via les variables VITE_WS_HOST, VITE_WS_PORT, VITE_WS_PROTOCOL.

# Dépannage

## MongoDB refuse la connexion (ECONNREFUSED 127.0.0.1:27017) : démarrez MongoDB.

## Si le port déjà utilisé : changez BACKEND_PORT dans .env.

## Cloudinary Unauthorized : vérifiez CLOUDINARY_* dans .env.
```
