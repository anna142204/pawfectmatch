<script setup>
import { useToast } from '@/composables/useToast';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-vue-next';

const { toasts } = useToast();

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'error': return XCircle;
    case 'info': return Info;
    case 'warning': return AlertTriangle;
    default: return Info;
  }
};
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
      >
        <component :is="getIcon(toast.type)" :size="20" />
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-4);
  right: var(--spacing-4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-5);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-white);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 400px;
  pointer-events: auto;
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  font-weight: var(--font-weight-medium);
}

.toast-success {
  color: var(--color-success);
  border-left: 4px solid var(--color-success);
}

.toast-error {
  color: var(--color-error);
  border-left: 4px solid var(--color-error);
}

.toast-info {
  color: var(--color-primary-600);
  border-left: 4px solid var(--color-primary-600);
}

.toast-warning {
  color: #f59e0b;
  border-left: 4px solid #f59e0b;
}

.toast-message {
  flex: 1;
  color: var(--color-neutral-black);
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (max-width: 480px) {
  .toast-container {
    left: var(--spacing-4);
    right: var(--spacing-4);
  }

  .toast {
    min-width: auto;
    width: 100%;
  }
}
</style>
