import Animal from '../models/animal.js';
import Adopter from '../models/adopter.js';
import jwt from 'jsonwebtoken';
import { parseCookies } from '../utils/parseCookies.mjs';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Calcule un score de compatibilité entre un animal et les préférences d'un adoptant
 * @param {Object} animal - L'animal à évaluer
 * @param {Object} preferences - Les préférences de l'adoptant
 * @returns {number} - Score de compatibilité (plus élevé = meilleur match)
 */
function calculateMatchScore(animal, preferences) {
  let score = 0;

  if (!preferences) return 0;

  // Score pour l'espèce (poids: 3 points par match)
  if (preferences.species && preferences.species.length > 0) {
    if (preferences.species.includes(animal.species)) {
      score += 3;
    }
  }

  // Score pour la taille (poids: 2 points par match)
  if (preferences.sizePreference && preferences.sizePreference.length > 0) {
    if (animal.size && preferences.sizePreference.includes(animal.size)) {
      score += 2;
    }
  }

  // Score pour l'environnement (poids: 1 point par caractéristique commune)
  if (preferences.environment && preferences.environment.length > 0 && animal.characteristics?.environment) {
    const commonEnv = preferences.environment.filter(env => 
      animal.characteristics.environment.includes(env)
    );
    score += commonEnv.length;
  }

  return score;
}

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

    // Récupérer tous les animaux sans pagination pour le scoring
    let animals = await Animal.find(query)
      .populate('ownerId', 'firstName lastName email phoneNumber');

    // Trier par préférences de l'adoptant si connecté
    try {
      const cookies = parseCookies(req.headers.cookie);
      const authToken = cookies?.auth_token;
      
      if (authToken) {
        const decoded = jwt.verify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
        const adopterId = decoded.userId;
        const userType = decoded.userType;
        
        // Appliquer le scoring uniquement pour les adoptants
        if (userType === 'adopter' && adopterId) {
          const adopter = await Adopter.findById(adopterId);
          
          if (adopter && adopter.preferences) {
            // Calculer le score pour chaque animal
            const animalsWithScore = animals.map(animal => ({
              animal,
              score: calculateMatchScore(animal, adopter.preferences)
            }));
            
            // Trier par score décroissant, puis par date de création
            animalsWithScore.sort((a, b) => {
              if (b.score !== a.score) {
                return b.score - a.score;
              }
              return new Date(b.animal.createdAt) - new Date(a.animal.createdAt);
            });
            
            // Extraire les animaux triés
            animals = animalsWithScore.map(item => item.animal);
          }
        }
      }
    } catch (err) {
      // En cas d'erreur de token, on continue avec le tri par défaut
      console.log('Tri par défaut (pas de token valide)');
      animals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Appliquer la pagination après le tri
    const paginatedAnimals = animals.slice(skip, skip + parseInt(limit));

    res.json({
      animals: paginatedAnimals,
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
