<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { MapPin, Trash2, User, Home, PawPrint } from 'lucide-vue-next';
import Button from '@/components/Button.vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const { success, error } = useToast();
const router = useRouter();
const { getAuthFetchOptions, requireUserType, logout } = useAuth();
// État
const stats = ref({ 
  global: { adopters: 0, owners: 0, animals: 0, matches: 0 },
  details: { animalsBySpecies: [], matchesByStatus: [] }
});
const adopters = ref([]);
const owners = ref([]);
const loading = ref(true);
const activeTab = ref('adopters');
const selectedOwner = ref(null);
const ownerAnimals = ref([]);
const loadingAnimals = ref(false);

// Initialisation
onMounted(() => {
    if (!requireUserType('admin')) {
        loading.value = false;
        return;
    }
    Promise.all([fetchStats(), fetchAdopters(), fetchOwners()]);
});

// Fetch helpers
const fetchJson = async (url) => {
    const res = await fetch(url, getAuthFetchOptions());
    return res.ok ? res.json() : null;
};

const fetchStats = async () => {
    try {
        const data = await fetchJson('/api/admin/stats');
        if (data) stats.value = data;
    } catch (err) {
        console.error('Erreur stats:', err);
    }
};

const fetchAdopters = async () => {
    loading.value = true;
    try {
        const data = await fetchJson('/api/adopters');
        adopters.value = data?.adopters || [];
    } catch {
        error('Erreur lors du chargement des adoptants');
    } finally {
        loading.value = false;
    }
};

const fetchOwners = async () => {
    loading.value = true;
    try {
        const data = await fetchJson('/api/owners');
        owners.value = data?.owners || [];
    } catch {
        error('Erreur lors du chargement des propriétaires');
    } finally {
        loading.value = false;
    }
};

// Actions
const deleteAdopter = async (id) => {
    if (!confirm('Supprimer cet adoptant ?')) return;
    try {
        const res = await fetch(`/api/adopters/${id}`, getAuthFetchOptions({ method: 'DELETE' }));
        if (res.ok) {
            success('Adoptant supprimé');
            fetchAdopters();
            fetchStats();
        }
    } catch {
        error('Erreur lors de la suppression');
    }
};

const deleteOwner = async (id) => {
    if (!confirm('Supprimer ce propriétaire ?')) return;
    try {
        const res = await fetch(`/api/owners/${id}`, getAuthFetchOptions({ method: 'DELETE' }));
        if (res.ok) {
            success('Propriétaire supprimé');
            fetchOwners();
            fetchStats();
            if (selectedOwner.value?._id === id) closeOwnerAnimals();
        }
    } catch {
        error('Erreur lors de la suppression');
    }
};

const closeOwnerAnimals = () => {
    selectedOwner.value = null;
    ownerAnimals.value = [];
};

const selectOwner = async (owner) => {
    if (selectedOwner.value?._id === owner._id) {
        closeOwnerAnimals();
        return;
    }

    selectedOwner.value = owner;
    loadingAnimals.value = true;

    try {
        // La route GET /api/owners/:id retourne les animaux dans la réponse
        const data = await fetchJson(`/api/owners/${owner._id}`);
        ownerAnimals.value = data?.animals || [];
    } catch {
        error('Erreur lors du chargement des animaux');
        ownerAnimals.value = [];
    } finally {
        loadingAnimals.value = false;
    }
};

const formatAge = (age) => `${age} ${age > 1 ? 'ans' : 'an'}`;

const deleteAnimal = async (animalId, animalName) => {
    if (!confirm(`Supprimer ${animalName} ?`)) return;
    try {
        const res = await fetch(`/api/animals/${animalId}`, getAuthFetchOptions({ method: 'DELETE' }));
        if (res.ok) {
            success('Animal supprimé');
            ownerAnimals.value = ownerAnimals.value.filter(a => a._id !== animalId);
            fetchStats();
        }
    } catch {
        error('Erreur lors de la suppression');
    }
};
const handleLogout = () => {
    logout();
};
</script>

