<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useToast } from '@/composables/useToast';
import { Edit2, Trash2 } from 'lucide-vue-next'; 

import ProgressSteps from '@/components/ProgressSteps.vue';
import Button from '@/components/Button.vue';
import BackButton from '@/components/BackButton.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import Input from '@/components/Input.vue';
import Dropdown from '@/components/Dropdown.vue';
import TagButton from '@/components/TagButton.vue';
import BaseAutocomplete from '@/components/BaseAutocomplete.vue';

import {
    STEPS, SPECIES_OPTIONS, AGE_OPTIONS, SEX_OPTIONS,
    SIZE_OPTIONS, WEIGHT_OPTIONS, ENV_OPTIONS,
    TRAINING_OPTIONS, PERSONALITY_OPTIONS, getBreedsForSpecies
} from '@/constants/animalOptions';

const router = useRouter();
const { userId, getAuthFetchOptions } = useAuth();
const { error, success } = useToast();

const currentStep = ref(0);
const showConfirmModal = ref(false);
const isUploading = ref(false);
const isEditMode = ref(false);
const editingId = ref(null);
const STORAGE_KEY = 'animal_form_draft';

const confirmModalConfig = ref({ title: '', message: '', action: null });

const form = reactive({
    name: '', species: '', race: '', age: '', sex: '',
    city: '', zip: '', price: '', size: '', weight: '',
    existingImages: [], // URLs (venant de l'API)
    newImages: [],      // Files (venant de l'upload)
    characteristics: { environment: [], dressage: [], personality: [] },
    description: ''
});

const LABELS = {
    species: { chat: 'Chat', chien: 'Chien', lapin: 'Lapin', oiseau: 'Oiseau', rongeur: 'Rongeur', autre: 'Autre' },
    age: { '0-1': '0-1 an', '1-3': '1-3 ans', '3-7': '3-7 ans', '7+': '7+ ans' },
    sex: { male: 'Mâle', female: 'Femelle' },
    size: { petit: 'Petit', moyen: 'Moyen', grand: 'Grand' },
    weight: { '0-5': '0-5 kg', '5-10': '5-10 kg', '10-20': '10-20 kg', '20-30': '20-30 kg', '30+': '30+ kg' }
};

const currentBreedOptions = computed(() => getBreedsForSpecies(form.species));
const canDelete = computed(() => isEditMode.value && editingId.value);

const totalImagesCount = computed(() => form.existingImages.length + form.newImages.length);

onMounted(async () => {
    const editId = localStorage.getItem('editingAnimalId');
    if (editId) {
        isEditMode.value = true;
        editingId.value = editId;
        await loadAnimalData(editId);
        currentStep.value = 4;
    } else {
        loadDraft();
    }
});

const loadDraft = () => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
        try {
            const parsed = JSON.parse(draft);
            Object.assign(form, parsed);
            form.newImages = [];
            form.characteristics = form.characteristics || { environment: [], dressage: [], personality: [] };
        } catch (e) { console.error(e); }
    }
};

