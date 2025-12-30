import Match from '../models/match.js';
import Animal from '../models/animal.js';
import Adopter from '../models/adopter.js';
import { ensureMatchChannel } from '../store/wsStore.mjs';

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
    ).populate('animalId');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (status === 'adopté' && match.animalId) {
      await Animal.findByIdAndUpdate(match.animalId._id, {
        availability: false
      });
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