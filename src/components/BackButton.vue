<script setup>
import { ChevronLeft } from 'lucide-vue-next';

defineProps({
  size: {
    type: Number,
    default: 32
  },
  strokeWidth: {
    type: Number,
    default: 2
  }
});

defineEmits(['click']);
</script>

<template>
  <button class="back-button" @click="$emit('click')" type="button">
    <ChevronLeft :size="size" :stroke-width="strokeWidth" />
  </button>
</template>

<style scoped>
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
</style>
