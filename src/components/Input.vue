<script setup>
import { computed } from 'vue';
import { Mail, Lock, User, Phone, Search } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'email', 'password', 'tel', 'number', 'url'].includes(value)
  },
  placeholder: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: null
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

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);

const iconComponents = {
  email: Mail,
  mail: Mail,
  password: Lock,
  lock: Lock,
  user: User,
  phone: Phone,
  search: Search
};

const getIconComponent = computed(() => {
  return props.icon ? iconComponents[props.icon] : null;
});

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};

const handleFocus = (event) => {
  emit('focus', event);
};

const handleBlur = (event) => {
  emit('blur', event);
};
</script>

<template>
  <div class="input-container">
    <div :class="['input-wrapper', { 'input-wrapper--error': error, 'input-wrapper--disabled': disabled }]">
      <!-- Icon Lucide -->
      <component 
        v-if="getIconComponent" 
        :is="getIconComponent"
        class="input-icon"
        :size="28"
      />

      <!-- Slot pour icône personnalisée -->
      <slot name="icon"></slot>

      <!-- Input field -->
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="input-field"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <!-- Slot pour suffix (ex: bouton clear, toggle password) -->
      <slot name="suffix"></slot>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="input-error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.input-container {
  width: 100%;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-neutral-white);
  border-radius: var(--radius-full);
  padding: var(--spacing-3) var(--spacing-5);
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  min-height: 56px;
  border: 2px solid transparent;
}

.input-wrapper:focus-within {
  background: var(--color-neutral-white);
  box-shadow: 0 4px 24px 0 rgba(166, 77, 255, 0.25);
  border: 2px solid var(--color-primary-600);
}

.input-wrapper--error {
  border: 2px solid var(--color-error);
  box-shadow: 0 4px 20px 0 rgba(239, 68, 68, 0.15);
}

.input-wrapper--error:focus-within {
  border: 2px solid var(--color-error);
  box-shadow: 0 4px 24px 0 rgba(239, 68, 68, 0.25);
}

.input-wrapper--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-neutral-100);
}

.input-icon {
  width: 28px;
  height: 28px;
  color: var(--color-neutral-300);
  margin-right: var(--spacing-3);
  flex-shrink: 0;
  stroke-width: 1.5;
}

.input-wrapper:focus-within .input-icon {
  color: var(--color-neutral-black);
  stroke-width: 2;
}

.input-wrapper--error .input-icon {
  color: var(--color-error);
}

.input-field {
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
}

.input-field::placeholder {
  color: var(--color-neutral-300);
  font-weight: var(--font-weight-light);
}

.input-field:disabled {
  cursor: not-allowed;
}

.input-error {
  margin-top: var(--spacing-2);
  padding-left: var(--spacing-6);
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  line-height: var(--body-sm-height);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}
</style>
