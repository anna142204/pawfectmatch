<script setup>
import Menu from '@/components/Menu.vue';
import OwnersMap from './AdopterOwnersMap.vue';
import OwnersList from './AdopterOwnersList.vue';
import { ref, watch, onMounted } from 'vue'; 
import { useRoute, useRouter } from 'vue-router';
import { Map, ClipboardList, ArrowRight, Heart } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const showMapView = ref(route.query.view !== 'list');
const recentMatches = ref([]);
const loading = ref(true);
const userId = localStorage.getItem('user_id');

const toggleView = (isMap) => {
  showMapView.value = isMap;
  router.replace({ 
    query: { ...route.query, view: isMap ? 'map' : 'list' } 
  });
};

watch(() => route.query.view, (newView) => {
  showMapView.value = newView !== 'list';
});

const fetchRecentMatches = async () => {
  if (!userId) return;
  try {
    const res = await fetch(`/api/matches?adopterId=${userId}&limit=50`, { 
      credentials: 'include' 
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Tous les matchs:', data.matches);
      recentMatches.value = (data.matches || [])
        .filter(m => m.status === 'validé' || m.status === 'adopté')
        .slice(0, 3);
      console.log('Matchs filtrés:', recentMatches.value);
    }
  } catch (err) {
    console.error('Erreur chargement matchs:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRecentMatches();
});
</script>

<template>
  <div class="home-page">
    <header class="home-header">
      <h1 class="text-h1">Découvrir</h1>
    </header>

    <main class="home-content">
      
      <section class="matches-section">
        <h4 class="text-h4">Mes derniers matchs</h4>
        <div v-if="loading" class="loading-text">Chargement...</div>
        <div v-else-if="recentMatches.length === 0" class="no-matches">
          <div class="no-matches-card">
            <Heart :size="48" class="heart-icon" />
            <p class="no-matches-text">Aucun match pour le moment</p>
            <router-link to="/adopter/swipe" class="swipe-link">
              Commencer à swiper <ArrowRight :size="18" />
            </router-link>
          </div>
        </div>
        <div v-else class="matches-grid">
          <router-link 
            v-for="match in recentMatches" 
            :key="match._id"
            :to="`/adopter/animal/${match.animalId._id}`"
            class="match-card"
          >
            <div class="match-image">
              <img v-if="match.animalId.images?.[0]" :src="match.animalId.images[0]" :alt="match.animalId.name" />
              <div v-else class="match-placeholder">Pas d'image</div>
              <div class="match-overlay"></div>
            </div>
            <div class="match-info">
              <h4 class="match-name">{{ match.animalId.name }}</h4>
              <p class="match-species">{{ match.animalId.species }}</p>
            </div>
          </router-link>
        </div>
      </section>


      <section class="map-section">
        <div class="map-header">
          <h4 class="text-h4">Propriétaires près de vous</h4>
          <div class="toggle-container">
            <button
              :class="['toggle-btn', { active: showMapView }]"
              @click="toggleView(true)"
              title="Voir la carte"
            >
              <Map size="18" />
            </button>
            <button
              :class="['toggle-btn', { active: !showMapView }]"
              @click="toggleView(false)"
              title="Voir la liste"
            >
              <ClipboardList size="18" />
            </button>
          </div>
        </div>

        <OwnersMap v-if="showMapView" />
        <OwnersList v-else />
      </section>
    </main>
    <Menu />
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  padding: 0px 24px 120px 24px;
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}
.home-header {
  padding-top: max(16px, env(safe-area-inset-top)); 
  padding-bottom: 16px;
}
.subtitle {
  color: var(--color-neutral-500);
  font-size: 16px;
  margin: 4px 0 0 0;
}

.home-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.matches-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-neutral-800);
}

.loading-text {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-neutral-500);
  font-size: 15px;
}

.no-matches {
  display: flex;
  justify-content: center;
}

.no-matches-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 30px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 300px;
}

.heart-icon {
  color: var(--color-primary-300);
}

.no-matches-text {
  margin: 0;
  color: var(--color-neutral-600);
  font-size: 15px;
  text-align: center;
}

.swipe-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: var(--color-primary-600);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  margin-top: 8px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.swipe-link:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.match-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  padding: 5px 5px 12px 5px;
  border-radius: 16px;
  overflow: visible;
}

.match-card:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.match-image {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-neutral-200);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.match-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.match-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.2));
  pointer-events: none;
}

.match-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--color-neutral-400);
  background: linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100));
}

.match-info {
  padding: 12px 0 0 0;
  text-align: center;
  width: 100%;
}

.match-name {
  margin: 0 0 3px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-neutral-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-species {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-neutral-500);
  text-transform: capitalize;
}

.card {
  position: relative;
  display: block;
  border-radius: 24px;
  overflow: hidden;
  text-decoration: none;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  transform: translateZ(0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:active {
  transform: scale(0.98);
}

.card-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 2;
}

.card:hover .card-bg {
  transform: scale(1.08);
}


.card-overlay-cat {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--color-secondary-600), rgba(0,0,0,0) 80%);
  z-index: 1;
}
.card-overlay-dog {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--color-primary-700), rgba(0,0,0,0) 80%);
  z-index: 1;
}
.card-overlay-rodent {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--color-secondary-400), rgba(0,0,0,0) 80%);
  z-index: 1;
}

.card-content {
  position: relative;
  z-index: 2;
  height: 75%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  color: white;
}

.featured-card {
  height: 170px;
}

.card-label {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-bottom {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  align-content: space-around;
  gap: 20px;
}

.featured-card h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.card-icon {
  background: white;
  color: var(--color-primary-600);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.category-card {
  height: 130px;
}

.category-card h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-neutral-800);
}

.toggle-container {
  display: flex;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-neutral-500);
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: rgba(0,0,0,0.05);
}

.toggle-btn.active {
  background: white;
  color: var(--color-primary-600);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
</style>