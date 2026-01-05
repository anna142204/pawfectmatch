import Adopter from '../models/adopter.js';

export async function getAdopters(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      city,
      zip,
      minAge,
      maxAge,
      species,
      environment,
      size,
      age,
      weight,
      sex,
      dressage,
      personality,
      maxPrice,
      maxDistance,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Basic filters
    if (firstName) query.firstName = new RegExp(firstName, 'i');
    if (lastName) query.lastName = new RegExp(lastName, 'i');
    if (email) query.email = new RegExp(email, 'i');

    // Address filters
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (zip) query['address.zip'] = zip;

    // Age range
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    // Preferences filters
    if (species) {
      const speciesArray = Array.isArray(species) ? species : [species];
      query['preferences.species'] = { $in: speciesArray };
    }

    if (environment) {
      const envArray = Array.isArray(environment) ? environment : [environment];
      query['preferences.environment'] = { $in: envArray };
    }

    if (size) {
      const sizeArray = Array.isArray(size) ? size : [size];
      query['preferences.size'] = { $in: sizeArray };
    }

    if (age) {
      const ageArray = Array.isArray(age) ? age : [age];
      query['preferences.age'] = { $in: ageArray };
    }

    if (weight) {
      const weightArray = Array.isArray(weight) ? weight : [weight];
      query['preferences.weight'] = { $in: weightArray };
    }

    if (sex) {
      const sexArray = Array.isArray(sex) ? sex : [sex];
      query['preferences.sex'] = { $in: sexArray };
    }

    if (dressage) {
      const dressageArray = Array.isArray(dressage) ? dressage : [dressage];
      query['preferences.dressage'] = { $in: dressageArray };
    }

    if (personality) {
      const personalityArray = Array.isArray(personality) ? personality : [personality];
      query['preferences.personality'] = { $in: personalityArray };
    }

    if (maxPrice) {
      query['preferences.maxPrice'] = { $gte: parseInt(maxPrice) };
    }

    if (maxDistance) {
      query['preferences.maxDistance'] = { $gte: parseInt(maxDistance) };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Adopter.countDocuments(query);

    const adopters = await Adopter.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      adopters,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get adopters error:', error);
    res.status(500).json({ error: 'Failed to fetch adopters' });
  }
}

export async function getAdopterById(req, res) {
  try {
    const { id } = req.params;

    const adopter = await Adopter.findById(id);

    if (!adopter) {
      return res.status(404).json({ error: 'Adopter not found' });
    }

    res.json(adopter);
  } catch (error) {
    console.error('Get adopter by id error:', error);
    res.status(500).json({ error: 'Failed to fetch adopter' });
  }
}

export async function updateAdopter(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow password update through this route
    delete updates.password;

    const adopter = await Adopter.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!adopter) {
      return res.status(404).json({ error: 'Adopter not found' });
    }

    res.json({
      message: 'Adopter updated successfully',
      adopter
    });
  } catch (error) {
    console.error('Update adopter error:', error);
    res.status(500).json({ error: 'Failed to update adopter' });
  }
}

export async function deleteAdopter(req, res) {
  try {
    const { id } = req.params;

    const adopter = await Adopter.findByIdAndDelete(id);

    if (!adopter) {
      return res.status(404).json({ error: 'Adopter not found' });
    }

    res.json({ message: 'Adopter deleted successfully' });
  } catch (error) {
    console.error('Delete adopter error:', error);
    res.status(500).json({ error: 'Failed to delete adopter' });
  }
}
