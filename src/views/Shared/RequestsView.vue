<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Menu from '@/components/Menu.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { CheckIcon, XIcon, MessageCircleIcon, Trash2Icon, User, PawPrint } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const requests = ref([]);
const loading = ref(true);
const activeTab = ref(route.query.tab || 'pending');
const imageErrors = ref({});

const userId = localStorage.getItem('user_id');
const userType = localStorage.getItem('user_type');
const isOwner = computed(() => userType === 'owner');

const confirmModal = ref({
    show: false, title: '', message: '', confirmText: 'Confirmer', type: 'warning', pendingAction: null
});

watch(activeTab, (newTab) => {
    router.replace({ 
        query: { 
            ...route.query,
            tab: newTab 
        } 
    });
});

// --- NAVIGATION VERS LE PROFIL ---
const goToProfile = (req) => {
    if (isOwner.value) {
        router.push({ name: 'OwnerProfileAdopter', params: { id: req.adopterId._id } });
    } else {
        router.push({ name: 'AdopterAnimalDetails', params: { id: req.animalId._id } });
    }
};

// --- CHARGEMENT ---
const fetchRequests = async () => {
    try {
        loading.value = true;
        let url = '/api/matches';
        if (!isOwner.value) url += `?adopterId=${userId}`;
        const response = await fetch(url, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            if (isOwner.value) {
                requests.value = data.matches.filter(match =>
                    match.animalId?.ownerId?._id === userId || match.animalId?.ownerId === userId
                );
            } else {
                requests.value = data.matches;
            }
        }
    } catch (error) { console.error(error); } finally { loading.value = false; }
};

// --- HELPERS ---
const getMainImage = (req) => isOwner.value
    ? (req.adopterId?.image || null)
    : (req.animalId?.images?.[0] || null);

const getSubImage = (req) => isOwner.value
    ? (req.animalId?.images?.[0] || null)
    : (req.animalId?.ownerId?.image || null);
const handleImageError = (id) => { imageErrors.value[id] = true; };

// --- FONCTION DE FORMATAGE DE DATE ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// --- FILTRES ---
const pendingRequests = computed(() => requests.value.filter(req => req.status === 'en_attente' || (!req.status && !req.isActive)));
const historyRequests = computed(() => requests.value.filter(req => ['validé', 'adopté', 'refusé'].includes(req.status)));
const validatedRequests = computed(() => historyRequests.value.filter(req => req.status === 'validé'));
const adoptedRequests = computed(() => historyRequests.value.filter(req => req.status === 'adopté'));
const refusedRequests = computed(() => historyRequests.value.filter(req => req.status === 'refusé'));

