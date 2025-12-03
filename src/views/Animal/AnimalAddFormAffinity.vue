<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Home, Car, Baby, Dog, Cat, Rat } from 'lucide-vue-next';
import ProgressSteps from '@/components/ProgressSteps.vue';
import TagButton from '@/components/TagButton.vue';
import Button from '@/components/Button.vue';
import BackButton from '@/components/BackButton.vue';

const router = useRouter();
const route = useRoute();

const isEditMode = ref(false);

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails', 'Résumé'];
const currentStep = ref(2);

// Affinités sélectionnées
const selectedAffinities = ref({
  environment: [],
  training: [],
  personality: []
});

// Options d'environnement
const environmentOptions = [
  { value: 'appartement', label: 'appartement', icon: Home },
  { value: 'voiture', label: 'voiture', icon: Car },
  { value: 'enfant', label: 'enfant', icon: Baby },
  { value: 'chien', label: 'chien', icon: Dog },
  { value: 'chat', label: 'chat', icon: Cat },
  { value: 'autre animaux', label: 'autre animaux', icon: Rat }
];

// Options de dressage
const trainingOptions = [
  { value: 'éduqué', label: 'éduqué' },
  { value: 'facile à dresser', label: 'facile à dresser' },
  { value: 'habitué à la laisse', label: 'habitué à la laisse' },
  { value: 'têtu', label: 'têtu' }
];

// Options de personnalité
const personalityOptions = [
  { value: 'calme', label: 'calme' },
  { value: 'énergique', label: 'énergique' },
  { value: 'indépendant', label: 'indépendant' },
  { value: 'affectueux', label: 'affectueux' },
  { value: 'curieux', label: 'curieux' },
  { value: 'joueur', label: 'joueur' },
  { value: 'bavard', label: 'bavard' },
  { value: 'explorateur', label: 'explorateur' },
  { value: 'câlin', label: 'câlin' },
  { value: 'protecteur', label: 'protecteur' },
  { value: 'territorial', label: 'territorial' },
  { value: 'sociable', label: 'sociable' },
  { value: 'timide', label: 'timide' },
  { value: 'peureux', label: 'peureux' }
];

// Charger les données existantes si disponibles
onMounted(() => {
  const savedData = localStorage.getItem('animalFormAffinityData');
  if (savedData) {
    selectedAffinities.value = JSON.parse(savedData);
  }
  
  const animalId = localStorage.getItem('editingAnimalId');
  if (animalId) {
    isEditMode.value = true;
  }
});

const goBack = () => {
  if (route.query.from === 'resume') {
    router.push('/owner/animal/add/resume');
  } else {
    router.push('/owner/animal/add/media');
  }
};

const toggleAffinity = (category, value) => {
  const index = selectedAffinities.value[category].indexOf(value);
  if (index > -1) {
    selectedAffinities.value[category].splice(index, 1);
  } else {
    selectedAffinities.value[category].push(value);
  }
};

const isSelected = (category, value) => {
  return selectedAffinities.value[category].includes(value);
};

const handleNext = () => {
  // Sauvegarder les données
  localStorage.setItem('animalFormAffinityData', JSON.stringify(selectedAffinities.value));
  
  // Si on vient du résumé, retourner au résumé, sinon aller à l'étape suivante
  if (route.query.from === 'resume') {
    router.push('/owner/animal/add/resume');
  } else {
    router.push('/owner/animal/add/details');
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

    <!-- Contenu scrollable -->
    <div class="form-container">
      <!-- Description -->
      <div class="affinity-description">
        <p class="description-text text-body-base text-neutral-black">
          Veuillez sélectionner les compatibilités que l'animal devrait avoir avec son futur propriétaire
        </p>
        <p class="description-subtext text-body-sm text-neutral-600">
          (Vous pouvez en sélectionner plusieurs)
        </p>
      </div>

      <!-- Environnement -->
      <div class="affinity-section">
        <h2 class="section-title  text-body-lg text-neutral-black">Environnement</h2>
        <div class="tags-container">
          <TagButton
            v-for="option in environmentOptions"
            :key="option.value"
            :label="option.label"
            :icon="option.icon"
            :selected="isSelected('environment', option.value)"
            @toggle="toggleAffinity('environment', option.value)"
          />
        </div>
      </div>

      <!-- Dressage -->
      <div class="affinity-section">
        <h2 class="section-title text-body-lg text-neutral-black">Dressage</h2>
        <div class="tags-container">
          <TagButton
            v-for="option in trainingOptions"
            :key="option.value"
            :label="option.label"
            :selected="isSelected('training', option.value)"
            @toggle="toggleAffinity('training', option.value)"
          />
        </div>
      </div>

      <!-- Personnalité -->
      <div class="affinity-section">
        <h2 class="section-title text-body-lg text-neutral-black">Personnalité</h2>
        <div class="tags-container">
          <TagButton
            v-for="option in personalityOptions"
            :key="option.value"
            :label="option.label"
            :selected="isSelected('personality', option.value)"
            @toggle="toggleAffinity('personality', option.value)"
          />
        </div>
      </div>
    </div>

    <!-- Bouton fixe en bas -->
    <div class="fixed-footer">
      <Button 
        type="button"
        variant="primary"
        size="base"
        class="btn-next"
        @click="handleNext"
      >
        Suivant
      </Button>
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
  padding-bottom: 100px; /* Espace pour le bouton fixe */
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
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.affinity-description {
  text-align: center;
  padding: 0 var(--spacing-2);
}

.description-text {
  margin: 0 0 var(--spacing-2) 0;
}

.description-subtext {
  margin: 0;
}

.affinity-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.section-title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.fixed-footer {
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
