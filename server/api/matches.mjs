import Match from '../models/match.js';
import Animal from '../models/animal.js';
import Adopter from '../models/adopter.js';
import { ensureMatchChannel, wsServer } from '../store/wsStore.mjs';
import jwt from 'jsonwebtoken';
import { parseCookies } from '../utils/parseCookies.mjs';

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

    // Pagination
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
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
}

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
      return res.status(404).json({ error: 'Match not found' });
    }

    // Ensure WebSocket channel exists for this match
    await ensureMatchChannel(id);

    res.json(match);
  } catch (error) {
    console.error('Get match by id error:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
}

export async function createMatch(req, res) {
  try {
    const { adopterId, animalId } = req.body;

    if (!adopterId || !animalId) {
      return res.status(400).json({ error: 'adopterId and animalId are required' });
    }

    const adopter = await Adopter.findById(adopterId);
    if (!adopter) return res.status(404).json({ error: 'Adopter not found' });

    const animal = await Animal.findById(animalId);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    
    if (!animal.availability) {
      return res.status(400).json({ error: 'Animal is not available' });
    }

    const existingMatch = await Match.findOne({ adopterId, animalId });
    if (existingMatch) {
      return res.status(409).json({ error: 'Match already exists' });
    }

    const match = new Match({
      adopterId,
      animalId,
      isActive: false,
      discussion: []
    });
    // Create WebSocket channel for this match
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
      message: 'Match created successfully',
      match: populatedMatch
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
}

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
      populate: {
        path: 'ownerId',
        select: 'firstName lastName'
      }
    })
    .populate('adopterId', 'firstName lastName email image');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    console.log(`[Update Match] Match ${id} updated. Status: "${status}", isActive: ${match.isActive}`);

    if (status === 'adopté' && match.animalId) {
      await Animal.findByIdAndUpdate(match.animalId._id, {
        availability: false
      });
    }

    // Send match notification to adopter via WebSocket when status is validated
    console.log(`[Match Notification] Checking if should send notification. Status received: "${status}"`);
    
    if (status === 'validé') {
      try {
        const adopterId = match.adopterId._id.toString();
        const ownerId = match.ownerId ? match.ownerId._id.toString() : null;
        
        console.log(`[Match Notification] Match validated. Adopter: ${adopterId}, Owner: ${ownerId}`);
        
        // Try to send notification to adopter via WebSocket
        const adopterClient = wsServer.getClientSocket(adopterId);
        console.log(`[Match Notification] Adopter WebSocket connection: ${adopterClient ? 'FOUND' : 'NOT FOUND'}`);
        
        if (adopterClient) {
          // Get owner name from populated animal
          const ownerName = match.animalId?.ownerId ? 
            `${match.animalId.ownerId.firstName || ''} ${match.animalId.ownerId.lastName || ''}`.trim() : '';
          
          // Prepare notification data for the popup
          const notificationData = {
            matchId: match._id.toString(),
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
          console.log(`[Match Notification] ✓ Sent notification to adopter ${adopterId}`);
        } else {
          console.log(`[Match Notification] ⚠ Adopter ${adopterId} not currently connected via WebSocket`);
          // Store notification flag in match for later retrieval when adopter connects
          await Match.findByIdAndUpdate(match._id, { 
            notificationPending: true,
            notificationSentAt: null 
          });
          console.log(`[Match Notification] Marked match ${match._id} as having pending notification`);
        }
        
        // Optionally notify owner as well if owner is connected
        if (ownerId) {
          const ownerClient = wsServer.getClientSocket(ownerId);
          if (ownerClient) {
            wsServer.sendCmd(ownerClient, 'matchValidated', {
              matchId: match._id.toString(),
              animalName: match.animalId?.name || '',
              adopterName: `${match.adopterId?.firstName || ''} ${match.adopterId?.lastName || ''}`.trim()
            });
            console.log(`[Match Notification] ✓ Sent validation confirmation to owner ${ownerId}`);
          }
        }
      } catch (error) {
        console.error('[Match Notification] ✗ Error sending match notification:', error);
        // Don't fail the request if notification fails to send
      }
    }

    res.json({
      message: 'Match updated successfully',
      match
    });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
}

