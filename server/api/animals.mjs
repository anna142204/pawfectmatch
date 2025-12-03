import Animal from '../models/animal.js';

export async function getAnimals(req, res) {
  try {
    const {
      species,
      race,
      name,
      minAge,
      maxAge,
      sex,
      city,
      zip,
      minPrice,
      maxPrice,
      ownerId,
      availability,
      environment,
      dressage,
      personality,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Basic filters
    if (species) query.species = new RegExp(species, 'i');
    if (race) query.race = new RegExp(race, 'i');
    if (name) query.name = new RegExp(name, 'i');
    if (sex) query.sex = sex;
    if (ownerId) query.ownerId = ownerId;
    if (availability !== undefined) query.availability = availability === 'true';

    // Age range
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    // Address filters
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (zip) query['address.zip'] = zip;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Characteristics filters
    if (environment) {
      const envArray = Array.isArray(environment) ? environment : [environment];
      query['characteristics.environment'] = { $in: envArray };
    }

    if (dressage) {
      const dressageArray = Array.isArray(dressage) ? dressage : [dressage];
      query['characteristics.dressage'] = { $in: dressageArray };
    }

    if (personality) {
      const personalityArray = Array.isArray(personality) ? personality : [personality];
      query['characteristics.personality'] = { $in: personalityArray };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Animal.countDocuments(query);

    const animals = await Animal.find(query)
      .populate('ownerId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      animals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get animals error:', error);
    res.status(500).json({ error: 'Failed to fetch animals' });
  }
}

export async function getAnimalById(req, res) {
  try {
    const { id } = req.params;

    const animal = await Animal.findById(id)
      .populate('ownerId', 'firstName lastName email phoneNumber address');

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    res.json(animal);
  } catch (error) {
    console.error('Get animal by id error:', error);
    res.status(500).json({ error: 'Failed to fetch animal' });
  }
}

export async function createAnimal(req, res) {
  try {
    const {
      species,
      race,
      name,
      age,
      sex,
      size,
      weight,
      address,
      image,
      price,
      ownerId,
      availability,
      description,
      characteristics
    } = req.body;

    // Validate required fields
    if (!species || !name || age === undefined || !sex || !address || !image || price === undefined || !ownerId || !description || !characteristics) {
      console.log('Champs manquants:', {
        species: !species,
        name: !name,
        age: age === undefined,
        sex: !sex,
        address: !address,
        image: !image,
        price: price === undefined,
        ownerId: !ownerId,
        description: !description,
        characteristics: !characteristics
      });
      return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
    }

    const animal = new Animal({
      species,
      race,
      name,
      age,
      sex,
      size,
      weight,
      address,
      image,
      price,
      ownerId,
      availability,
      description,
      characteristics
    });

    await animal.save();

    console.log('Animal créé avec succès:', animal._id);

    res.status(201).json({
      message: 'Animal créé avec succès',
      animal
    });
  } catch (error) {
    console.error('Create animal error:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })));
    }
    res.status(500).json({ error: 'Échec de la création de l\'animal', details: error.message });
  }
}

export async function updateAnimal(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const animal = await Animal.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    res.json({
      message: 'Animal updated successfully',
      animal
    });
  } catch (error) {
    console.error('Update animal error:', error);
    res.status(500).json({ error: 'Failed to update animal' });
  }
}

export async function deleteAnimal(req, res) {
  try {
    const { id } = req.params;

    const animal = await Animal.findByIdAndDelete(id);

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    res.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({ error: 'Failed to delete animal' });
  }
}
