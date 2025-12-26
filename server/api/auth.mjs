import jwt from 'jsonwebtoken';
import Adopter from '../models/adopter.js';
import Owner from '../models/owner.js';
import Admin from '../models/admin.js';
import { getGeoJSON } from '../utils/geocoder.mjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';


export async function registerAdopter(req, res) {
  try {
    const { firstName, lastName, email, password, address, age, about, preferences, image } = req.body;

    // Validate required fields only
    if (!firstName || !lastName || !email || !password || !address || !age) {
      return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
    }

    // Check if email already exists
    const existingAdopter = await Adopter.findOne({ email });
    if (existingAdopter) {
      return res.status(409).json({ error: 'Cet email est déjà enregistré' });
    }

const location = await getGeoJSON(address.zip, address.city);

    // Create new adopter (about and preferences are optional)
    const adopter = new Adopter({
      firstName,
      lastName,
      email,
      password,
      address,
      location,
      age,
      ...(about && { about }),
      ...(preferences && { preferences }),
      image: image || ''
    });

    await adopter.save();

    // Generate JWT token
    const token = jwt.sign(
      { sub: adopter._id, email: adopter.email, type: 'adopter' },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    res.status(201).json({ 
      message: 'Adopter registered successfully',
      token,
      user: adopter
    });

  } catch (error) {
    console.error('Register adopter error:', error);
    res.status(500).json({ error: 'Échec de l\'inscription' });
  }
}

export async function registerOwner(req, res) {
  try {
    const { firstName, lastName, email, password, address, phoneNumber, about, image } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !address) {
      return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
    }

    // Check if email already exists
    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      return res.status(409).json({ error: 'Cet email est déjà enregistré' });
    }

const location = await getGeoJSON(address.zip, address.city);

    const owner = new Owner({
      firstName,
      lastName,
      email,
      password,
      address,     
      location,     
      phoneNumber,
      about,
      image: image || ''
    });
    await owner.save();

    // Generate JWT token
    const token = jwt.sign(
      { sub: owner._id, email: owner.email, type: 'owner' },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    res.status(201).json({ 
      message: 'Owner registered successfully',
      token,
      user: owner
    });
  } catch (error) {
    console.error('Register owner error:', error);
    res.status(500).json({ error: 'Échec de l\'inscription' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Search for user in all collections in parallel
    const [adopter, owner, admin] = await Promise.all([
      Adopter.findOne({ email }),
      Owner.findOne({ email }),
      Admin.findOne({ email })
    ]);

    const user = adopter || owner || admin;
    const type = adopter ? 'adopter' : owner ? 'owner' : admin ? 'admin' : null;

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { sub: user._id, email: user.email, type },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    // Store JWT in httpOnly cookie
    const maxAge = parseExpirationTime(JWT_EXPIRES_IN);
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true seulement en production
      sameSite: 'strict',
      maxAge
    });

    res.json({ 
      user,
      type
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Échec de la connexion' });
  }
}

/**
 * Convert JWT expiration string to milliseconds
 * @param {string} expiresIn - JWT expiration string (e.g., '15m', '1h', '7d')
 * @returns {number} - Milliseconds
 */
function parseExpirationTime(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes

  const [, value, unit] = match;
  const num = parseInt(value);

  const units = {
    s: 1000,           // seconds
    m: 60 * 1000,      // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000 // days
  };

  return num * (units[unit] || units.m);
}