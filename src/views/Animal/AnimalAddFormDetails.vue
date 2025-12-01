<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronLeft } from 'lucide-vue-next';
import ProgressSteps from '@/components/ProgressSteps.vue';
import Button from '@/components/Button.vue';

const router = useRouter();
const route = useRoute();

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails & besoins', 'Résumé'];
const currentStep = ref(3);

// Description de l'animal
const description = ref('');

// Charger les données existantes si disponibles
onMounted(() => {
  const savedData = localStorage.getItem('animalFormDetailsData');
  if (savedData) {
    const data = JSON.parse(savedData);
    description.value = data.description || '';
  }
});

const goBack = () => {
  if (route.query.from === 'resume') {
    router.push('/owner/animal/add/resume');
  } else {
    router.push('/owner/animal/add/affinity');
  }
};

const handleNext = () => {
  // Validation basique
  if (!description.value.trim()) {
    alert('Veuillez entrer une description de l\'animal');
    return;
  }

  // Sauvegarder les données
  const detailsData = {
    description: description.value
  };
  localStorage.setItem('animalFormDetailsData', JSON.stringify(detailsData));
  
  // Toujours retourner au résumé (c'est la dernière étape avant le résumé)
  router.push('/owner/animal/add/resume');
};
</script>

<template>
  <div class="add-animal-page">
    <!-- Header avec bouton retour et titre -->
    <div class="page-header">
      <button class="back-button" @click="goBack" type="button">
        <ChevronLeft :size="32" :stroke-width="2" />
      </button>
      <h1 class="page-title">Ajouter un animal</h1>
    </div>

    <!-- Barre de progression -->
    <ProgressSteps :steps="steps" :current-step="currentStep" />

    <!-- Contenu du formulaire -->
    <div class="form-container">
      <form @submit.prevent="handleNext" class="details-form">
        <!-- Description -->
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            v-model="description"
            class="textarea-field"
            placeholder="Décrivez l'animal, son comportement, ses habitudes, ses besoins particuliers..."
            rows="10"
            required
          />
        </div>

        <!-- Bouton suivant -->
        <div class="form-actions">
          <Button 
            type="submit"
            variant="primary"
            size="lg"
            class="btn-next"
          >
            suivant
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.add-animal-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-100);
  padding-bottom: var(--spacing-8);
}

.page-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-8) var(--spacing-6);
  padding-top: var(--spacing-12);
  padding-bottom: var(--spacing-4);
  gap: var(--spacing-4);
  background-color: var(--color-neutral-100);
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-neutral-black);
  cursor: pointer;
  padding: var(--spacing-2);
  margin-left: calc(var(--spacing-2) * -1);
}

.back-button:active {
  opacity: 0.6;
}

.page-title {
  font-family: var(--font-family);
  font-size: var(--heading-h2-size);
  font-weight: var(--heading-h2-weight);
  line-height: var(--heading-h2-height);
  color: var(--color-primary-700);
  margin: 0;
  text-align: center;
  flex: 1;
  margin-right: var(--spacing-10);
}

.form-container {
  flex: 1;
  padding: var(--spacing-6);
  padding-top: var(--spacing-4);
}

.details-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  height: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  flex: 1;
}

.form-label {
  font-family: var(--font-family);
  font-size: var(--body-lg-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-black);
  line-height: var(--body-lg-height);
}

.textarea-field {
  flex: 1;
  min-height: 200px;
  padding: var(--spacing-4) var(--spacing-5);
  background: var(--color-neutral-white);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-family);
  font-size: 16px;
  line-height: 24px;
  color: var(--color-neutral-black);
  font-weight: var(--font-weight-normal);
  resize: vertical;
  outline: none;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.textarea-field::placeholder {
  color: var(--color-neutral-400);
}

.textarea-field:focus {
  background: var(--color-neutral-white);
  box-shadow: 0 4px 24px 0 rgba(166, 77, 255, 0.25);
  border: 2px solid var(--color-primary-600);
  padding: calc(var(--spacing-4) - 2px) calc(var(--spacing-5) - 2px);
}

.form-actions {
  margin-top: var(--spacing-6);
}

.form-actions :deep(.btn-next) {
  width: 100%;
  border-radius: var(--radius-full);
  min-height: 60px;
  text-transform: lowercase;
}
</style>
