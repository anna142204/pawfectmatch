/**
 * Calcule la distance approximative entre deux codes postaux français et suisses
 * Utilise les coordonnées approximatives basées sur les départements/cantons
 */

// Coordonnées GPS approximatives des codes postaux suisses (par région)
const swissPostalCoordinates = {
  // Canton de Genève (1200-1299)
  '12': { lat: 46.2044, lon: 6.1432 },
  // Canton de Vaud (1000-1099, 1110-1199, 1300-1599, 1800-1899)
  '10': { lat: 46.5197, lon: 6.6323 },
  '11': { lat: 46.5197, lon: 6.6323 },
  '13': { lat: 46.5197, lon: 6.6323 },
  '14': { lat: 46.5197, lon: 6.6323 },
  '15': { lat: 46.5197, lon: 6.6323 },
  '18': { lat: 46.5197, lon: 6.6323 },
  // Canton de Fribourg (1600-1799)
  '16': { lat: 46.8067, lon: 7.1608 },
  '17': { lat: 46.8067, lon: 7.1608 },
  // Canton du Valais (1900-1999, 3900-3999)
  '19': { lat: 46.2317, lon: 7.3589 },
  '39': { lat: 46.2317, lon: 7.3589 },
  // Canton de Neuchâtel (2000-2099)
  '20': { lat: 46.9897, lon: 6.9294 },
  // Canton du Jura (2800-2899)
  '28': { lat: 47.3667, lon: 7.3333 },
  // Canton de Berne (3000-3899)
  '30': { lat: 46.9481, lon: 7.4474 },
  '31': { lat: 46.9481, lon: 7.4474 },
  '32': { lat: 46.9481, lon: 7.4474 },
  '33': { lat: 46.9481, lon: 7.4474 },
  '34': { lat: 46.9481, lon: 7.4474 },
  '35': { lat: 46.9481, lon: 7.4474 },
  '36': { lat: 46.9481, lon: 7.4474 },
  '37': { lat: 46.9481, lon: 7.4474 },
  '38': { lat: 46.9481, lon: 7.4474 },
  // Canton de Bâle (4000-4999)
  '40': { lat: 47.5596, lon: 7.5886 },
  '41': { lat: 47.5596, lon: 7.5886 },
  '42': { lat: 47.5596, lon: 7.5886 },
  '43': { lat: 47.5596, lon: 7.5886 },
  '44': { lat: 47.5596, lon: 7.5886 },
  '45': { lat: 47.5596, lon: 7.5886 },
  '46': { lat: 47.5596, lon: 7.5886 },
  '47': { lat: 47.5596, lon: 7.5886 },
  '48': { lat: 47.5596, lon: 7.5886 },
  '49': { lat: 47.5596, lon: 7.5886 },
  // Canton de Soleure (4500-4599, 2500-2599)
  '25': { lat: 47.2084, lon: 7.5386 },
  // Canton de Lucerne (6000-6099)
  '60': { lat: 47.0502, lon: 8.3093 },
  '61': { lat: 47.0502, lon: 8.3093 },
  // Canton de Zurich (8000-8999)
  '80': { lat: 47.3769, lon: 8.5417 },
  '81': { lat: 47.3769, lon: 8.5417 },
  '82': { lat: 47.3769, lon: 8.5417 },
  '83': { lat: 47.3769, lon: 8.5417 },
  '84': { lat: 47.3769, lon: 8.5417 },
  '85': { lat: 47.3769, lon: 8.5417 },
  '86': { lat: 47.3769, lon: 8.5417 },
  '87': { lat: 47.3769, lon: 8.5417 },
  '88': { lat: 47.3769, lon: 8.5417 },
  '89': { lat: 47.3769, lon: 8.5417 },
  // Canton d'Argovie (5000-5999)
  '50': { lat: 47.3931, lon: 8.0458 },
  '51': { lat: 47.3931, lon: 8.0458 },
  '52': { lat: 47.3931, lon: 8.0458 },
  '53': { lat: 47.3931, lon: 8.0458 },
  '54': { lat: 47.3931, lon: 8.0458 },
  '55': { lat: 47.3931, lon: 8.0458 },
  '56': { lat: 47.3931, lon: 8.0458 },
  '57': { lat: 47.3931, lon: 8.0458 },
  '58': { lat: 47.3931, lon: 8.0458 },
  '59': { lat: 47.3931, lon: 8.0458 },
  // Canton de Saint-Gall (9000-9099)
  '90': { lat: 47.4245, lon: 9.3767 },
  '91': { lat: 47.4245, lon: 9.3767 },
  '92': { lat: 47.4245, lon: 9.3767 },
  '93': { lat: 47.4245, lon: 9.3767 },
  '94': { lat: 47.4245, lon: 9.3767 },
  // Canton des Grisons (7000-7999)
  '70': { lat: 46.8499, lon: 9.5331 },
  '71': { lat: 46.8499, lon: 9.5331 },
  '72': { lat: 46.8499, lon: 9.5331 },
  '73': { lat: 46.8499, lon: 9.5331 },
  '74': { lat: 46.8499, lon: 9.5331 },
  '75': { lat: 46.8499, lon: 9.5331 },
  '76': { lat: 46.8499, lon: 9.5331 },
  '77': { lat: 46.8499, lon: 9.5331 },
  '78': { lat: 46.8499, lon: 9.5331 },
  '79': { lat: 46.8499, lon: 9.5331 },
  // Canton du Tessin (6500-6999)
  '65': { lat: 46.0037, lon: 8.9511 },
  '66': { lat: 46.0037, lon: 8.9511 },
  '67': { lat: 46.0037, lon: 8.9511 },
  '68': { lat: 46.0037, lon: 8.9511 },
  '69': { lat: 46.0037, lon: 8.9511 },
};

