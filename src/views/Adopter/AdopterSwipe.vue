<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Menu from '@/components/Menu.vue';
import SwipeCard from '@/components/SwipeCard.vue';

const router = useRouter();

const animals = ref([]);
const currentIndex = ref(0);
const loading = ref(true);
const error = ref(null);
const userId = localStorage.getItem('user_id');

// Récupérer les IDs des animaux déjà "dislikés" stockés localement
const getIgnoredAnimalIds = () => {
  const ignored = localStorage.getItem(`ignored_animals_${userId}`);
  return ignored ? JSON.parse(ignored) : [];
};

// Sauvegarder un ID d'animal comme "disliké"
const saveIgnoredAnimal = (animalId) => {
  const ignored = getIgnoredAnimalIds();
  if (!ignored.includes(animalId)) {
    ignored.push(animalId);
    localStorage.setItem(`ignored_animals_${userId}`, JSON.stringify(ignored));
  }
};

const fetchAnimals = async () => {
  try {
    loading.value = true;
    error.value = null;

    if (!userId) {
      throw new Error("Utilisateur non connecté");
    }

    // Charger les animaux disponibles
    const animalsResponse = await fetch('/api/animals?availability=true', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!animalsResponse.ok) throw new Error('Erreur lors du chargement des animaux');
    const animalsData = await animalsResponse.json();

    // Charger les matchs existants pour cet utilisateur (ceux qu'on a déjà likés)
    const matchesResponse = await fetch(`/api/matches?adopterId=${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    let matchedAnimalIds = [];
    if (matchesResponse.ok) {
      const matchesData = await matchesResponse.json();
      // On récupère les IDs des animaux avec qui on a déjà matché
      matchedAnimalIds = matchesData.matches.map(m => 
        typeof m.animalId === 'object' ? m.animalId._id : m.animalId
      );
    }

    // Récupérer les animaux ignorés (swipe gauche)
    const ignoredIds = getIgnoredAnimalIds();

    // Filtrer : On garde seulement les animaux qui ne sont NI matchés NI ignorés
    const allExcludedIds = [...matchedAnimalIds, ...ignoredIds];
    
    const filteredAnimals = animalsData.animals.filter(animal => 
      !allExcludedIds.includes(animal._id)
    );

    animals.value = filteredAnimals.map(animal => ({
      id: animal._id,
      name: animal.name,
      description: animal.description,
      image: animal.image,
      distance: animal.distance !== null && animal.distance !== undefined 
        ? `${animal.distance} km` 
        : 'Distance inconnue',
      urgent: false,
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

onMounted(() => {
  fetchAnimals();
});

const currentAnimal = computed(() => {
  return animals.value[currentIndex.value];
});

const hasMoreAnimals = computed(() => {
  return currentIndex.value < animals.value.length;
});

// GESTION DU SWIPE GAUCHE (Refus)
const handleSwipeLeft = (animal) => {
  console.log('Rejected:', animal.name);
  // On sauvegarde en local pour ne plus le revoir
  saveIgnoredAnimal(animal.id); 
  nextAnimal();
};

// GESTION DU SWIPE DROITE (Like/Match)
const handleSwipeRight = async (animal) => {
  console.log('Liked:', animal.name);
  
  try {
    // Appel API pour créer le match en base de données
    const response = await fetch('/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        adopterId: userId,
        animalId: animal.id
      }),
    });

    if (!response.ok) {
      console.error("Erreur lors de la création du match");
    } else {
       console.log("Match créé avec succès !");
    }
  } catch (e) {
    console.error("Erreur réseau", e);
  }

  nextAnimal();
};

const nextAnimal = () => {
  if (currentIndex.value < animals.value.length) {
    currentIndex.value++;
  }
};

const handleCardClick = (animal) => {
  router.push({ name: 'AdopterAnimalDetails', params: { id: animal.id } });
};
</script>

<template>
  <div class="swipe-page">
    <div class="swipe-header">
      <h1 class="swipe-title text-h1 text-primary-700">Swipe</h1>
    </div>

    <div class="swipe-container">
      <div v-if="loading" class="loading-container">
        <p>Chargement des animaux...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchAnimals" class="retry-button">Réessayer</button>
      </div>

      <div v-else class="cards-stack">
        <div v-if="!hasMoreAnimals" class="no-more-cards">
          <p>Plus d'animaux à découvrir pour le moment</p>
        </div>

        <SwipeCard
          v-if="currentAnimal"
          :animal="currentAnimal"
          @swipe-left="handleSwipeLeft"
          @swipe-right="handleSwipeRight"
          @click="handleCardClick"
        />
      </div>
    </div>
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
  padding: var(--spacing-2) var(--spacing-6);
  padding-top: var(--spacing-12);
  background-color: var(--color-neutral-100);
  flex-shrink: 0;
}

.swipe-title {
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
