<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { MapPin, User, ChevronRight, PawPrint, Building2, Home, Search } from 'lucide-vue-next';

const router = useRouter();

const owners = ref([]);
const loading = ref(false);
const filterType = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);

let debounceTimeout = null;

const fetchOwners = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: 3,
      type: filterType.value === 'all' ? '' : filterType.value,
      search: searchQuery.value
    });

    const response = await fetch(`/api/owners?${params.toString()}`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      owners.value = data.owners;
      totalPages.value = data.pagination.pages;
      totalItems.value = data.pagination.total;

    }
  } catch (error) {
    console.error('Erreur chargement:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchOwners();
});

watch([currentPage, filterType], () => {
  fetchOwners();
});

watch(searchQuery, () => {
  currentPage.value = 1;
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchOwners();
  }, 300);
});

const setFilter = (type) => {
  filterType.value = type;
  currentPage.value = 1;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const goToOwnerProfile = (id) => {
  router.push(`/adopter/owner/${id}`);
};

const getDisplayName = (owner) => {
  return owner.societyName || `${owner.firstName} ${owner.lastName}`;
};
</script>

<template>
  <div class="list-container">

    <div class="search-bar">
      <Search class="search-icon" size="18" />
      <input v-model="searchQuery" type="text" placeholder="Rechercher un nom, une ville..." class="search-input" />
    </div>

    <div class="filter-tabs">
      <button @click="setFilter('all')" :class="['filter-chip', { active: filterType === 'all' }]">Tous</button>
      <button @click="setFilter('society')" :class="['filter-chip', { active: filterType === 'society' }]">
        <Building2 size="14" /> Refuges
      </button>
      <button @click="setFilter('private')" :class="['filter-chip', { active: filterType === 'private' }]">
        <Home size="14" /> Particuliers
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Chargement...</p>
    </div>

    <div v-else-if="owners.length === 0" class="empty-state">
      <p>Aucun résultat trouvé.</p>
    </div>

    <div v-else class="content">
      <div class="list-items">
        <div v-for="owner in owners" :key="owner._id" class="owner-card" @click="goToOwnerProfile(owner._id)">
          <div class="avatar-wrapper">
            <img v-if="owner.image" :src="owner.image" class="owner-avatar" />
            <div v-else class="owner-avatar placeholder">
              <User size="20" />
            </div>
          </div>

          <div class="info-wrapper">
            <h4 class="owner-name">
              {{ getDisplayName(owner) }}
              <span v-if="owner.societyName" class="type-badge society">
                <Building2 size="10" />
              </span>
              <span v-else class="type-badge private">
                <User size="10" />
              </span>
            </h4>
            <div class="meta-row">
              <span class="location">
                <MapPin size="12" /> {{ owner.address?.city || 'Suisse' }}
              </span>
              <span class="dot">•</span>
              <span class="animal-count">
                <PawPrint size="10" /> {{ owner.animalCount || 0 }} animaux
              </span>
            </div>
          </div>
          <div class="action-icon">
            <ChevronRight size="18" color="#9ca3af" />
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-controls">
        <button @click="prevPage" :disabled="currentPage === 1 || loading" class="page-btn">
          Précédent
        </button>
        <span class="page-count">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages || loading" class="page-btn">
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
  gap: 12px;
}

/* Recherche */
.search-bar {
  position: relative;
  margin-bottom: 4px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 38px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  background: white;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--color-primary-600, #10b981);
}

/* Filtres */
.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-chip:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.filter-chip.active {
  background: var(--color-primary-600, #10b981);
  color: white;
  border-color: var(--color-primary-600, #10b981);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

/* Etats */
.loading-state,
.empty-state {
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

/* Carte */
.owner-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.1s;
  border: 1px solid transparent;
}

.owner-card:active {
  transform: scale(0.98);
}

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

.info-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.owner-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
}

.type-badge.society {
  background-color: #e0e7ff;
  color: #4338ca;
}

.type-badge.private {
  background-color: #f3f4f6;
  color: #6b7280;
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
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary-600, #059669);
  font-weight: 500;
  font-size: 12px;
}

.action-icon {
  margin-left: auto;
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
  color: var(--color-primary-600, #059669);
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