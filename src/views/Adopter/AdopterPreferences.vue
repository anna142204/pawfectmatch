<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/Button.vue'
import TagButton from '@/components/TagButton.vue'

import dogImg from '@/assets/images/dog.webp'
import catImg from '@/assets/images/cat.webp'
import birdImg from '@/assets/images/bird.webp'
import rodentImg from '@/assets/images/rodent.webp'
import fishImg from '@/assets/images/fish.webp'
import otherImg from '@/assets/images/other.webp'

const router = useRouter()
const { userId, getAuthFetchOptions, requireAuth } = useAuth()

const step = ref(1)
const loading = ref(false)
const error = ref('')

const form = ref({
  species: [],
  size: [],
  age: [],
  sex: [],
  environment: [],
  dressage: [],
  personality: [],
})

const animalOptions = [
  { label: 'Chiens', value: 'chien', image: dogImg },
  { label: 'Chats', value: 'chat', image: catImg },
  { label: 'Rongeurs', value: 'rongeur', image: rodentImg },
  { label: 'Oiseaux', value: 'oiseau', image: birdImg },
  // Ton modèle Animal a "autre" + "lapin" mais tu n’as pas d’image lapin; tu peux adapter plus tard.
  { label: 'Poissons', value: 'poisson', image: fishImg }, // ok côté adopter (string libre), mais tes animaux actuels n’ont pas "poisson"
  { label: 'Autres', value: 'autre', image: otherImg },
]

const sizeOptions = [
  { label: 'Petits', value: 'petit' },
  { label: 'Moyens', value: 'moyen' },
  { label: 'Grands', value: 'grand' },
]

const ageOptions = [
  { label: 'Bébés', value: '0-1' },
  { label: 'Jeunes', value: '1-3' },
  { label: 'Adultes', value: '3-7' },
  { label: 'Seniors', value: '7+' },
]

const sexOptions = [
  { label: 'Mâle', value: 'male' },
  { label: 'Femelle', value: 'female' },
]

const environmentOptions = [
  { label: 'appartement', value: 'appartement' },
  { label: 'voiture', value: 'voiture' },
  { label: 'enfants', value: 'enfant' },
  { label: 'chiens', value: 'chien' },
  { label: 'chats', value: 'chat' },
  { label: 'autres animaux', value: 'autre animaux' },
]

const dressageOptions = [
  { label: 'éduqué', value: 'éduqué' },
  { label: 'facile à dresser', value: 'facile à dresser' },
  { label: 'habitué à la laisse', value: 'habitué à la laisse' },
  { label: 'têtu', value: 'têtu' },
]

const personalityOptions = [
  { label: 'calme', value: 'calme' },
  { label: 'énergique', value: 'énergique' },
  { label: 'indépendant', value: 'indépendant' },
  { label: 'affectueux', value: 'affectueux' },
  { label: 'curieux', value: 'curieux' },
  { label: 'joueur', value: 'joueur' },
  { label: 'bavard', value: 'bavard' },
  { label: 'explorateur', value: 'explorateur' },
  { label: 'câlin', value: 'câlin' },
  { label: 'protecteur', value: 'protecteur' },
  { label: 'territorial', value: 'territorial' },
  { label: 'sociable', value: 'sociable' },
  { label: 'timide', value: 'timide' },
  { label: 'peureux', value: 'peureux' },
]

const questionTitle = computed(() => {
  if (step.value === 1) return 'Animaux*'
  if (step.value === 2) return 'Critères*'
  return 'Affinités*'
})

const questionSubTitle = computed(() => `Question N°${step.value} sur 3`)

const toggleArrayValue = (arr, value) => {
  const idx = arr.indexOf(value)
  if (idx === -1) arr.push(value)
  else arr.splice(idx, 1)
}

const isSelected = (arr, value) => arr.includes(value)

const selectAllToggle = (targetArray, allValues) => {
  const isAllSelected = allValues.every(v => targetArray.includes(v))
  
  if (isAllSelected) {
    targetArray.splice(0, targetArray.length)
  } else {
    targetArray.splice(0, targetArray.length, ...allValues)
  }
}

const canGoNext = computed(() => {
  if (step.value === 1) return form.value.species.length > 0
  if (step.value === 2) {
    return form.value.size.length > 0 || form.value.age.length > 0 || form.value.sex.length > 0
  }
  if (step.value === 3) {
    return form.value.environment.length > 0 || form.value.dressage.length > 0 || form.value.personality.length > 0
  }
  return true
})

