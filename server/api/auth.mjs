import jwt from 'jsonwebtoken';
import Adopter from '../models/adopter.js';
import Owner from '../models/owner.js';
import Admin from '../models/admin.js';
import { getGeoJSON } from '../utils/geocoder.mjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

/**
 * Inscription d'un nouvel adopteur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Token JWT et informations utilisateur
 */
export async function registerAdopter(req, res) {
  try {
    const { firstName, lastName, email, password, address, age, about, preferences, image } = req.body;

    // Valide les champs requis
    if (!firstName || !lastName || !email || !password || !address || !age) {
      return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
    }

    // Vérifie si l'email existe déjà
    const existingAdopter = await Adopter.findOne({ email });
    if (existingAdopter) {
      return res.status(409).json({ error: 'Cet email est déjà enregistré' });
    }

const location = await getGeoJSON(address.zip, address.city);

    // Crée un nouvel adopteur (about et preferences sont optionnels)
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

    // Génère le token JWT
    const token = jwt.sign(
      { sub: adopter._id, email: adopter.email, type: 'adopter' },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    // Stocke le JWT dans un cookie httpOnly
    const maxAge = parseExpirationTime(JWT_EXPIRES_IN);
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });

    res.status(201).json({ 
      message: 'Inscription réussie',
      user: adopter,
      type: 'adopter'
    });

  } catch (error) {
    res.status(500).json({ error: 'Échec de l\'inscription' });
  }
}

/**
 * Inscription d'un nouveau propriétaire
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Token JWT et informations utilisateur
 */
export async function registerOwner(req, res) {
  try {
    const { firstName, lastName, email, password, address, phoneNumber, about, image } = req.body;

    // Valide les champs requis
    if (!firstName || !lastName || !email || !password || !address) {
      return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
    }

    // Vérifie si l'email existe déjà
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

    // Génère le token JWT
    const token = jwt.sign(
      { sub: owner._id, email: owner.email, type: 'owner' },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    // Stocke le JWT dans un cookie httpOnly
    const maxAge = parseExpirationTime(JWT_EXPIRES_IN);
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });

    res.status(201).json({ 
      message: 'Inscription réussie',
      user: owner,
      type: 'owner'
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de l\'inscription' });
  }
}

/**
 * Connexion d'un utilisateur (adopteur, propriétaire ou admin)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Token JWT, type d'utilisateur et informations
 */
export async function login(req, res) {
  try {
    const { email, password, type } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    if (!type || !['adopter', 'owner'].includes(type)) {
      return res.status(400).json({ error: 'Type d\'utilisateur invalide' });
    }

    // Recherche l'utilisateur selon le type
    let user;
    let userType = type;
    
    if (type === 'adopter') {
      user = await Adopter.findOne({ email });
    } else if (type === 'owner') {
      user = await Owner.findOne({ email });
    }

    // Si pas trouvé, chercher dans Admin
    if (!user) {
      user = await Admin.findOne({ email });
      if (user) {
        userType = 'admin';
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    // Vérifie le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    // Génère le token JWT
    const token = jwt.sign(
      { sub: user._id, email: user.email, type: userType },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    // Stocke le JWT dans un cookie httpOnly
    const maxAge = parseExpirationTime(JWT_EXPIRES_IN);
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });

    res.json({ 
      user,
      type: userType
    });
  } catch (error) {
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

/**
 * Récupère l'utilisateur courant basé sur le cookie JWT
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Informations utilisateur
 */
export async function getMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
 // Récupère les infos utilisateur selon le type
    let user;
    
    if (req.user.type === 'adopter') {
      user = await Adopter.findById(req.user.sub);
    } else if (req.user.type === 'owner') {
      user = await Owner.findById(req.user.sub);
    } else if (req.user.type === 'admin') {
      user = await Admin.findById(req.user.sub);
    }

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ 
      user, 
      type: req.user.type, 
      id: req.user.sub 
    });
  } catch (error) {
    res.status(401).json({ error: 'Non authentifié' });
  }
}