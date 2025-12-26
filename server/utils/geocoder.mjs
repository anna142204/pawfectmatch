
export async function getGeoJSON(zip, city) {
  try {
    // Construction de la requête pour la Suisse
    const query = `${zip} ${city} Switzerland`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const response = await fetch(url, { 
      headers: { 'User-Agent': 'PawfectMatch/1.0' } 
    });
    
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        type: 'Point',
        coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
      };
    }
  } catch (error) {
    console.error(`Erreur géocodage pour ${city}:`, error.message);
  }

  // Fallback : Centre de la Suisse si l'adresse est introuvable
  return {
    type: 'Point',
    coordinates: [8.2275, 46.8182]
  };
}