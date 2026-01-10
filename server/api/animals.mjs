import Animal from '../models/animal.js';
import Adopter from '../models/adopter.js';
import jwt from 'jsonwebtoken';
import { parseCookies } from '../utils/parseCookies.mjs';
import mongoose from 'mongoose';
import { getGeoJSON } from '../utils/geocoder.mjs';

const JWT_SECRET = process.env.JWT_SECRET;

// Helper to extract auth token from cookies or Authorization header
function extractAuthToken(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const header = req.headers.authorization || '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : header;
  return cookies?.auth_token || headerToken || null;
}

// Normalize list query params to arrays, supporting comma-separated values
function parseListParam(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.includes(',')) return val.split(',').map(s => s.trim()).filter(Boolean);
  return [val];
}

export async function getAnimals(req, res) {
  try {
    const {
      species, race, name, minAge, maxAge, sex, city, zip,
      minPrice, maxPrice, ownerId, availability,
      environment, dressage, personality,
      page = 1, limit = 20
    } = req.query;

    // Variables pour l'adoptant connecté
    let adopter = null;
    let adopterLocation = null;

    // Récupérer l'adoptant si connecté
    const authToken = extractAuthToken(req);
    if (authToken && JWT_SECRET) {
      try {
        const decoded = jwt.verify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
        const adopterId = decoded.sub;
        const userType = decoded.type;
        if (userType === 'adopter' && adopterId) {
          adopter = await Adopter.findById(adopterId);
          if (adopter?.location?.coordinates) {
            adopterLocation = adopter.location.coordinates;
          }
        }
      } catch (err) {
        // silently skip auth errors; route remains public
      }
    }

    const pipeline = [];

    const match = {};
    if (species) {
      match.species = new RegExp(species, 'i');
    } else if (adopter?.preferences?.species?.length) {
      match.species = { $in: adopter.preferences.species };
    }
    if (race) match.race = new RegExp(race, 'i');
    if (name) match.name = new RegExp(name, 'i');
    if (sex) match.sex = sex;
    if (ownerId) match.ownerId = new mongoose.Types.ObjectId(ownerId);
    if (availability !== undefined) match.availability = availability === 'true';

    if (minAge || maxAge) {
      match.age = {};
      if (minAge) match.age.$gte = parseInt(minAge);
      if (maxAge) match.age.$lte = parseInt(maxAge);
    }

    if (city) match['address.city'] = new RegExp(city, 'i');
    if (zip) match['address.zip'] = zip;

    if (minPrice || maxPrice) {
      match.price = {};
      if (minPrice) match.price.$gte = parseFloat(minPrice);
      if (maxPrice) match.price.$lte = parseFloat(maxPrice);
    }

    const envList = parseListParam(environment);
    const dressList = parseListParam(dressage);
    const persList = parseListParam(personality);
    if (envList) match['characteristics.environment'] = { $in: envList };
    if (dressList) match['characteristics.dressage'] = { $in: dressList };
    if (persList) match['characteristics.personality'] = { $in: persList };

    // Étape 1: $geoNear (DOIT être la première étape si utilisé)
    if (adopterLocation) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: adopterLocation
          },
          distanceField: 'distance',
          distanceMultiplier: 0.001, // Convertir mètres en km
          spherical: true,
          query: match, // Intégrer les filtres dans $geoNear
          key: 'location'
        }
      });

      // Si une distance max est définie dans les préférences, filtrer après calcul
      if (adopter?.preferences?.maxDistance) {
        pipeline.push({
          $match: {
            distance: { $lte: adopter.preferences.maxDistance }
          }
        });
      }
    } else {
      // Si pas de géolocalisation, utiliser $match normal
      if (Object.keys(match).length > 0) {
        pipeline.push({ $match: match });
      }
    }

    // Étape 2: Exclure les animaux déjà matchés par cet adopteur
    if (adopter) {
      pipeline.push({
        $lookup: {
          from: 'matches',
          let: { animalId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$animalId', '$$animalId'] },
                    { $eq: ['$adopterId', new mongoose.Types.ObjectId(adopter._id)] }
                  ]
                }
              }
            }
          ],
          as: 'existingMatches'
        }
      });

      pipeline.push({ $addFields: { matchedCount: { $size: '$existingMatches' } } });
      pipeline.push({ $match: { matchedCount: { $eq: 0 } } });
    }

    // Étape 3: Lookup owner (pour obtenir les infos du propriétaire)
    pipeline.push({
      $lookup: {
        from: 'owners',
        localField: 'ownerId',
        foreignField: '_id',
        as: 'ownerData'
      }
    });

    pipeline.push({
      $unwind: {
        path: '$ownerData',
        preserveNullAndEmptyArrays: true
      }
    });

    // Étape 3: Project pour structurer les données
    pipeline.push({
      $project: {
        _id: 1,
        species: 1,
        race: 1,
        name: 1,
        sex: 1,
        age: 1,
        size: 1,
        weight: 1,
        price: 1,
        availability: 1,
        characteristics: 1,
        address: 1,
        location: 1,
        images: 1,
        description: 1,
        createdAt: 1,
        distance: {
          $cond: {
            if: { $ne: ['$distance', null] },
            then: { $round: ['$distance', 0] },
            else: null
          }
        },
        ownerId: '$ownerData._id',
        owner: {
          _id: '$ownerData._id',
          firstName: '$ownerData.firstName',
          lastName: '$ownerData.lastName',
          email: '$ownerData.email',
          phoneNumber: '$ownerData.phoneNumber',
          address: '$ownerData.address',
          location: '$ownerData.location',
          societyName: '$ownerData.societyName',
          image: '$ownerData.image'
        }
      }
    });

    // Étape 5: Trier par score de compatibilité si connecté
    if (adopter && adopter.preferences) {
      pipeline.push({
        $addFields: {
          matchScore: {
            $add: [
              {
                $cond: [
                  { $in: ['$species', adopter.preferences.species || []] },
                  3,
                  0
                ]
              },
              {
                $cond: [
                  { $in: ['$size', adopter.preferences.sizePreference || []] },
                  2,
                  0
                ]
              },
              {
                $size: {
                  $filter: {
                    input: '$characteristics.environment',
                    as: 'env',
                    cond: { $in: ['$$env', adopter.preferences.environment || []] }
                  }
                }
              }
            ]
          }
        }
      });

      pipeline.push({
        $sort: {
          matchScore: -1,
          createdAt: -1,
          distance: 1
        }
      });
    } else {
      // Tri par date si pas connecté
      pipeline.push({
        $sort: {
          createdAt: -1,
          distance: 1
        }
      });
    }

    // Étape 6: Compter le total
    const totalPipeline = [...pipeline];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Animal.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Étape 7: Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // Exécuter l'agrégation
    const animals = await Animal.aggregate(pipeline);

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
      return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
    }

    // Géocoder l'adresse pour stocker la position
    let location = { type: 'Point', coordinates: [8.2275, 46.8182] }; // défaut Suisse si géocodage échoue
    if (address?.zip && address?.city) {
      try {
        const geoData = await getGeoJSON(address.zip, address.city);
        if (geoData) location = geoData;
      } catch (geoErr) {
        console.error('Erreur géocodage createAnimal:', geoErr.message);
      }
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
      location,
      images,
      price,
      ownerId,
      availability,
      description,
      characteristics
    });

    await animal.save();

    res.status(201).json({
      message: 'Animal créé avec succès',
      animal
    });
  } catch (error) {
    console.error('Create animal error:', error);
    res.status(500).json({ error: 'Échec de la création de l\'animal', details: error.message });
  }
}

export async function updateAnimal(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.sub;

    // Recalculer la géolocalisation si l'adresse change
    if (updates.address && (updates.address.zip || updates.address.city)) {
      try {
        const geoData = await getGeoJSON(updates.address.zip, updates.address.city);
        if (geoData) updates.location = geoData;
      } catch (geoErr) {
        console.error('Erreur géocodage updateAnimal:', geoErr.message);
      }
    }

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
