<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { Upload, X, Trash2 } from 'lucide-vue-next';

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

const canUploadMore = computed(() => {
  if (!props.multiple && selectedFiles.value.length >= 1) return false;
  return selectedFiles.value.length < props.max;
});

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

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
    <input ref="fileInput" type="file" :multiple="multiple"
      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" @change="handleFileSelect" hidden />

    <div v-if="canUploadMore" class="upload-zone" :class="{ 'profile-mode': !multiple }" @click="triggerFileInput">
      <Upload :size="40" :stroke-width="1.5" class="upload-icon" />
      <p class="upload-text">
        {{ multiple ? 'Cliquez ou glissez des images' : 'Cliquez pour ajouter une photo de profil' }}
      </p>
      <p class="upload-hint" v-if="multiple">JPG, PNG, WebP, GIF (max 5MB)</p>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="hasFiles" class="preview-section" :class="{ 'is-profile-mode': !multiple }">
      
      <div class="preview-header" v-if="multiple">
        <span class="preview-title">
          {{ fileCount }} image{{ fileCount > 1 ? 's' : '' }}
        </span>
        <button type="button" @click="clearAll" class="clear-all-btn">
          <Trash2 :size="16" /> Tout supprimer
        </button>
      </div>

      <div class="preview-grid" :class="{ 'is-profile': !multiple }">
        <div v-for="fileItem in selectedFiles" :key="fileItem.id" class="preview-item">
          
          <img 
            :src="fileItem.preview" 
            :alt="fileItem.file.name" 
            class="preview-image" 
            :class="{ 'clickable': !multiple }"
            @click="!multiple ? triggerFileInput() : null"
          /> 
          
          <button type="button" @click.stop="removeFile(fileItem.id)" class="remove-preview-btn">
            <X :size="16" stroke-width="2.5" />
          </button>

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
  text-align: center;
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

/* CORRECTION ALIGNEMENT TRASH */
.clear-all-btn {
  background: transparent;
  border: none;
  color: var(--color-error);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px; /* Espace entre icône et texte */
}

.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  /* Padding pour éviter que les boutons "X" ne soient coupés */
  padding: 10px;
  margin: -10px;
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

/* CORRECTION DU BOUTON X */
.remove-preview-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 26px; /* Taille du bouton */
  height: 26px;
  border-radius: 50%;
  
  /* Fond BLANC, Bordure VIOLETTE */
  background: white;
  border: 1px solid var(--color-primary-600);
  color: var(--color-primary-600); /* Icône violette */
  
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.remove-preview-btn:hover {
  background-color: var(--color-primary-50);
}

.cancel-profile-link {
  background: none;
  border: none;
  text-decoration: underline;
  color: var(--color-neutral-500);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 4px;
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