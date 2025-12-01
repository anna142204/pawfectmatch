<script setup>
import { ref, onMounted, computed } from 'vue';

const owners = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = 5;

onMounted(async () => {
  try {
    const response = await fetch('/api/owners');
    if (response.ok) {
      const data = await response.json();
      // L'API retourne { owners, pagination }
      owners.value = data.owners || data;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des propriétaires:', error);
  } finally {
    loading.value = false;
  }
});

const paginatedOwners = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return owners.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(owners.value.length / itemsPerPage);
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};
</script>

<template>
  <div class="owners-list">
    <div v-if="loading" class="loading">
      <p>Chargement des propriétaires...</p>
    </div>

    <div v-else-if="owners.length === 0" class="empty">
      <p>Aucun propriétaire trouvé</p>
    </div>

    <div v-else>
      <div class="owners-container">
        <div v-for="owner in paginatedOwners" :key="owner._id" class="owner-card">
          <div class="owner-header">
            <h3 class="owner-name">{{ owner.firstName }} {{ owner.lastName }}</h3>
            <span class="owner-animals">{{ owner.animals?.length || 0 }} 🐾</span>
          </div>
          <p class="owner-location">📍 {{ owner.address?.city || 'Localisation inconnue' }}</p>
          <p class="owner-contact">{{ owner.email }}</p>
          <router-link :to="`/adopter/owner/${owner._id}`" class="view-btn">
            Voir les animaux
          </router-link>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
          title="Page précédente"
        >
          ←
        </button>
        <span class="page-info">
          <strong>Page {{ currentPage }} / {{ totalPages }}</strong>
          <span class="items-info">({{ paginatedOwners.length }} / {{ owners.length }} propriétaires)</span>
        </span>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
          title="Page suivante"
        >
          →
        </button>
      </div>
      <div v-else-if="owners.length > 0" class="pagination">
        <span class="page-info">
          <strong>Page 1 / 1</strong>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.owners-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading,
.empty {
  text-align: center;
  padding: 32px 0;
  color: #999;
}

.owners-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.owner-card {
  padding: 16px;
  background: #FAFAFA;
  border-radius: 12px;
  border: 1px solid #E8E8E8;
  transition: all 0.3s ease;
}

.owner-card:hover {
  background: #F5F5F5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.owner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.owner-name {
  margin: 0;
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
}

.owner-animals {
  font-size: 14px;
  background: #E8F5E9;
  padding: 4px 8px;
  border-radius: 6px;
}

.owner-location {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.owner-contact {
  margin: 4px 0;
  font-size: 13px;
  color: #888;
}

.view-btn {
  display: inline-block;
  margin-top: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.view-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: #F9F9F9;
  border-radius: 12px;
  border: 1px solid #E8E8E8;
}

.pagination-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  color: #333;
  font-weight: 600;
}

.items-info {
  font-size: 12px;
  color: #888;
  font-weight: 400;
}
</style>
