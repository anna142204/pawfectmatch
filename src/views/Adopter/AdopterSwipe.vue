<script setup>
import { ref, computed } from 'vue';
import Menu from '@/components/Menu.vue';
import SwipeCard from '@/components/SwipeCard.vue';

// Données d'exemple - à remplacer par un fetch API
const animals = ref([
  {
    id: 1,
    name: 'Plumo',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
    distance: '9 km',
    urgent: true,
    tags: ['élément', 'élément', 'élément', 'élément']
  },
  {
    id: 2,
    name: 'Bibble',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=400&fit=crop',
    distance: '9 km',
    urgent: true,
    tags: ['élément', 'élément', 'élément', 'élément']
  },
  {
    id: 3,
    name: 'Iko',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
    distance: '9 km',
    urgent: true,
    tags: ['élément', 'élément', 'élément', 'élément']
  }
]);

const currentIndex = ref(0);

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
      <div class="cards-stack">
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-100);
  padding-bottom: 80px;
}

.swipe-header {
  padding: var(--spacing-8) var(--spacing-6);
  padding-top: var(--spacing-12);
  background-color: var(--color-neutral-100);
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
  position: relative;
  min-height: 600px;
}

.cards-stack {
  width: 100%;
  max-width: 400px;
  height: 640px;
  position: relative;
}

.no-more-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  font-family: var(--font-family);
  font-size: var(--body-lg-size);
  color: var(--color-neutral-500);
}
</style>
