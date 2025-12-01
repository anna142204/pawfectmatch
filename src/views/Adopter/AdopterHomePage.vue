<script setup>
import Menu from '@/components/Menu.vue';
import OwnersMap from './OwnersMap.vue';
import OwnersList from './OwnersList.vue';
import { ref } from 'vue';

const showMapView = ref(true);
</script>

<template>
  <div class="home-page">
    <!-- Header -->
    <header class="home-header">
      <h1 class="text-h2 text-primary-700">Home</h1>
    </header>

    <!-- Main Content -->
    <main class="home-content">
      <!-- Featured Section - Chats -->
      <router-link to="/adopter/swipe" class="featured-card cats-card">
        <div class="card-content">
          <h2 class="text-h5 text-neutral-white">Chats</h2>
        </div>
        <div class="card-image">
          <span class="emoji">🐱</span>
        </div>
      </router-link>

      <!-- Grid Section - Chiens & Rongeurs -->
      <div class="cards-grid">
        <router-link to="/adopter/swipe" class="category-card dogs-card">
          <div class="card-content">
            <h2 class="text-h5 text-neutral-white">Chiens</h2>
          </div>
          <div class="card-image">
            <span class="emoji">🐕</span>
          </div>
        </router-link>

        <router-link to="/adopter/swipe" class="category-card rabbits-card">
          <div class="card-content">
            <h2 class="text-h5 text-neutral-white">Rongeurs</h2>
          </div>
          <div class="card-image">
            <span class="emoji">🐰</span>
          </div>
        </router-link>
      </div>

      <!-- Map Section -->
      <section class="map-section">
        <div class="map-header">
          <h3 class="map-title">Propriétaires près de vous</h3>
          <div class="toggle-container">
            <button
              :class="['toggle-btn', { active: showMapView }]"
              @click="showMapView = true"
              title="Voir la carte"
            >
              🗺️
            </button>
            <button
              :class="['toggle-btn', { active: !showMapView }]"
              @click="showMapView = false"
              title="Voir la liste"
            >
              📋
            </button>
          </div>
        </div>

        <!-- Map View Component -->
        <OwnersMap v-if="showMapView" />

        <!-- List View Component -->
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
  padding: 24px;
  padding-bottom: calc(100px + 24px);
  gap: 32px;
}

.home-header {
  margin-top: 8px;
}

.home-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Featured Card */
.featured-card {
  min-height: 200px;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.featured-card:active {
  transform: scale(0.98);
}

/* Grid Cards */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.category-card {
  min-height: 160px;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.category-card:active {
  transform: scale(0.98);
}

/* Card Content */
.card-content {
  z-index: 2;
  flex: 1;
}

.card-image {
  position: absolute;
  right: 20px;
  bottom: 12px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.emoji {
  display: block;
  line-height: 1;
}

/* Background Gradients */
.cats-card {
  background: linear-gradient(135deg, #FF6666 0%, #FFB3B3 100%);
}

.dogs-card {
  background: linear-gradient(135deg, #B366FF 0%, #E6CCFF 100%);
}

.rabbits-card {
  background: linear-gradient(135deg, #FFB84D 0%, #FFE0B3 100%);
}

/* Map Section */
.map-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.map-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.toggle-container {
  display: flex;
  gap: 8px;
  background: #E8E8E8;
  border-radius: 8px;
  padding: 4px;
}

.toggle-btn {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.toggle-btn.active {
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.view-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  animation: slideIn 0.3s ease;
}

.list-view {
  background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.view-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.view-card:active {
  transform: scale(0.98);
}

.view-icon {
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.view-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.view-title {
  font-weight: 600;
  font-size: 16px;
  color: #fff;
}

.view-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.view-arrow {
  font-size: 20px;
  color: #fff;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 480px) {
  .home-page {
    padding: 16px;
    padding-bottom: calc(100px + 16px);
    gap: 20px;
  }

  .featured-card {
    min-height: 180px;
  }

  .category-card {
    min-height: 140px;
  }

  .card-image {
    font-size: 60px;
  }
}
</style>
