<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  animal: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['swipe-left', 'swipe-right', 'click']);

const card = ref(null);
const isDragging = ref(false);
const startX = ref(0);
const currentX = ref(0);
const offsetX = ref(0);

const transform = computed(() => {
  if (!isDragging.value && offsetX.value === 0) return 'translate(0, 0) rotate(0deg)';
  const rotation = offsetX.value / 20;
  return `translate(${offsetX.value}px, 0) rotate(${rotation}deg)`;
});

const opacity = computed(() => {
  return 1 - Math.abs(offsetX.value) / 300;
});

const handleTouchStart = (e) => {
  isDragging.value = true;
  startX.value = e.touches[0].clientX;
};

const handleTouchMove = (e) => {
  if (!isDragging.value) return;
  currentX.value = e.touches[0].clientX;
  offsetX.value = currentX.value - startX.value;
};

const handleTouchEnd = () => {
  isDragging.value = false;
  
  if (Math.abs(offsetX.value) > 100) {
    if (offsetX.value > 0) {
      emit('swipe-right', props.animal);
    } else {
      emit('swipe-left', props.animal);
    }
  }
  
  offsetX.value = 0;
};

const handleMouseDown = (e) => {
  isDragging.value = true;
  startX.value = e.clientX;
};

const handleClick = (e) => {
  // Émettre l'événement click seulement si ce n'était pas un drag
  if (Math.abs(offsetX.value) < 5) {
    emit('click', props.animal);
  }
};

const handleMouseMove = (e) => {
  if (!isDragging.value) return;
  currentX.value = e.clientX;
  offsetX.value = currentX.value - startX.value;
};

const handleMouseUp = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  
  if (Math.abs(offsetX.value) > 100) {
    if (offsetX.value > 0) {
      emit('swipe-right', props.animal);
    } else {
      emit('swipe-left', props.animal);
    }
  }
  
  offsetX.value = 0;
};
</script>

<template>
  <div 
    ref="card"
    class="swipe-card"
    :style="{ transform, opacity }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @click="handleClick"
  >
    <!-- Badges en haut -->
    <div class="card-badges">
      <div class="badge badge-distance">
        <span>{{ animal.distance || '9 km' }}</span>
      </div>
      <div class="badge badge-urgent" v-if="animal.urgent">
        <span>urgent</span>
      </div>
    </div>

    <!-- Image de l'animal avec overlay gradient -->
    <div class="card-image">
      <img :src="animal.images[0]" :alt="animal.name" />
      <div class="image-overlay"></div>
    </div>

    <!-- Contenu superposé sur l'image -->
    <div class="card-content">
      <!-- Informations de l'animal -->
      <div class="card-info">
        <h2 class="card-title">{{ animal.name }}</h2>
        <p class="card-description">{{ animal.description }}</p>
      </div>

      <!-- Tags/Éléments -->
      <div class="card-tags">
        <span 
          v-for="(tag, index) in animal.tags" 
          :key="index"
          class="tag"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Boutons d'action intégrés dans la carte -->
      <div class="card-actions">
        <button 
          class="card-action-btn btn-reject"
          @click.stop="emit('swipe-left', animal)"
          type="button"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <button 
          class="card-action-btn btn-like"
          @click.stop="emit('swipe-right', animal)"
          type="button"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.swipe-card {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--color-neutral-900);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
  cursor: grab;
  user-select: none;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
  position: relative;
}

.swipe-card:active {
  cursor: grabbing;
}

.card-badges {
  position: absolute;
  top: var(--spacing-4);
  left: var(--spacing-4);
  right: var(--spacing-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.badge {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-full);
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  font-weight: var(--font-weight-semibold);
  backdrop-filter: blur(8px);
}

.badge-distance {
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-neutral-800);
}

.badge-urgent {
  background: rgba(239, 68, 68, 0.95);
  color: var(--color-neutral-white);
}

.card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 30%, transparent 100%);
  pointer-events: none;
}

.card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 60%, transparent 100%);
  padding-top: var(--spacing-16);
}

.card-info {
  padding: var(--spacing-6) var(--spacing-6) var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.card-title {
  font-family: var(--font-family);
  font-size: var(--heading-h2-size);
  font-weight: var(--heading-h2-weight);
  line-height: var(--heading-h2-height);
  color: var(--color-neutral-white);
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.card-description {
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  line-height: var(--body-base-height);
  color: var(--color-neutral-white);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  opacity: 0.95;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  padding: 0 var(--spacing-6) var(--spacing-6);
}

.tag {
  padding: var(--spacing-2) var(--spacing-4);
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-full);
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  color: var(--color-neutral-white);
  font-weight: var(--font-weight-medium);
}

.card-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-6);
  padding: var(--spacing-6);
  padding-top: var(--spacing-4);
}

.card-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-lg);
  -webkit-user-select: none;
  user-select: none;
}

.card-action-btn:active {
  transform: scale(0.95);
}

.btn-reject {
  width: 72px;
  height: 72px;
  background: var(--color-neutral-400);
  color: var(--color-neutral-white);
}

.btn-reject:hover {
  background: var(--color-neutral-500);
}

.btn-reject:active {
  background: var(--color-neutral-600);
}

.btn-like {
  width: 88px;
  height: 88px;
  background: var(--color-secondary-600);
  color: var(--color-neutral-white);
}

.btn-like:hover {
  background: var(--color-secondary-700);
}

.btn-like:active {
  background: var(--color-secondary-800);
  transform: scale(0.92);
}
</style>
