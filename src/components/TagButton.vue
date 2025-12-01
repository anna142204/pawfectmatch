<script setup>
import { Plus } from 'lucide-vue-next';

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  selected: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle']);

const handleClick = () => {
  emit('toggle');
};
</script>

<template>
  <button 
    :class="['tag-button', { 'tag-button--selected': selected }]"
    @click="handleClick"
    type="button"
  >
    <component 
      v-if="icon" 
      :is="icon" 
      :size="20" 
      :stroke-width="2.5"
      class="tag-icon"
    />
    <span class="tag-label">{{ label }}</span>
    <Plus 
      :size="20" 
      :stroke-width="2.5"
      class="tag-plus"
    />
  </button>
</template>

<style scoped>
.tag-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-primary-100);
  border: none;
  border-radius: var(--radius-full);
  font-family: var(--font-family);
  font-size: var(--body-md-size);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary-700);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tag-button:hover {
  background-color: var(--color-primary-200);
}

.tag-button:active {
  transform: scale(0.95);
}

.tag-button--selected {
  background-color: var(--color-primary-600);
  color: var(--color-neutral-white);
}

.tag-button--selected:hover {
  background-color: var(--color-primary-700);
}

.tag-icon,
.tag-plus {
  flex-shrink: 0;
}

.tag-label {
  line-height: 1;
}
</style>
