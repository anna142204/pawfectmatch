<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { MapPin, User, ChevronRight, PawPrint } from 'lucide-vue-next';

const router = useRouter();
const owners = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = 5; // On en affiche peu pour ne pas trop allonger la Home

onMounted(async () => {
  try {
    const response = await fetch('/api/owners', { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      owners.value = data.owners || data;
    }
  } catch (error) {
    console.error('Erreur chargement:', error);
  } finally {
    loading.value = false;
  }
});

const getDisplayName = (owner) => {
  if (owner.societyName) return owner.societyName;
  return `${owner.firstName} ${owner.lastName}`;
};

const paginatedOwners = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return owners.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(owners.value.length / itemsPerPage);
});

const goToOwnerProfile = (id) => {
  router.push(`/adopter/owner/${id}`);
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
</script>

<template>
  <div class="list-container">
    
    <div v-if="loading" class="loading-state">
      <p>Chargement...</p>
    </div>

    <div v-else-if="owners.length === 0" class="empty-state">
      <p>Aucun propriétaire trouvé.</p>
    </div>

    <div v-else class="content">
      <div class="list-items">
        <div 
          v-for="owner in paginatedOwners" 
          :key="owner._id" 
          class="owner-card"
          @click="goToOwnerProfile(owner._id)"
        >
          <div class="avatar-wrapper">
            <img 
              v-if="owner.image" 
              :src="owner.image" 
              class="owner-avatar" 
              alt="Avatar" 
            />
            <div v-else class="owner-avatar placeholder">
              <User size="20" />
            </div>
          </div>

          <div class="info-wrapper">
            <h4 class="owner-name">{{ getDisplayName(owner) }}</h4>
            
            <div class="meta-row">
              <span class="location">
                <MapPin size="12" /> {{ owner.address?.city || 'Suisse' }}
              </span>
              <span v-if="owner.animals?.length > 0" class="dot">•</span>
              <span v-if="owner.animals?.length > 0" class="animal-count">
                 {{ owner.animals.length }} animaux
              </span>
            </div>
          </div>

          <div class="action-icon">
            <ChevronRight size="18" color="#9ca3af" />
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-controls">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1" 
          class="page-btn"
        >
          Précédent
        </button>
        <span class="page-count">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages" 
          class="page-btn"
        >
          Suivant
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.loading-state, .empty-state {
  text-align: center;
  color: var(--color-neutral-500);
  padding: 20px 0;
  font-size: 14px;
  font-style: italic;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* CARTE PROPRIÉTAIRE */
.owner-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 12px;
  border-radius: 12px;
  /* Ombre légère pour ressortir sur le fond gris de la Home */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  border: 1px solid transparent;
}

.owner-card:active {
  transform: scale(0.98);
  background-color: #f9fafb;
}

/* Avatar */
.avatar-wrapper {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  margin-right: 12px;
}

.owner-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #f3f4f6;
}

.owner-avatar.placeholder {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

/* Info Text */
.info-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.owner-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.location {
  display: flex;
  align-items: center;
  gap: 3px;
}

.dot {
  color: #d1d5db;
}

.animal-count {
  color: var(--color-primary-600);
  font-weight: 500;
  font-size: 12px;
}

/* Pagination */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--color-primary-600);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
}

.page-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.page-count {
  font-size: 12px;
  color: #6b7280;
}
</style>