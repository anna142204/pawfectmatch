import Owner from '../models/owner.js';
import Animal from '../models/animal.js';

export async function getOwners(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      city,
      zip,
      phoneNumber,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Basic filters
    if (firstName) query.firstName = new RegExp(firstName, 'i');
    if (lastName) query.lastName = new RegExp(lastName, 'i');
    if (email) query.email = new RegExp(email, 'i');
    if (phoneNumber) query.phoneNumber = new RegExp(phoneNumber, 'i');

    // Address filters
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (zip) query['address.zip'] = zip;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Owner.countDocuments(query);

    const owners = await Owner.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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

    // Get owner's animals
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

    // Don't allow password update through this route
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

    // Check if owner has animals
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
