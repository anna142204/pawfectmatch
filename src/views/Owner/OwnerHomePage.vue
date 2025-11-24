<script setup>
import { ref, onMounted } from 'vue';
import Menu from '@/components/Menu.vue';

const userType = ref('owner');

onMounted(() => {
  // Récupérer le type d'utilisateur depuis localStorage
  const storedUserType = localStorage.getItem('user_type');
  if (storedUserType) {
    userType.value = storedUserType;
  }
});
</script>

<template>
  <div class="owner-home">
    <div class="content">
      <h1>Bienvenue sur votre page Owner</h1>
      <p>Vous êtes connecté en tant que : {{ userType }}</p>
    </div>
    
    <Menu :userType="userType" />
  </div>
</template>

<style scoped>
.owner-home {
  min-height: 100vh;
  padding-bottom: 80px; /* Espace pour le menu fixe */
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
