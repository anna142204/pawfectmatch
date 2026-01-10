import Adopter from '../models/adopter.js';
import Owner from '../models/owner.js';
import Animal from '../models/animal.js';
import Match from '../models/match.js';

export async function getStats(req, res) {
  try {
    const [
      totalAdopters,
      totalOwners,
      totalAnimals,
      totalMatches,
      animalsBySpecies,
      matchesByStatus
    ] = await Promise.all([
      Adopter.countDocuments(),
      Owner.countDocuments(),
      Animal.countDocuments(),
      Match.countDocuments(),

      Animal.aggregate([
        {
          $group: {
            _id: "$species",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      Match.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$status", "en attente"] },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      global: {
        adopters: totalAdopters,
        owners: totalOwners,
        animals: totalAnimals,
        matches: totalMatches
      },
      details: {
        animalsBySpecies: animalsBySpecies.map(stat => ({
          species: stat._id,
          count: stat.count
        })),
        matchesByStatus: matchesByStatus.map(stat => ({
          status: stat._id,
          count: stat.count
        }))
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
}