const handleNext = () => {
  error.value = ''

  if (step.value === 1 && form.value.species.length === 0) {
    error.value = 'Sélectionne au moins un type d’animal'
    return
  }

  if (step.value < 3) step.value++
}

const handleBack = () => {
  error.value = ''
  if (step.value > 1) step.value--
}

const handleSave = async () => {
  error.value = ''
  if (!requireAuth() || !userId.value) {
    error.value = 'Utilisateur introuvable'
    return
  }

  loading.value = true
  try {
    const payload = {
      preferences: {
        ...form.value,
      },
    }

    const res = await fetch(
      `/api/adopters/${userId.value}`,
      getAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    )

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      error.value = data.error || 'Impossible d’enregistrer tes préférences'
      return
    }

    router.push('/adopter')
  } catch (e) {
    error.value = 'Impossible d’enregistrer tes préférences'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="prefs-page">
    <div class="prefs-container">
      <div class="prefs-header">
        <div class="title-row">
          <h1 class="title">{{ questionTitle }}</h1>
          <span class="counter">{{ questionSubTitle }}</span>
        </div>
      </div>

      <div class="prefs-content">
        <p class="subtitle">
          <template v-if="step === 1">Quels animaux souhaitez-vous adopter ?</template>
          <template v-else-if="step === 2">Quels sont vos critères d'adoption ?</template>
          <template v-else>Quels sont vos critères de compatibilités ?</template>
          <br />
          <small>(Vous pouvez en sélectionner plusieurs)</small>
        </p>

        <!-- STEP 1 -->
        <section v-if="step === 1" class="animals-grid">
          <button
            v-for="opt in animalOptions"
            :key="opt.value"
            type="button"
            class="animal-card"
            :class="{ selected: isSelected(form.species, opt.value) }"
            @click="toggleArrayValue(form.species, opt.value)"
          >
            <img :src="opt.image" :alt="opt.label" class="animal-img" />
            <span class="animal-label">{{ opt.label }}</span>
          </button>
        </section>

        <!-- STEP 2 -->
        <section v-else-if="step === 2" class="blocks">
          <div class="block">
            <div class="block-head">
              <h2 class="block-title">Taille</h2>
              <button
                type="button"
                class="select-all"
                @click="selectAllToggle(form.size, sizeOptions.map(o => o.value))"
              >
                Tout sélectionner
              </button>
            </div>

            <div class="cards-row">
              <button
                v-for="opt in sizeOptions"
                :key="opt.value"
                type="button"
                class="criteria-card"
                :class="{ selected: isSelected(form.size, opt.value) }"
                @click="toggleArrayValue(form.size, opt.value)"
              >
                <div class="criteria-card-inner">
                  <div class="criteria-title">{{ opt.label }}</div>
                </div>
              </button>
            </div>
          </div>

          <div class="block">
            <div class="block-head">
              <h2 class="block-title">Âge</h2>
              <button
                type="button"
                class="select-all"
                @click="selectAllToggle(form.age, ageOptions.map(o => o.value))"
              >
                Tout sélectionner
              </button>
            </div>

            <div class="cards-row">
              <button
                v-for="opt in ageOptions"
                :key="opt.value"
                type="button"
                class="criteria-card"
                :class="{ selected: isSelected(form.age, opt.value) }"
                @click="toggleArrayValue(form.age, opt.value)"
              >
                <div class="criteria-card-inner">
                  <div class="criteria-title">{{ opt.label }}</div>
                </div>
              </button>
            </div>
          </div>

          <div class="block">
            <div class="block-head">
              <h2 class="block-title">Genre</h2>
              <button
                type="button"
                class="select-all"
                @click="selectAllToggle(form.sex, sexOptions.map(o => o.value))"
              >
                Tout sélectionner
              </button>
            </div>

            <div class="cards-row">
              <button
                v-for="opt in sexOptions"
                :key="opt.value"
                type="button"
                class="criteria-card"
                :class="{ selected: isSelected(form.sex, opt.value) }"
                @click="toggleArrayValue(form.sex, opt.value)"
              >
                <div class="criteria-card-inner">
                  <div class="criteria-title">{{ opt.label }}</div>
                </div>
              </button>
            </div>
          </div>
        </section>

        <!-- STEP 3 -->
        <section v-else class="blocks">
          <div class="block">
            <div class="block-head">
              <h2 class="block-title">Environnement</h2>
              <button
                type="button"
                class="select-all"
                @click="selectAllToggle(form.environment, environmentOptions.map(o => o.value))"
              >
                Tout sélectionner
              </button>
            </div>

            <div class="chips">
              <TagButton
                v-for="opt in environmentOptions"
                :key="opt.value"
                :label="opt.label"
                :selected="isSelected(form.environment, opt.value)"
                @toggle="toggleArrayValue(form.environment, opt.value)"
              />
            </div>
          </div>

          <div class="block">
            <div class="block-head">
              <h2 class="block-title">Dressage</h2>
              <button
                type="button"
                class="select-all"
                @click="selectAllToggle(form.dressage, dressageOptions.map(o => o.value))"
              >
                Tout sélectionner
              </button>
            </div>

            <div class="chips">
              <TagButton
                v-for="opt in dressageOptions"
                :key="opt.value"
                :label="opt.label"
                :selected="isSelected(form.dressage, opt.value)"
                @toggle="toggleArrayValue(form.dressage, opt.value)"
              />
            </div>
          </div>

          <div class="block">
            <div class="block-head">
              <h2 class="block-title">Personnalité</h2>
              <button
                type="button"
                class="select-all"
                @click="selectAllToggle(form.personality, personalityOptions.map(o => o.value))"
              >
                Tout sélectionner
              </button>
            </div>

            <div class="chips">
              <TagButton
                v-for="opt in personalityOptions"
                :key="opt.value"
                :label="opt.label"
                :selected="isSelected(form.personality, opt.value)"
                @toggle="toggleArrayValue(form.personality, opt.value)"
              />
            </div>
          </div>
        </section>

        <div v-if="error" class="error-message">{{ error }}</div>
      </div>

      <footer class="prefs-actions">
        <Button type="button" variant="secondary" size="base" class="btn-back" :disabled="step === 1" @click="handleBack">
          retour
        </Button>

        <Button
          v-if="step < 3"
          type="button"
          variant="primary"
          size="base"
          class="btn-next"
          :disabled="!canGoNext"
          @click="handleNext"
        >
          suivant
        </Button>

        <Button
          v-else
          type="button"
          variant="primary"
          size="base"
          class="btn-next"
          :disabled="loading || !canGoNext"
          @click="handleSave"
        >
          <span v-if="loading" class="loader"></span>
          <span v-else>terminer</span>
        </Button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.prefs-page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  background: var(--gradient-primary-secondary);
  padding: 0 !important;
  overflow: hidden;
}

