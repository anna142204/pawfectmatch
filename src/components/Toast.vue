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
  z-index: 9999;
  width: 100%;
  max-width: 430px;
  left: 50% !important;
  transform: translateX(-50%) !important; 
  padding: 0 var(--spacing-8);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-white);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  width: 100%; 
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
  font-size: 14px;
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
</style>