<template>
    <div class="admin-page">
        <!-- Header -->
        <div class="page-header">
            <h2 class="page-title text-h2 text-primary-700">Dashboard Admin</h2>
        </div>

        <!-- Content -->
        <div class="page-content">
            <!-- Stats -->
            <section class="stats-section">
                <div class="stats-grid">
                    <div class="stat-card" v-for="(value, key) in {
                        Adoptants: stats.global.adopters,
                        Propriétaires: stats.global.owners,
                        Animaux: stats.global.animals,
                        Matches: stats.global.matches
                    }" :key="key">
                        <span class="stat-value text-h2 text-primary-700">{{ value }}</span>
                        <span class="stat-label text-label-base text-neutral-600">{{ key }}</span>
                    </div>
                </div>
            </section>

            <!-- Details Section -->
            <section v-if="stats.details" class="details-section">
                <!-- Animals by Species -->
                <div class="detail-card">
                    <h3 class="detail-title text-h4 text-neutral-black">Animaux par espèce</h3>
                    <div v-if="!stats.details.animals?.bySpecies?.length" class="empty-detail">
                        <p class="text-body-sm text-neutral-500">Aucune donnée</p>
                    </div>
                    <div v-else class="detail-table">
                        <div class="table-header">
                            <div class="col">Espèce</div>
                            <div class="col">Nombre</div>
                            <div class="col">Prix moyen</div>
                        </div>
                        <div v-for="item in stats.details.animals.bySpecies" :key="item.species" class="table-row">
                            <div class="col">{{ item.species }}</div>
                            <div class="col">{{ item.count }}</div>
                            <div class="col">{{ item.avgPrice }} CHF</div>
                        </div>
                    </div>
                </div>

                <!-- Animals by Size -->
                <div class="detail-card">
                    <h3 class="detail-title text-h4 text-neutral-black">Animaux par taille</h3>
                    <div v-if="!stats.details.animals?.bySize?.length" class="empty-detail">
                        <p class="text-body-sm text-neutral-500">Aucune donnée</p>
                    </div>
                    <div v-else class="size-grid">
                        <div v-for="item in stats.details.animals.bySize" :key="item.size" class="size-badge">
                            <span class="size-name">{{ item.size }}</span>
                            <span class="size-count">{{ item.count }}</span>
                        </div>
                    </div>
                </div>

                <!-- Availability -->
                <div class="detail-card">
                    <h3 class="detail-title text-h4 text-neutral-black">Disponibilité des animaux</h3>
                    <div v-if="!stats.details.animals?.availability?.length" class="empty-detail">
                        <p class="text-body-sm text-neutral-500">Aucune donnée</p>
                    </div>
                    <div v-else class="availability-grid">
                        <div v-for="item in stats.details.animals.availability" :key="item.available" class="availability-item">
                            <div :class="['availability-status', { available: item.available }]">
                                {{ item.available ? 'Disponibles' : 'Non disponibles' }}
                            </div>
                            <div class="availability-count">{{ item.count }}</div>
                        </div>
                    </div>
                </div>

                <!-- Matches by Status -->
                <div class="detail-card">
                    <h3 class="detail-title text-h4 text-neutral-black">Matches par statut</h3>
                    <div v-if="!stats.details.matches?.byStatus?.length" class="empty-detail">
                        <p class="text-body-sm text-neutral-500">Aucune donnée</p>
                    </div>
                    <div v-else class="status-grid">
                        <div v-for="item in stats.details.matches.byStatus" :key="item.status" class="status-item">
                            <span class="status-label">{{ item.status }}</span>
                            <span class="status-badge">{{ item.count }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Tabs -->
            <section class="tabs-section">
                <div class="tabs">
                    <button v-for="tab in [
                        { id: 'adopters', label: 'Adoptants', count: adopters.length },
                        { id: 'owners', label: 'Propriétaires', count: owners.length }
                    ]" :key="tab.id" :class="['tab text-button-sm', { active: activeTab === tab.id }]"
                        @click="activeTab = tab.id">
                        {{ tab.label }} ({{ tab.count }})
                    </button>
                </div>
            </section>

            <!-- Users List -->
            <section class="users-section">
                <div v-if="loading" class="loading-container">
                    <div class="spinner"></div>
                </div>

                <!-- Adopters -->
                <template v-else-if="activeTab === 'adopters'">
                    <div v-if="!adopters.length" class="empty-message">
                        <p class="text-body-base text-neutral-500">Aucun adoptant</p>
                    </div>
                    <div v-else class="users-list">
                        <div class="user-card" v-for="a in adopters" :key="a._id">
                            <div class="user-avatar">
                                <User :size="24" />
                            </div>
                            <div class="user-info">
                                <h3 class="text-body-lg text-neutral-black">{{ a.firstName }} {{ a.lastName }}</h3>
                                <p class="text-body-sm text-neutral-600">{{ a.email }}</p>
                                <p class="text-body-sm text-neutral-500 location">
                                    <MapPin :size="14" /> {{ a.address?.city }} ({{ a.address?.zip }})
                                </p>
                            </div>
                            <button class="btn-delete" @click="deleteAdopter(a._id)">
                                <Trash2 :size="18" />
                            </button>
                        </div>
                    </div>
                </template>

                <!-- Owners -->
                <template v-else>
                    <div v-if="!owners.length" class="empty-message">
                        <p class="text-body-base text-neutral-500">Aucun propriétaire</p>
                    </div>
                    <template v-else>
                        <div class="users-list">
                            <template v-for="o in owners" :key="o._id">
                                <div class="user-card" :class="{ selected: selectedOwner?._id === o._id }">
                                    <div class="user-avatar clickable" @click="selectOwner(o)">
                                        <Home :size="24" />
                                    </div>
                                    <div class="user-info clickable" @click="selectOwner(o)">
                                        <h3 class="text-body-lg text-neutral-black">{{ o.firstName }} {{ o.lastName }}
                                        </h3>
                                        <p class="text-body-sm text-neutral-600">{{ o.email }}</p>
                                        <p class="text-body-sm text-neutral-500 location">
                                            <MapPin :size="14" /> {{ o.address?.city }} ({{ o.address?.zip }})
                                        </p>
                                        <p v-if="o.societyName" class="text-body-sm text-success">{{ o.societyName }}
                                        </p>
                                    </div>
                                    <button class="btn-delete" @click.stop="deleteOwner(o._id)">
                                        <Trash2 :size="18" />
                                    </button>
                                </div>

                                <!-- Animals section under the selected owner -->
                                <div v-if="selectedOwner?._id === o._id" class="animals-section">
                                    <h4 class="section-title text-h5 text-primary-700">
                                        Animaux de {{ o.firstName }}
                                    </h4>

                                    <div v-if="loadingAnimals" class="loading-container small">
                                        <div class="spinner"></div>
                                    </div>
                                    <div v-else-if="!ownerAnimals.length" class="empty-message small">
                                        <p class="text-body-sm text-neutral-500">Aucun animal</p>
                                    </div>
                                    <div v-else class="animals-grid">
                                        <div class="animal-card" v-for="animal in ownerAnimals" :key="animal._id">
                                            <button class="btn-delete-animal"
                                                @click="deleteAnimal(animal._id, animal.name)">
                                                <Trash2 :size="14" />
                                            </button>
                                            <img v-if="animal.images && animal.images.length" :src="animal.images[0]" :alt="animal.name"
                                                class="animal-image" />
                                            <div v-else class="animal-placeholder">
                                                <PawPrint :size="32" />
                                            </div>
                                            <div class="animal-info">
                                                <h4 class="text-body-base text-neutral-black">{{ animal.name }}</h4>
                                                <p class="text-body-sm text-neutral-600">
                                                    {{ animal.species }} {{ animal.race ? `- ${animal.race}` : '' }}
                                                </p>
                                                <p class="text-body-xs text-neutral-500">{{ formatAge(animal.age) }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                    </template>

                </template>
                <Button variant="secondary" @click="handleLogout" class="logout-btn">
                    Se déconnecter
                </Button>
            </section>
        </div>
    </div>
</template>

<style scoped>
.admin-page {
    min-height: 100vh;
    background-color: var(--color-neutral-100);
    padding-bottom: var(--spacing-6);
}

/* Header */
.page-header {
    padding: var(--spacing-6) var(--spacing-4) var(--spacing-4);
    text-align: center;
}

.page-title {
    margin: var(--spacing-2);
}

/* Content */
.page-content {
    padding: 0 var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

/* Stats Section */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
}

.stat-card {
    background: var(--color-neutral-white);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    text-align: center;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.stat-value {
    display: block;
}

.stat-label {
    text-transform: uppercase;
}

/* Tabs */
.tabs {
    display: flex;
    gap: var(--spacing-2);
    background: var(--color-neutral-white);
    border-radius: var(--radius-base);
    padding: var(--spacing-1);
}

.tab {
    flex: 1;
    padding: var(--spacing-3) var(--spacing-4);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-neutral-600);
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab:hover {
    color: var(--color-neutral-800);
    background: var(--color-neutral-100);
}

.tab.active {
    background: var(--color-primary-500);
    color: var(--color-neutral-white);
}

/* Users List */
.users-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.user-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    background: var(--color-neutral-white);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
}

.user-card.selected {
    box-shadow: 0 0 0 2px var(--color-primary-500);
    background: var(--color-primary-50);
}

.user-avatar {
    width: 48px;
    height: 48px;
    background: var(--color-neutral-200);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

.user-info {
    flex: 1;
    min-width: 0;
}

.user-info h3 {
    margin: 0 0 var(--spacing-1);
}

.user-info p {
    margin: 0;
    padding-bottom: var(--spacing-1);
}

.user-info .location {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
}

.clickable {
    cursor: pointer;
}

.btn-delete {
    width: 40px;
    height: 40px;
    background: var(--color-secondary-100);
    border: none;
    border-radius: var(--radius-full);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.btn-delete:hover {
    background: var(--color-secondary-600);
    color: var(--color-neutral-white);
}

.btn-delete svg {
    color: var(--color-secondary-700);
}

.btn-delete:hover svg {
    color: var(--color-neutral-white);
}

/* Loading & Empty */
.loading-container {
    display: flex;
    justify-content: center;
    padding: var(--spacing-10);
}

.loading-container.small {
    padding: var(--spacing-4);
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

.empty-message {
    text-align: center;
    padding: var(--spacing-10);
}

.empty-message.small {
    padding: var(--spacing-4);
}

/* Animals Section */
.animals-section {
    background: var(--color-neutral-50);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    margin-top: calc(-1 * var(--spacing-2));
    margin-bottom: var(--spacing-1);
    border: 1px solid var(--color-neutral-200);
}

.section-title {
    margin: 0 0 var(--spacing-4);
}

.animals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--spacing-3);
}

.animal-card {
    background: var(--color-neutral-white);
    border-radius: var(--radius-sm);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    position: relative;
}

.btn-delete-animal {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 1;
}

.btn-delete-animal svg {
    color: var(--color-secondary-700);
}

.btn-delete-animal:hover {
    background: var(--color-secondary-600);
}

.btn-delete-animal:hover svg {
    color: var(--color-neutral-white);
}

.animal-image {
    width: 100%;
    height: 100px;
    object-fit: cover;
}

.animal-placeholder {
    width: 100%;
    height: 100px;
    background: var(--color-neutral-200);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
}

.animal-info {
    padding: var(--spacing-3);
}

.animal-info h4 {
    margin: 0 0 var(--spacing-1);
}

.animal-info p {
    margin: 0;
}

.logout-btn {
    margin: var(--spacing-6) auto 0;
    display: block;
}

/* Details Section */
.details-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
}

.detail-card {
    background: var(--color-neutral-white);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-sm);
}

