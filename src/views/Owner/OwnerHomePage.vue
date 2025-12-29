<script setup>
import Menu from '@/components/Menu.vue';
</script>

<template>
  <div class="owner-home">
    <div class="content">
      <h1>Bienvenue sur votre page Owner</h1>
      <p>Gérez vos animaux et vos demandes d'adoption</p>
    </div>
    
    <Menu />
  </div>
</template>

<style scoped>
.owner-home {
  min-height: 100vh;
  padding-bottom: 80px;
}

.content {
  padding: var(--spacing-6);
}

h1 {
  font-size: var(--heading-h2-size);
  font-weight: var(--heading-h2-weight);
  color: var(--color-neutral-900);
  margin-bottom: var(--spacing-4);
}

p {
  font-size: var(--body-base-size);
  color: var(--color-neutral-600);
}
</style>
