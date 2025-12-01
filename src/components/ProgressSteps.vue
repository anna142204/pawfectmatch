<script setup>
const props = defineProps({
  steps: {
    type: Array,
    required: true
  },
  currentStep: {
    type: Number,
    required: true
  }
});
</script>

<template>
  <div class="progress-steps">
    <!-- Labels au-dessus -->
    <div class="labels-row">
      <div 
        v-for="(step, index) in steps" 
        :key="`label-${index}`"
        class="step-label" 
        :class="{ 'step-active': index === currentStep }"
      >
        {{ step }}
      </div>
    </div>
    
    <!-- Ligne de progression avec cercles -->
    <div class="progress-bar">
      <div class="progress-line"></div>
      <div 
        v-for="(step, index) in steps" 
        :key="`circle-${index}`"
        class="step-circle"
        :class="{ 
          'step-completed': index < currentStep,
          'step-current': index === currentStep 
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.progress-steps {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: var(--spacing-6) 0;
  gap: var(--spacing-3);
}

.labels-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 25px;
  width: 100%;
}

.step-label {
  flex: 1;
  font-family: var(--font-family);
  font-size: 11px;
  font-weight: var(--font-weight-normal);
  color: var(--color-neutral-400);
  text-align: start;
  line-height: 1.3;
}

.step-label.step-active {
  color: var(--color-primary-700);
  font-weight: var(--font-weight-semibold);
}

.progress-bar {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 95%;
}

.progress-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-primary-700);
  z-index: 1;
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-neutral-white);
  border: 3px solid var(--color-primary-700);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.step-circle.step-current {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
  box-shadow: 0 0 0 4px rgba(141, 15, 188, 0.2);
}

.step-circle.step-completed {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
}
</style>
