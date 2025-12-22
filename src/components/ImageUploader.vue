<script setup>
import { ref, computed, onUnmounted } from 'vue';
import {Upload, CircleX } from 'lucide-vue-next';

// Props pour la flexibilité
const props = defineProps({
  multiple: {
    type: Boolean,
    default: true
  },
  max: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['filesSelected']);

const fileInput = ref(null);
const selectedFiles = ref([]);
const error = ref('');

const hasFiles = computed(() => selectedFiles.value.length > 0);
const fileCount = computed(() => selectedFiles.value.length);

// On ne peut plus uploader si on est en mode simple et qu'on a déjà une photo, 
// ou si on a atteint la limite max
const canUploadMore = computed(() => {
  if (!props.multiple && selectedFiles.value.length >= 1) return false;
  return selectedFiles.value.length < props.max;
});

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  // Si mode profil, on ne prend que le premier fichier
  const filesToProcess = props.multiple ? files : [files[0]];

  const validFiles = [];
  const errors = [];
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  for (const file of filesToProcess) {
    if (selectedFiles.value.length + validFiles.length >= props.max) {
      errors.push("Limite de photos atteinte");
      break;
    }

    if (!file.type.startsWith('image/')) {
      errors.push(`${file.name}: n'est pas une image`);
      continue;
    }

    if (file.size > 5 * 1024 * 1024) {
      errors.push(`${file.name}: dépasse 5MB`);
      continue;
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`${file.name}: format non supporté`);
      continue;
    }

    // Si on est en mode photo unique, on vide l'existant avant de remplacer
    if (!props.multiple) {
      clearAll();
    }

    const fileWithPreview = {
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    };
    validFiles.push(fileWithPreview);
  }

  if (errors.length > 0) {
    error.value = errors.join(' • ');
    setTimeout(() => { error.value = ''; }, 5000);
  }

  if (validFiles.length > 0) {
    selectedFiles.value.push(...validFiles);
    emit('filesSelected', selectedFiles.value);
  }

  if (fileInput.value) fileInput.value.value = '';
};

const removeFile = (id) => {
  const fileToRemove = selectedFiles.value.find(f => f.id === id);
  if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
  selectedFiles.value = selectedFiles.value.filter(f => f.id !== id);
  emit('filesSelected', selectedFiles.value);
};

const clearAll = () => {
  selectedFiles.value.forEach(f => URL.revokeObjectURL(f.preview));
  selectedFiles.value = [];
  emit('filesSelected', []);
};

onUnmounted(() => {
  selectedFiles.value.forEach(f => URL.revokeObjectURL(f.preview));
});

const triggerFileInput = () => {
  if (canUploadMore.value) fileInput.value?.click();
};
</script>

<template>
  <div class="image-uploader">
    <div v-if="canUploadMore" class="upload-zone" :class="{ 'profile-mode': !multiple }" @click="triggerFileInput">
      <input ref="fileInput" type="file" :multiple="multiple"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" @change="handleFileSelect" hidden />

      <Upload :size="40" :stroke-width="1.5" class="upload-icon" />
      <p class="upload-text">
        {{ multiple ? 'Cliquez ou glissez des images' : 'Cliquez pour ajouter une photo de profil (optionnel)' }}
      </p>
      <p class="upload-hint">JPG, PNG, WebP, GIF (max 5MB par image)</p>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="hasFiles" class="preview-section">
      <div class="preview-header">
        <span class="preview-title" v-if="multiple">
          {{ fileCount }} image{{ fileCount > 1 ? 's' : '' }} sélectionnée{{ fileCount > 1 ? 's' : '' }}
        </span>

        <button type="button" @click="clearAll" class="clear-all-btn">
          {{ multiple ? 'Tout supprimer' : 'Supprimer' }}
        </button>
      </div>

      <div class="preview-grid" :class="{ 'is-profile': !multiple }">
        <div v-for="fileItem in selectedFiles" :key="fileItem.id" class="preview-item">
          <img :src="fileItem.preview" :alt="fileItem.file.name" class="preview-image" /> 
            <CircleX size="30px" @click.stop="removeFile(fileItem.id)" class="remove-preview-btn"/>
          <p v-if="multiple" class="file-name">{{ fileItem.file.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: 100%;
}

/* Zone d'upload avec votre style d'origine */
.upload-zone {
  border: 2px dashed var(--color-primary-300);
  border-radius: var(--radius-lg);
  padding: var(--spacing-8);
  background: var(--color-primary-50, #f5f0ff);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  min-height: 100px;
  justify-content: center;
}

.upload-zone:hover {
  border-color: var(--color-primary-600);
  background: var(--color-primary-100, #ede9fe);
}

/* Style spécifique pour le mode photo de profil ronde */
.upload-zone.profile-mode {
  border-radius: 50%;
  width: 100px;
  height: 100px;
  margin: 0 auto;
  padding: var(--spacing-4);
}

.upload-zone.profile-mode .upload-text {
  font-size: 11px;
  text-align: center;
}

.upload-zone.profile-mode .upload-hint {
  display: none;
}

.upload-icon {
  color: var(--color-primary-600);
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral-900);
  margin: 0;
}

.upload-hint {
  font-size: 12px;
  color: var(--color-neutral-600);
  margin: 0;
  text-align: center;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: var(--spacing-3);
  border-radius: var(--radius-base);
  font-size: 12px;
  text-align: center;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral-900);
}

.clear-all-btn {
  background: transparent;
  border: none;
  color: var(--color-error);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.preview-grid.is-profile {
  justify-content: center;
}

.preview-item {
  position: relative;
  width: 100px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Photo de profil plus grande et ronde */
.preview-grid.is-profile .preview-item {
  width: 150px;
}

.preview-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
}

.preview-grid.is-profile .preview-image {
  border-radius: 50%;
  border: 3px solid var(--color-primary-600);
}

.remove-preview-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  color:  var(--color-primary-600);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.file-name {
  font-size: 10px;
  color: var(--color-neutral-600);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
</style>