<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeft, Edit2 } from 'lucide-vue-next';
import ProgressSteps from '@/components/ProgressSteps.vue';
import Button from '@/components/Button.vue';

const router = useRouter();

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails & besoins', 'Résumé'];
const currentStep = ref(4);

// Données consolidées
const formData = ref({
  general: {},
  media: {},
  affinity: {},
  details: {}
});

// Labels pour affichage
const speciesLabels = {
  'chat': 'Chat',
  'chien': 'Chien',
  'lapin': 'Lapin',
  'oiseau': 'Oiseau',
  'rongeur': 'Rongeur',
  'autre': 'Autre'
};

const ageLabels = {
  '0-1': '0-1 an',
  '1-3': '1-3 ans',
  '3-7': '3-7 ans',
  '7+': '7+ ans'
};

const sexLabels = {
  'male': 'Mâle',
  'female': 'Femelle'
};

const sizeLabels = {
  'petit': 'Petit',
  'moyen': 'Moyen',
  'grand': 'Grand'
};

const weightLabels = {
  '0-5': '0-5 kg',
  '5-10': '5-10 kg',
  '10-20': '10-20 kg',
  '20-30': '20-30 kg',
  '30+': '30+ kg'
};

const affinityLabels = {
  environment: {
    'appartement': 'appartement',
    'voiture': 'voiture',
    'enfants': 'enfants',
    'chiens': 'chiens',
    'chats': 'chats',
    'autres_animaux': 'autres animaux'
  },
  training: {
    'eduque': 'éduqué',
    'facile_dresser': 'facile à dresser',
    'habitue_laisse': 'habitué à la laisse',
    'tetu': 'têtu'
  },
  personality: {
    'calme': 'calme',
    'energique': 'énergique',
    'independant': 'indépendant',
    'affectueux': 'affectueux',
    'curieux': 'curieux',
    'joueur': 'joueur',
    'bavard': 'bavard',
    'explorateur': 'explorateur',
    'protecteur': 'protecteur',
    'gourmand': 'gourmand'
  }
};

// Charger toutes les données sauvegardées
onMounted(() => {
  formData.value.general = JSON.parse(localStorage.getItem('animalFormData') || '{}');
  formData.value.media = JSON.parse(localStorage.getItem('animalFormMediaData') || '{}');
  formData.value.affinity = JSON.parse(localStorage.getItem('animalFormAffinityData') || '{}');
  formData.value.details = JSON.parse(localStorage.getItem('animalFormDetailsData') || '{}');
});

// Computed pour afficher les affinités
const environmentList = computed(() => {
  return (formData.value.affinity.environment || []).map(val => affinityLabels.environment[val] || val);
});

const trainingList = computed(() => {
  return (formData.value.affinity.training || []).map(val => affinityLabels.training[val] || val);
});

const personalityList = computed(() => {
  return (formData.value.affinity.personality || []).map(val => affinityLabels.personality[val] || val);
});

const goBack = () => {
  router.push('/owner/animal/add/details');
};

const editSection = (section) => {
  const routes = {
    general: '/owner/animal/add',
    media: '/owner/animal/add/media',
    affinity: '/owner/animal/add/affinity',
    details: '/owner/animal/add/details'
  };
  // Ajouter le paramètre from=resume pour indiquer qu'on vient du résumé
  router.push({ path: routes[section], query: { from: 'resume' } });
};

