<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Edit2 } from 'lucide-vue-next';
import ProgressSteps from '@/components/ProgressSteps.vue';
import Button from '@/components/Button.vue';
import BackButton from '@/components/BackButton.vue';
import { useToast } from '@/composables/useToast';

const { success, error } = useToast();

const router = useRouter();

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails', 'Résumé'];
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

const AGE_MAPPING = {
  '0-1': 0,
  '1-3': 1,
  '3-7': 3,
  '7+': 7
};

// Charger toutes les données sauvegardées
onMounted(() => {
  formData.value.general = JSON.parse(localStorage.getItem('animalFormData') || '{}');
  formData.value.media = JSON.parse(localStorage.getItem('animalFormMediaData') || '{}');
  formData.value.affinity = JSON.parse(localStorage.getItem('animalFormAffinityData') || '{}');
  formData.value.details = JSON.parse(localStorage.getItem('animalFormDetailsData') || '{}');
});

// Computed pour afficher les affinités
const environmentList = computed(() => formData.value.affinity.environment || []);
const trainingList = computed(() => formData.value.affinity.training || []);
const personalityList = computed(() => formData.value.affinity.personality || []);

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
      error('Données manquantes dans les informations générales');
      return;
    }

    if (!formData.value.media.images || formData.value.media.images.length === 0) {
      error('Au moins une image est requise');
      return;
    }

    const ownerId = localStorage.getItem('user_id');
    if (!ownerId) {
      error('Utilisateur non identifié');
      return;
    }

    // Préparer les données pour l'API
    const firstImage = formData.value.media.images[0];
    const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url;
    const ageValue = AGE_MAPPING[formData.value.general.age] ?? 1;

    const animalData = {
      name: formData.value.general.name,
      species: formData.value.general.species,
      race: formData.value.general.race || '',
      age: ageValue,
      sex: formData.value.general.sex,
      address: {
        city: formData.value.general.city || '',
        zip: formData.value.general.zip || ''
      },
      image: imageUrl,
      price: parseFloat(formData.value.general.price) || 0,
      ownerId,
      availability: true,
      description: formData.value.details.description || '',
      characteristics: {
        environment: [...(formData.value.affinity.environment || [])],
        dressage: [...(formData.value.affinity.training || [])],
        personality: [...(formData.value.affinity.personality || [])]
      }
    };

    // Appeler l'API pour créer l'animal
    const response = await fetch('/api/animals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(animalData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Erreur lors de la création de l\'animal');
    }

    // Nettoyer le localStorage
    ['animalFormData', 'animalFormMediaData', 'animalFormAffinityData', 'animalFormDetailsData']
      .forEach(key => localStorage.removeItem(key));

    // Message de succès et redirection
    success('Animal créé avec succès !');
    setTimeout(() => router.push('/owner/animals'), 1500);
  } catch (err) {
    error(err.message || 'Une erreur est survenue lors de la création de l\'animal');
  }
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

    <!-- Contenu scrollable -->
    <div class="form-container">
      <div class="resume-content">
        <!-- Informations générales -->
        <div class="resume-section">
          <div class="section-header">
            <h2 class="section-title text-h4 text-neutral-black">Informations générales</h2>
            <button class="edit-button" @click="editSection('general')" type="button">
              <Edit2 :size="20" :stroke-width="2" />
            </button>
          </div>
          <div class="section-content">
            <div class="info-row">
              <span class="info-label text-body-base text-neutral-700">Nom :</span>
              <span class="info-value text-body-base text-neutral-black">{{ formData.general.name || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label text-body-base text-neutral-700">Espèce :</span>
              <span class="info-value text-body-base text-neutral-black">{{ speciesLabels[formData.general.species] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label text-body-base text-neutral-700">Âge :</span>
              <span class="info-value text-body-base text-neutral-black">{{ ageLabels[formData.general.age] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label text-body-base text-neutral-700">Genre :</span>
              <span class="info-value text-body-base text-neutral-black">{{ sexLabels[formData.general.sex] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label text-body-base text-neutral-700">Taille :</span>
              <span class="info-value text-body-base text-neutral-black">{{ sizeLabels[formData.general.size] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label text-body-base text-neutral-700">Poids :</span>
              <span class="info-value text-body-base text-neutral-black">{{ weightLabels[formData.general.weight] || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Médias -->
        <div class="resume-section">
          <div class="section-header">
            <h2 class="section-title text-h4 text-neutral-black">Médias</h2>
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
            <p v-else class="empty-message text-body-base text-neutral-500">Àucun média ajouté</p>
          </div>
        </div>

        <!-- Affinités -->
        <div class="resume-section">
          <div class="section-header">
            <h2 class="section-title text-h4 text-neutral-black">Affinités</h2>
            <button class="edit-button" @click="editSection('affinity')" type="button">
              <Edit2 :size="20" :stroke-width="2" />
            </button>
          </div>
          <div class="section-content">
            <div class="affinity-group" v-if="environmentList.length > 0">
              <span class="affinity-label text-body-base text-neutral-700">Environnement :</span>
              <div class="tags-list">
                <span v-for="(item, index) in environmentList" :key="index" class="tag">
                  {{ item }}
                </span>
              </div>
            </div>
            <div class="affinity-group" v-if="trainingList.length > 0">
              <span class="affinity-label text-body-base text-neutral-700">Dressage :</span>
              <div class="tags-list">
                <span v-for="(item, index) in trainingList" :key="index" class="tag">
                  {{ item }}
                </span>
              </div>
            </div>
            <div class="affinity-group" v-if="personalityList.length > 0">
              <span class="affinity-label text-body-base text-neutral-700">Personnalité :</span>
              <div class="tags-list">
                <span v-for="(item, index) in personalityList" :key="index" class="tag">
                  {{ item }}
                </span>
              </div>
            </div>
            <p v-if="environmentList.length === 0 && trainingList.length === 0 && personalityList.length === 0" class="empty-message text-body-base text-neutral-500">
              Aucune affinité sélectionnée
            </p>
          </div>
        </div>

        <!-- Détails & besoins -->
        <div class="resume-section">
          <div class="section-header">
            <h2 class="section-title text-h4 text-neutral-black">Description</h2>
            <button class="edit-button" @click="editSection('details')" type="button">
              <Edit2 :size="20" :stroke-width="2" />
            </button>
          </div>
          <div class="section-content">
            <p class="description-text text-body-base text-neutral-black">
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
        size="base"
        class="btn-submit"
        @click="handleSubmit"
      >
        Terminer
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
  font-weight: var(--font-weight-semibold);
  min-width: 80px;
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
  font-weight: var(--font-weight-semibold);
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
  margin: 0;
  white-space: pre-wrap;
}

.empty-message {
  font-style: italic;
  margin: 0;
}

.fixed-footer {
  position: fixed;
  bottom: 0;
  left: var(--spacing-6);
  right: var(--spacing-6);
  z-index: 10;
  padding-bottom: var(--spacing-6);
}
</style>
