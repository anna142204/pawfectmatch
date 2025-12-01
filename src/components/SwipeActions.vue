<script setup>
import { RotateCcw, Heart } from 'lucide-vue-next';

const emit = defineEmits(['reject', 'like']);

const handleReject = () => {
  emit('reject');
};

const handleLike = () => {
  emit('like');
};
</script>

<template>
  <div class="swipe-actions">
    <!-- Bouton de rejet (rond) -->
    <button 
      class="action-btn btn-reject"
      @click="handleReject"
      type="button"
    >
      <RotateCcw :size="32" :stroke-width="2" />
    </button>

    <!-- Bouton de like (rond) -->
    <button 
      class="action-btn btn-like"
      @click="handleLike"
      type="button"
    >
      <Heart :size="40" :stroke-width="2" fill="white" />
    </button>
  </div>
</template>

<style scoped>
.swipe-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-6);
  padding: var(--spacing-6) 0;
}

.action-btn {
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

.action-btn:active {
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