export async function finalizeAdoption(req, res) {
  try {
    const { id } = req.params;
    
    const match = await Match.findById(id).populate('animalId');
    if (!match) return res.status(404).json({ error: 'Match not found' });
    
    if (match.status !== 'validé') {
      return res.status(400).json({ error: 'Match must be validated before adoption' });
    }
    
    match.status = 'adopté';
    match.isActive = false;
    await match.save();
    
    if (match.animalId) {
      await Animal.findByIdAndUpdate(match.animalId._id, { availability: false });
    }
    
    res.json({ 
      message: 'Adoption finalized successfully',
      match 
    });
  } catch (error) {
    console.error('Finalize adoption error:', error);
    res.status(500).json({ error: 'Failed to finalize adoption' });
  }
}

export async function deleteMatch(req, res) {
  try {
    const { id } = req.params;
    const match = await Match.findByIdAndDelete(id);

    if (!match) return res.status(404).json({ error: 'Match not found' });

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
}

export async function addMessage(req, res) {
  try {
    const { id } = req.params;
    const { sender, senderModel, message } = req.body;

    if (!sender || !senderModel || !message) {
      return res.status(400).json({ error: 'sender, senderModel, and message are required' });
    }

    if (!['Adopter', 'Owner'].includes(senderModel)) {
      return res.status(400).json({ error: 'senderModel must be either "Adopter" or "Owner"' });
    }

    const match = await Match.findById(id);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    if (!match.isActive) {
      return res.status(400).json({ error: 'Cannot send message to inactive match' });
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
      message: 'Message added successfully',
      match: updatedMatch
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
}

export async function getMatchDiscussion(req, res) {
  try {
    const { id } = req.params;

    const match = await Match.findById(id)
      .select('discussion adopterId animalId isActive')
      .populate('discussion.sender', 'firstName lastName image');

    if (!match) {
    // Ensure WebSocket channel exists for this match
    await ensureMatchChannel(id);

      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({
      matchId: match._id,
      adopterId: match.adopterId,
      animalId: match.animalId,
      isActive: match.isActive,
      discussion: match.discussion
    });
  } catch (error) {
    console.error('Get match discussion error:', error);
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
}

export async function getPendingNotifications(req, res) {
  try {
    // Extract JWT token from cookies or Authorization header
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('[Pending Notifications] No token found in request');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify and decode JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (jwtError) {
      console.error('[Pending Notifications] JWT verification failed:', jwtError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Only adopters can fetch pending notifications
    if (decoded.type !== 'adopter') {
      console.log(`[Pending Notifications] Access denied - user is ${decoded.type}, not adopter`);
      return res.status(403).json({ error: 'Only adopters can fetch pending notifications' });
    }

    const adopterId = decoded.sub;

    if (!adopterId) {
      console.log('[Pending Notifications] No adopterId in token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log(`[Pending Notifications] Fetching for adopter: ${adopterId}`);

    // Find all matches with pending notifications for this adopter
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

    console.log(`[Pending Notifications] Found ${matches.length} pending notifications`);

    // Format notification data for each match
    const notifications = matches.map(match => ({
      matchId: match._id.toString(),
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

    // Mark notifications as sent
    if (notifications.length > 0) {
      const matchIds = matches.map(m => m._id);
      await Match.updateMany(
        { _id: { $in: matchIds } },
        { 
          notificationPending: false,
          notificationSentAt: new Date()
        }
      );
      console.log(`[Pending Notifications] Marked ${notifications.length} notifications as sent`);
    }

    res.json(notifications);
  } catch (error) {
    console.error('Get pending notifications error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch pending notifications', details: error.message });
  }
}