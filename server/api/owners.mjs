import Owner from '../models/owner.js';
import Animal from '../models/animal.js';

export async function getOwners(req, res) {
  try {
    const {
      search,
      type,   // 'society' ou 'private'
      page = 1, 
      limit = 20
    } = req.query;

    const filters = [];

    // Recherche Globale
    if (search) {
      const regex = new RegExp(search, 'i');
      filters.push({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { societyName: regex },
          { 'address.city': regex },
          { 'address.zip': regex }
        ]
      });
    }

    // Filtre par type
    if (type === 'society') {
      // Doit exister, ne pas être null, et ne pas être vide
      filters.push({
        societyName: { $exists: true, $nin: [null, ""] }
      });
    } else if (type === 'private') {
      // Soit n'existe pas, soit est null, soit est vide
      filters.push({
        $or: [
          { societyName: { $exists: false } },
          { societyName: null },
          { societyName: "" }
        ]
      });
    }

    const matchStage = filters.length > 0 ? { $and: filters } : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Agrégation avec pagination et comptage des animaux
    const owners = await Owner.aggregate([
      { $match: matchStage }, 
      
      { $sort: { createdAt: -1, _id: 1 } }, 

      { $skip: skip },
      { $limit: parseInt(limit) },
      
      // Jointure pour compter les animaux
      {
        $lookup: {
          from: 'animals',
          localField: '_id',
          foreignField: 'ownerId',
          as: 'animalsList'
        }
      },
      {
        $addFields: {
          animalCount: { $size: "$animalsList" }
        }
      },
      {
        $project: {
          password: 0,
          animalsList: 0,
          __v: 0
        }
      }
    ]);

    const total = await Owner.countDocuments(matchStage);

    res.json({
      owners,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get owners error:', error);
    res.status(500).json({ error: 'Failed to fetch owners' });
  }
}
export async function getOwnerById(req, res) {
  try {
    const { id } = req.params;

    const owner = await Owner.findById(id);

    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    const animals = await Animal.find({ ownerId: id });

    res.json({
      ...owner.toJSON(),
      animals
    });
  } catch (error) {
    console.error('Get owner by id error:', error);
    res.status(500).json({ error: 'Failed to fetch owner' });
  }
}

export async function updateOwner(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.password;

    const owner = await Owner.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    res.json({
      message: 'Owner updated successfully',
      owner
    });
  } catch (error) {
    console.error('Update owner error:', error);
    res.status(500).json({ error: 'Failed to update owner' });
  }
}

export async function deleteOwner(req, res) {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des animaux associés avant de supprimer
    const animalsCount = await Animal.countDocuments({ ownerId: id });
    if (animalsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete owner with associated animals',
        animalsCount 
      });
    }

    const owner = await Owner.findByIdAndDelete(id);

    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    res.json({ message: 'Owner deleted successfully' });
  } catch (error) {
    console.error('Delete owner error:', error);
    res.status(500).json({ error: 'Failed to delete owner' });
  }
}
