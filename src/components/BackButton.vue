<script setup>
import { ChevronLeft } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const props = defineProps({
  size: { type: Number, default: 24 },
  strokeWidth: { type: Number, default: 2 },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'overlay'].includes(value)
  },
  to: { type: String, default: null },
  // NOUVEAU : Si vrai, le bouton ne navigue pas tout seul
  manual: { type: Boolean, default: false }
});

const emit = defineEmits(['click']);
const router = useRouter();

const handleBack = () => {
  emit('click');

  // Si on est en mode manuel, on s'arrête ici
  if (props.manual) return;

  // Comportement automatique pour les autres cas (profils, etc.)
  if (props.to) {
    router.push(props.to);
  } else {
    router.back();
  }
};
</script>

<template>
  <button
    class="back-button"
    :class="[`back-button--${variant}`]"
    @click="handleBack"
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