<script setup>
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Sélectionner'
  },
  options: {
    type: Array,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const handleChange = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<template>
  <div class="select-container">
    <div :class="['select-wrapper', { 'select-wrapper--error': error, 'select-wrapper--disabled': disabled }]">
      <select
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        class="select-field"
        @change="handleChange"
      >
        <option value="" disabled selected>{{ placeholder }}</option>
        <option 
          v-for="option in options" 
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      
      <ChevronDown 
        class="select-icon"
        :size="24"
        :stroke-width="2"
      />
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="select-error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.select-container {
  width: 100%;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-neutral-white);
  border-radius: var(--radius-full);
  padding: var(--spacing-2) var(--spacing-4);
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  min-height: 30px;
  border: 2px solid transparent;
}

.select-wrapper:focus-within {
  background: var(--color-neutral-white);
  box-shadow: 0 4px 24px 0 rgba(166, 77, 255, 0.25);
  border: 2px solid var(--color-primary-600);
}

.select-wrapper--error {
  border: 2px solid var(--color-error);
  box-shadow: 0 4px 20px 0 rgba(239, 68, 68, 0.15);
}

.select-wrapper--error:focus-within {
  border: 2px solid var(--color-error);
  box-shadow: 0 4px 24px 0 rgba(239, 68, 68, 0.25);
}

.select-wrapper--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-neutral-100);
}

.select-field {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-family);
  font-size: 16px;
  line-height: 24px;
  color: var(--color-neutral-black);
  font-weight: var(--font-weight-normal);
  min-width: 0;
  appearance: none;
  cursor: pointer;
  padding-right: var(--spacing-8);
}

.select-field:disabled {
  cursor: not-allowed;
}

.select-field option {
  font-family: var(--font-family);
  padding: var(--spacing-2);
}

.select-icon {
  position: absolute;
  right: var(--spacing-4);
  color: var(--color-accent-800);
  pointer-events: none;
}

.select-error {
  margin-top: var(--spacing-2);
  padding-left: var(--spacing-6);
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  line-height: var(--body-sm-height);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}
</style>