const loadAnimalData = async (id) => {
    try {
        const res = await fetch(`/api/animals/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Impossible de charger l\'animal');
        const data = await res.json();

        form.name = data.name || '';
        form.species = data.species || '';
        form.race = data.race || '';
        form.age = data.age || '';
        form.sex = data.sex || '';
        form.size = data.size || '';
        form.weight = data.weight || '';
        form.price = data.price || '';
        form.description = data.description || '';

        form.city = data.address?.city || '';
        form.zip = data.address?.zip || '';

        if (Array.isArray(data.images)) {
            form.existingImages = data.images; 
        } else if (data.images) {
            form.existingImages = [data.images];
        } else {
            form.existingImages = [];
        }
        
        form.newImages = [];

        form.characteristics = { environment: [], dressage: [], personality: [] };

        if (data.characteristics) {
            form.characteristics.environment = data.characteristics.environment || [];
            form.characteristics.dressage = data.characteristics.dressage || []; 
            form.characteristics.personality = data.characteristics.personality || [];
        }

    } catch (err) {
        error("Erreur chargement données");
        router.push('/owner/animals');
    }
};

// Sauvegarde automatique (sauf en edit)
watch(form, (newVal) => {
    if (isEditMode.value) return;
    const { newImages, existingImages, ...safeData } = newVal;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...safeData, existingImages }));
}, { deep: true });

watch(() => form.species, (newVal, oldVal) => {
    if (!isEditMode.value && oldVal && newVal !== oldVal) form.race = '';
});

const handleNewFiles = (files) => {
    form.newImages = files;
};

const removeExistingImage = (index) => {
    form.existingImages.splice(index, 1);
};

const toggleTag = (category, value) => {
    const list = form.characteristics[category];
    const idx = list.indexOf(value);
    if (idx > -1) list.splice(idx, 1);
    else list.push(value);
};
const isTagSelected = (cat, val) => form.characteristics[cat]?.includes(val);

const nextStep = () => {
    if (validateStep(currentStep.value)) {
        currentStep.value++;
        scrollToTop();
    }
};
const prevStep = () => { if (currentStep.value > 0) currentStep.value--; scrollToTop(); };
const goToStep = (index) => { currentStep.value = index; scrollToTop(); };
const scrollToTop = () => document.querySelector('.form-scroll-container')?.scrollTo(0, 0);

const validateStep = (step) => {
    if (step === 0) {
        if (!form.name || !form.species || !form.age || !form.sex || !form.city || !form.zip || !form.price) {
            error('Veuillez remplir les champs obligatoires'); return false;
        }
    }
    if (step === 1) {
        if (totalImagesCount.value === 0) {
            error('Ajoutez au moins une photo'); return false;
        }
    }
    if (step === 3 && !form.description.trim()) {
        error('La description est requise'); return false;
    }
    return true;
};

const submitForm = async () => {
    if (!validateStep(currentStep.value)) return;
    isUploading.value = true;

    try {
        const finalImages = [...form.existingImages];

        if (form.newImages.length > 0) {
            const formData = new FormData();
            
            form.newImages.forEach(fileItem => {
                formData.append('image', fileItem.file);
            });

            const uploadRes = await fetch('/api/images/animal', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!uploadRes.ok) throw new Error("Erreur lors de l'upload des images");

            const uploadData = await uploadRes.json();
            
            if (uploadData.data && uploadData.data.images) {
                const newUrls = uploadData.data.images.map(img => img.url);
                finalImages.push(...newUrls);
            } else if (uploadData.data && uploadData.data.url) {
                 // Cas où une seule image
                 finalImages.push(uploadData.data.url);
            }
        }

        const payload = {
            name: form.name,
            species: form.species,
            race: form.race || '',
            age: form.age,
            sex: form.sex,
            size: form.size || undefined,
            weight: form.weight || undefined,
            address: { city: form.city, zip: form.zip },
            images: finalImages, 
            price: parseFloat(form.price),
            description: form.description,
            characteristics: {
                environment: [...form.characteristics.environment],
                dressage: [...form.characteristics.dressage],
                personality: [...form.characteristics.personality]
            },
            ownerId: userId.value,
            availability: true
        };
        
        if (Array.isArray(payload.images)) {
            payload.images = payload.images.flat();
        }

        const url = isEditMode.value ? `/api/animals/${editingId.value}` : '/api/animals';
        const method = isEditMode.value ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method, 
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', 
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Erreur ${isEditMode.value ? 'modification' : 'création'}`);

        cleanUpAndExit(isEditMode.value ? 'Modifications enregistrées !' : 'Animal créé avec succès !');

    } catch (err) {
        console.error(err);
        error(err.message || "Une erreur est survenue");
    } finally {
        isUploading.value = false;
    }
};