// Coordonnées GPS approximatives des départements français (centre)
const departmentCoordinates = {
  '01': { lat: 46.2, lon: 5.2 },   // Ain
  '02': { lat: 49.5, lon: 3.4 },   // Aisne
  '03': { lat: 46.3, lon: 3.1 },   // Allier
  '04': { lat: 44.1, lon: 6.2 },   // Alpes-de-Haute-Provence
  '05': { lat: 44.7, lon: 6.1 },   // Hautes-Alpes
  '06': { lat: 43.9, lon: 7.2 },   // Alpes-Maritimes
  '07': { lat: 44.7, lon: 4.4 },   // Ardèche
  '08': { lat: 49.7, lon: 4.7 },   // Ardennes
  '09': { lat: 43.0, lon: 1.5 },   // Ariège
  '10': { lat: 48.3, lon: 4.1 },   // Aube
  '11': { lat: 43.2, lon: 2.4 },   // Aude
  '12': { lat: 44.3, lon: 2.6 },   // Aveyron
  '13': { lat: 43.5, lon: 5.0 },   // Bouches-du-Rhône
  '14': { lat: 49.1, lon: -0.3 },  // Calvados
  '15': { lat: 45.0, lon: 2.7 },   // Cantal
  '16': { lat: 45.7, lon: 0.2 },   // Charente
  '17': { lat: 45.7, lon: -0.6 },  // Charente-Maritime
  '18': { lat: 47.1, lon: 2.4 },   // Cher
  '19': { lat: 45.3, lon: 1.8 },   // Corrèze
  '21': { lat: 47.3, lon: 4.8 },   // Côte-d'Or
  '22': { lat: 48.5, lon: -2.8 },  // Côtes-d'Armor
  '23': { lat: 46.2, lon: 2.0 },   // Creuse
  '24': { lat: 45.0, lon: 0.7 },   // Dordogne
  '25': { lat: 47.2, lon: 6.0 },   // Doubs
  '26': { lat: 44.7, lon: 5.0 },   // Drôme
  '27': { lat: 49.1, lon: 1.0 },   // Eure
  '28': { lat: 48.4, lon: 1.5 },   // Eure-et-Loir
  '29': { lat: 48.2, lon: -4.0 },  // Finistère
  '30': { lat: 44.0, lon: 4.1 },   // Gard
  '31': { lat: 43.4, lon: 1.3 },   // Haute-Garonne
  '32': { lat: 43.7, lon: 0.6 },   // Gers
  '33': { lat: 44.8, lon: -0.6 },  // Gironde
  '34': { lat: 43.6, lon: 3.5 },   // Hérault
  '35': { lat: 48.1, lon: -1.7 },  // Ille-et-Vilaine
  '36': { lat: 46.8, lon: 1.7 },   // Indre
  '37': { lat: 47.3, lon: 0.7 },   // Indre-et-Loire
  '38': { lat: 45.3, lon: 5.5 },   // Isère
  '39': { lat: 46.7, lon: 5.6 },   // Jura
  '40': { lat: 43.9, lon: -0.8 },  // Landes
  '41': { lat: 47.6, lon: 1.3 },   // Loir-et-Cher
  '42': { lat: 45.5, lon: 4.3 },   // Loire
  '43': { lat: 45.0, lon: 3.9 },   // Haute-Loire
  '44': { lat: 47.3, lon: -1.8 },  // Loire-Atlantique
  '45': { lat: 47.9, lon: 2.0 },   // Loiret
  '46': { lat: 44.6, lon: 1.5 },   // Lot
  '47': { lat: 44.3, lon: 0.5 },   // Lot-et-Garonne
  '48': { lat: 44.5, lon: 3.5 },   // Lozère
  '49': { lat: 47.4, lon: -0.6 },  // Maine-et-Loire
  '50': { lat: 49.1, lon: -1.3 },  // Manche
  '51': { lat: 49.0, lon: 4.0 },   // Marne
  '52': { lat: 48.1, lon: 5.1 },   // Haute-Marne
  '53': { lat: 48.1, lon: -0.7 },  // Mayenne
  '54': { lat: 48.7, lon: 6.2 },   // Meurthe-et-Moselle
  '55': { lat: 49.0, lon: 5.4 },   // Meuse
  '56': { lat: 47.7, lon: -2.8 },  // Morbihan
  '57': { lat: 49.1, lon: 6.6 },   // Moselle
  '58': { lat: 47.0, lon: 3.5 },   // Nièvre
  '59': { lat: 50.4, lon: 3.2 },   // Nord
  '60': { lat: 49.4, lon: 2.5 },   // Oise
  '61': { lat: 48.6, lon: 0.2 },   // Orne
  '62': { lat: 50.5, lon: 2.3 },   // Pas-de-Calais
  '63': { lat: 45.7, lon: 3.1 },   // Puy-de-Dôme
  '64': { lat: 43.3, lon: -0.6 },  // Pyrénées-Atlantiques
  '65': { lat: 43.1, lon: 0.1 },   // Hautes-Pyrénées
  '66': { lat: 42.6, lon: 2.5 },   // Pyrénées-Orientales
  '67': { lat: 48.6, lon: 7.5 },   // Bas-Rhin
  '68': { lat: 47.8, lon: 7.2 },   // Haut-Rhin
  '69': { lat: 45.8, lon: 4.6 },   // Rhône
  '70': { lat: 47.6, lon: 6.1 },   // Haute-Saône
  '71': { lat: 46.6, lon: 4.5 },   // Saône-et-Loire
  '72': { lat: 48.0, lon: 0.2 },   // Sarthe
  '73': { lat: 45.5, lon: 6.4 },   // Savoie
  '74': { lat: 46.0, lon: 6.4 },   // Haute-Savoie
  '75': { lat: 48.86, lon: 2.35 }, // Paris
  '76': { lat: 49.5, lon: 1.0 },   // Seine-Maritime
  '77': { lat: 48.6, lon: 2.9 },   // Seine-et-Marne
  '78': { lat: 48.8, lon: 1.9 },   // Yvelines
  '79': { lat: 46.5, lon: -0.4 },  // Deux-Sèvres
  '80': { lat: 49.9, lon: 2.3 },   // Somme
  '81': { lat: 43.8, lon: 2.1 },   // Tarn
  '82': { lat: 44.0, lon: 1.3 },   // Tarn-et-Garonne
  '83': { lat: 43.4, lon: 6.2 },   // Var
  '84': { lat: 44.0, lon: 5.1 },   // Vaucluse
  '85': { lat: 46.7, lon: -1.4 },  // Vendée
  '86': { lat: 46.6, lon: 0.3 },   // Vienne
  '87': { lat: 45.8, lon: 1.3 },   // Haute-Vienne
  '88': { lat: 48.2, lon: 6.4 },   // Vosges
  '89': { lat: 47.8, lon: 3.6 },   // Yonne
  '90': { lat: 47.6, lon: 6.9 },   // Territoire de Belfort
  '91': { lat: 48.6, lon: 2.3 },   // Essonne
  '92': { lat: 48.9, lon: 2.2 },   // Hauts-de-Seine
  '93': { lat: 48.9, lon: 2.5 },   // Seine-Saint-Denis
  '94': { lat: 48.8, lon: 2.5 },   // Val-de-Marne
  '95': { lat: 49.0, lon: 2.1 },   // Val-d'Oise
};

