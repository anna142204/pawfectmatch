<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronLeft } from 'lucide-vue-next';
import ProgressSteps from '@/components/ProgressSteps.vue';
import Input from '@/components/Input.vue';
import Dropdown from '@/components/Dropdown.vue';
import Button from '@/components/Button.vue';

const router = useRouter();
const route = useRoute();

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails & besoins', 'Résumé'];
const currentStep = ref(0);

// Données du formulaire
const formData = ref({
  name: '',
  species: '',
  age: '',
  sex: '',
  size: '',
  weight: ''
});

// Charger les données existantes
onMounted(() => {
  const savedData = localStorage.getItem('animalFormData');
  if (savedData) {
    formData.value = JSON.parse(savedData);
  }
});

// Options pour les selects
const speciesOptions = [
  { value: 'chat', label: 'Chat' },
  { value: 'chien', label: 'Chien' },
  { value: 'lapin', label: 'Lapin' },
  { value: 'oiseau', label: 'Oiseau' },
  { value: 'rongeur', label: 'Rongeur' },
  { value: 'autre', label: 'Autre' }
];

const ageOptions = [
  { value: '0-1', label: '0-1 an' },
  { value: '1-3', label: '1-3 ans' },
  { value: '3-7', label: '3-7 ans' },
  { value: '7+', label: '7+ ans' }
];

const sexOptions = [
  { value: 'male', label: 'Mâle' },
  { value: 'female', label: 'Femelle' }
];

const sizeOptions = [
  { value: 'petit', label: 'Petit' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'grand', label: 'Grand' }
];

const weightOptions = [
  { value: '0-5', label: '0-5 kg' },
  { value: '5-10', label: '5-10 kg' },
  { value: '10-20', label: '10-20 kg' },
  { value: '20-30', label: '20-30 kg' },
  { value: '30+', label: '30+ kg' }
];

const goBack = () => {
  // Si on vient du résumé, retourner au résumé
  if (route.query.from === 'resume') {
    router.push('/owner/animal/add/resume');
  } else {
    router.push('/owner/animals');
  }
};

const handleNext = () => {
  // Validation basique
  if (!formData.value.name || !formData.value.species) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }
  
  // Sauvegarder les données
  localStorage.setItem('animalFormData', JSON.stringify(formData.value));
  
  // Si on vient du résumé, retourner au résumé, sinon aller à l'étape suivante
  if (route.query.from === 'resume') {
    router.push('/owner/animal/add/resume');
  } else {
    router.push('/owner/animal/add/media');
  }
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

    <!-- Formulaire -->
    <div class="form-container">
      <form @submit.prevent="handleNext" class="animal-form">
        <!-- Nom de l'animal -->
        <div class="form-group">
          <label class="form-label">Nom de l'animal</label>
          <Input
            v-model="formData.name"
            type="text"
            placeholder="Nelson"
            required
          />
        </div>

        <!-- Espèce -->
        <div class="form-group">
          <label class="form-label">Espèce</label>
          <Dropdown
            v-model="formData.species"
            :options="speciesOptions"
            placeholder="Choisir"
            required
          />
        </div>

        <!-- Age et Genre sur la même ligne -->
        <div class="form-row">
          <div class="form-group form-group-half">
            <label class="form-label">Age</label>
            <Dropdown
              v-model="formData.age"
              :options="ageOptions"
              placeholder="Choisir"
              required
            />
          </div>

          <div class="form-group form-group-half">
            <label class="form-label">Genre</label>
            <Dropdown
              v-model="formData.sex"
              :options="sexOptions"
              placeholder="Choisir"
              required
            />
          </div>
        </div>

        <!-- Taille et Poids sur la même ligne -->
        <div class="form-row">
          <div class="form-group form-group-half">
            <label class="form-label">Taille</label>
            <Dropdown
              v-model="formData.size"
              :options="sizeOptions"
              placeholder="Choisir"
              required
            />
          </div>

          <div class="form-group form-group-half">
            <label class="form-label">Poids</label>
            <Dropdown
              v-model="formData.weight"
              :options="weightOptions"
              placeholder="Choisir"
              required
            />
          </div>
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

.animal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-family: var(--font-family);
  font-size: var(--body-lg-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-black);
  line-height: var(--body-lg-height);
}

.form-row {
  display: flex;
  gap: var(--spacing-4);
}

.form-group-half {
  flex: 1;
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
