import Match from '../models/match.js';
import Animal from '../models/animal.js';
import Adopter from '../models/adopter.js';

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

    // Filters
    if (adopterId) query.adopterId = adopterId;
    if (animalId) query.animalId = animalId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Match.countDocuments(query);

    const matches = await Match.find(query)
      .populate('adopterId', 'firstName lastName email')
      .populate({
        path: 'animalId',
        select: 'name species race age image',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber'
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
      .populate('adopterId', 'firstName lastName email address')
      .populate({
        path: 'animalId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber address'
        }
      })
      .populate('discussion.sender', 'firstName lastName');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Get match by id error:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
}

export async function createMatch(req, res) {
  try {
    const { adopterId, animalId } = req.body;

    // Validate required fields
    if (!adopterId || !animalId) {
      return res.status(400).json({ error: 'adopterId and animalId are required' });
    }

    // Check if adopter exists
    const adopter = await Adopter.findById(adopterId);
    if (!adopter) {
      return res.status(404).json({ error: 'Adopter not found' });
    }

    // Check if animal exists and is available
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }
    if (!animal.availability) {
      return res.status(400).json({ error: 'Animal is not available' });
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({ adopterId, animalId });
    if (existingMatch) {
      return res.status(409).json({ error: 'Match already exists' });
    }

    const match = new Match({
      adopterId,
      animalId,
      isActive: true,
      discussion: []
    });

    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('adopterId', 'firstName lastName email')
      .populate({
        path: 'animalId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber'
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
    const { isActive } = req.body;

    const match = await Match.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    )
      .populate('adopterId', 'firstName lastName email')
      .populate({
        path: 'animalId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber'
        }
      });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
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

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

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

    // Validate required fields
    if (!sender || !senderModel || !message) {
      return res.status(400).json({ error: 'sender, senderModel, and message are required' });
    }

    // Validate senderModel
    if (!['Adopter', 'Owner'].includes(senderModel)) {
      return res.status(400).json({ error: 'senderModel must be either "Adopter" or "Owner"' });
    }

    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (!match.isActive) {
      return res.status(400).json({ error: 'Cannot send message to inactive match' });
    }

    // Add message to discussion
    match.discussion.push({
      sender,
      senderModel,
      message,
      timestamp: new Date()
    });

    await match.save();

    const updatedMatch = await Match.findById(id)
      .populate('adopterId', 'firstName lastName email')
      .populate({
        path: 'animalId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phoneNumber'
        }
      })
      .populate('discussion.sender', 'firstName lastName');

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
      .populate('discussion.sender', 'firstName lastName');

    if (!match) {
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