/**
 * Formule de Haversine pour calculer la distance entre deux points GPS
 * @param {number} lat1 - Latitude du premier point
 * @param {number} lon1 - Longitude du premier point
 * @param {number} lat2 - Latitude du second point
 * @param {number} lon2 - Longitude du second point
 * @returns {number} Distance en kilomètres
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Détermine si un code postal est suisse (format 4 chiffres)
 * @param {string} zipCode - Code postal
 * @returns {boolean}
 */
function isSwissZipCode(zipCode) {
  if (!zipCode || typeof zipCode !== 'string') {
    return false;
  }
  // Code postal suisse: 4 chiffres (1000-9999)
  return /^[1-9]\d{3}$/.test(zipCode.trim());
}

/**
 * Extrait le département d'un code postal français
 * @param {string} zipCode - Code postal
 * @returns {string} Département (2 premiers chiffres)
 */
function getDepartmentFromZip(zipCode) {
  if (!zipCode || typeof zipCode !== 'string') {
    return null;
  }
  
  // Pour la Corse
  if (zipCode.startsWith('20')) {
    return zipCode.substring(0, 3) === '200' || zipCode.substring(0, 3) === '201' ? '2A' : '2B';
  }
  
  // Pour les autres départements
  return zipCode.substring(0, 2);
}

