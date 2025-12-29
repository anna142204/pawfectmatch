<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Input from '@/components/Input.vue';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  modelValue: String,
  options: { type: Array, default: () => [] },
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  error: String,
  label: String 
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);

const searchQuery = ref('');
const isOpen = ref(false);
const containerRef = ref(null);

watch(() => props.modelValue, (newVal) => {
  searchQuery.value = newVal || '';
}, { immediate: true });

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter(opt => opt.toLowerCase().includes(query));
});

const handleInput = (value) => {
  searchQuery.value = value;
  isOpen.value = true;
  emit('update:modelValue', value);
};

const selectOption = (option) => {
  searchQuery.value = option;
  emit('update:modelValue', option);
  isOpen.value = false;
};

const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div class="autocomplete-wrapper" ref="containerRef">
    
    <label v-if="label" class="form-label">{{ label }}</label>

    <Input
      :modelValue="searchQuery"
      @update:modelValue="handleInput"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :error="error"
      @focus="isOpen = true"
    >
      <template #suffix>
        <ChevronDown 
          class="chevron-icon" 
          :class="{ 'is-rotated': isOpen }" 
          :size="24" 
        />
      </template>
    </Input>

    <transition name="fade">
      <ul v-if="isOpen && filteredOptions.length > 0" class="suggestions-list">
        <li 
          v-for="option in filteredOptions" 
          :key="option"
          @click="selectOption(option)"
          class="suggestion-item"
        >
          {{ option }}
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.autocomplete-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-neutral-900);
}

.chevron-icon {
  color: var(--color-neutral-400);
  transition: transform 0.2s ease;
  pointer-events: none;
}
.chevron-icon.is-rotated {
  transform: rotate(180deg);
  color: var(--color-primary-600);
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin-top: 4px;
  
  background: var(--color-neutral-white);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-lg);
  
  max-height: 250px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
}

.suggestion-item {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-neutral-black);
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--color-neutral-100);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
  font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>