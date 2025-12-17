<script setup>
import { ref, computed, onMounted } from 'vue';
import Menu from '@/components/Menu.vue';
import SwipeCard from '@/components/SwipeCard.vue';

const animals = ref([]);
const currentIndex = ref(0);
const loading = ref(true);
const error = ref(null);

// Charger les animaux depuis l'API
const fetchAnimals = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const response = await fetch('/api/animals?availability=true', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des animaux');
    }

    const data = await response.json();
    
    // Adapter les données de l'API au format attendu par SwipeCard
    animals.value = data.animals.map(animal => ({
      id: animal._id,
      name: animal.name,
      description: animal.description,
      image: animal.image,
      distance: '9 km', // À calculer avec la géolocalisation
      urgent: false, // À définir selon vos critères
      tags: [
        ...(animal.characteristics?.environment || []),
        ...(animal.characteristics?.personality || []).slice(0, 2)
      ].slice(0, 4)
    }));
    
  } catch (err) {
    console.error('Erreur:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Charger les animaux au montage du composant
onMounted(() => {
  fetchAnimals();
});

const currentAnimal = computed(() => {
  return animals.value[currentIndex.value];
});

const hasMoreAnimals = computed(() => {
  return currentIndex.value < animals.value.length;
});

const handleSwipeLeft = (animal) => {
  console.log('Rejected:', animal.name);
  nextAnimal();
};

const handleSwipeRight = (animal) => {
  console.log('Liked:', animal.name);
  nextAnimal();
};

const nextAnimal = () => {
  if (currentIndex.value < animals.value.length - 1) {
    currentIndex.value++;
  } else {
    currentIndex.value = animals.value.length;
  }
};
</script>

<template>
  <div class="swipe-page">
    <!-- En-tête -->
    <div class="swipe-header">
      <h1 class="swipe-title">Swipe</h1>
    </div>

    <!-- Zone de swipe -->
    <div class="swipe-container">
      <!-- Loader pendant le chargement -->
      <div v-if="loading" class="loading-container">
        <p>Chargement des animaux...</p>
      </div>

      <!-- Message d'erreur -->
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchAnimals" class="retry-button">Réessayer</button>
      </div>

      <!-- Cards stack -->
      <div v-else class="cards-stack">
        <!-- Message si plus d'animaux -->
        <div v-if="!hasMoreAnimals" class="no-more-cards">
          <p>Plus d'animaux à découvrir pour le moment</p>
        </div>

        <!-- Carte actuelle -->
        <SwipeCard
          v-if="currentAnimal"
          :animal="currentAnimal"
          @swipe-left="handleSwipeLeft"
          @swipe-right="handleSwipeRight"
        />
      </div>
    </div>

    <!-- Menu de navigation -->
    <Menu />
  </div>
</template>

<style scoped>
.swipe-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-100);
  overflow: hidden;
}

.swipe-header {
  padding: var(--spacing-8) var(--spacing-6);
  padding-top: var(--spacing-12);
  background-color: var(--color-neutral-100);
  flex-shrink: 0;
}

.swipe-title {
  font-family: var(--font-family);
  font-size: var(--heading-h1-size);
  font-weight: var(--heading-h1-weight);
  line-height: var(--heading-h1-height);
  color: var(--color-neutral-black);
  margin: 0;
  text-align: center;
}

.swipe-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 var(--spacing-6);
  padding-bottom: 100px;
  position: relative;
  overflow: hidden;
}

.cards-stack {
  width: 100%;
  max-width: 400px;
  height: 100%;
  max-height: 640px;
  position: relative;
}

.loading-container,
.error-container,
.no-more-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  gap: var(--spacing-4);
}

.loading-container p,
.error-container p,
.no-more-cards p {
  font-family: var(--font-family);
  font-size: var(--body-lg-size);
  color: var(--color-neutral-600);
  margin: 0;
}

.retry-button {
  padding: var(--spacing-3) var(--spacing-6);
  background-color: var(--color-primary-600);
  color: var(--color-neutral-white);
  border: none;
  border-radius: var(--radius-full);
  font-family: var(--font-family);
  font-size: var(--body-md-size);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: var(--color-primary-700);
}

.retry-button:active {
  transform: scale(0.95);
}
</style>
