<script setup>
import Button from '../components/Button.vue'
</script>

<template>
  <div class="test-page">
    <!-- Header -->
    <header class="header">
      <h1 class="text-h3 text-primary-700">Test Mobile</h1>
      <p class="text-body-base text-neutral-700">Page de test du design system</p>
    </header>

    <!-- Content -->
    <main class="content">
      <!-- Buttons Section -->
      <section class="section">
        <h2 class="text-h5 text-neutral-900">Boutons</h2>
        <div class="button-group">
          <Button variant="primary" size="lg">Large Primary</Button>
          <Button variant="primary" size="base">Base Primary</Button>
          <Button variant="primary" size="sm">Small Primary</Button>
        </div>
        <div class="button-group">
          <Button variant="secondary" size="lg">Large Secondary</Button>
          <Button variant="secondary" size="base">Base Secondary</Button>
          <Button variant="secondary" size="sm">Small Secondary</Button>
        </div>
        <div class="button-group">
          <Button variant="primary" :disabled="true">Disabled</Button>
        </div>
      </section>

      <!-- Typography Section -->
      <section class="section">
        <h2 class="text-h5 text-neutral-900">Typographie</h2>
        <h1 class="text-h1 text-primary-700">Heading 1</h1>
        <h2 class="text-h2 text-primary-700">Heading 2</h2>
        <h3 class="text-h3 text-primary-700">Heading 3</h3>
        <p class="text-body-lg text-neutral-800">Body Large - Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
        <p class="text-body-base text-neutral-700">Body Base - Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
        <p class="text-body-sm text-neutral-600">Body Small - Lorem ipsum dolor sit amet consectetur.</p>
      </section>

      <!-- Colors Section -->
      <section class="section">
        <h2 class="text-h5 text-neutral-900">Couleurs</h2>
        <div class="color-grid">
          <div class="color-box bg-primary-700">
            <span class="text-label-base text-neutral-white">Primary</span>
          </div>
          <div class="color-box bg-secondary-700">
            <span class="text-label-base text-neutral-white">Secondary</span>
          </div>
          <div class="color-box bg-accent-700">
            <span class="text-label-base text-neutral-white">Accent</span>
          </div>
          <div class="color-box bg-success">
            <span class="text-label-base text-neutral-white">Success</span>
          </div>
          <div class="color-box bg-warning">
            <span class="text-label-base text-neutral-black">Warning</span>
          </div>
          <div class="color-box bg-error">
            <span class="text-label-base text-neutral-white">Error</span>
          </div>
        </div>
      </section>

      <!-- Spacing Section -->
      <section class="section">
        <h2 class="text-h5 text-neutral-900">Espacements</h2>
        <div class="spacing-demo">
          <div class="spacing-box" style="padding: var(--spacing-2);">spacing-2 (8px)</div>
          <div class="spacing-box" style="padding: var(--spacing-4);">spacing-4 (16px)</div>
          <div class="spacing-box" style="padding: var(--spacing-6);">spacing-6 (24px)</div>
          <div class="spacing-box" style="padding: var(--spacing-8);">spacing-8 (32px)</div>
        </div>
      </section>

      <!-- Radius Section -->
      <section class="section">
        <h2 class="text-h5 text-neutral-900">Border Radius</h2>
        <div class="radius-demo">
          <div class="radius-box bg-primary-200" style="border-radius: var(--radius-sm);">sm</div>
          <div class="radius-box bg-primary-300" style="border-radius: var(--radius-base);">base</div>
          <div class="radius-box bg-primary-400" style="border-radius: var(--radius-md);">md</div>
          <div class="radius-box bg-primary-500" style="border-radius: var(--radius-lg);">lg</div>
          <div class="radius-box bg-primary-600" style="border-radius: var(--radius-xl);">xl</div>
          <div class="radius-box bg-primary-700" style="border-radius: var(--radius-full);">full</div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.test-page {
  min-height: 100vh;
  padding-bottom: var(--spacing-10);
}

.header {
  padding: var(--spacing-6);
  background: linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500));
  color: var(--color-neutral-white);
}

.header h1,
.header p {
  color: var(--color-neutral-white);
  margin: 0;
}

.header p {
  margin-top: var(--spacing-2);
}

.content {
  padding: var(--spacing-4);
}

.section {
  margin-bottom: var(--spacing-8);
  padding: var(--spacing-4);
  background-color: var(--color-neutral-50);
  border-radius: var(--radius-base);
}

.section h2 {
  margin: 0 0 var(--spacing-4) 0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.color-box {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-sm);
}

.spacing-demo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.spacing-box {
  background-color: var(--color-primary-100);
  border: 2px solid var(--color-primary-500);
  border-radius: var(--radius-base);
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  color: var(--color-primary-800);
  text-align: center;
}

.radius-demo {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-3);
}

.radius-box {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-white);
}
</style>
