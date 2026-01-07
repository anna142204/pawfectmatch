<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { Camera, Trash2, Settings, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-vue-next';
import BackButton from '@/components/BackButton.vue';
import Button from '@/components/Button.vue';
import Input from '@/components/Input.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import TagButton from '@/components/TagButton.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

import { SPECIES_OPTIONS, ENV_OPTIONS, SIZE_OPTIONS, AGE_OPTIONS, WEIGHT_OPTIONS, SEX_OPTIONS, TRAINING_OPTIONS, PERSONALITY_OPTIONS } from '@/constants/animalOptions';

const router = useRouter();
const { success, error } = useToast();
const loading = ref(true);
const isSaving = ref(false);
const userId = localStorage.getItem('user_id');

const showImageUploader = ref(false);
const showDeleteModal = ref(false);
const showAdvanced = ref(false);

const newImageFile = ref(null);

const deleteModalConfig = ref({ title: '', message: '' });

const form = reactive({
    firstName: '',
    lastName: '',
    age: '',
    city: '',
    zip: '',
    about: '',
    image: null,
    preferences: { species: [], environment: [], size: [], age: [], weight: [], sex: [], dressage: [], personality: [], maxPrice: null, maxDistance: null }
});

onMounted(async () => {
    if (!userId) return router.push('/login');
    try {
        const res = await fetch(`/api/adopters/${userId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Erreur chargement profil');
        const data = await res.json();
        Object.assign(form, {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            age: data.age || '',
            city: data.address?.city || '',
            zip: data.address?.zip || '',
            about: data.about || '',
            image: data.image || null,
            preferences: {
                species: data.preferences?.species || [],
                environment: data.preferences?.environment || [],
                size: data.preferences?.size || [],
                age: data.preferences?.age || [],
                weight: data.preferences?.weight || [],
                sex: data.preferences?.sex || [],
                dressage: data.preferences?.dressage || [],
                personality: data.preferences?.personality || [],
                maxPrice: data.preferences?.maxPrice || null,
                maxDistance: data.preferences?.maxDistance || null
            }
        });
    } catch (e) {
        error(e.message);
    } finally {
        loading.value = false;
    }
});

const handleImageSelect = (files) => {
    if (files && files.length > 0) newImageFile.value = files[0].file;
};

const toggleImageEdit = () => {
    showImageUploader.value = !showImageUploader.value;
    if (!showImageUploader.value) newImageFile.value = null;
};

const handleDeleteImage = async () => {
    newImageFile.value = null;
    form.image = null;
    showImageUploader.value = false;
};

const togglePref = (category, value) => {
    const list = form.preferences[category];
    const idx = list.indexOf(value);
    if (idx > -1) list.splice(idx, 1);
    else list.push(value);
};
const hasPref = (cat, val) => form.preferences[cat].includes(val);

const submitForm = async () => {
    isSaving.value = true;
    try {
        let finalImageUrl = form.image;

        if (newImageFile.value) {
            const formData = new FormData();
            formData.append('image', newImageFile.value);
            
            const uploadRes = await fetch('/api/images/adopter', { 
                method: 'POST', 
                body: formData, 
                credentials: 'include' 
            });

            if (!uploadRes.ok) throw new Error("Erreur upload image");
            
            const uploadData = await uploadRes.json();
            
            if (uploadData.data && uploadData.data.url) {
                finalImageUrl = uploadData.data.url;
            } else if (uploadData.url) {
                finalImageUrl = uploadData.url;
            }
        }

        const payload = {
            firstName: form.firstName,
            lastName: form.lastName,
            age: form.age,
            address: { city: form.city, zip: form.zip },
            about: form.about,
            image: finalImageUrl,
            preferences: form.preferences
        };

        const res = await fetch(`/api/adopters/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Erreur sauvegarde');
        success('Profil mis à jour');
        router.push('/adopter/profile');
    } catch (e) {
        console.error(e);
        error(e.message);
    } finally {
        isSaving.value = false;
    }
};

const confirmDeleteAccount = () => {
    deleteModalConfig.value = {
        title: 'Supprimer mon compte ?',
        message: 'Cette action est irréversible. Toutes vos données seront effacées.'
    };
    showDeleteModal.value = true;
};

const handleDelete = async () => {
    showDeleteModal.value = false;
    try {
        const res = await fetch(`/api/adopters/${userId}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) throw new Error('Erreur suppression');
        success('Compte supprimé');
        router.push('/logout');
    } catch (err) {
        error(err.message);
    }
};
</script>

<template>
    <div class="edit-page">
        <div class="header">
            <BackButton manual @click="router.back()" />
            <h1 class="page-title text-h3 text-primary-700">Modifier mon profil</h1>
        </div>

        <div v-if="loading" class="loading">Chargement...</div>

        <form v-else @submit.prevent="submitForm" class="form-content">

            <div class="section photo-section-container">
                <h3 class="text-h4 text-neutral-800 mb-4">Ma photo</h3>
                <div class="photo-wrapper">
                    <div v-if="form.image && !showImageUploader" class="current-photo-view">
                        <div class="current-image">
                            <img :src="form.image" class="preview-img" />
                        </div>
                        <Button type="button" variant="secondary" size="sm" @click="toggleImageEdit">
                            <Camera :size="16" style="margin-right: 8px" /> Modifier la photo
                        </Button>
                        <Button type="button" variant="danger" size="sm" @click="handleDeleteImage">
                            <Trash2 :size="16" style="margin-right: 8px" /> Supprimer la photo
                        </Button>
                    </div>
                    <div v-else class="upload-mode-view">
                        <ImageUploader @filesSelected="handleImageSelect" :max="1" :multiple="false" />
                        <button v-if="form.image" type="button" class="cancel-link" @click="toggleImageEdit">Annuler</button>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3 class="text-h4 text-neutral-800 mb-4">Informations</h3>
                <div class="row">
                    <div class="col"><label class="label">Prénom</label>
                        <div class="input-wrapper"><Input v-model="form.firstName" required /></div>
                    </div>
                    <div class="col"><label class="label">Nom</label>
                        <div class="input-wrapper"><Input v-model="form.lastName" required /></div>
                    </div>
                </div>
                <div class="form-group mt-large">
                    <label class="label">Âge</label>
                    <div class="input-wrapper form-age"><Input v-model="form.age" type="number" /></div>
                </div>
            </div>

            <div class="section">
                <h3 class="text-h4 text-neutral-800 mb-4">Lieu de vie</h3>
                <div class="row">
                    <div class="col"><label class="label">Ville</label>
                        <div class="input-wrapper"><Input v-model="form.city" /></div>
                    </div>
                    <div class="col"><label class="label">NPA</label>
                        <div class="input-wrapper"><Input v-model="form.zip" /></div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3 class="text-h4 text-neutral-800 mb-4">Mes préférences</h3>

                
                <div class="pref-group">
                    <label class="label sub-label">Espèces recherchées</label>
                    <div class="tags-container">
                        <TagButton v-for="opt in SPECIES_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="hasPref('species', opt.value)" @toggle="togglePref('species', opt.value)" />
                    </div>
                </div>

                <div class="pref-group">
                    <label class="label sub-label">Taille préférée</label>
                    <div class="tags-container">
                        <TagButton v-for="opt in SIZE_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="hasPref('size', opt.value)"
                            @toggle="togglePref('size', opt.value)" />
                    </div>
                </div>

                <div class="pref-group">
                    <label class="label sub-label">Âge préféré</label>
                    <div class="tags-container">
                        <TagButton v-for="opt in AGE_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="hasPref('age', opt.value)"
                            @toggle="togglePref('age', opt.value)" />
                    </div>
                </div>

                <div class="pref-group">
                    <label class="label sub-label">Poids préféré</label>
                    <div class="tags-container">
                        <TagButton v-for="opt in WEIGHT_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="hasPref('weight', opt.value)"
                            @toggle="togglePref('weight', opt.value)" />
                    </div>
                </div>

                <div class="pref-group ">
                    <label class="label sub-label">Sexe préféré</label>
                    <div class="tags-container">
                        <TagButton v-for="opt in SEX_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="hasPref('sex', opt.value)"
                            @toggle="togglePref('sex', opt.value)" />
                    </div>
                </div>
<div class="pref-group">
                    <label class="label sub-label">Mon environnement</label>
                    <div class="tags-container">
                        <TagButton v-for="opt in ENV_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="hasPref('environment', opt.value)"
                            @toggle="togglePref('environment', opt.value)" />
                    </div>
                </div>

                <div class="pref-group">
                    <label class="label sub-label">Dressage</label>
                    <div class="tags-container">
                        <TagButton v-for="opt in TRAINING_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="hasPref('dressage', opt.value)"
                            @toggle="togglePref('dressage', opt.value)" />
                    </div>
                </div>

                <div class="pref-group">
                    <label class="label sub-label">Personnalité</label>
                    <div class="tags-container">
                        <TagButton v-for="opt in PERSONALITY_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="hasPref('personality', opt.value)"
                            @toggle="togglePref('personality', opt.value)" />
                    </div>
                </div>

                <div class="pref-group-row last-group">
                    <div class="pref-group-col">
                        <label class="label sub-label">Budget max (CHF)</label>
                        <div class="input-wrapper"><Input v-model="form.preferences.maxPrice" type="number" /></div>
                    </div>
                    <div class="pref-group-col">
                        <label class="label sub-label">Distance max (km)</label>
                        <div class="input-wrapper"><Input v-model="form.preferences.maxDistance" type="number" /></div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3 class="text-h4 text-neutral-800 mb-4">À propos de moi</h3>
                <textarea v-model="form.about" class="textarea-field" placeholder="Parlez de vous..."></textarea>
            </div>

            <div class="section advanced-section">
                <button type="button" class="advanced-header" @click="showAdvanced = !showAdvanced">
                    <div class="advanced-title">
                        <Settings :size="20" class="icon-grey" />
                        <span class="text-body-lg text-neutral-800">Paramètres avancés</span>
                    </div>
                    <component :is="showAdvanced ? ChevronUp : ChevronDown" :size="20" class="icon-grey" />
                </button>

                <div v-show="showAdvanced" class="advanced-content">
                    <div class="danger-zone-content">
                        <div class="warning-text">
                            <AlertTriangle :size="18" class="text-danger-600 mr-2" />
                            <span class="text-body-base text-neutral-600">Suppression du compte</span>
                        </div>
                        <p class="text-body-base text-neutral-500 mb-3">
                            La suppression du compte est définitive. Toutes vos données seront perdues.
                        </p>
                        <Button type="button" variant="danger" class="btn-delete" @click="confirmDeleteAccount">
                            <Trash2 :size="18" class="mr-2" /> Supprimer mon compte
                        </Button>
                    </div>
                </div>
            </div>

            <div class="spacer"></div>

            <div class="actions">
                <Button variant="primary" type="submit" :disabled="isSaving" class="save-btn">
                    {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
                </Button>
            </div>
        </form>

        <ConfirmModal :show="showDeleteModal" :title="deleteModalConfig.title" :message="deleteModalConfig.message"
            confirmText="Supprimer définitivement" cancelText="Annuler" type="danger" @confirm="handleDelete"
            @cancel="showDeleteModal = false" />
    </div>
</template>

<style scoped>
.edit-page {
    padding: 20px;
    background-color: var(--color-neutral-100);
    min-height: 100vh;
    box-sizing: border-box;
    width: 100%;
    overflow-x: hidden;
}

.header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 25px;
    margin-top: 10px;
}

.page-title {
    margin: 0;
    font-size: 1.5rem;
}

.form-content {
    display: flex;
    flex-direction: column;
    gap: 25px;
    width: 100%;
}

.section {
    background: white;
    padding: 0 20px 20px 20px;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    width: 100%;
    box-sizing: border-box;
}

.photo-wrapper {
    display: flex;
    justify-content: center;
}

.current-photo-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.current-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid var(--color-neutral-100);
}

.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.upload-mode-view {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.cancel-link {
    background: none;
    border: none;
    text-decoration: underline;
    color: var(--color-neutral-500);
    cursor: pointer;
    font-size: 0.9rem;
}

.row {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.col {
    flex: 1;
    min-width: 140px;
}

.input-wrapper {
    width: 80%;
}

:deep(.input-root),
:deep(input) {
    width: 100% !important;
    box-sizing: border-box;
    max-width: 100%;
}

.label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--color-neutral-700);
}

.textarea-field {
    width: 100%;
    min-height: 120px;
    padding: 12px;
    border: 1px solid var(--color-neutral-300);
    border-radius: 8px;
    font-family: inherit;
    font-size: 16px;
    resize: vertical;
    box-sizing: border-box;
    max-width: 100%;
}

.form-age{
    max-width: 40%;
}

.mt-large {
    margin-top: 20px;
}

.mb-4 {
    margin-bottom: 15px;
}

.mr-2 {
    margin-right: 8px;
}

.mb-3 {
    margin-bottom: 10px;
}

.pref-group {
    margin-bottom: 25px;
}

.pref-group-row {
    display: flex;
    gap: 10px;
    margin-bottom: 25px;
}

.pref-group-col {
    flex: 1;
}

.last-group {
    margin-bottom: 0;
    margin-top: 10px;
}

.sub-label {
    color: var(--color-neutral-600);
    font-size: 0.95rem;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.advanced-section {
    padding: 0;
    overflow: hidden;
}

.advanced-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
}

.advanced-header:active {
    background-color: #f9fafb;
}

.advanced-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
}

.icon-grey {
    color: #6b7280;
}

.advanced-content {
    padding: 0 20px 20px 20px;
    animation: slideDown 0.3s ease-out;
}

.danger-zone-content {
    background-color: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 12px;
    padding: 15px;
}

.warning-text {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-weight: 600;
}

.text-danger-600 {
    color: #dc2626;
}

.btn-delete {
    width: 100%;
    justify-content: center;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.spacer {
    height: 60px;
}

.actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    background: white;
    border-top: 1px solid #eee;
    z-index: 50;
    display: flex;
    justify-content: center;
}

.save-btn {
    width: 100%;
    max-width: 600px;
}
</style>