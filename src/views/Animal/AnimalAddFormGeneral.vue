<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ProgressSteps from '@/components/ProgressSteps.vue';
import Input from '@/components/Input.vue';
import Dropdown from '@/components/Dropdown.vue';
import Button from '@/components/Button.vue';
import BackButton from '@/components/BackButton.vue';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const route = useRoute();
const { error } = useToast();

// Mode édition
const isEditMode = ref(false);

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails', 'Résumé'];
const currentStep = ref(0);

// Données du formulaire
const formData = ref({
  name: '',
  species: '',
  race: '',
  age: '',
  sex: '',
  city: '',
  zip: '',
  price: '',
  size: '',
  weight: ''
});

// Charger les données existantes
onMounted(() => {
  const savedData = localStorage.getItem('animalFormData');
  if (savedData) {
    formData.value = JSON.parse(savedData);
  }
  
  // Vérifier si on est en mode édition
  const animalId = localStorage.getItem('editingAnimalId');
  if (animalId) {
    isEditMode.value = true;
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
  // Validation
  if (!formData.value.name || !formData.value.species || !formData.value.age || !formData.value.sex || !formData.value.city || !formData.value.zip || !formData.value.price) {
    error('Veuillez remplir tous les champs obligatoires');
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
      <BackButton @click="goBack" />
      <h1 class="page-title text-h2 text-primary-700">{{ isEditMode ? 'Modifier un animal' : 'Ajouter un animal' }}</h1>
    </div>

    <!-- Barre de progression -->
    <ProgressSteps :steps="steps" :current-step="currentStep" />

    <!-- Formulaire -->
    <div class="form-container">
      <form @submit.prevent="handleNext" class="animal-form">
        <!-- Nom de l'animal -->
        <div class="form-group">
          <label class="form-label text-body-lg text-neutral-black">Nom de l'animal</label>
          <Input
            v-model="formData.name"
            type="text"
            placeholder="Nelson"
            required
          />
        </div>

        <!-- Espèce -->
        <div class="form-group">
          <label class="form-label text-body-lg text-neutral-black">Espèce</label>
          <Dropdown
            v-model="formData.species"
            :options="speciesOptions"
            placeholder="Choisir"
            required
          />
        </div>

        <!-- Race (optionnel) -->
        <div class="form-group">
          <label class="form-label text-body-lg text-neutral-black">Race (optionnel)</label>
          <Input
            v-model="formData.race"
            type="text"
            placeholder="Persan, Labrador, etc."
          />
        </div>

        <!-- Age et Genre sur la même ligne -->
        <div class="form-row">
          <div class="form-group form-group-half">
            <label class="form-label text-body-lg text-neutral-black">Age</label>
            <Dropdown
              v-model="formData.age"
              :options="ageOptions"
              placeholder="Choisir"
              required
            />
          </div>

          <div class="form-group form-group-half">
            <label class="form-label text-body-lg text-neutral-black">Genre</label>
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
            <label class="form-label text-body-lg text-neutral-black">Taille</label>
            <Dropdown
              v-model="formData.size"
              :options="sizeOptions"
              placeholder="Choisir"
            />
          </div>

          <div class="form-group form-group-half">
            <label class="form-label text-body-lg text-neutral-black">Poids</label>
            <Dropdown
              v-model="formData.weight"
              :options="weightOptions"
              placeholder="Choisir"
            />
          </div>
        </div>

        <!-- Ville et Code postal sur la même ligne -->
        <div class="form-row">
          <div class="form-group form-group-half">
            <label class="form-label text-body-lg text-neutral-black">Ville</label>
            <Input
              v-model="formData.city"
              type="text"
              placeholder="Lausanne"
              required
            />
          </div>

          <div class="form-group form-group-half">
            <label class="form-label text-body-lg text-neutral-black">Code postal</label>
            <Input
              v-model="formData.zip"
              type="text"
              placeholder="1000"
              required
            />
          </div>
        </div>

        <!-- Prix -->
        <div class="form-group">
          <label class="form-label text-body-lg text-neutral-black">Prix (CHF)</label>
          <Input
            v-model="formData.price"
            type="number"
            placeholder="500"
            min="0"
            step="0.01"
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
  position: relative;
  padding-bottom: 100px;
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
  font-weight: var(--font-weight-semibold);
}

.form-row {
  display: flex;
  gap: var(--spacing-4);
}

.form-group-half {
  flex: 1;
  min-width: 0;
}

.form-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 100vw;
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
  background-color: var(--color-neutral-100);
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.btn-next {
  width: 100%;
  max-width: 100%;
}
</style>