// --- ACTIONS API ---
const executeUpdateStatus = async (matchId, status, isActive) => {
    try {
        const response = await fetch(`/api/matches/${matchId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ status, isActive })
        });
        if (response.ok) {
            const match = requests.value.find(r => r._id === matchId);
            if (match) {
                match.status = status;
                match.isActive = isActive;
                match.updatedAt = new Date().toISOString();
            }
        }
    } catch (e) { console.error(e); }
};

const executeDeleteMatch = async (matchId) => {
    try {
        const response = await fetch(`/api/matches/${matchId}`, { method: 'DELETE', credentials: 'include' });
        if (response.ok) requests.value = requests.value.filter(r => r._id !== matchId);
    } catch (e) { console.error(e); }
};

// --- ACTIONS UI ---
const onRejectClick = (matchId) => {
    confirmModal.value = {
        show: true, title: 'Refuser', message: 'Refuser cette demande ?', confirmText: 'Refuser', type: 'danger',
        pendingAction: () => executeUpdateStatus(matchId, 'refusé', false)
    };
};
const onAcceptClick = (matchId) => { executeUpdateStatus(matchId, 'validé', true); };
const onDeleteClick = (matchId, isHistory = false) => {
    confirmModal.value = {
        show: true, title: 'Suppression', message: isHistory ? 'Retirer de l\'historique ?' : 'Annuler la demande ?',
        confirmText: 'Supprimer', type: 'danger', pendingAction: () => executeDeleteMatch(matchId)
    };
};

const handleModalConfirm = async () => { if (confirmModal.value.pendingAction) await confirmModal.value.pendingAction(); closeModal(); };
const closeModal = () => { confirmModal.value.show = false; confirmModal.value.pendingAction = null; };

const goToDiscussion = (matchId) => {
    const prefix = isOwner.value ? 'owner' : 'adopter';
    router.push(`/${prefix}/messages/${matchId}`);
};

onMounted(fetchRequests);
</script>

<template>
    <div class="page-container bg-gray-50">
        <div class="sticky-header">
            <h1 class="page-title text-h1">Demandes</h1>
            <div class="tabs-container">
                <button class="tab-btn" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
                    En attente <span class="badge-count" v-if="pendingRequests.length">{{ pendingRequests.length
                        }}</span>
                </button>
                <button class="tab-btn" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
                    Historique
                </button>
            </div>
        </div>

        <div v-if="loading" class="loading state-container">Chargement...</div>

        <div v-else-if="activeTab === 'pending'" class="content-wrapper">
            <div v-if="pendingRequests.length === 0" class="empty-state state-container">
                <p>Aucune demande en attente.</p>
                <router-link v-if="!isOwner" to="/adopter" class="link-action">Aller swiper !</router-link>
            </div>

            <div v-else class="cards-container">
                <div v-for="req in pendingRequests" :key="req._id" class="request-card" @click="goToProfile(req)">

                    <div class="avatar-group">
                        <img v-if="getMainImage(req) && !imageErrors[req._id + '_main']" :src="getMainImage(req)"
                            class="main-avatar" @error="handleImageError(req._id + '_main')" />
                        <div v-else class="main-avatar placeholder-style">
                            <User v-if="isOwner" :size="24" />
                            <PawPrint v-else :size="24" />
                        </div>

                        <img v-if="getSubImage(req) && !imageErrors[req._id + '_sub']" :src="getSubImage(req)"
                            class="sub-avatar" @error="handleImageError(req._id + '_sub')" />
                        <div v-else class="sub-avatar placeholder-style small">
                            <PawPrint v-if="isOwner" :size="12" />
                            <User v-else :size="12" />
                        </div>
                    </div>

                    <div class="item-content">
                        <h3>
                            <span v-if="isOwner">
                                {{ req.adopterId?.firstName }}
                                <span class="separator-x">x</span>
                                {{ req.animalId?.name }}
                            </span>

                            <span v-else>
                                {{ req.animalId?.name }}
                            </span>
                        </h3>
                        <p class="subtitle">Demande du {{ formatDate(req.updatedAt) }}</p>
                    </div>

                    <div class="item-actions-icons">
                        <template v-if="isOwner">
                            <button @click.stop="onRejectClick(req._id)" class="action-btn reject">
                                <XIcon size="20" />
                            </button>
                            <button @click.stop="onAcceptClick(req._id)" class="action-btn accept">
                                <CheckIcon size="20" />
                            </button>
                        </template>
                        <template v-else>
                            <button @click.stop="onDeleteClick(req._id)" class="action-btn reject">
                                <XIcon size="20" />
                            </button>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="content-wrapper history-wrapper">

            <section v-if="validatedRequests.length > 0" class="history-section">
                <h2 class="section-header text-primary">Discussions en cours</h2>
                <div class="cards-container">
                    <div v-for="req in validatedRequests" :key="req._id" class="request-card" @click="goToProfile(req)">
                        <div class="avatar-group">
                            <img v-if="getMainImage(req) && !imageErrors[req._id + '_main']" :src="getMainImage(req)"
                                class="main-avatar" @error="handleImageError(req._id + '_main')" />
                            <div v-else class="main-avatar placeholder-style">
                                <User :size="24" />
                            </div>
                            <img v-if="getSubImage(req) && !imageErrors[req._id + '_sub']" :src="getSubImage(req)"
                                class="sub-avatar" @error="handleImageError(req._id + '_sub')" />
                            <div v-else class="sub-avatar placeholder-style small">
                                <User :size="12" />
                            </div>
                        </div>
                        <div class="item-content">
                            <h3>
                                <span v-if="isOwner">
                                    {{ req.adopterId?.firstName }}
                                    <span class="separator-x">x</span>
                                    {{ req.animalId?.name }}
                                </span>

                                <span v-else>
                                    {{ req.animalId?.name }}
                                </span>
                            </h3>
                            <p class="subtitle">Matché le {{ formatDate(req.updatedAt) }}</p>
                        </div>
                        <button @click.stop="goToDiscussion(req._id)" class="chat-btn">
                            <MessageCircleIcon size="20" />
                        </button>
                    </div>
                </div>
            </section>

            <section v-if="adoptedRequests.length > 0" class="history-section">
                <h2 class="section-header text-success">Adoptions finalisées</h2>
                <div class="cards-container">
                    <div v-for="req in adoptedRequests" :key="req._id" class="request-card adopted-bg"
                        @click="goToProfile(req)">
                        <div class="avatar-group">
                            <img v-if="getMainImage(req) && !imageErrors[req._id + '_main']" :src="getMainImage(req)"
                                class="main-avatar" @error="handleImageError(req._id + '_main')" />
                            <div v-else class="main-avatar placeholder-style">
                                <User :size="24" />
                            </div>
                            <img v-if="getSubImage(req) && !imageErrors[req._id + '_sub']" :src="getSubImage(req)"
                                class="sub-avatar" @error="handleImageError(req._id + '_sub')" />
                            <div v-else class="sub-avatar placeholder-style small">
                                <User :size="12" />
                            </div>
                        </div>
                        <div class="item-content">
                            <h3>
                                <span v-if="isOwner">
                                    {{ req.adopterId?.firstName }}
                                    <span class="separator-x">x</span>
                                    {{ req.animalId?.name }}
                                </span>

                                <span v-else>
                                    {{ req.animalId?.name }}
                                </span>
                            </h3>
                            <p class="subtitle">Adopté le {{ formatDate(req.updatedAt) }}</p>
                        </div>
                        <button @click.stop="goToDiscussion(req._id)" class="chat-btn secondary">
                            <MessageCircleIcon size="20" />
                        </button>
                    </div>
                </div>
            </section>

            <section v-if="refusedRequests.length > 0" class="history-section">
                <h2 class="section-header text-neutral">Refusés</h2>
                <div class="cards-container">
                    <div v-for="req in refusedRequests" :key="req._id" class="request-card refused-item"
                        @click="goToProfile(req)">
                        <div class="avatar-group grayscale">
                            <img v-if="getMainImage(req) && !imageErrors[req._id + '_main']" :src="getMainImage(req)"
                                class="main-avatar" @error="handleImageError(req._id + '_main')" />
                            <div v-else class="main-avatar placeholder-style">
                                <User :size="24" />
                            </div>
                        </div>
                        <div class="item-content">
                            <h3>
                                <span v-if="isOwner">
                                    {{ req.adopterId?.firstName }}
                                    <span class="separator-x">x</span>
                                    {{ req.animalId?.name }}
                                </span>

                                <span v-else>
                                    {{ req.animalId?.name }}
                                </span>
                            </h3>
                            <p class="subtitle">Demande refusée</p>
                        </div>
                        <button v-if="!isOwner" @click.stop="onDeleteClick(req._id, true)" class="action-btn ghost">
                            <Trash2Icon size="18" />
                        </button>
                    </div>
                </div>
            </section>

            <div v-if="historyRequests.length === 0" class="empty-state state-container">
                <p>Aucun historique.</p>
            </div>
        </div>

        <Menu />
        <ConfirmModal :show="confirmModal.show" :title="confirmModal.title" :message="confirmModal.message"
            :confirm-text="confirmModal.confirmText" :type="confirmModal.type" @confirm="handleModalConfirm"
            @cancel="closeModal" />
    </div>
</template>

<style scoped>
.page-container {
    min-height: 100vh;
    padding-bottom: 90px;
}

.sticky-header {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    background-color: var(--color-neutral-100);
    z-index: 10;
    padding: 3vh 20px 0 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.content-wrapper {
    padding: 20px;
}

.cards-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.request-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
    border: 1px solid transparent;
}

.request-card:active {
    transform: scale(0.98);
}

.refused-item {
    background-color: #fafafa;
    box-shadow: none;
    border: 1px solid #f0f0f0;
}

.refused-item .item-content {
    opacity: 0.6;
}

.adopted-bg {
    background-color: #f0fdf4;
    border: 1px solid #dcfce7;
}

.tabs-container {
    display: flex;
    padding: 0 10px;
}

.tab-btn {
    flex: 1;
    padding: 12px;
    border: none;
    background: none;
    font-family: var(--font-family);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-neutral-500);
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: color 0.2s;
}

.tab-btn::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: transparent;
    border-radius: 3px 3px 0 0;
    transition: background 0.2s;
}

.tab-btn.active {
    color: var(--color-primary-700);
}

.tab-btn.active::after {
    background: var(--color-primary-700);
}

.badge-count {
    background: var(--color-primary-700);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
}

.separator-x {
    color: var(--color-primary-700);
    font-weight: 400;
    margin: 0 4px;
}

.state-container {
    text-align: center;
    color: var(--color-neutral-500);
    padding: 40px 0;
    font-style: italic;
}

.grayscale .avatar-group {
    filter: grayscale(100%);
}

.avatar-group {
    position: relative;
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    margin-right: 15px;
}

.main-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

.sub-avatar {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.placeholder-style {
    background: linear-gradient(180deg, #f5f5f5, #e8e8e8);
    color: #454444;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.placeholder-style.small {
    background: #e5e7eb;
    color: #6b7280;
}

.item-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.item-content h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-neutral-900);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.subtitle {
    margin: 2px 0 0 0;
    font-size: 12px;
    color: var(--color-neutral-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.text-neutral {
    color: var(--color-neutral-500) !important;
}

.item-actions-icons {
    display: flex;
    gap: 12px;
    margin-left: 10px;
}

.action-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: transform 0.1s;
}

.action-btn:active {
    transform: scale(0.95);
}

.action-btn.accept {
    background: var(--color-primary-100);
    color: var(--color-primary-700);
}

.action-btn.reject {
    background: var(--color-neutral-100);
    color: var(--color-neutral-600);
}

.action-btn.ghost {
    background: transparent;
    color: var(--color-neutral-400);
}

.action-btn.ghost:hover {
    background: var(--color-neutral-100);
    color: var(--color-neutral-600);
}

.chat-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--color-primary-50);
    color: var(--color-primary-600);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    cursor: pointer;
}

.chat-btn.secondary {
    background: white;
    border: 1px solid var(--color-primary-100);
}

.history-wrapper {
    display: flex;
    flex-direction: column;
    gap: 35px;
}

.section-header {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    margin: 0 0 10px 15px;
}

.text-primary {
    color: var(--color-primary-600);
}

.text-success {
    color: #059669;
}

.link-action {
    display: inline-block;
    margin-top: 10px;
    color: var(--color-primary-600);
    font-weight: 600;
    text-decoration: none;
}
</style>