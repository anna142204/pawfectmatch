<script setup>
import { X } from 'lucide-vue-next';
import Button from './Button.vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirmation'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirmer'
  },
  cancelText: {
    type: String,
    default: 'Annuler'
  },
  type: {
    type: String,
    default: 'warning', // warning, danger, info
    validator: (value) => ['warning', 'danger', 'info'].includes(value)
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};

const handleBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    handleCancel();
  }
};
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop" @click="handleBackdropClick">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title text-h4 text-neutral-black">{{ title }}</h3>
          <button class="btn-close" @click="handleCancel" type="button">
            <X :size="24" :stroke-width="2" />
          </button>
        </div>
        
        <div class="modal-body">
          <p class="modal-message text-body-base text-neutral-700">{{ message }}</p>
        </div>

        <div class="modal-footer">
          <Button
            variant="secondary"
            size="base"
            @click="handleCancel"
            class="btn-cancel"
          >
            {{ cancelText }}
          </Button>
          <Button
            :variant="type === 'danger' ? 'danger' : 'primary'"
            size="base"
            @click="handleConfirm"
            class="btn-confirm"
          >
            {{ confirmText }}
          </Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-4);
}

.modal-container {
  background-color: var(--color-neutral-white);
  border-radius: var(--radius-2xl);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 400px;
  width: 100%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-neutral-200);
}

.modal-title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.btn-close {
  background: none;
  border: none;
  color: var(--color-neutral-500);
  cursor: pointer;
  padding: var(--spacing-2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-base);
  transition: all 0.2s ease;
}

.btn-close:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-700);
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-message {
  margin: 0;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  border-top: 1px solid var(--color-neutral-200);
}

.btn-cancel,
.btn-confirm {
  flex: 1;
}

/* Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>
