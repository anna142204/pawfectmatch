<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronLeft, Home, Car, Baby, Dog, Cat, Rat } from 'lucide-vue-next';
import ProgressSteps from '@/components/ProgressSteps.vue';
import TagButton from '@/components/TagButton.vue';
import Button from '@/components/Button.vue';

const router = useRouter();
const route = useRoute();

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails & besoins', 'Résumé'];
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
  { value: 'enfants', label: 'enfants', icon: Baby },
  { value: 'chiens', label: 'chiens', icon: Dog },
  { value: 'chats', label: 'chats', icon: Cat },
  { value: 'autres_animaux', label: 'autres animaux', icon: Rat }
];

// Options de dressage
const trainingOptions = [
  { value: 'eduque', label: 'éduqué' },
  { value: 'facile_dresser', label: 'facile à dresser' },
  { value: 'habitue_laisse', label: 'habitué à la laisse' },
  { value: 'tetu', label: 'têtu' }
];

// Options de personnalité
const personalityOptions = [
  { value: 'calme', label: 'calme' },
  { value: 'energique', label: 'énergique' },
  { value: 'independant', label: 'indépendant' },
  { value: 'affectueux', label: 'affectueux' },
  { value: 'curieux', label: 'curieux' },
  { value: 'joueur', label: 'joueur' },
  { value: 'bavard', label: 'bavard' },
  { value: 'explorateur', label: 'explorateur' },
  { value: 'protecteur', label: 'protecteur' },
  { value: 'gourmand', label: 'gourmand' }
];

// Charger les données existantes si disponibles
onMounted(() => {
  const savedData = localStorage.getItem('animalFormAffinityData');
  if (savedData) {
    selectedAffinities.value = JSON.parse(savedData);
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
      <button class="back-button" @click="goBack" type="button">
        <ChevronLeft :size="32" :stroke-width="2" />
      </button>
      <h1 class="page-title">Ajouter un animal</h1>
    </div>

    <!-- Barre de progression -->
    <ProgressSteps :steps="steps" :current-step="currentStep" />

    <!-- Contenu scrollable -->
    <div class="form-container">
      <!-- Description -->
      <div class="affinity-description">
        <p class="description-text">
          Veuillez sélectionner les compatibilités que l'animal devrait avoir avec son futur propriétaire
        </p>
        <p class="description-subtext">
          (Vous pouvez en sélectionner plusieurs)
        </p>
      </div>

      <!-- Environnement -->
      <div class="affinity-section">
        <h2 class="section-title">Environnement</h2>
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
        <h2 class="section-title">Dressage</h2>
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
        <h2 class="section-title">Personnalité</h2>
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
        size="lg"
        class="btn-next"
        @click="handleNext"
      >
        suivant
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
  font-family: var(--font-family);
  font-size: var(--body-md-size);
  line-height: var(--body-md-height);
  color: var(--color-neutral-black);
  margin: 0 0 var(--spacing-2) 0;
}

.description-subtext {
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  line-height: var(--body-sm-height);
  color: var(--color-neutral-600);
  margin: 0;
}

.affinity-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.section-title {
  font-family: var(--font-family);
  font-size: var(--heading-h3-size);
  font-weight: var(--heading-h3-weight);
  line-height: var(--heading-h3-height);
  color: var(--color-neutral-black);
  margin: 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.fixed-footer {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - var(--spacing-12));
  max-width: calc(430px - var(--spacing-12));
  padding: var(--spacing-5) 0;
  padding-bottom: var(--spacing-6);
  background-color: transparent;
  z-index: 10;
}

.fixed-footer :deep(.btn-next) {
  width: 100%;
  border-radius: var(--radius-full);
  min-height: 60px;
  text-transform: lowercase;
}
</style>
