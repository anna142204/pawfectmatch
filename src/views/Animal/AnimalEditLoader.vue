<script setup>
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const route = useRoute();
const { error } = useToast();
const loading = ref(true);

onMounted(async () => {
  const animalId = route.params.id;
  
  if (!animalId) {
    error('ID animal manquant');
    router.push('/owner/animals');
    return;
  }

  try {
    // Récupérer les données de l'animal
    const response = await fetch(`/api/animals/${animalId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Animal non trouvé');
    }

    const animal = await response.json();

    // Préparer les données pour le formulaire général
    const generalData = {
      name: animal.name,
      species: animal.species,
      race: animal.race || '',
      age: animal.age,
      sex: animal.sex,
      city: animal.address?.city || '',
      zip: animal.address?.zip || '',
      price: animal.price,
      size: animal.size || '',
      weight: animal.weight || ''
    };

    // Préparer les données média
    const mediaData = {
      images: Array.isArray(animal.image) ? animal.image : [animal.image]
    };

    // Préparer les données d'affinité
    const affinityData = {
      environment: animal.characteristics?.environment || [],
      training: animal.characteristics?.dressage || [],
      personality: animal.characteristics?.personality || []
    };

    // Préparer les données de détails
    const detailsData = {
      description: animal.description || ''
    };

    // Sauvegarder dans localStorage
    localStorage.setItem('animalFormData', JSON.stringify(generalData));
    localStorage.setItem('animalFormMediaData', JSON.stringify(mediaData));
    localStorage.setItem('animalFormAffinityData', JSON.stringify(affinityData));
    localStorage.setItem('animalFormDetailsData', JSON.stringify(detailsData));
    localStorage.setItem('editingAnimalId', animalId);

    // Rediriger vers la première étape du formulaire
    router.push('/owner/animal/add/resume');
    
  } catch (err) {
    error(err.message || 'Impossible de charger l\'animal');
    router.push('/owner/animals');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="loader-page">
    <div class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">Chargement des données...</p>
    </div>
  </div>
</template>

<style scoped>
.loader-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-neutral-100);
  padding: var(--general-padding)
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-neutral-200);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  color: var(--color-neutral-600);
  margin: 0;
}
</style>