.prefs-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.prefs-header {
  padding: var(--spacing-8) var(--spacing-6) var(--spacing-4);
  text-align: center;
}

.title-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--spacing-3);
}

.title {
  margin: 0;
  font-family: var(--font-family);
  font-size: var(--heading-h1-size, 32px);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-white);
}

.counter {
  font-size: var(--body-sm-size);
  color: var(--color-neutral-white);
  opacity: 0.9;
}

.subtitle {
  margin: 0 0 var(--spacing-6) 0;
  font-size: var(--body-base-size);
  color: var(--color-neutral-600);
  text-align: center;
}

.subtitle small {
  color: var(--color-neutral-500);
}

.prefs-content {
  background: var(--color-neutral-white);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--spacing-6);
  padding-top: var(--spacing-8);
  box-shadow: var(--shadow-2xl);
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.animals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-4);
}

.animal-card {
  background: transparent;
  border: 2px solid transparent;
  padding: var(--spacing-2);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.animal-card.selected {
  border-color: var(--color-primary-600);
  background: rgba(124, 58, 237, 0.08);
}

.animal-img {
  width: 86px;
  height: 86px;
  object-fit: contain;
}

.animal-label {
  font-size: var(--body-sm-size);
  color: var(--color-neutral-900);
}

.blocks {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--spacing-3);
}

.block-title {
  margin: 0;
  font-size: var(--heading-h3-size, 22px);
  color: var(--color-neutral-900);
}

.select-all {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-primary-600);
  font-weight: var(--font-weight-medium);
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-4);
}

.criteria-card {
  border: 2px solid var(--color-neutral-200);
  background: var(--color-neutral-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-4);
  cursor: pointer;
}

.criteria-card.selected {
  border-color: var(--color-primary-600);
  background: rgba(124, 58, 237, 0.08);
}

.criteria-title {
  font-size: var(--body-base-size);
  color: var(--color-neutral-900);
  text-align: center;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.error-message {
  background: var(--color-error);
  color: var(--color-neutral-white);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-base);
  margin-top: var(--spacing-4);
  text-align: center;
}

.prefs-actions {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--color-neutral-white);
}

.prefs-actions :deep(.btn-back) {
  flex: 1;
}

.prefs-actions :deep(.btn-next) {
  flex: 2;
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