const confirmDelete = () => {
    confirmModalConfig.value = {
        title: 'Supprimer l\'animal',
        message: `Êtes-vous sûr de vouloir supprimer ${form.name} ?`,
        action: 'delete'
    };
    showConfirmModal.value = true;
};

const executeDelete = async () => {
    try {
        const res = await fetch(`/api/animals/${editingId.value}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) throw new Error('Erreur suppression');
        cleanUpAndExit('Animal supprimé');
    } catch (err) { error(err.message); }
};

const cleanUpAndExit = (msg = '') => {
    if (msg) success(msg);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('editingAnimalId');
    router.push('/owner/animals');
};

const handleQuitRequest = () => {
    confirmModalConfig.value = {
        title: 'Quitter ?',
        message: 'Vos données non sauvegardées seront perdues.',
        action: 'quit'
    };
    showConfirmModal.value = true;
};

const handleModalConfirm = () => {
    showConfirmModal.value = false;
    if (confirmModalConfig.value.action === 'quit') cleanUpAndExit();
    if (confirmModalConfig.value.action === 'delete') executeDelete();
};
</script>

<template>
    <div class="view-screen">
        <div class="view-header">
            <div class="header-content">
                <BackButton manual @click="handleQuitRequest" />
                <h1 class="page-title text-h2 text-primary-700">
                    {{ isEditMode ? 'Modifier' : 'Ajouter' }} un animal
                </h1>
            </div>
        </div>
        <div class="stepper-wrapper">
            <ProgressSteps :steps="STEPS" :current-step="currentStep" />
        </div>

        <div class="form-scroll-container">

            <div v-show="currentStep === 0" class="step-content">
                <div class="form-group">
                    <label class="form-label text-body-lg text-neutral-black">Nom de l'animal</label>
                    <Input v-model="form.name" placeholder="Ex: Rex" required />
                </div>
                <div class="form-group">
                    <label class="form-label text-body-lg text-neutral-black">Espèce</label>
                    <Dropdown v-model="form.species" :options="SPECIES_OPTIONS" placeholder="Choisir" />
                </div>
                <div class="form-group" v-if="currentBreedOptions.length > 0">
                    <BaseAutocomplete 
                        v-model="form.race" 
                        label="Race" 
                        :options="currentBreedOptions"
                        placeholder="Rechercher..." 
                        :strict-mode="true"
                    />
                </div>
                <div class="form-group" v-else>
                    <label class="form-label text-body-lg text-neutral-black">Race / Type</label>
                    <Input v-model="form.race" placeholder="Ex: Croisé..." />
                </div>
                <div class="form-row">
                    <div class="form-group half"><label class="form-label text-body-lg text-neutral-black">Âge</label>
                        <Dropdown v-model="form.age" :options="AGE_OPTIONS" placeholder="Choisir" />
                    </div>
                    <div class="form-group half"><label class="form-label text-body-lg text-neutral-black">Sexe</label>
                        <Dropdown v-model="form.sex" :options="SEX_OPTIONS" placeholder="Choisir" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group half"><label
                            class="form-label text-body-lg text-neutral-black">Taille</label>
                        <Dropdown v-model="form.size" :options="SIZE_OPTIONS" placeholder="Choisir" />
                    </div>
                    <div class="form-group half"><label class="form-label text-body-lg text-neutral-black">Poids</label>
                        <Dropdown v-model="form.weight" :options="WEIGHT_OPTIONS" placeholder="Choisir" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group half"><label
                            class="form-label text-body-lg text-neutral-black">Ville</label><Input v-model="form.city"
                            placeholder="Lausanne" required /></div>
                    <div class="form-group half"><label
                            class="form-label text-body-lg text-neutral-black">NPA</label><Input v-model="form.zip"
                            placeholder="1000" required /></div>
                </div>
                <div class="form-group"><label class="form-label text-body-lg text-neutral-black">Prix
                        (CHF)</label><Input v-model="form.price" type="number" placeholder="500" required /></div>
            </div>

            <div v-show="currentStep === 1" class="step-content">

                <div class="description">
                    <h2 class="section-title text-h3 text-primary-700">Ajoutez des photos</h2>
                    <p class="description-text text-body-base text-neutral-900">
                        Ajoutez des photos de l'animal afin que le futur propriétaire tombe sous son charme
                    </p>
                    <p class="description-subtext text-body-sm text-neutral-600">
                        (Vous pouvez en sélectionner plusieurs)
                    </p>
                </div>

                <ImageUploader @filesSelected="handleNewFiles" />

                <div v-if="form.existingImages.length > 0" class="uploaded-images-section">
                    <div class="uploaded-header">
                        <h3 class="uploaded-title text-body-lg text-neutral-black">Images sauvegardées</h3>
                        <span class="image-count">{{ form.existingImages.length }}</span>
                    </div>
                    <div class="images-grid">
                        <div v-for="(imgUrl, index) in form.existingImages" :key="index" class="image-item">
                            <img :src="imgUrl" class="image-preview" />
                            <button type="button" @click="removeExistingImage(index)" class="remove-image-btn">
                                <Trash2 :size="16" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <div v-show="currentStep === 2" class="step-content">
                <div class="description">
                    <p class="description-text text-body-base text-neutral-black">
                        Veuillez sélectionner les compatibilités que l'animal devrait avoir avec son futur propriétaire
                    </p>
                    <p class="description-subtext text-body-sm text-neutral-600">
                        (Vous pouvez en sélectionner plusieurs)
                    </p>
                </div>
                <div class="affinity-section">
                    <h3 class="section-title text-h4 text-neutral-black">Environnement</h3>
                    <div class="tags-container">
                        <TagButton v-for="opt in ENV_OPTIONS" :key="opt.value" :label="opt.label" :icon="opt.icon"
                            :selected="isTagSelected('environment', opt.value)"
                            @toggle="toggleTag('environment', opt.value)" />
                    </div>
                </div>
                <div class="affinity-section">
                    <h3 class="section-title text-h4 text-neutral-black">Dressage</h3>
                    <div class="tags-container">
                        <TagButton v-for="opt in TRAINING_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="isTagSelected('dressage', opt.value)"
                            @toggle="toggleTag('dressage', opt.value)" />
                    </div>
                </div>
                <div class="affinity-section">
                    <h3 class="section-title text-h4 text-neutral-black">Personnalité</h3>
                    <div class="tags-container">
                        <TagButton v-for="opt in PERSONALITY_OPTIONS" :key="opt.value" :label="opt.label"
                            :selected="isTagSelected('personality', opt.value)"
                            @toggle="toggleTag('personality', opt.value)" />
                    </div>
                </div>
            </div>

            <div v-show="currentStep === 3" class="step-content h-full">
                <div class="form-group h-full flex flex-col">
                    <label class="form-label text-body-lg text-neutral-black">Description</label>
                    <textarea v-model="form.description" class="textarea-field"
                        placeholder="Décrivez l'animal..."></textarea>
                </div>
            </div>

            <div v-show="currentStep === 4" class="step-content resume-container">

                <div class="resume-section">
                    <div class="section-header">
                        <h2 class="section-title text-h4 text-neutral-black">Informations générales</h2>
                        <button class="edit-button" @click="goToStep(0)">
                            <Edit2 :size="20" />
                        </button>
                    </div>
                    <div class="section-content">
                        <div class="info-row"><span class="info-label text-body-base text-neutral-700">Nom :</span><span
                                class="info-val text-body-base text-neutral-black">{{ form.name }}</span></div>
                        <div class="info-row"><span class="info-label text-body-base text-neutral-700">Espèce
                                :</span><span class="info-val text-body-base text-neutral-black">{{
                                LABELS.species[form.species] }}</span></div>
                        <div class="info-row"><span class="info-label text-body-base text-neutral-700">Race
                                :</span><span class="info-val text-body-base text-neutral-black">{{ form.race || '-'
                                }}</span></div>
                        <div class="info-row"><span class="info-label text-body-base text-neutral-700">Âge :</span><span
                                class="info-val text-body-base text-neutral-black">{{ LABELS.age[form.age] }}</span>
                        </div>
                        <div class="info-row"><span class="info-label text-body-base text-neutral-700">Genre
                                :</span><span class="info-val text-body-base text-neutral-black">{{ LABELS.sex[form.sex]
                                }}</span></div>
                        <div class="info-row"><span class="info-label text-body-base text-neutral-700">Ville
                                :</span><span class="info-val text-body-base text-neutral-black">{{ form.city }}</span>
                        </div>
                        <div class="info-row"><span class="info-label text-body-base text-neutral-700">Prix
                                :</span><span class="info-val text-body-base text-neutral-black">{{ form.price }}
                                CHF</span></div>
                    </div>
                </div>

                <div class="resume-section">
                    <div class="section-header">
                        <h2 class="section-title text-h4 text-neutral-black">Médias</h2>
                        <button class="edit-button" @click="goToStep(1)">
                            <Edit2 :size="20" />
                        </button>
                    </div>
                    <div class="media-grid" v-if="totalImagesCount > 0">
                        <div v-for="(img, idx) in form.existingImages" :key="'ex-' + idx" class="image-item">
                            <img :src="img" class="image-preview" />
                        </div>
                        <div v-for="(img, idx) in form.newImages" :key="'new-' + idx" class="image-item">
                            <img :src="img.preview" class="image-preview" />
                        </div>
                    </div>
                    <p v-else class="empty-message text-body-base text-neutral-500">Aucun média</p>
                </div>

                <div class="resume-section">
                    <div class="section-header">
                        <h2 class="section-title text-h4 text-neutral-black">Affinités</h2>
                        <button class="edit-button" @click="goToStep(2)">
                            <Edit2 :size="20" />
                        </button>
                    </div>
                    <div class="section-content">
                        <div class="affinity-group" v-if="form.characteristics.environment.length">
                            <span class="affinity-label text-body-base text-neutral-700">Environnement :</span>
                            <div class="tags-list"><span v-for="t in form.characteristics.environment" :key="t"
                                    class="tag">{{ t }}</span></div>
                        </div>
                        <div class="affinity-group" v-if="form.characteristics.dressage.length">
                            <span class="affinity-label text-body-base text-neutral-700">Dressage :</span>
                            <div class="tags-list"><span v-for="t in form.characteristics.dressage" :key="t"
                                    class="tag">{{ t }}</span></div>
                        </div>
                        <div class="affinity-group" v-if="form.characteristics.personality.length">
                            <span class="affinity-label text-body-base text-neutral-700">Personnalité :</span>
                            <div class="tags-list"><span v-for="t in form.characteristics.personality" :key="t"
                                    class="tag">{{ t }}</span></div>
                        </div>
                        <p v-if="!form.characteristics.environment.length && !form.characteristics.dressage.length && !form.characteristics.personality.length"
                            class="empty-message text-body-base text-neutral-500">Aucune affinité</p>
                    </div>
                </div>

                <div class="resume-section">
                    <div class="section-header">
                        <h2 class="section-title text-h4 text-neutral-black">Description</h2>
                        <button class="edit-button" @click="goToStep(3)">
                            <Edit2 :size="20" />
                        </button>
                    </div>
                    <p class="description-text text-body-base text-neutral-black">{{ form.description }}</p>
                </div>

                <div v-if="canDelete" class="delete-section">
                    <Button type="button" variant="danger" class="btn-delete-full" @click="confirmDelete">
                        Supprimer cet animal
                    </Button>
                </div>
            </div>

        </div>

        <div class="fixed-footer">
            <Button v-if="currentStep > 0" variant="secondary" class="btn-flex" @click="prevStep"
                :disabled="isUploading">Retour</Button>
            <Button v-if="currentStep < 4" variant="primary" class="btn-flex" @click="nextStep">Suivant</Button>
            <Button v-else variant="primary" class="btn-flex" @click="submitForm" :disabled="isUploading">
                {{ isUploading ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Terminer') }}
            </Button>
        </div>

        <ConfirmModal :show="showConfirmModal" :title="confirmModalConfig.title" :message="confirmModalConfig.message"
            confirmText="Confirmer" cancelText="Annuler" @confirm="handleModalConfirm"
            @cancel="showConfirmModal = false" />
    </div>
</template>

<style scoped>
.view-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-neutral-100);
    padding: var(--general-padding);
    padding-bottom: 0;
}

.view-header {
    padding: 36px 0 16px 0;
}

.header-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
}

.page-title {
    flex: 1;
    text-align: center;
    margin: 0;
    margin-right: 40px;
}

.stepper-wrapper {
    margin-bottom: var(--spacing-6);
}

.form-scroll-container {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 100px;
    display: flex;
    flex-direction: column;
}

.step-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
    animation: fadeIn 0.3s ease;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.form-label {
    font-weight: 600;
}

.form-row {
    display: flex;
    gap: var(--spacing-4);
}

.half {
    flex: 1;
    min-width: 0;
}

.textarea-field {
    flex: 1;
    min-height: 200px;
    padding: var(--spacing-4);
    border-radius: var(--radius-base);
    border: none;
    resize: none;
    font-family: inherit;
    font-size: 16px;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.description {
    text-align: center;
    padding: 0 var(--spacing-2);
    margin-bottom: var(--spacing-2);
}

.description-text {
    margin: 0 0 8px 0;
    line-height: 1.5;
}

.description-subtext {
    margin: 0;
}

.section-title {
    margin: 0 0 8px 0;
}

.uploaded-images-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    margin-top: var(--spacing-4);
}

.uploaded-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.uploaded-title {
    margin: 0;
}

.image-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 var(--spacing-2);
    background-color: var(--color-primary-100);
    color: var(--color-primary-700);
    border-radius: var(--radius-full);
    font-size: var(--body-xs-size);
    font-weight: 600;
}

.images-grid,
.media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: var(--spacing-3);
}

.image-item {
    position: relative;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background-color: var(--color-neutral-200);
    transition: transform 0.2s ease;
    aspect-ratio: 1;
}

.image-item:active {
    transform: scale(0.98);
}

.image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-lg);
    display: block;
}

.remove-image-btn {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
}

.remove-image-btn:hover {
    background: rgba(220, 38, 38, 0.9);
    transform: scale(1.1);
}

.remove-image-btn:active {
    transform: scale(0.95);
}

.resume-container {
    gap: var(--spacing-4);
}

.resume-section {
    background: white;
    padding: var(--spacing-4);
    border-radius: var(--radius-base);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-neutral-200);
}

.section-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.edit-button {
    color: var(--color-primary-600);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
}

.info-row {
    display: flex;
    gap: var(--spacing-2);
}

.info-label {
    font-weight: 600;
    min-width: 80px;
}

.empty-message {
    font-style: italic;
}

/* AFFINITÉS */
.affinity-section {
    margin-bottom: var(--spacing-4);
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
}

.affinity-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
}

.tag {
    display: inline-block;
    padding: var(--spacing-1) var(--spacing-3);
    background-color: var(--color-primary-100);
    color: var(--color-primary-700);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

/* FOOTER */
.delete-section {
    margin-top: var(--spacing-4);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-neutral-200);
}

.btn-delete-full {
    width: 100%;
}

.fixed-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
    background-color: var(--color-neutral-100);
    display: flex;
    gap: var(--spacing-3);
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);
    z-index: 20;
}

.btn-flex {
    flex: 1;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>