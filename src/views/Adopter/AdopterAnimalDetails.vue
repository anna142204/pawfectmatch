<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Menu from '@/components/Menu.vue';
import BackButton from '@/components/BackButton.vue';
import Button from '@/components/Button.vue';
import { Cat, MapPin, Mars, Heart, Home } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const animal = ref(null);
const loading = ref(true);
const error = ref(null);

const goBackToSwipe = () => {
  router.push({ name: 'AdopterSwipe' });
};

const fetchAnimal = async () => {
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id;
    const response = await fetch(`/api/animals/${id}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Erreur lors du chargement de l\'animal');
    const data = await response.json();
    animal.value = data.animal || data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAnimal();
});

const charColumns = computed(() => {
  if (!animal.value || !animal.value.characteristics) return [[], []];
  const chars = Array.isArray(animal.value.characteristics)
    ? animal.value.characteristics
    : Object.values(animal.value.characteristics).flat();
  const mid = Math.ceil(chars.length / 2);
  return [chars.slice(0, mid), chars.slice(mid)];
});
</script>

<template>
  <div class="animal-page">
    <div class="hero">
      <BackButton @click="goBackToSwipe" />
      <img :src="animal?.image || '/images/sample-cat.jpg'" alt="photo animal" class="hero-img"/>
    </div>

    <section class="card">
      <template v-if="loading">
        <div style="text-align:center; padding:2rem;">Chargement...</div>
      </template>
      <template v-else-if="error">
        <div style="color:red; text-align:center; padding:2rem;">{{ error }}</div>
      </template>
      <template v-else-if="animal">
        <div class="card-header">
          <div class="title">
            <div class="name-row">
              <h1 class="text-h2">{{ animal.name }}</h1>
              <div class="gender" :title="animal.gender">
                <Mars size="18" v-if="animal.gender === 'male'" />
                <Mars size="18" v-else />
              </div>
            </div>

            <div class="tags">
              <span class="tag"><Cat size="18" /> {{ animal.species || 'Animal' }}</span>
              <span class="tag small"><MapPin size="18" /> {{ animal.location || animal.city || '' }}</span>
            </div>
          </div>

          <div class="shelter">
            <div class="shelter-logo">{{ animal.shelter?.name || '' }}</div>
          </div>
        </div>

        <div class="info-row">
          <div class="info-col">
            <div class="info-label text-body-sm">Race</div>
            <div class="info-value text-body-lg">{{ animal.race }}</div>
          </div>
          <div class="info-col">
            <div class="info-label text-body-sm">Âge</div>
            <div class="info-value text-body-lg">{{ animal.age }}</div>
          </div>
          <div class="info-col">
            <div class="info-label text-body-sm">Prix</div>
            <div class="info-value text-body-lg">{{ animal.price }}</div>
          </div>
        </div>

        <h2 class="text-h4" style="margin-top: var(--spacing-4); margin-bottom: var(--spacing-2);">Caractéristiques</h2>

        <div class="chars">
          <div class="char-col" v-for="(col, idx) in charColumns" :key="idx">
            <ul>
              <li v-for="(c, i) in col" :key="i" class="text-body-base"><span class="bullet"></span>{{ c }}</li>
            </ul>
          </div>
        </div>

        <h2 class="text-h4" style="margin-top: var(--spacing-4); margin-bottom: var(--spacing-2);">Description</h2>
        <p class="text-body-base">{{ animal.description }}</p>

        <div class="fav-btn-row">
          <button class="fav-btn" aria-label="Favori">
            <Heart size="28" stroke-width="1.6" />
          </button>
        </div>
      </template>
    </section>

    <Menu />
  </div>
</template>

<style scoped>
.animal-page {
  color: var(--color-neutral-black);
  position: relative;
  min-height: 100vh;
  background: var(--color-neutral-white);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero {
  position: relative;
  height: 340px;
  overflow: hidden;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card {
  background: #fff7fb;
  border-top-left-radius: var(--radius-2xl);
  border-top-right-radius: var(--radius-2xl);
  margin-top: -30px;
  padding: var(--spacing-6) var(--spacing-6) 180px;
  box-shadow: 0 -6px 30px rgba(230,200,220,0.18);
  position: relative;
  z-index: 10;
  min-height: calc(100vh - 340px + 30px);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
}

.title {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.name-row h1 {
  margin: 0;
  font-weight: var(--font-weight-bold);
}

.gender {
  display: flex;
  align-items: center;
}

.gender svg {
  color: var(--color-neutral-900);
  opacity: 0.95;
}

.tags {
  margin-top: var(--spacing-2);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  background: var(--color-secondary-50);
  color: var(--color-secondary-800);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  margin-right: var(--spacing-2);
  font-size: var(--body-sm-size);
  font-weight: var(--font-weight-normal);
}

.tag svg {
  display: inline-block;
}

.shelter {
  display: flex;
  justify-content: center;
}

.shelter-logo {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, var(--color-neutral-white), var(--color-secondary-100));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--label-sm-size);
  text-align: center;
  font-weight: var(--font-weight-normal);
  color: var(--color-neutral-900);
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-4);
  gap: var(--spacing-4);
}

.info-col {
  text-align: center;
  flex: 1;
}

.info-label {
  color: var(--color-neutral-600);
  font-weight: var(--font-weight-normal);
}

.info-value {
  font-weight: var(--font-weight-semibold);
  margin-top: var(--spacing-1);
}

.chars {
  display: flex;
  gap: var(--spacing-4);
}

.char-col {
  flex: 1;
}

.char-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.char-col li {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) 0;
  color: var(--color-neutral-700);
}

.bullet {
  width: 12px;
  height: 12px;
  background: var(--color-accent-600);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

    .fav-btn-row {
      display: flex;
      justify-content: flex-end;
      margin-top: var(--spacing-6);
      margin-bottom: var(--spacing-1);
    }
    .fav-btn {
      position: static;
      width: 64px;
      height: 64px;
      border-radius: var(--radius-full);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 30% 30%, var(--color-secondary-100), var(--color-secondary-700));
      box-shadow: 0 10px 20px rgba(225,75,98,0.28);
      cursor: pointer;
      transition: transform 0.2s ease;
      z-index: 20;
      box-sizing: border-box;
    }

.fav-btn:hover {
  transform: scale(1.05);
}

.fav-btn svg {
  color: var(--color-neutral-white);
}

@media (max-width: 420px) {
  .card {
    padding-bottom: 180px;
  }
}
</style>
