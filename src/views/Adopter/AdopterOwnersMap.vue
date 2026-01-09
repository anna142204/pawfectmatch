<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { X, User } from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { getAuthFetchOptions, requireAuth } = useAuth();
const owners = ref([]);
const loading = ref(true);
const selectedOwner = ref(null);
const mapContainer = ref(null);
const map = ref(null);
const markers = ref(new Map());

// Coordonnées par défaut (Vaud)
const defaultCenter = [46.5197, 6.6323];
const defaultZoom = 8;

onMounted(async () => {
  if (!requireAuth()) {
    loading.value = false;
    return;
  }
  try {
    const response = await fetch('/api/owners', getAuthFetchOptions());
    if (response.ok) {
      const data = await response.json();
      owners.value = data.owners || data;
    }
  } catch (error) {
    console.error('Erreur chargement map:', error);
  } finally {
    loading.value = false;
    await nextTick();
    initMap();
  }
});

const initMap = () => {
  if (!mapContainer.value) return;

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  
  script.onload = () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    setTimeout(() => {
      const L = window.L;
      if (!L) return;

      // Création de la carte
      map.value = L.map(mapContainer.value, {
        zoomControl: false 
      }).setView(defaultCenter, defaultZoom);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
      }).addTo(map.value);

      owners.value.forEach(owner => {
        // On vérifie si le propriétaire a bien des coordonnées GeoJSON valides
        if (owner.location && 
            owner.location.coordinates && 
            Array.isArray(owner.location.coordinates) &&
            owner.location.coordinates.length === 2) {
          
          // GeoJSON stocke [Longitude, Latitude]
          // Leaflet attend [Latitude, Longitude]
          const [lon, lat] = owner.location.coordinates;

          // Petit décalage aléatoire
          const jitterLat = lat + (Math.random() - 0.5) * 0.005;
          const jitterLon = lon + (Math.random() - 0.5) * 0.005;

          const marker = L.circleMarker([jitterLat, jitterLon], {
            radius: 8,
            fillColor: 'var(--color-primary-700)',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          })
          .addTo(map.value)
          .on('click', () => selectOwner(owner));

          markers.value.set(owner._id, marker);
        }
      });
    }, 100);
  };
  document.body.appendChild(script);
};

const selectOwner = (owner) => {
  selectedOwner.value = owner;
};

const closeDetails = () => {
  selectedOwner.value = null;
};

const goToProfile = () => {
  if (selectedOwner.value) {
    router.push(`/adopter/owner/${selectedOwner.value._id}`);
  }
};

const getDisplayName = (owner) => {
  return owner.societyName || `${owner.firstName} ${owner.lastName}`;
};
</script>

<template>
  <div class="map-wrapper">
    <div v-if="loading" class="loading-state">
      Chargement de la carte...
    </div>

    <div v-else class="map-frame">
      <div ref="mapContainer" class="map-render"></div>

      <Transition name="slide-up">
        <div v-if="selectedOwner" class="owner-popup" @click="goToProfile">
          
          <button @click.stop="closeDetails" class="close-btn">
            <X size="20" />
          </button>

          <div class="popup-content">
            <div class="avatar-box">
              <img 
                v-if="selectedOwner.image" 
                :src="selectedOwner.image" 
                class="popup-avatar"
              />
              <div v-else class="popup-avatar placeholder">
                <User size="20" />
              </div>
            </div>

            <div class="info-box">
              <h4 class="popup-name">{{ getDisplayName(selectedOwner) }}</h4>
              <p class="popup-location">{{ selectedOwner.address?.city || 'Suisse' }}</p>
              <div class="popup-badges" v-if="selectedOwner.animals?.length">
                <span class="badge">{{ selectedOwner.animals.length }} animaux</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 350px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  background: #f3f4f6;
  position: relative;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 14px;
}

.map-frame {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-render {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.owner-popup {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 1000;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
}

.popup-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-box {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.popup-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.popup-avatar.placeholder {
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.info-box {
  flex: 1;
}

.popup-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.popup-location {
  margin: 2px 0 4px 0;
  font-size: 13px;
  color: #6b7280;
}

.badge {
  font-size: 11px;
  background-color: #ecfdf5;
  color: #059669;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>