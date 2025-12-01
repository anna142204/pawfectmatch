<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronLeft, Plus } from 'lucide-vue-next';
import ProgressSteps from '@/components/ProgressSteps.vue';
import Button from '@/components/Button.vue';

const router = useRouter();
const route = useRoute();

// Étapes du formulaire
const steps = ['Infos générales', 'Médias', 'Affinités', 'Détails & besoins', 'Résumé'];
const currentStep = ref(1);

// Images sélectionnées
const selectedImages = ref([]);
const mainImageInput = ref(null);
const additionalImagesInput = ref([null, null, null, null]);

// Charger les données existantes si disponibles
onMounted(() => {
  const savedData = localStorage.getItem('animalFormMediaData');
  if (savedData) {
    const data = JSON.parse(savedData);
    selectedImages.value = data.images || [];
  }
});

const goBack = () => {
  if (route.query.from === 'resume') {
    router.push('/owner/animal/add/resume');
  } else {
    router.push('/owner/animal/add');
  }
};

const handleMainImageClick = () => {
  mainImageInput.value.click();
};

const handleAdditionalImageClick = (index) => {
  additionalImagesInput.value[index].click();
};

const handleMainImageChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (selectedImages.value.length === 0) {
        selectedImages.value.push(e.target.result);
      } else {
        selectedImages.value[0] = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }
};

const handleAdditionalImageChange = (event, index) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const actualIndex = index + 1;
      if (selectedImages.value[actualIndex]) {
        selectedImages.value[actualIndex] = e.target.result;
      } else {
        selectedImages.value.push(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }
};

const handleNext = () => {
  // Sauvegarder les données
  const mediaData = {
    images: selectedImages.value
  };
  localStorage.setItem('animalFormMediaData', JSON.stringify(mediaData));
  
  // Si on vient du résumé, retourner au résumé, sinon aller à l'étape suivante
  if (route.query.from === 'resume') {
    router.push('/owner/animal/add/resume');
  } else {
    router.push('/owner/animal/add/affinity');
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

    <!-- Contenu du formulaire -->
    <div class="form-container">
      <!-- Description -->
      <div class="media-description">
        <p class="description-text">
          Ajoutez des photos et/ou vidéos de l'animal afin que le futur propriétaire tombe sous son charme
        </p>
        <p class="description-subtext">
          (Vous pouvez en sélectionner plusieurs)
        </p>
      </div>

      <!-- Image principale -->
      <div class="main-image-container">
        <input
          ref="mainImageInput"
          type="file"
          accept="image/*,video/*"
          class="file-input"
          @change="handleMainImageChange"
        />
        <div 
          class="main-image-box"
          :class="{ 'has-image': selectedImages[0] }"
          @click="handleMainImageClick"
        >
          <img 
            v-if="selectedImages[0]" 
            :src="selectedImages[0]" 
            alt="Image principale"
            class="preview-image"
          />
          <div v-else class="import-placeholder">
            <span class="import-text">Importer</span>
          </div>
        </div>
      </div>

      <!-- Images additionnelles -->
      <div class="additional-images-container">
        <div 
          v-for="index in 4" 
          :key="index"
          class="additional-image-box"
          :class="{ 'has-image': selectedImages[index] }"
          @click="handleAdditionalImageClick(index - 1)"
        >
          <input
            :ref="el => additionalImagesInput[index - 1] = el"
            type="file"
            accept="image/*,video/*"
            class="file-input"
            @change="(e) => handleAdditionalImageChange(e, index - 1)"
          />
          <img 
            v-if="selectedImages[index]" 
            :src="selectedImages[index]" 
            alt="Image additionnelle"
            class="preview-image"
          />
          <div v-else class="add-icon">
            <Plus :size="32" :stroke-width="2.5" />
          </div>
        </div>
      </div>

      <!-- Bouton suivant -->
      <div class="form-actions">
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
  padding-top: var(--spacing-8);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.media-description {
  text-align: center;
  padding: 0 var(--spacing-4);
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

.file-input {
  display: none;
}

.main-image-container {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-4);
}

.main-image-box {
  width: 100%;
  max-width: 340px;
  aspect-ratio: 4/3;
  border: 2px dashed var(--color-secondary-500);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background-color: var(--color-neutral-white);
  transition: all 0.2s ease;
}

.main-image-box:hover {
  border-color: var(--color-secondary-600);
  background-color: var(--color-secondary-50);
}

.main-image-box.has-image {
  border-style: solid;
  padding: 0;
}

.import-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.import-text {
  font-family: var(--font-family);
  font-size: var(--body-lg-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-white);
  background-color: var(--color-secondary-500);
  padding: var(--spacing-3) var(--spacing-8);
  border-radius: var(--radius-full);
  text-transform: capitalize;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.additional-images-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-4);
  margin-top: var(--spacing-2);
}

.additional-image-box {
  aspect-ratio: 1;
  border: 2px dashed var(--color-secondary-500);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background-color: var(--color-neutral-white);
  transition: all 0.2s ease;
}

.additional-image-box:hover {
  border-color: var(--color-secondary-600);
  background-color: var(--color-secondary-50);
}

.additional-image-box.has-image {
  border-style: solid;
  padding: 0;
}

.add-icon {
  color: var(--color-secondary-500);
  display: flex;
  align-items: center;
  justify-content: center;
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
