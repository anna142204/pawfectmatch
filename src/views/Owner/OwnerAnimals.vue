<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Edit } from 'lucide-vue-next';
import Menu from '@/components/Menu.vue';
import Button from '@/components/Button.vue';
import { useToast } from '@/composables/useToast';

import dogImg from '@/images/dog.webp';
import catImg from '@/images/cat.webp';
import birdImg from '@/images/bird.webp';
import rodentImg from '@/images/rodent.webp';
import otherImg from '@/images/other.webp';

const router = useRouter();
const { success, error } = useToast();

const animals = ref([]);
const loading = ref(true);
const ownerId = ref(null);
const selectedCategory = ref(null);

const categories = [
  { id: 'chien', label: 'Chiens', image: dogImg },
  { id: 'chat', label: 'Chats', image: catImg },
  { id: 'lapin', label: 'Lapins', image: rodentImg },
  { id: 'oiseau', label: 'Oiseaux', image: birdImg },
  { id: 'autre', label: 'Autres', image: otherImg }
];

const filteredAnimals = computed(() => {
  if (!selectedCategory.value) {
    return animals.value;
  }
  return animals.value.filter(animal => animal.species === selectedCategory.value);
});

const hasFilteredAnimals = computed(() => filteredAnimals.value.length > 0);

onMounted(async () => {
  ownerId.value = localStorage.getItem('user_id');
  if (!ownerId.value) {
    error('Utilisateur non identifié');
    router.push('/login');
    return;
  }
  await fetchAnimals();
});

const fetchAnimals = async () => {
  loading.value = true;
  try {
    const response = await fetch(`/api/animals?ownerId=${ownerId.value}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des animaux');
    }

    const data = await response.json();
    animals.value = data.animals || data;
  } catch (err) {
    error(err.message || 'Impossible de charger les animaux');
  } finally {
    loading.value = false;
  }
};

const goToAddAnimal = () => {
  localStorage.removeItem('editingAnimalId');
  localStorage.removeItem('animal_add_draft');
  router.push('/owner/animal/add');
};

const editAnimal = (animalId) => {
  localStorage.setItem('editingAnimalId', animalId);
  router.push('/owner/animal/edit/' + animalId);
};

const deleteAnimal = async (animal) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${animal.name} ?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/animals/${animal._id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression');
    }

    success(`${animal.name} a été supprimé avec succès`);
    await fetchAnimals();
  } catch (err) {
    error(err.message || 'Impossible de supprimer l\'animal');
  }
};

const getAvailabilityText = (available) => available ? 'Disponible' : 'Adopté';

const getAvailabilityClass = (available) => available ? 'available' : 'adopted';

const selectCategory = (categoryId) => {
  if (selectedCategory.value === categoryId) {
    selectedCategory.value = null;
  } else {
    selectedCategory.value = categoryId;
  }
};

const isCategorySelected = (categoryId) => {
  return selectedCategory.value === categoryId;
};
</script>

 <template>
  <div class="owner-animals-page">
    <div class="page-header">
      <h1 class="text-h1">Animaux</h1>
    </div>

    <div class="page-content">
      <section class="categories-section">
        <h4 class="section-title text-h4 text-primary-700">Catégories</h4>
        <div class="categories-grid">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-item"
            :class="{ 'category-active': isCategorySelected(category.id) }"
            @click="selectCategory(category.id)"
          >
            <div class="category-icon">
              <img :src="category.image" :alt="category.label" class="category-img" />
            </div>
            
            <p class="category-label text-body-sm text-neutral-black">{{ category.label }}</p>
          </div>
        </div>
      </section>

      <section class="announcements-section">
        <div class="section-header">
          <h4 class="section-title text-h4 text-primary-700">Mes annonces</h4>
          <button class="btn-filters text-body-base text-primary-600">Filtres</button>
        </div>

        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
        </div>

        <div v-else-if="hasFilteredAnimals" class="animals-grid">
          <div v-for="animal in filteredAnimals" :key="animal._id" class="animal-card">
            <img :src="animal.images[0]" :alt="animal.name" class="animal-image" />
            <h3 class="animal-name text-body-lg text-neutral-white">{{ animal.name }}</h3>
            <button class="btn-edit-card" @click="editAnimal(animal._id)">
              <Edit :size="20" :stroke-width="2.5" />
            </button>
          </div>
        </div>

        <div v-else class="empty-message">
          <p class="text-body-base text-neutral-500">
            {{ selectedCategory ? 'Aucun animal de cette catégorie' : 'Aucune annonce pour le moment' }}
          </p>
        </div>
      </section>
    </div>

    <div class="floating-add-button">
      <Button variant="primary" size="base" @click="goToAddAnimal" class="btn-add-animal">
        Ajouter un animal
      </Button>
    </div>

    <Menu />
  </div>
</template>

<style scoped>
.owner-animals-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
}

.page-header {
  padding-top: max(16px, env(safe-area-inset-top)); 
  padding-bottom: 16px;
}

.page-title {
  margin: 0;
  text-align: center;
}

.page-content {
  flex: 1;
  padding: 0 0 var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.section-title {
  margin: 0 0 var(--spacing-4) 0;
}

.categories-section {
  margin-bottom: var(--spacing-3);
  overflow: hidden;
  padding-left: var(--spacing-7);
}

.categories-grid {
  display: flex;
  gap: var(--spacing-4);
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
  scrollbar-width: none;
}

.categories-grid::-webkit-scrollbar {
  display: none;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  min-width: 80px;
}

.category-item:active {
  transform: scale(0.95);
}

.category-icon {
  width: 70px;
  height: 70px;
  background: var(--color-neutral-white);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
  padding: 10px;
}

.category-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.category-active .category-icon {
  background: var(--color-primary-600);
  box-shadow: 0 4px 12px rgba(255, 100, 46, 0.3);
}

.category-label {
  margin: 0;
  text-align: center;
}

.announcements-section {
  padding: 0 var(--spacing-7);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.btn-filters {
  background: transparent;
  border: none;
  padding: var(--spacing-2);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
}

/* Loading */
.loading-container {
  display: flex;
  justify-content: center;
  padding: var(--spacing-12) 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-neutral-200);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Grid des animaux */
.animals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

/* Carte animal */
.animal-card {
  position: relative;
  background: var(--color-neutral-white);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  aspect-ratio: 1;
}

.animal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.animal-name {
  position: absolute;
  bottom: var(--spacing-3);
  left: var(--spacing-3);
  right: 56px;
  margin: 0;
  font-weight: var(--font-weight-semibold);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-edit-card {
  position: absolute;
  bottom: var(--spacing-3);
  right: var(--spacing-3);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary-600);
  color: var(--color-neutral-white);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.btn-edit-card:active {
  transform: scale(0.9);
}

/* État vide */
.empty-message {
  padding: var(--spacing-12) 0;
  text-align: center;
}

.empty-message p {
  margin: 0;
}

/* Bouton flottant */
.floating-add-button {
  position: fixed;
  bottom: 96px;
  left: 0;
  right: 0;
  padding: var(--spacing-4) var(--spacing-6);
  z-index: 100;
  pointer-events: none;
}

.btn-add-animal {
  width: 100%;
  pointer-events: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* Responsive */
@media (max-width: 380px) {
  .categories-grid {
    gap: var(--spacing-3);
  }

  .category-icon {
    width: 70px;
    height: 70px;
    font-size: 36px;
  }

  .category-label {
    font-size: var(--body-xs-size);
  }
}
</style>
