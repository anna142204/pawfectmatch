<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Menu from '@/components/Menu.vue';

const route = useRoute();
const router = useRouter();
const owner = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const ownerId = route.params.id;
    const response = await fetch(`/api/owners/${ownerId}`);
    
    if (!response.ok) {
      throw new Error('Propriétaire non trouvé');
    }
    
    owner.value = await response.json();
  } catch (err) {
    error.value = err.message;
    console.error('Erreur:', err);
  } finally {
    loading.value = false;
  }
});

const adoptedCount = computed(() => owner.value?.animals?.filter(a => a.status === 'adopted').length || 0);
const availableCount = computed(() => owner.value?.animals?.filter(a => a.status !== 'adopted').length || owner.value?.animals?.length || 0);

const animalTypeIcon = (type) => {
  const icons = {
    'chat': '🐱',
    'chien': '🐕',
    'rongeur': '🐭',
    'lapin': '🐰'
  };
  return icons[type?.toLowerCase()] || '🐾';
};

const getAnimalStatus = (animal) => {
  if (animal.status === 'adopted') return 'adopté';
  if (animal.status === 'available') return 'disponible';
  return 'indisponible';
};
</script>

<template>
  <div class="profile-container">
    <div v-if="loading" class="loading">
      <p>Chargement du profil...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
      <button @click="router.back()" class="back-btn">← Retour</button>
    </div>

    <div v-else-if="owner" class="profile">
      <!-- Back button -->
      <button @click="router.back()" class="back-button">←</button>

      <!-- Hero Image/Banner -->
      <div class="hero-section">
        <div class="hero-illustration">🏠</div>
      </div>

      <!-- Content wrapped in white background -->
      <div class="content-wrapper">
        <!-- Title and Location -->
        <div class="header-info">
          <h1 class="org-title">{{ owner.societyName || `${owner.firstName} ${owner.lastName}` }}</h1>
          <p class="location-badge">📍 {{ owner.address?.city }}</p>
        </div>

        <!-- Description -->
        <p class="description-text">
          {{ owner.description || 'Un propriétaire passionné par les animaux, prêt à trouver des familles aimantes pour ses compagnons.' }}
        </p>

        <!-- Animal type badges -->
        <div class="animal-types-row">
          <span v-if="owner.animals?.some(a => a.type?.toLowerCase() === 'chat')" class="type-badge">🐱 chat</span>
          <span v-if="owner.animals?.some(a => a.type?.toLowerCase() === 'chien')" class="type-badge">🐕 chien</span>
          <span v-if="owner.animals?.some(a => a.type?.toLowerCase() === 'rongeur')" class="type-badge">🐭 rongeur</span>
        </div>

        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-item">
            <p class="stat-label">Animaux adoptés</p>
            <p class="stat-number">{{ adoptedCount }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Animaux disponibles</p>
            <p class="stat-number">{{ availableCount }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Note</p>
            <p class="stat-number star">⭐ 5,5/6</p>
          </div>
        </div>

        <!-- Animals Section -->
        <section class="animals-section" v-if="owner.animals && owner.animals.length > 0">
          <h2 class="section-title">Animaux</h2>
          <div class="animals-grid">
            <div v-for="animal in owner.animals" :key="animal._id" class="animal-card">
              <div class="animal-photo">🖼️</div>
              <h3 class="animal-name">{{ animal.name }}</h3>
              <div class="animal-badges">
                <span class="badge badge-type">{{ animalTypeIcon(animal.type) }} {{ animal.type }}</span>
                <span class="badge" :class="`badge-${getAnimalStatus(animal)}`">{{ getAnimalStatus(animal) }}</span>
              </div>
            </div>
          </div>
        </section>

        <div v-else class="no-animals">
          <p>Pas d'animaux disponibles pour le moment.</p>
        </div>

        <!-- Testimonials Section -->
        <section class="testimonials-section" v-if="owner.testimonials && owner.testimonials.length > 0">
          <h2 class="section-title">Témoignages</h2>
          <div class="testimonials-grid">
            <div v-for="(testimonial, idx) in owner.testimonials" :key="idx" class="testimonial-card">
              <div class="testimonial-avatars">
                <div class="avatar">👤</div>
                <div class="avatar">🐾</div>
              </div>
              <div class="testimonial-content">
                <h3 class="testimonial-title">{{ testimonial.adopter }} & {{ testimonial.animal }}</h3>
                <p class="testimonial-text">"{{ testimonial.text }}"</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <Menu />
  </div>
</template>

<style scoped>
.profile-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 80px;
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  flex: 1;
}

.error {
  color: #d32f2f;
  gap: 16px;
}

.back-btn {
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.profile {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Back button */
.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Hero Section - Illustration avec ciel et nuages */
.hero-section {
  position: relative;
  width: 100%;
  height: 240px;
  background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-section::before,
.hero-section::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.9;
}

.hero-section::before {
  width: 60px;
  height: 40px;
  top: 30px;
  left: 10%;
}

.hero-section::after {
  width: 80px;
  height: 50px;
  top: 40px;
  right: 5%;
}

.hero-illustration {
  font-size: 120px;
  text-align: center;
  position: relative;
  z-index: 2;
}

/* Content wrapper - white background */
.content-wrapper {
  flex: 1;
  background: white;
  padding: 32px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header Info */
.header-info {
  text-align: center;
  margin-bottom: 8px;
}

.org-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.location-badge {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* Description */
.description-text {
  margin: 0;
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  text-align: center;
}

/* Animal types row */
.animal-types-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #FFF5E1;
  color: #B8860B;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #E8E8E8;
  border-bottom: 1px solid #E8E8E8;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.stat-number {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-number.star {
  font-size: 24px;
}

/* Section Title */
.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Animals Section */
.animals-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.animals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.animal-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E8E8E8;
  transition: all 0.2s ease;
}

.animal-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.animal-photo {
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
}

.animal-name {
  margin: 0;
  padding: 12px 8px 0;
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
}

.animal-badges {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  display: inline-block;
}

.badge-type {
  background: #FFF5E1;
  color: #B8860B;
}

.badge-disponible {
  background: #C8E6C9;
  color: #2E7D32;
}

.badge-adopté {
  background: #BBDEFB;
  color: #1565C0;
}

.badge-indisponible {
  background: #F5F5F5;
  color: #666;
}

.no-animals {
  text-align: center;
  padding: 32px;
  background: #FAFAFA;
  border-radius: 12px;
  border: 1px dashed #D0D0D0;
  color: #999;
}

/* Testimonials Section */
.testimonials-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #F3E9F8;
  padding: 24px;
  border-radius: 16px;
  margin-top: 8px;
}

.testimonials-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.testimonial-card {
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.7);
  padding: 16px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.testimonial-avatars {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.testimonial-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.testimonial-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

.testimonial-text {
  margin: 0;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  font-style: italic;
}

/* Responsive */
@media (max-width: 600px) {
  .content-wrapper {
    padding: 24px 16px 16px;
  }

  .org-title {
    font-size: 24px;
  }

  .hero-section {
    height: 200px;
  }

  .hero-illustration {
    font-size: 100px;
  }

  .stats-row {
    gap: 12px;
  }

  .stat-number {
    font-size: 24px;
  }

  .animals-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
  .animals-grid {
    grid-template-columns: 1fr;
  }
}
</style>
