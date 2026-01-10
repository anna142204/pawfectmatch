import express from 'express';
import {
  login,
  registerAdopter,
  registerOwner,
} from '../api/auth.mjs';
import { logout } from '../api/logout.mjs';
import {
  getAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  deleteAnimal
} from '../api/animals.mjs';
import {
  getAdopters,
  getAdopterById,
  updateAdopter,
  deleteAdopter
} from '../api/adopters.mjs';
import {
  getOwners,
  getOwnerById,
  updateOwner,
  deleteOwner
} from '../api/owners.mjs';
import {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  addMessage,
  getMatchDiscussion,
  getPendingNotifications,
  finalizeAdoption
} from '../api/matches.mjs';
import {
  uploadEntityImages,
  deleteImage,
  upload
} from '../api/images.mjs';
import {
  getStats
} from '../api/admin.mjs';
import {
  requireAuth,
  requireAdopter,
  requireOwner,
  requireAdmin,
  requireOwnership
} from '../middleware/auth.mjs';

const router = express.Router();

// Auth routes - Public
router.post('/auth/register/adopter', registerAdopter);
router.post('/auth/register/owner', registerOwner);
router.post('/auth/login', login);
router.post('/auth/logout', requireAuth, logout);

// Image upload routes - Protected
router.post('/images/:type', requireAuth, upload.array('image', 10), uploadEntityImages); // Protégé
router.delete('/images', requireAuth, deleteImage); // Protégé

// Animal routes
router.get('/animals', getAnimals); // Public: lecture
router.get('/animals/:id', getAnimalById); // Public: lecture
router.post('/animals', requireAuth, requireOwner, createAnimal); // Protégé: création
router.put('/animals/:id', requireAuth, requireOwner, updateAnimal); // Protégé: modification
router.delete('/animals/:id', requireAuth, requireOwner, deleteAnimal); // Protégé: suppression

// Adopter routes
router.get('/adopters', getAdopters); // Public: lecture
router.get('/adopters/:id', getAdopterById); // Public: lecture
router.put('/adopters/:id', requireAuth, requireOwnership('id'), updateAdopter); // Protégé
router.delete('/adopters/:id', requireAuth, requireOwnership('id'), deleteAdopter); // Protégé

// Owner routes
router.get('/owners', getOwners); // Public: lecture
router.get('/owners/:id', getOwnerById); // Public: lecture
router.put('/owners/:id', requireAuth, requireOwnership('id'), updateOwner); // Protégé
router.delete('/owners/:id', requireAuth, requireOwnership('id'), deleteOwner); // Protégé

// Match routes - Protected
router.get('/matches', getMatches); // Public: lecture
router.get('/matches/pending-notifications', requireAuth, requireAdopter, getPendingNotifications); // Protégé
router.get('/matches/:id', getMatchById); // Public: lecture
router.post('/matches', requireAuth, requireAdopter, createMatch); // Protégé: création
router.put('/matches/:id', requireAuth, updateMatch); // Protégé: validation
router.patch('/matches/:id/adopt', requireAuth, finalizeAdoption); // Protégé
router.delete('/matches/:id', requireAuth, deleteMatch); // Protégé
router.post('/matches/:id/messages', requireAuth, addMessage); // Protégé
router.get('/matches/:id/discussion', requireAuth, getMatchDiscussion); // Protégé

// Admin routes - Admin only
router.get('/admin/stats', requireAuth, requireAdmin, getStats);

export default router;