import express from 'express';
import { 
  login, 
  registerAdopter, 
  registerOwner, 
} from '../api/auth.mjs';
import { logout } from '../api/logout.mjs';

const router = express.Router();

// Auth routes - Public
router.post('/auth/register/adopter', registerAdopter);
router.post('/auth/register/owner', registerOwner);
router.post('/auth/login', login);
router.post('/auth/logout', logout);

export default router;
