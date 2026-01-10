import jwt from 'jsonwebtoken';
import { parseCookies } from '../utils/parseCookies.mjs';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware pour vérifier l'authentification JWT
 * Vérifie le token dans les cookies ou le header Authorization
 */
export function requireAuth(req, res, next) {
    try {
        const cookies = parseCookies(req.headers.cookie || '');
        const token = cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        req.user = decoded; // Ajoute les infos utilisateur à la requête
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
}

/**
 * Middleware pour vérifier que l'utilisateur est un adopteur
 */
export function requireAdopter(req, res, next) {
    if (!req.user || req.user.type !== 'adopter') {
        return res.status(403).json({ error: 'Accès réservé aux adopteurs' });
    }
    next();
}

/**
 * Middleware pour vérifier que l'utilisateur est un propriétaire
 */
export function requireOwner(req, res, next) {
    if (!req.user || req.user.type !== 'owner') {
        return res.status(403).json({ error: 'Accès réservé aux propriétaires' });
    }
    next();
}

/**
 * Middleware pour vérifier que l'utilisateur est un admin
 */
export function requireAdmin(req, res, next) {
    if (!req.user || req.user.type !== 'admin') {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
}

/**
 * Middleware pour vérifier que l'utilisateur accède à ses propres données
 * @param {string} userIdParam - Nom du paramètre contenant l'ID utilisateur
 */
export function requireOwnership(userIdParam = 'id') {
    return (req, res, next) => {
        const resourceUserId = req.params[userIdParam] || req.body.adopterId || req.body.ownerId;

        if (!req.user || req.user.sub !== resourceUserId) {
            return res.status(403).json({ error: 'Accès interdit : vous ne pouvez accéder qu\'à vos propres données' });
        }
        next();
    };
}
