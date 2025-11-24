<script setup>
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
    </main>
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
