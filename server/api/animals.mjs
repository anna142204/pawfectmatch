import Animal from '../models/animal.js';
import Adopter from '../models/adopter.js';
import jwt from 'jsonwebtoken';
import { parseCookies } from '../utils/parseCookies.mjs';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Calcule la distance en km entre deux points GeoJSON [lon, lat]
 * Formule de Haversine
 */
function calculateGeoDistance(coords1, coords2) {
  if (!coords1 || !coords2) return null;
  
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance en km
  
  return Math.round(distance); // Arrondi au km près
}

/**
 * Calcule un score de compatibilité
 */
function calculateMatchScore(animal, preferences) {
  let score = 0;
  if (!preferences) return 0;

  if (preferences.species?.includes(animal.species)) score += 3;
  if (preferences.sizePreference?.includes(animal.size)) score += 2;
  
  if (preferences.environment && animal.characteristics?.environment) {
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
      species, race, name, minAge, maxAge, sex, city, zip,
      minPrice, maxPrice, ownerId, availability,
      environment, dressage, personality,
      page = 1, limit = 20
    } = req.query;

    const query = {};
    if (species) query.species = new RegExp(species, 'i');
    if (race) query.race = new RegExp(race, 'i');
    if (name) query.name = new RegExp(name, 'i');
    if (sex) query.sex = sex;
    if (ownerId) query.ownerId = ownerId;
    if (availability !== undefined) query.availability = availability === 'true';

    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    if (city) query['address.city'] = new RegExp(city, 'i');
    if (zip) query['address.zip'] = zip;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (environment) query['characteristics.environment'] = { $in: Array.isArray(environment) ? environment : [environment] };
    if (dressage) query['characteristics.dressage'] = { $in: Array.isArray(dressage) ? dressage : [dressage] };
    if (personality) query['characteristics.personality'] = { $in: Array.isArray(personality) ? personality : [personality] };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Animal.countDocuments(query);

    // Récupérer tous les animaux (avec location du owner)
    let animals = await Animal.find(query)
      .populate('ownerId', 'firstName lastName email phoneNumber address location societyName image');

    // Variables pour l'adoptant connecté
    let adopter = null;
    let adopterLocation = null;

    // Trier par préférences de l'adoptant si connecté
    try {
      const cookies = parseCookies(req.headers.cookie);
      const authToken = cookies?.auth_token;
      
      if (authToken) {
        const decoded = jwt.verify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
        
        const adopterId = decoded.sub; 
        const userType = decoded.type; 

        // Récupérer l'adoptant si connecté
        if (userType === 'adopter' && adopterId) {
          adopter = await Adopter.findById(adopterId);
          
          if (adopter) {
             console.log(`Adoptant trouvé: ${adopter.firstName}`);
             // On récupère les coordonnées GPS de l'adoptant (GeoJSON)
             if (adopter.location && adopter.location.coordinates) {
                adopterLocation = adopter.location.coordinates;
             }
          }
          
          if (adopter && adopter.preferences) {
            // Calculer le score pour chaque animal
            const animalsWithScore = animals.map(animal => ({
              animal,
              score: calculateMatchScore(animal, adopter.preferences)
            }));
            
            // Trier par score décroissant
            animalsWithScore.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return new Date(b.animal.createdAt) - new Date(a.animal.createdAt);
            });
            
            animals = animalsWithScore.map(item => item.animal);
          }
        }
      }
    } catch (err) {
      console.log('Utilisateur non connecté ou token invalide');
      animals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Calculer la distance pour chaque animal
    const animalsWithDistance = animals.map(animal => {
      const animalObj = animal.toObject();
      
      // On vérifie si on a les coordonnées des deux côtés
      if (adopterLocation && animal.ownerId?.location?.coordinates) {
        const ownerLocation = animal.ownerId.location.coordinates;
        
        // Calcul via les coordonnées GPS
        const distance = calculateGeoDistance(adopterLocation, ownerLocation);
        animalObj.distance = distance;
      } else {
        animalObj.distance = null;
      }
      
      return animalObj;
    });

    // Appliquer la pagination après le tri
    const paginatedAnimals = animalsWithDistance.slice(skip, skip + parseInt(limit));

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
      .populate('ownerId', 'firstName lastName email phoneNumber address societyName image');

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
      images,
      price,
      ownerId,
      availability,
      description,
      characteristics
    } = req.body;

    // Validate required fields
    if (!species || !name || age === undefined || !sex || !address || !images || images.length === 0 || price === undefined || !ownerId || !description || !characteristics) {
      console.log('Champs manquants:', {
        species: !species,
        name: !name,
        age: age === undefined,
        sex: !sex,
        address: !address,
        images: !images,
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
      images,
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
    const userId = req.user.sub;

    const animal = await Animal.findOneAndUpdate(
      { _id: id, ownerId: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!animal) {
      return res.status(404).json({ error: 'Animal introuvable ou accès non autorisé' });
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
    const userId = req.user.sub;

    const animal = await Animal.findOneAndDelete({ _id: id, ownerId: userId });

    if (!animal) {
      return res.status(404).json({ error: 'Animal introuvable ou accès non autorisé' });
    }

    res.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({ error: 'Failed to delete animal' });
  }
}