const handleSubmit = async () => {
  try {
    // Validation
    if (!formData.value.general.name || !formData.value.general.species) {
      alert('Données manquantes dans les informations générales');
      return;
    }

    // Préparer les données pour l'API
    const animalData = {
      name: formData.value.general.name,
      species: formData.value.general.species,
      age: formData.value.general.age,
      sex: formData.value.general.sex,
      size: formData.value.general.size,
      weight: formData.value.general.weight,
      images: formData.value.media.images || [],
      characteristics: {
        environment: formData.value.affinity.environment || [],
        dressage: formData.value.affinity.training || [],
        personality: formData.value.affinity.personality || []
      },
      description: formData.value.details.description || ''
    };

    // Appeler l'API pour créer l'animal
    const response = await fetch('/api/animals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(animalData)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de l\'animal');
    }

    // Nettoyer le localStorage
    localStorage.removeItem('animalFormData');
    localStorage.removeItem('animalFormMediaData');
    localStorage.removeItem('animalFormAffinityData');
    localStorage.removeItem('animalFormDetailsData');

    // Rediriger vers la liste des animaux
    router.push('/owner/animals');
    
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue lors de la création de l\'animal');
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
      <div class="resume-content">
        <!-- Informations générales -->
        <div class="resume-section">
          <div class="section-header">
            <h2 class="section-title">Informations générales</h2>
            <button class="edit-button" @click="editSection('general')" type="button">
              <Edit2 :size="20" :stroke-width="2" />
            </button>
          </div>
          <div class="section-content">
            <div class="info-row">
              <span class="info-label">Nom :</span>
              <span class="info-value">{{ formData.general.name || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Espèce :</span>
              <span class="info-value">{{ speciesLabels[formData.general.species] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Âge :</span>
              <span class="info-value">{{ ageLabels[formData.general.age] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Genre :</span>
              <span class="info-value">{{ sexLabels[formData.general.sex] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Taille :</span>
              <span class="info-value">{{ sizeLabels[formData.general.size] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Poids :</span>
              <span class="info-value">{{ weightLabels[formData.general.weight] || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Médias -->
        <div class="resume-section">
          <div class="section-header">
            <h2 class="section-title">Médias</h2>
            <button class="edit-button" @click="editSection('media')" type="button">
              <Edit2 :size="20" :stroke-width="2" />
            </button>
          </div>
          <div class="section-content">
            <div class="media-grid" v-if="formData.media.images && formData.media.images.length > 0">
              <img 
                v-for="(image, index) in formData.media.images" 
                :key="index"
                :src="image" 
                alt="Animal"
                class="media-thumbnail"
              />
            </div>
            <p v-else class="empty-message">Aucun média ajouté</p>
          </div>
        </div>

        <!-- Affinités -->
        <div class="resume-section">
          <div class="section-header">
            <h2 class="section-title">Affinités</h2>
            <button class="edit-button" @click="editSection('affinity')" type="button">
              <Edit2 :size="20" :stroke-width="2" />
            </button>
          </div>
          <div class="section-content">
            <div class="affinity-group" v-if="environmentList.length > 0">
              <span class="affinity-label">Environnement :</span>
              <div class="tags-list">
                <span v-for="(item, index) in environmentList" :key="index" class="tag">
                  {{ item }}
                </span>
              </div>
            </div>
            <div class="affinity-group" v-if="trainingList.length > 0">
              <span class="affinity-label">Dressage :</span>
              <div class="tags-list">
                <span v-for="(item, index) in trainingList" :key="index" class="tag">
                  {{ item }}
                </span>
              </div>
            </div>
            <div class="affinity-group" v-if="personalityList.length > 0">
              <span class="affinity-label">Personnalité :</span>
              <div class="tags-list">
                <span v-for="(item, index) in personalityList" :key="index" class="tag">
                  {{ item }}
                </span>
              </div>
            </div>
            <p v-if="environmentList.length === 0 && trainingList.length === 0 && personalityList.length === 0" class="empty-message">
              Aucune affinité sélectionnée
            </p>
          </div>
        </div>

        <!-- Détails & besoins -->
        <div class="resume-section">
          <div class="section-header">
            <h2 class="section-title">Description</h2>
            <button class="edit-button" @click="editSection('details')" type="button">
              <Edit2 :size="20" :stroke-width="2" />
            </button>
          </div>
          <div class="section-content">
            <p class="description-text">
              {{ formData.details.description || 'Aucune description' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bouton fixe en bas -->
    <div class="fixed-footer">
      <Button 
        type="button"
        variant="primary"
        size="lg"
        class="btn-submit"
        @click="handleSubmit"
      >
        terminer
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
  padding-bottom: 100px;
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
}

.resume-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.resume-section {
  background-color: var(--color-neutral-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-5);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.section-title {
  font-family: var(--font-family);
  font-size: var(--heading-h3-size);
  font-weight: var(--heading-h3-weight);
  line-height: var(--heading-h3-height);
  color: var(--color-primary-700);
  margin: 0;
}

.edit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-primary-600);
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease;
}

.edit-button:hover {
  background-color: var(--color-primary-50);
}

.edit-button:active {
  background-color: var(--color-primary-100);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.info-row {
  display: flex;
  gap: var(--spacing-2);
}

.info-label {
  font-family: var(--font-family);
  font-size: var(--body-md-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
  min-width: 80px;
}

.info-value {
  font-family: var(--font-family);
  font-size: var(--body-md-size);
  font-weight: var(--font-weight-normal);
  color: var(--color-neutral-black);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--spacing-3);
}

.media-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.affinity-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.affinity-label {
  font-family: var(--font-family);
  font-size: var(--body-md-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.tag {
  display: inline-block;
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
  border-radius: var(--radius-full);
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  font-weight: var(--font-weight-medium);
}

.description-text {
  font-family: var(--font-family);
  font-size: var(--body-md-size);
  line-height: var(--body-md-height);
  color: var(--color-neutral-black);
  margin: 0;
  white-space: pre-wrap;
}

.empty-message {
  font-family: var(--font-family);
  font-size: var(--body-md-size);
  color: var(--color-neutral-500);
  font-style: italic;
  margin: 0;
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

.fixed-footer :deep(.btn-submit) {
  width: 100%;
  border-radius: var(--radius-full);
  min-height: 60px;
  text-transform: lowercase;
}
</style>
