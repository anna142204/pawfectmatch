<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ProgressSteps from '@/components/ProgressSteps.vue';
import Button from '@/components/Button.vue';
import BackButton from '@/components/BackButton.vue';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const route = useRoute();
const { error } = useToast();

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails', 'Résumé'];
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
  // Validation
  if (!description.value.trim()) {
    error('Veuillez entrer une description de l\'animal');
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
      <BackButton @click="goBack" />
      <h1 class="page-title text-h2 text-primary-700">Ajouter un animal</h1>
    </div>

    <!-- Barre de progression -->
    <ProgressSteps :steps="steps" :current-step="currentStep" />

    <!-- Contenu du formulaire -->
    <div class="form-container">
      <form @submit.prevent="handleNext" class="details-form">
        <!-- Description -->
        <div class="form-group">
          <label class="form-label text-body-lg text-neutral-black">Description</label>
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
            size="base"
            class="btn-next"
          >
            Suivant
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
  padding: var(--spacing-12) 0 var(--spacing-4);
  gap: var(--spacing-4);
  background-color: var(--color-neutral-100);
}

.page-title {
  margin: 0;
  text-align: center;
  flex: 1;
  margin-right: var(--spacing-10);
}

.form-container {
  flex: 1;
  padding: var(--spacing-4) 0;
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
  font-weight: var(--font-weight-semibold);
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
</style>
