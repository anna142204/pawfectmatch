<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'base',
    validator: (value) => ['sm', 'base', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const getTextClass = (size) => {
  const textClasses = {
    'sm': 'text-button-sm',
    'base': 'text-button-md',
    'lg': 'text-button-base'
  }
  return textClasses[size]
}
</script>

<template>
  <button :class="['btn', `btn-${variant}`, `btn-${size}`, getTextClass(size)]" :disabled="disabled"
    @click="$emit('click')">
    <slot></slot>
  </button>
</template>

<style scoped>
.btn {
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.btn-sm {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-sm);
  width: 100%;
}

.btn-base {
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-base);
  width: 100%;
}

.btn-lg {
  padding: var(--spacing-4) var(--spacing-8);
  border-radius: var(--radius-lg);
  width: 100%;
}

/* Primary variant */
.btn-primary {
  background-color: var(--color-primary-700);
  color: var(--color-neutral-white);
  border-color: var(--color-primary-700);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-800);
  border-color: var(--color-primary-800);
}

.btn-primary:active:not(:disabled) {
  background-color: var(--color-primary-900);
  border-color: var(--color-primary-900);
}

/* Secondary variant */
.btn-secondary {
  background-color: transparent;
  color: var(--color-primary-700);
  border-color: var(--color-primary-700);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-primary-50);
  color: var(--color-primary-800);
  border-color: var(--color-primary-800);
}

.btn-secondary:active:not(:disabled) {
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
  border-color: var(--color-primary-900);
}

/* Danger variant */
.btn-danger {
  background-color: #dc2626;
  color: var(--color-neutral-white);
  border-color: #dc2626;
}

.btn-danger:hover:not(:disabled) {
  background-color: #b91c1c;
  border-color: #b91c1c;
}

.btn-danger:active:not(:disabled) {
  background-color: #991b1b;
  border-color: #991b1b;
}
</style>
