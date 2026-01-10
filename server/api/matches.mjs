import Match from '../models/match.js';
import Animal from '../models/animal.js';
import Adopter from '../models/adopter.js';
import { ensureMatchChannel, wsServer } from '../store/wsStore.mjs';
import jwt from 'jsonwebtoken';
import { parseCookies } from '../utils/parseCookies.mjs';

/**
 * Récupère la liste des matches avec pagination et filtres
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Liste des matches avec pagination
 */
export async function getMatches(req, res) {
  try {
    const {
      adopterId,
      animalId,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (adopterId) query.adopterId = adopterId;
    if (animalId) query.animalId = animalId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Match.countDocuments(query);

    const matches = await Match.find(query)
      .populate('adopterId', 'firstName lastName email image')
      .populate({
        path: 'animalId',
        select: 'name species race age images',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber societyName image'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      matches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la récupération des matchs' });
  }
}


/**
 * Récupère un match par son ID avec toutes les informations détaillées
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Match avec informations de l'adopteur, animal et propriétaire
 */
export async function getMatchById(req, res) {
  try {
    const { id } = req.params;

    const match = await Match.findById(id)
      .populate('adopterId', 'firstName lastName email address image')
      .populate({
        path: 'animalId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber address societyName image'
        }
      })
      .populate('discussion.sender', 'firstName lastName image');

    if (!match) {
      return res.status(404).json({ error: 'Match introuvable' });
    }

    await ensureMatchChannel(id);

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Échec de la récupération du match' });
  }
}


/**
 * Crée un nouveau match entre un adopteur et un animal
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Match créé avec canal WebSocket
 */
export async function createMatch(req, res) {
  try {
    const { animalId } = req.body;
    const adopterId = req.user.sub; // Forcer l'ID de l'utilisateur authentifié

    if (!animalId) {
      return res.status(400).json({ error: "L'identifiant de l'animal est requis" });
    }

    const adopter = await Adopter.findById(adopterId);
    if (!adopter) return res.status(404).json({ error: 'Adopteur introuvable' });

    const animal = await Animal.findById(animalId);
    if (!animal) return res.status(404).json({ error: 'Animal introuvable' });

    if (!animal.availability) {
      return res.status(400).json({ error: "L'animal n'est pas disponible" });
    }

    const existingMatch = await Match.findOne({ adopterId, animalId });
    if (existingMatch) {
      return res.status(409).json({ error: 'Ce match existe déjà' });
    }

    const match = new Match({
      adopterId,
      animalId,
      isActive: false,
      discussion: []
    });

    await ensureMatchChannel(match._id.toString());
    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('adopterId', 'firstName lastName email image')
      .populate({
        path: 'animalId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber image'
        }
      });

    res.status(201).json({
      message: 'Match créé avec succès',
      match: populatedMatch
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la création du match' });
  }
}


/**
 * Met à jour un match et envoie des notifications WebSocket
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Match mis à jour
 */
export async function updateMatch(req, res) {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;

    if (status) {
      updateData.status = status;
      if (status === 'validé') updateData.isActive = true;
      if (status === 'refusé') updateData.isActive = false;
    }

    const match = await Match.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'animalId',
        select: 'name species race images ownerId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName'
        }
      })
      .populate('adopterId', 'firstName lastName email image');

    if (!match) {
      return res.status(404).json({ error: 'Match introuvable' });
    }

    if (status === 'adopté' && match.animalId) {
      await Animal.findByIdAndUpdate(match.animalId._id, {
        availability: false
      });
    }

    if (status === 'validé') {
      try {
        const adopterId = match.adopterId._id.toString();
        const ownerId = match.animalId?.ownerId?._id ? match.animalId.ownerId._id.toString() : null;

        const adopterClient = wsServer.getClientSocket(adopterId);

        if (adopterClient) {
          const ownerName = match.animalId?.ownerId ?
            `${match.animalId.ownerId.firstName || ''} ${match.animalId.ownerId.lastName || ''}`.trim() : '';

          const notificationData = {
            matchId: match._id.toString(),
            animalId: match.animalId?._id ? match.animalId._id.toString() : 'NO_ANIMAL_ID',
            animalImage: match.animalId?.images?.[0] || '',
            animalName: match.animalId?.name || '',
            animalSpecies: match.animalId?.species || '',
            animalRace: match.animalId?.race || '',
            adopterImage: match.adopterId?.image || '',
            adopterName: `${match.adopterId?.firstName || ''} ${match.adopterId?.lastName || ''}`.trim(),
            ownerName: ownerName,
            conversationLink: `/adopter/messages/${match._id.toString()}`
          };

          wsServer.sendCmd(adopterClient, 'matchNotification', notificationData);
        } else {
          await Match.findByIdAndUpdate(match._id, {
            notificationPending: true,
            notificationSentAt: null
          });
        }

        if (ownerId) {
          const ownerClient = wsServer.getClientSocket(ownerId);
          if (ownerClient) {
            wsServer.sendCmd(ownerClient, 'matchValidated', {
              matchId: match._id.toString(),
              animalName: match.animalId?.name || '',
              adopterName: `${match.adopterId?.firstName || ''} ${match.adopterId?.lastName || ''}`.trim()
            });
          }
        }
      } catch (error) {
        // Continue même si l'envoi de notification échoue
      }
    }

    res.json({
      message: 'Match mis à jour avec succès',
      match
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la mise à jour du match' });
  }
}


