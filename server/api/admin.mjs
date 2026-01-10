import Adopter from '../models/adopter.js';
import Owner from '../models/owner.js';
import Animal from '../models/animal.js';
import Match from '../models/match.js';

/**
 * Récupère les statistiques du dashboard admin
 */
export async function getStats(req, res) {
  try {
    const animalStats = await Animal.aggregate([
      {
        $facet: {
          bySpecies: [
            {
              $group: {
                _id: "$species",
                count: { $sum: 1 },
                avgPrice: { $avg: "$price" }
              }
            },
            { $sort: { count: -1 } },
            {
              $project: {
                _id: 0,
                species: "$_id",
                count: 1,
                avgPrice: { $round: ["$avgPrice", 2] }
              }
            }
          ],
          
          bySize: [
            {
              $group: {
                _id: "$size",
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            {
              $project: {
                _id: 0,
                size: "$_id",
                count: 1
              }
            }
          ],

          availability: [
            {
              $group: {
                _id: "$availability",
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                available: "$_id",
                count: 1
              }
            }
          ],

          total: [
            {
              $count: "totalAnimals"
            }
          ]
        }
      }
    ]);

    // Aggregation pour les matches avec statistiques avancées
    const matchStats = await Match.aggregate([
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: { $ifNull: ["$status", "pending"] },
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                status: "$_id",
                count: 1
              }
            }
          ],

          // Total des matches
          total: [
            {
              $count: "totalMatches"
            }
          ]
        }
      }
    ]);

    const [totalAdopters, totalOwners] = await Promise.all([
      Adopter.countDocuments(),
      Owner.countDocuments()
    ]);

    const animalData = animalStats[0];
    const matchData = matchStats[0];
    
    const totalAnimals = animalData.total[0]?.totalAnimals || 0;
    const totalMatches = matchData.total[0]?.totalMatches || 0;

    res.json({
      global: {
        adopters: totalAdopters,
        owners: totalOwners,
        animals: totalAnimals,
        matches: totalMatches
      },
      details: {
        animals: {
          bySpecies: animalData.bySpecies,
          bySize: animalData.bySize,
          availability: animalData.availability
        },
        matches: {
          byStatus: matchData.byStatus
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
}