<script setup>
import { useRouter } from 'vue-router';
import Menu from '@/components/Menu.vue';
import Button from '@/components/Button.vue';

const router = useRouter();

const goToAddAnimal = () => {
  router.push('/owner/animal/add');
};
</script>

<template>
  <div class="owner-animals-page">
    <!-- En-tête -->
    <div class="page-header">
      <h1 class="page-title">Mes Animaux</h1>
    </div>

    <!-- Contenu -->
    <div class="page-content">
      <!-- Bouton ajouter un animal -->
      <div class="add-animal-container">
        <Button 
          variant="primary"
          size="lg"
          @click="goToAddAnimal"
        >
          Ajouter un animal
        </Button>
      </div>

      <!-- Liste des animaux (à implémenter) -->
      <div class="animals-list">
        <p class="no-animals">Aucun animal pour le moment</p>
      </div>
    </div>

    <!-- Menu de navigation -->
    <Menu />
  </div>
</template>

<style scoped>
.owner-animals-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-100);
  padding-bottom: 80px;
}

.page-header {
  padding: var(--spacing-8) var(--spacing-6);
  padding-top: var(--spacing-12);
  background-color: var(--color-neutral-100);
}

.page-title {
  font-family: var(--font-family);
  font-size: var(--heading-h1-size);
  font-weight: var(--heading-h1-weight);
  line-height: var(--heading-h1-height);
  color: var(--color-neutral-black);
  margin: 0;
  text-align: center;
}

.page-content {
  flex: 1;
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.add-animal-container {
  width: 100%;
}

.add-animal-container :deep(button) {
  width: 100%;
  border-radius: var(--radius-full);
  min-height: 56px;
}

.animals-list {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-animals {
  font-family: var(--font-family);
  font-size: var(--body-lg-size);
  color: var(--color-neutral-500);
  text-align: center;
}
</style>