/**
 * Finalise l'adoption d'un animal et désactive sa disponibilité
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Match finalisé
 */
export async function finalizeAdoption(req, res) {
  try {
    const { id } = req.params;

    const match = await Match.findById(id).populate('animalId');
    if (!match) return res.status(404).json({ error: 'Match introuvable' });

    if (match.status !== 'validé') {
      return res.status(400).json({ error: 'Le match doit être validé avant l\'adoption' });
    }

    match.status = 'adopté';
    match.isActive = false;
    await match.save();

    if (match.animalId) {
      await Animal.findByIdAndUpdate(match.animalId._id, { availability: false });
    }

    res.json({
      message: 'Adoption finalisée avec succès',
      match
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la finalisation de l\'adoption' });
  }
}


/**
 * Supprime un match de la base de données
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Message de confirmation
 */
export async function deleteMatch(req, res) {
  try {
    const { id } = req.params;
    const match = await Match.findByIdAndDelete(id);

    if (!match) return res.status(404).json({ error: 'Match introuvable' });

    res.json({ message: 'Match supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la suppression du match' });
  }
}


/**
 * Ajoute un message à la discussion d'un match
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Match mis à jour avec le nouveau message
 */
export async function addMessage(req, res) {
  try {
    const { id } = req.params;
    const { sender, senderModel, message } = req.body;

    if (!sender || !senderModel || !message) {
      return res.status(400).json({ error: 'L\'expéditeur, le modèle d\'expéditeur et le message sont requis' });
    }

    if (!['Adopter', 'Owner'].includes(senderModel)) {
      return res.status(400).json({ error: 'Le modèle d\'expéditeur doit être "Adopter" ou "Owner"' });
    }

    const match = await Match.findById(id);
    if (!match) return res.status(404).json({ error: 'Match introuvable' });

    if (match.status !== 'validé' && match.status !== 'adopté') {
      return res.status(400).json({ error: 'Impossible d\'envoyer un message à un match inactif' });
    }

    match.discussion.push({
      sender,
      senderModel,
      message,
      timestamp: new Date()
    });

    await match.save();

    const updatedMatch = await Match.findById(id)
      .populate('adopterId', 'firstName lastName email image')
      .populate({
        path: 'animalId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber image'
        }
      })
      .populate('discussion.sender', 'firstName lastName image');

    res.json({
      message: 'Message ajouté avec succès',
      match: updatedMatch
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de l\'ajout du message' });
  }
}


/**
 * Récupère la discussion d'un match spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Discussion avec informations du match
 */
export async function getMatchDiscussion(req, res) {
  try {
    const { id } = req.params;

    const match = await Match.findById(id)
      .select('discussion adopterId animalId isActive')
      .populate('discussion.sender', 'firstName lastName image');

    if (!match) {
      await ensureMatchChannel(id);
      return res.status(404).json({ error: 'Match introuvable' });
    }

    res.json({
      matchId: match._id,
      adopterId: match.adopterId,
      animalId: match.animalId,
      isActive: match.isActive,
      discussion: match.discussion
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la récupération de la discussion' });
  }
}


/**
 * Récupère les notifications en attente pour un adopteur authentifié
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Array} Liste des notifications en attente
 */
export async function getPendingNotifications(req, res) {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    if (decoded.type !== 'adopter') {
      return res.status(403).json({ error: 'Seuls les adopteurs peuvent récupérer les notifications en attente' });
    }

    const adopterId = decoded.sub;

    if (!adopterId) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const matches = await Match.find({
      adopterId,
      status: 'validé',
      notificationPending: true
    })
      .populate('animalId', 'name species race images')
      .populate({
        path: 'animalId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName'
        }
      })
      .populate('adopterId', 'firstName lastName email image');

    const notifications = matches.map(match => ({
      matchId: match._id.toString(),
      animalId: match.animalId?._id.toString() || '',
      animalImage: match.animalId?.images?.[0] || '',
      animalName: match.animalId?.name || '',
      animalSpecies: match.animalId?.species || '',
      animalRace: match.animalId?.race || '',
      adopterImage: match.adopterId?.image || '',
      adopterName: `${match.adopterId?.firstName || ''} ${match.adopterId?.lastName || ''}`.trim(),
      ownerName: match.animalId?.ownerId ?
        `${match.animalId.ownerId.firstName || ''} ${match.animalId.ownerId.lastName || ''}`.trim() : '',
      conversationLink: `/adopter/messages/${match._id.toString()}`
    }));

    if (notifications.length > 0) {
      const matchIds = matches.map(m => m._id);
      await Match.updateMany(
        { _id: { $in: matchIds } },
        {
          notificationPending: false,
          notificationSentAt: new Date()
        }
      );
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Échec de la récupération des notifications en attente', details: error.message });
  }
}