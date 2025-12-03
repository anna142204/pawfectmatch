import Adopter from '../models/adopter.js';
import Owner from '../models/owner.js';
import Animal from '../models/animal.js';
import Match from '../models/match.js';

export async function getStats(req, res) {
  try {
    const [totalAdopters, totalOwners, totalAnimals, totalMatches] = await Promise.all([
      Adopter.countDocuments(),
      Owner.countDocuments(),
      Animal.countDocuments(),
      Match.countDocuments()
    ]);

    res.json({
      totalAdopters,
      totalOwners,
      totalAnimals,
      totalMatches,
      pendingReports: 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
}
