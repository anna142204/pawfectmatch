<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Menu from '@/components/Menu.vue';
import BackButton from '@/components/BackButton.vue';
import { Cat, MapPin, Mars, Venus, Heart, User } from 'lucide-vue-next';

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

const ownerName = computed(() => {
  const o = animal.value?.ownerId;
  if (!o) return '';
  if (o.societyName && o.societyName.trim() !== '') {
    return o.societyName;
  }
  return [o.firstName, o.lastName].filter(Boolean).join(' ');
});

const ownerProfileTo = computed(() => {
  const ownerId = animal.value?.ownerId?._id;
  if (!ownerId) return null;
  return { name: 'AdopterProfileOwner', params: { id: ownerId } };
});

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '';
  const n = Number(price);
  if (isNaN(n)) return String(price);
  return `${n} CHF`;
};
</script>

<template>
  <div class="animal-page">
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <p>Chargement...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <!-- Animal Content -->
    <div v-else-if="animal" class="profile-wrapper">
      <!-- Full Screen Photo Section -->
      <div class="photo-section">
        <BackButton @click="goBackToSwipe" variant="overlay" />
        <img :src="animal?.image || '/images/sample-cat.jpg'" alt="photo animal" class="animal-photo"/>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <!-- Animal Header with Name and owner Logo -->
        <div class="animal-header">
          <div class="header-left">
            <div class="name-row">
              <h1 class="animal-name">{{ animal.name }}</h1>
              <div class="gender" :title="animal.gender">
                <Mars size="20" v-if="animal.gender === 'male'" />
                <Venus size="20" v-else />
              </div>
            </div>

            <div class="tags">
              <span class="tag"><Cat size="16" /> {{ animal.species || 'Animal' }}</span>
              <span class="tag"><MapPin size="16" /> {{ animal.address.city || '' }}</span>
            </div>
          </div>
          <div class ="owner-link">
          <RouterLink
              v-if="ownerProfileTo"
              class="owner-logo"
              :to="ownerProfileTo"
              :title="ownerName"
          >
            <img v-if="animal?.ownerId?.avatarUrl" :src="animal.ownerId.avatarUrl" alt="image propriétaire" />
            <div v-else class="owner-placeholder"><User/></div>

          </RouterLink>
          <p>{{ ownerName }}</p>
          </div>
        </div>

        <!-- Stats Section -->
        <div class="stats-section">
          <div class="stat-item">
            <p class="stat-label">Race</p>
            <p class="stat-value">{{ animal.race }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Âge</p>
            <p class="stat-value">{{ animal.age }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Prix</p>
            <p class="stat-value">{{ formatPrice(animal.price) }}</p>
          </div>
        </div>

        <!-- Characteristics Section -->
        <section class="characteristics-section">
          <h2 class="section-title">Caractéristiques</h2>
          <div class="chars">
            <div class="char-col" v-for="(col, idx) in charColumns" :key="idx">
              <ul>
                <li v-for="(c, i) in col" :key="i"><span class="bullet"></span>{{ c }}</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Description Section -->
        <section class="description-section">
          <h2 class="section-title">Description</h2>
          <p class="description-text">{{ animal.description }}</p>
        </section>

        <!-- Favorite Button -->
        <div class="fav-btn-row">
          <button class="fav-btn" aria-label="Favori">
            <Heart size="30" stroke-width="2" />
          </button>
        </div>
      </div>
    </div>

    <Menu />
  </div>
</template>

<style scoped>
.animal-page {
  height: 100%;
  background: #FFFFFF;
  padding-bottom: 100px;
}

.loading,
.error-message {
  text-align: center;
  padding: 24px;
  color: #999;
}

.error-message {
  color: #d32f2f;
}

/* Profile Wrapper */
.profile-wrapper {
  display: flex;
  flex-direction: column;
}
.owner-link{
  display: flex;
  flex-direction: column;
  align-items: center;
}
.photo-section {
  position: relative;
  width: 100%;
  height: 400px;
  background: linear-gradient(180deg, #DDD 0%, #AAA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.animal-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 25px 40px;
  background: white ;
  margin-top: -60px;
  border-radius: 20px 20px 0 0;
  position: relative;
  z-index: 1;
}

/* Animal Header */
.animal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-top: 15px;
}

.header-left {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.animal-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.gender {
  display: flex;
  align-items: center;
}

.gender svg {
  color: var(--color-neutral-900);
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(var(--color-secondary-200),var(--color-secondary-100));
  color: #6b2335;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.tag svg {
  flex-shrink: 0;
}

.owner-logo {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(180deg, #f5f5f5, #e8e8e8);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.owner-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.owner-placeholder {
display: flex;
color: #454444;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  text-align: center;
  padding: 25px 0;
  border-top: 1px solid #E8E8E8;
  border-bottom: 1px solid #E8E8E8;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #999;
}

.stat-value {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Section Titles */
.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Characteristics Section */
.characteristics-section {
  display: flex;
  flex-direction: column;
  padding-top: 15px;
  gap: 12px;
}

.chars {
  display: flex;
  gap: 16px;
  padding: 12px 0;
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
  gap: 8px;
  padding: 6px 0;
  color: #555;
  font-size: 14px;
}

.bullet {
  width: 10px;
  height: 10px;
  background: var(--color-accent-600);
  border-radius: 50%;
  flex-shrink: 0;
}

/* Description Section */
.description-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.description-text {
  margin: 0;
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  text-align: justify;
}

/* Favorite Button */
.fav-btn-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.fav-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(var(--color-secondary-600),var(--color-secondary-300));
  cursor: pointer;
  transition: transform 0.2s ease;
}

.fav-btn:hover {
  transform: scale(1.05);
}

.fav-btn svg {
  color: #fff;
}
</style>
