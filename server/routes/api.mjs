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
  getMatchDiscussion
} from '../api/matches.mjs';

const router = express.Router();

// Auth routes - Public
router.post('/auth/register/adopter', registerAdopter);
router.post('/auth/register/owner', registerOwner);
router.post('/auth/login', login);
router.post('/auth/logout', logout);

// Animal routes
router.get('/animals', getAnimals);
router.get('/animals/:id', getAnimalById);
router.post('/animals', createAnimal);
router.put('/animals/:id', updateAnimal);
router.delete('/animals/:id', deleteAnimal);

// Adopter routes
router.get('/adopters', getAdopters);
router.get('/adopters/:id', getAdopterById);
router.put('/adopters/:id', updateAdopter);
router.delete('/adopters/:id', deleteAdopter);

// Owner routes
router.get('/owners', getOwners);
router.get('/owners/:id', getOwnerById);
router.put('/owners/:id', updateOwner);
router.delete('/owners/:id', deleteOwner);

// Match routes
router.get('/matches', getMatches);
router.get('/matches/:id', getMatchById);
router.post('/matches', createMatch);
router.put('/matches/:id', updateMatch);
router.delete('/matches/:id', deleteMatch);
router.post('/matches/:id/messages', addMessage);
router.get('/matches/:id/discussion', getMatchDiscussion);

export default router;
