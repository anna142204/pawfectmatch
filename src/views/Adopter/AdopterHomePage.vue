<script setup>
import Menu from '@/components/Menu.vue';
import OwnersMap from './OwnersMap.vue';
import OwnersList from './OwnersList.vue';
import { ref, watch } from 'vue'; 
import { useRoute, useRouter } from 'vue-router';
import { Map, ClipboardList, ArrowRight } from 'lucide-vue-next';

import catHome from '@/images/cat-home.webp';
import dogHome from '@/images/dog-home.webp';
import rodentHome from '@/images/rodent-home.webp';

const route = useRoute();
const router = useRouter();

const showMapView = ref(route.query.view !== 'list');

const toggleView = (isMap) => {
  showMapView.value = isMap;
  router.replace({ 
    query: { ...route.query, view: isMap ? 'map' : 'list' } 
  });
};

watch(() => route.query.view, (newView) => {
  showMapView.value = newView !== 'list';
});
</script>

<template>
  <div class="home-page">
    <header class="home-header">
      <h1 class="text-h1 text-primary-700">Découvrir</h1>
    </header>

    <main class="home-content">
      
      <router-link to="/adopter/swipe?species=chat" class="card featured-card">
        <div class="card-bg" :style="{ backgroundImage: `url(${catHome})`}"></div>
        <div class="card-overlay-cat"></div>
        <div class="card-content">
          <div class="card-bottom">
            <div class="card-icon"><ArrowRight size="20"/></div>
            <h2>Chats</h2>
          </div>
        </div>
      </router-link>

      <div class="cards-grid">
        <router-link to="/adopter/swipe?species=chien" class="card category-card">
          <div class="card-bg" :style="{ backgroundImage: `url(${dogHome})` }"></div>
          <div class="card-overlay-dog"></div>
          <div class="card-content">
            <h3>Chiens</h3>
          </div>
        </router-link>

        <router-link to="/adopter/swipe?species=rongeur" class="card category-card">
          <div class="card-bg" :style="{ backgroundImage: `url(${rodentHome})` }"></div>
          <div class="card-overlay-rodent"></div>
          <div class="card-content">
            <h3>Rongeurs</h3>
          </div>
        </router-link>
      </div>

      <section class="map-section">
        <div class="map-header">
          <h3 class="map-title">Propriétaires près de vous</h3>
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
  padding: 24px 24px 120px 24px;
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--color-neutral-100);
  min-height: 100vh;
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