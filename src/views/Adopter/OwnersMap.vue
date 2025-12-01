<script setup>
import { ref, onMounted, nextTick } from 'vue';

const owners = ref([]);
const loading = ref(true);
const selectedOwner = ref(null);
const mapContainer = ref(null);
const map = ref(null);
const markers = ref(new Map());

// Coordonnées par défaut (Suisse centre)
const defaultCenter = [46.8182, 8.2275];
const defaultZoom = 8;

// Données de géolocalisation approximatives des villes suisses
const cityCoordinates = {
  'Zurich': [47.3769, 8.5472],
  'Berne': [46.9479, 7.4474],
  'Genève': [46.2017, 6.1432],
  'Lausanne': [46.5197, 6.6323],
  'Bâle': [47.5596, 7.5886],
  'Lucerne': [47.0502, 8.3093],
  'Saint-Gall': [47.4235, 9.3768],
  'Neuchâtel': [46.9916, 6.9271],
  'Fribourg': [46.8044, 7.1607],
  'Sion': [46.2355, 7.3591],
  'Montreux': [46.4268, 6.9101],
  'Yverdon': [46.6813, 6.6438],
  'Nyon': [46.3834, 6.2381],
  'Martigny': [46.4020, 7.7585],
  'Aarau': [47.3929, 8.0451],
};

onMounted(async () => {
  try {
    const response = await fetch('/api/owners');
    if (response.ok) {
      const data = await response.json();
      owners.value = data.owners || data;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des propriétaires:', error);
  } finally {
    loading.value = false;
    await nextTick();
    initMap();
  }
});

const initMap = () => {
  if (!mapContainer.value) return;

  // Charger Leaflet dynamiquement
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Initialiser la carte
    setTimeout(() => {
      const L = window.L;
      map.value = L.map(mapContainer.value).setView(defaultCenter, defaultZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.value);

      // Ajouter les marqueurs des propriétaires
      owners.value.forEach(owner => {
        const city = owner.address?.city || '';
        const coords = cityCoordinates[city];

        if (coords) {
          const marker = L.circleMarker(coords, {
            radius: 8,
            fillColor: '#4CAF50',
            color: '#2E7D32',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.7
          })
            .bindPopup(`<strong>${owner.firstName} ${owner.lastName}</strong><br>${city}`)
            .addTo(map.value)
            .on('click', () => selectOwner(owner));

          markers.value.set(owner._id, marker);
        }
      });

      // Adapter la vue à tous les marqueurs
      if (markers.value.size > 0) {
        const group = new L.FeatureGroup(Array.from(markers.value.values()));
        map.value.fitBounds(group.getBounds().pad(0.1));
      }
    }, 100);
  };
  document.body.appendChild(script);
};

const selectOwner = (owner) => {
  selectedOwner.value = selectedOwner.value?._id === owner._id ? null : owner;
  if (selectedOwner.value && map.value) {
    const marker = markers.value.get(owner._id);
    if (marker) {
      marker.openPopup();
    }
  }
};

const closeDetails = () => {
  selectedOwner.value = null;
};
</script>

<template>
  <div class="map-view">
    <div v-if="loading" class="loading">
      <p>Chargement de la carte...</p>
    </div>

    <div v-else class="map-container">
      <!-- Carte Leaflet -->
      <div ref="mapContainer" class="map-leaflet"></div>

      <!-- Owner Details Panel -->
      <transition name="slide-up">
        <div v-if="selectedOwner" class="owner-details">
          <div class="details-header">
            <h3>{{ selectedOwner.firstName }} {{ selectedOwner.lastName }}</h3>
            <button @click="closeDetails" class="close-btn">✕</button>
          </div>
          <div class="details-content">
            <p><strong>📍 Localisation:</strong> {{ selectedOwner.address?.city || 'Non spécifiée' }}</p>
            <p><strong>✉️ Email:</strong> {{ selectedOwner.email }}</p>
            <p><strong>🐾 Animaux:</strong> {{ selectedOwner.animals?.length || 0 }}</p>
            <router-link :to="`/adopter/profile-owner/${selectedOwner._id}`" class="profile-btn">
              Voir le profil complet
            </router-link>
          </div>
        </div>
      </transition>

      <!-- Legend -->
      <div class="map-legend">
        <div class="legend-item">
          <div class="legend-marker"></div>
          <span>Propriétaire</span>
        </div>
        <div class="legend-text">Total: {{ owners.length }} propriétaires</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading {
  text-align: center;
  padding: 32px 0;
  color: #999;
}

.map-container {
  position: relative;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E8E8E8;
}

.map-leaflet {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
}

:deep(.leaflet-container) {
  font-family: inherit;
}

:deep(.leaflet-popup-content) {
  font-size: 13px;
}

.owner-details {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FAFAFA;
  border-top: 1px solid #E8E8E8;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F5F5F5;
  border-bottom: 1px solid #E8E8E8;
}

.details-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1a1a1a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #1a1a1a;
}

.details-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.details-content p {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.profile-btn {
  display: inline-block;
  margin-top: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%);
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s ease;
}

.profile-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.map-legend {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 500;
  font-size: 13px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4CAF50;
  border: 2px solid #2E7D32;
}

.legend-text {
  color: #666;
  font-weight: 500;
}

@media (max-width: 480px) {
  .map-container {
    height: 300px;
  }

  .map-legend {
    bottom: 12px;
    right: 12px;
    padding: 10px;
    font-size: 12px;
  }

  .details-content {
    padding: 12px;
  }

  .profile-btn {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
