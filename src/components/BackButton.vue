<script setup>
import { ChevronLeft } from 'lucide-vue-next';

defineProps({
  size: {
    type: Number,
    default: 24
  },
  strokeWidth: {
    type: Number,
    default: 2
  },
  variant: {
    type: String,
    default: 'default', // 'default' | 'overlay'
    validator: (value) => ['default', 'overlay'].includes(value)
  }
});

defineEmits(['click']);
</script>

<template>
  <button
    class="back-button"
    :class="[`back-button--${variant}`]"
    @click="$emit('click')"
    type="button"
  >
    <ChevronLeft :size="size" :stroke-width="strokeWidth" />
  </button>
</template>

<style scoped>
.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button--default {
  background: transparent;
  color: var(--color-neutral-black);
  padding: var(--spacing-2);
  margin-left: calc(var(--spacing-2) * -1);
}

.back-button--overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-neutral-black);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 0;
}

.back-button:active {
  opacity: 0.7;
}

.back-button--overlay:hover {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
