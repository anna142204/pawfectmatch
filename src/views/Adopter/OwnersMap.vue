<script setup>
import { ref, onMounted } from 'vue';

const owners = ref([]);
const loading = ref(true);
const selectedOwner = ref(null);

onMounted(async () => {
  try {
    const response = await fetch('/api/owners');
    if (response.ok) {
      owners.value = await response.json();
    }
  } catch (error) {
    console.error('Erreur lors du chargement des propriétaires:', error);
  } finally {
    loading.value = false;
  }
});

const selectOwner = (owner) => {
  selectedOwner.value = selectedOwner.value?._id === owner._id ? null : owner;
};
</script>

<template>
  <div class="map-view">
    <div v-if="loading" class="loading">
      <p>Chargement de la carte...</p>
    </div>

    <div v-else class="map-container">
      <!-- Map Placeholder -->
      <div class="map-placeholder">
        <div class="map-info-banner">
          📍 Carte interactive - {{ owners.length }} propriétaires disponibles
        </div>
        <div class="owners-grid">
          <div
            v-for="owner in owners"
            :key="owner._id"
            :class="['owner-marker', { active: selectedOwner?._id === owner._id }]"
            @click="selectOwner(owner)"
          >
            <div class="marker-icon">📍</div>
            <div class="marker-info">
              <span class="marker-name">{{ owner.firstName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Owner Details -->
      <div v-if="selectedOwner" class="owner-details">
        <div class="details-header">
          <h3>{{ selectedOwner.firstName }} {{ selectedOwner.lastName }}</h3>
          <button @click="selectedOwner = null" class="close-btn">✕</button>
        </div>
        <div class="details-content">
          <p><strong>📍 Localisation:</strong> {{ selectedOwner.city || 'Non spécifiée' }}</p>
          <p><strong>✉️ Email:</strong> {{ selectedOwner.email }}</p>
          <p><strong>🐾 Animaux:</strong> {{ selectedOwner.animals?.length || 0 }}</p>
          <router-link :to="`/adopter/profile-owner/${selectedOwner._id}`" class="profile-btn">
            Voir le profil complet
          </router-link>
        </div>
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.map-placeholder {
  background: linear-gradient(135deg, #E3F2FD 0%, #F1F8E9 100%);
  border-radius: 12px;
  padding: 16px;
  border: 2px dashed #90CAF9;
  min-height: 300px;
}

.map-info-banner {
  background: #4CAF50;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 16px;
}

.owners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.owner-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 2px solid #E0E0E0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.owner-marker:hover {
  transform: scale(1.05);
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.owner-marker.active {
  background: #E8F5E9;
  border-color: #4CAF50;
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.3);
}

.marker-icon {
  font-size: 24px;
}

.marker-name {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: #1a1a1a;
  word-break: break-word;
}

.owner-details {
  background: #FAFAFA;
  border-radius: 12px;
  border: 1px solid #E8E8E8;
  overflow: hidden;
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
</style>
