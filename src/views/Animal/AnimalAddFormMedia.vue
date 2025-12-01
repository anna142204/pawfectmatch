<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeft, Trash2 } from 'lucide-vue-next';
import ProgressSteps from '@/components/ProgressSteps.vue';
import Button from '@/components/Button.vue';
import ImageUploader from '@/components/ImageUploader.vue';

const router = useRouter();

const STEPS = ['Infos générales', 'Médias', 'Affinités', 'Détails & besoins', 'Résumé'];
const CURRENT_STEP = 1;
const STORAGE_KEY = 'animalFormMediaData';

const selectedFiles = ref([]);
const uploadedImages = ref([]);
const isUploading = ref(false);
const uploadProgress = ref({ current: 0, total: 0 });

const hasFiles = computed(() => selectedFiles.value.length > 0);
const hasUploadedImages = computed(() => uploadedImages.value.length > 0);
const totalImagesCount = computed(() => uploadedImages.value.length + selectedFiles.value.length);
const canProceed = computed(() => !isUploading.value && (hasFiles.value || hasUploadedImages.value));

onMounted(() => {
  loadSavedData();
});

const loadSavedData = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const data = JSON.parse(savedData);
      uploadedImages.value = data.images || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  }
};

const saveData = () => {
  try {
    const mediaData = { images: uploadedImages.value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mediaData));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données:', error);
  }
};

const goBack = () => {
  router.push('/owner/animal/add');
};

const handleFilesSelected = (files) => {
  selectedFiles.value = files;
};

const removeUploadedImage = (index) => {
  uploadedImages.value.splice(index, 1);
  saveData();
};

const uploadImages = async () => {
  if (selectedFiles.value.length === 0) return;

  isUploading.value = true;
  uploadProgress.value = { current: 0, total: selectedFiles.value.length };

  try {
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const fileItem = selectedFiles.value[i];
      uploadProgress.value.current = i + 1;

      const formData = new FormData();
      formData.append('image', fileItem.file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Erreur ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } else {
          const text = await response.text();
          console.error('Réponse HTML du serveur:', text.substring(0, 500));
          errorMessage = `Le serveur a renvoyé une erreur (${response.status}). Vérifiez que le backend est démarré.`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      uploadedImages.value.push({
        url: data.url,
        publicId: data.publicId
      });
    }

    // Tout s'est bien passé, on vide les fichiers sélectionnés
    selectedFiles.value = [];
    saveData();
  } catch (error) {
    console.error('Erreur upload:', error);
    alert(error.message || 'Erreur lors de l\'upload des images');
    throw error;
  } finally {
    isUploading.value = false;
    uploadProgress.value = { current: 0, total: 0 };
  }
};

const handleNext = async () => {
  if (!hasFiles.value && !hasUploadedImages.value) {
    alert('Veuillez ajouter au moins une image');
    return;
  }

  // Upload les images sélectionnées si nécessaire
  if (hasFiles.value) {
    await uploadImages();
  }

  // Vérifier qu'on a bien des images uploadées
  if (!hasUploadedImages.value) {
    alert('Aucune image n\'a été uploadée avec succès');
    return;
  }

  saveData();
  router.push('/owner/animal/add/affinity');
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
    <ProgressSteps :steps="STEPS" :current-step="CURRENT_STEP" />

    <!-- Contenu du formulaire -->
    <div class="form-container">
      <!-- Description -->
      <div class="media-description">
        <h2 class="section-title">Ajoutez des photos</h2>
        <p class="description-text">
          Ajoutez des photos de l'animal afin que le futur propriétaire tombe sous son charme
        </p>
        <p class="description-subtext">
          Vous pouvez en sélectionner plusieurs
        </p>
      </div>

      <!-- Image uploader -->
      <ImageUploader @filesSelected="handleFilesSelected" />

      <!-- Images déjà uploadées -->
      <div v-if="hasUploadedImages" class="uploaded-images">
        <div class="uploaded-header">
          <h3 class="uploaded-title">Images sauvegardées</h3>
          <span class="image-count">{{ uploadedImages.length }}</span>
        </div>
        <div class="images-grid">
          <div v-for="(image, index) in uploadedImages" :key="image.publicId" class="image-item">
            <img 
              :src="image.url" 
              :alt="`Image de l'animal ${index + 1}`" 
              class="image-preview" 
            />
            <button 
              type="button"
              @click="removeUploadedImage(index)"
              class="remove-image-btn"
              :aria-label="`Supprimer l'image ${index + 1}`"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Indicateur d'upload -->
      <div v-if="isUploading" class="upload-progress">
        <div class="progress-spinner"></div>
        <p class="progress-text">
          Upload en cours... {{ uploadProgress.current }} / {{ uploadProgress.total }}
        </p>
      </div>

      <!-- Bouton suivant -->
      <div class="form-actions">
        <Button 
          type="button"
          variant="primary"
          size="base"
          class="btn-next"
          @click="handleNext"
          :disabled="!canProceed"
        >
          <span v-if="isUploading">Upload en cours...</span>
          <span v-else-if="hasFiles">Valider et uploader ({{ totalImagesCount }})</span>
          <span v-else>Suivant</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-animal-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-100);
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-6) var(--spacing-5);
  padding-top: var(--spacing-10);
  padding-bottom: var(--spacing-3);
  gap: var(--spacing-4);
  background-color: var(--color-neutral-100);
  flex-shrink: 0;
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
  padding: var(--spacing-5);
  padding-top: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  overflow-y: auto;
}

.media-description {
  text-align: center;
  padding: 0;
}

.section-title {
  font-family: var(--font-family);
  font-size: var(--heading-h4-size);
  font-weight: var(--heading-h4-weight);
  line-height: 1.2;
  color: var(--color-primary-700);
  margin: 0 0 var(--spacing-2) 0;
}

.description-text {
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  line-height: 1.3;
  color: var(--color-neutral-900);
  margin: 0 0 var(--spacing-1) 0;
}

.description-subtext {
  font-family: var(--font-family);
  font-size: var(--body-xs-size);
  line-height: 1.2;
  color: var(--color-neutral-600);
  margin: 0;
}

.uploaded-images {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.uploaded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.uploaded-title {
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
  margin: 0;
}

.image-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--spacing-2);
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
  font-family: var(--font-family);
  font-size: var(--body-xs-size);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: var(--spacing-3);
}

.image-item {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--color-neutral-200);
  transition: transform 0.2s ease;
}

.image-item:active {
  transform: scale(0.98);
}

.image-preview {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-lg);
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.remove-image-btn:hover {
  background: rgba(220, 38, 38, 0.9);
  transform: scale(1.1);
}

.remove-image-btn:active {
  transform: scale(0.95);
}

.upload-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--color-primary-50);
  border-radius: var(--radius-lg);
}

.progress-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-primary-200);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.progress-text {
  font-size: var(--body-sm-size);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary-700);
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-actions {
  margin-top: auto;
  padding-top: var(--spacing-4);
  padding-bottom: var(--spacing-2);
  flex-shrink: 0;
}

.form-actions :deep(.btn-next) {
  width: 100%;
  border-radius: var(--radius-full);
  min-height: 50px;
  text-transform: lowercase;
  font-size: var(--body-base-size);
}

.form-actions :deep(.btn-next:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