/**
 * Extrait la région d'un code postal suisse (2 premiers chiffres)
 * @param {string} zipCode - Code postal suisse
 * @returns {string} Région (2 premiers chiffres)
 */
function getSwissRegionFromZip(zipCode) {
  if (!zipCode || typeof zipCode !== 'string') {
    return null;
  }
  return zipCode.substring(0, 2);
}

/**
 * Récupère les coordonnées d'un code postal
 * @param {string} zipCode - Code postal
 * @returns {Object|null} Coordonnées {lat, lon} ou null
 */
function getCoordinatesFromZip(zipCode) {
  if (!zipCode) {
    return null;
  }
  
  const cleanZip = zipCode.trim();
  
  // Vérifier si c'est un code postal suisse
  if (isSwissZipCode(cleanZip)) {
    const region = getSwissRegionFromZip(cleanZip);
    return swissPostalCoordinates[region] || null;
  }
  
  // Sinon, traiter comme un code postal français
  const dept = getDepartmentFromZip(cleanZip);
  return departmentCoordinates[dept] || null;
}

/**
 * Calcule la distance approximative entre deux codes postaux (FR ou CH)
 * @param {string} zip1 - Premier code postal
 * @param {string} zip2 - Second code postal
 * @returns {number|null} Distance en kilomètres (arrondie) ou null si impossible à calculer
 */
export function calculateDistance(zip1, zip2) {
  if (!zip1 || !zip2) {
    return null;
  }
  
  const coords1 = getCoordinatesFromZip(zip1);
  const coords2 = getCoordinatesFromZip(zip2);
  
  if (!coords1 || !coords2) {
    console.log(`Impossible de calculer la distance entre ${zip1} et ${zip2}`);
    return null;
  }
  
  const distance = haversineDistance(
    coords1.lat, coords1.lon,
    coords2.lat, coords2.lon
  );
  
  // Arrondir à l'entier le plus proche
  return Math.round(distance);
}
