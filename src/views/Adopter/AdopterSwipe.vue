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

const getIgnoredAnimalIds = () => {
  const ignored = localStorage.getItem(`ignored_animals_${userId}`);
  return ignored ? JSON.parse(ignored) : [];
};

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

    if (!userId) throw new Error("Utilisateur non connecté");

    // 1. Charger les animaux
    const animalsResponse = await fetch('/api/animals?availability=true', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!animalsResponse.ok) throw new Error('Erreur chargement animaux');
    const animalsData = await animalsResponse.json();

    // 2. Charger les matchs existants
    const matchesResponse = await fetch(`/api/matches?adopterId=${userId}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    let matchedIds = [];
    if (matchesResponse.ok) {
      const matchesData = await matchesResponse.json();
      matchedIds = matchesData.matches.map(m => 
        typeof m.animalId === 'object' ? m.animalId._id : m.animalId
      );
    }

    // 3. Filtrer (Exclure déjà matchés ou ignorés)
    const ignoredIds = getIgnoredAnimalIds();
    const excludedIds = [...matchedIds, ...ignoredIds];
    
    const filtered = animalsData.animals.filter(a => !excludedIds.includes(a._id));

    animals.value = filtered.map(animal => ({
      id: animal._id,
      name: animal.name,
      description: animal.description,
      image: animal.image,
      distance: animal.distance ? `${animal.distance} km` : 'Distance inconnue',
      urgent: false,
      tags: [
        ...(animal.characteristics?.environment || []),
        ...(animal.characteristics?.personality || []).slice(0, 2)
      ].slice(0, 4)
    }));
    
  } catch (err) {
    console.error(err);
    error.value = err.message || "Une erreur est survenue";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAnimals();
});

const currentAnimal = computed(() => animals.value[currentIndex.value]);
const hasMoreAnimals = computed(() => currentIndex.value < animals.value.length);

const handleSwipeLeft = (animal) => {
  saveIgnoredAnimal(animal.id); 
  nextAnimal();
};

const handleSwipeRight = async (animal) => {
  try {
    await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ adopterId: userId, animalId: animal.id }),
    });
  } catch (e) {
    console.error(e);
  }
  nextAnimal();
};

const nextAnimal = () => {
  if (currentIndex.value < animals.value.length) currentIndex.value++;
};

const handleCardClick = (animal) => {
  router.push({ name: 'AdopterAnimalDetails', params: { id: animal.id } });
};
</script>

<template>
  <div class="viewport">
    <header class="header">
      <h1 class="title text-h1 text-primary-700">Swipe</h1>
    </header>

    <main class="main-content">
      <div v-if="loading" class="state-container">
        <div class="loader"></div>
        <p>Recherche de compagnons...</p>
      </div>

      <div v-else-if="error" class="state-container">
        <p>{{ error }}</p>
        <button @click="fetchAnimals" class="btn-retry">Réessayer</button>
      </div>

      <div v-else class="cards-area">
        <div v-if="!hasMoreAnimals" class="state-container">
          <p>C'est tout pour le moment ! 🐾</p>
          <small>Revenez plus tard.</small>
        </div>

        <SwipeCard
          v-if="currentAnimal"
          :animal="currentAnimal"
          @swipe-left="handleSwipeLeft"
          @swipe-right="handleSwipeRight"
          @click="handleCardClick"
          class="card-instance" 
        />
      </div>
    </main>
    
    <Menu />
  </div>
</template>

<style scoped>
.viewport {
  position: fixed; 
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh; 
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-100);
  overflow: hidden;
}

.header {
  flex-shrink: 0;
  padding: 0;
  padding-top: max(16px, env(safe-area-inset-top)); 
  text-align: center;
  background-color: var(--color-neutral-100);
  z-index: 10;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  padding-bottom: calc(80px + 16px + env(safe-area-inset-bottom));
  padding-left: 16px;
  padding-right: 16px;
  box-sizing: border-box;
}

.cards-area {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.swipe-card), .card-instance {
  width: 95%;
  height: 90%;
  max-height: 100%;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  text-align: center;
  gap: 16px;
  color: var(--color-neutral-600);
}

.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--color-primary-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-retry {
  padding: 12px 24px;
  background-color: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
</style>