.detail-title {
    margin: 0 0 var(--spacing-3);
    font-weight: 600;
}

.empty-detail {
    text-align: center;
    padding: var(--spacing-4);
    color: var(--color-neutral-500);
}

/* Table Style */
.detail-table {
    overflow-x: auto;
}

.table-header {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-2);
    padding: var(--spacing-3);
    background: var(--color-neutral-100);
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: var(--body-sm-size);
    color: var(--color-neutral-700);
}

.table-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-2);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-neutral-200);
    font-size: var(--body-sm-size);
    align-items: center;
}

.table-row:last-child {
    border-bottom: none;
}

.table-row .col {
    word-break: break-word;
}

/* Size Grid */
.size-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-3);
}

.size-badge {
    background: var(--color-primary-100);
    border: 1px solid var(--color-primary-300);
    border-radius: var(--radius-base);
    padding: var(--spacing-3);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.size-name {
    font-weight: 600;
    color: var(--color-primary-700);
    text-transform: capitalize;
}

.size-count {
    font-size: var(--body-h3-size);
    font-weight: bold;
    color: var(--color-primary-600);
}

/* Availability */
.availability-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-3);
}

.availability-item {
    background: var(--color-neutral-100);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    text-align: center;
}

.availability-status {
    font-weight: 600;
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-2);
    color: var(--color-secondary-700);
    background: var(--color-secondary-100);
}

.availability-status.available {
    color: var(--color-success-700);
    background: var(--color-success-100);
}

.availability-count {
    font-size: var(--heading-h2-size);
    font-weight: bold;
    color: var(--color-primary-600);
}

/* Status Grid */
.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-3);
}

.status-item {
    background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100));
    border-left: 4px solid var(--color-primary-600);
    border-radius: var(--radius-base);
    padding: var(--spacing-3);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.status-label {
    font-size: var(--body-sm-size);
    color: var(--color-neutral-700);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
}

.status-badge {
    font-size: var(--heading-h2-size);
    font-weight: bold;
    color: var(--color-primary-700);
}
</style>
