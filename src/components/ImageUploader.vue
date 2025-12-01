<script setup>
import { ref, computed } from 'vue';
import { X, Upload } from 'lucide-vue-next';

const emit = defineEmits(['filesSelected']);

const fileInput = ref(null);
const selectedFiles = ref([]);
const error = ref('');

const hasFiles = computed(() => selectedFiles.value.length > 0);
const fileCount = computed(() => selectedFiles.value.length);

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const validFiles = [];
  const errors = [];
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  for (const file of files) {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      errors.push(`${file.name}: n'est pas une image`);
      continue;
    }

    // Bloquer les SVG
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      errors.push(`${file.name}: les SVG ne sont pas autorisés`);
      continue;
    }

    // Vérifier que le type est dans la liste autorisée
    if (!allowedTypes.includes(file.type)) {
      errors.push(`${file.name}: format non supporté (JPG, PNG, WebP, GIF uniquement)`);
      continue;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      errors.push(`${file.name}: dépasse 5MB`);
      continue;
    }

    // Créer la prévisualisation
    const reader = new FileReader();
    const fileWithPreview = { file, preview: '', id: Date.now() + Math.random() };
    
    reader.onload = (evt) => {
      fileWithPreview.preview = evt.target.result;
    };
    reader.readAsDataURL(file);

    validFiles.push(fileWithPreview);
  }

  if (errors.length > 0) {
    error.value = errors.join(' • ');
    setTimeout(() => {
      error.value = '';
    }, 5000);
  } else {
    error.value = '';
  }

  if (validFiles.length > 0) {
    selectedFiles.value.push(...validFiles);
    emit('filesSelected', selectedFiles.value);
  }

  // Reset input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const removeFile = (id) => {
  selectedFiles.value = selectedFiles.value.filter(f => f.id !== id);
  emit('filesSelected', selectedFiles.value);
};

const clearAll = () => {
  selectedFiles.value = [];
  error.value = '';
  emit('filesSelected', []);
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const droppedFiles = e.dataTransfer.files;
  if (droppedFiles.length > 0) {
    handleFileSelect({ target: { files: droppedFiles } });
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};
</script>

<template>
  <div class="image-uploader">
    <div 
      class="upload-zone"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput"
        type="file" 
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        @change="handleFileSelect"
        hidden
      />
      
      <Upload :size="40" :stroke-width="1.5" class="upload-icon" />
      <p class="upload-text">Cliquez ou glissez des images</p>
      <p class="upload-hint">JPG, PNG, WebP, GIF (max 5MB par image)</p>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- Prévisualisations -->
    <div v-if="hasFiles" class="preview-section">
      <div class="preview-header">
        <span class="preview-title">{{ fileCount }} image{{ fileCount > 1 ? 's' : '' }} sélectionnée{{ fileCount > 1 ? 's' : '' }}</span>
        <button 
          type="button"
          @click="clearAll"
          class="clear-all-btn"
        >
          Tout supprimer
        </button>
      </div>
      <div class="preview-grid">
        <div v-for="fileItem in selectedFiles" :key="fileItem.id" class="preview-item">
          <img :src="fileItem.preview" :alt="fileItem.file.name" class="preview-image" />
          <button 
            type="button" 
            @click.stop="removeFile(fileItem.id)"
            class="remove-preview-btn"
            :aria-label="`Supprimer ${fileItem.file.name}`"
          >
            <X :size="14" />
          </button>
          <p class="file-name">{{ fileItem.file.name }}</p>
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

.upload-zone:active {
  transform: scale(0.99);
}

.upload-icon {
  color: var(--color-primary-600);
}

.upload-text {
  font-size: var(--body-base-size);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-900);
  margin: 0;
}

.upload-hint {
  font-size: var(--body-sm-size);
  color: var(--color-neutral-600);
  margin: 0;
  text-align: center;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: var(--spacing-3);
  border-radius: var(--radius-base);
  font-size: var(--body-sm-size);
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
  font-size: var(--body-base-size);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-900);
}

.clear-all-btn {
  background: transparent;
  border: none;
  color: var(--color-error);
  font-size: var(--body-sm-size);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  padding: var(--spacing-2);
}

.clear-all-btn:active {
  opacity: 0.7;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-3);
}

.preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.preview-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-lg);
  background: var(--color-neutral-200);
}

.remove-preview-btn {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-preview-btn:hover {
  background: rgba(220, 38, 38, 0.9);
  transform: scale(1.1);
}

.remove-preview-btn:active {
  transform: scale(0.95);
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
