<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Menu from '@/components/Menu.vue';
import BackButton from '@/components/BackButton.vue';
import { Cat, MapPin, Mars, Venus, Heart, User, PawPrint } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const animal = ref(null);
const loading = ref(true);
const error = ref(null);
const isLiked = ref(false);
const userId = localStorage.getItem('user_id');

const imageErrors = ref({});
const handleImageError = (id) => { imageErrors.value[id] = true; };

// Image carousel logic
const currentImageIndex = ref(0);
const touchStartX = ref(0);
const touchEndX = ref(0);
const isDragging = ref(false);

const hasMultipleImages = computed(() => 
  animal.value?.images && animal.value.images.length > 1
);

const goToNextImage = () => {
  if (animal.value?.images && currentImageIndex.value < animal.value.images.length - 1) {
    currentImageIndex.value++;
  }
};

const goToPreviousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  }
};

const goToImage = (index) => {
  currentImageIndex.value = index;
};

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX;
  isDragging.value = true;
};

const handleTouchMove = (e) => {
  if (!isDragging.value) return;
  touchEndX.value = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;
  
  const swipeThreshold = 50;
  const diff = touchStartX.value - touchEndX.value;

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      goToNextImage();
    } else {
      goToPreviousImage();
    }
  }

  isDragging.value = false;
  touchStartX.value = 0;
  touchEndX.value = 0;
};

const toggleLike = async () => {
  if (!isLiked.value && animal.value) {
    // Créer un match
    try {
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adopterId: userId, animalId: animal.value._id }),
      });
    } catch (e) {
      console.error('Erreur lors de la création du match:', e);
    }
  }
  isLiked.value = !isLiked.value;
};

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

    // Vérifier si un match existe déjà pour cet animal
    if (userId) {
      const matchesResponse = await fetch(`/api/matches?adopterId=${userId}&animalId=${id}`, {
        credentials: 'include',
      });
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        isLiked.value = matchesData.matches && matchesData.matches.length > 0;
      }
    }
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

const characteristicsByCategory = computed(() => {
  if (!animal.value || !animal.value.characteristics) {
    return { environment: [], dressage: [], personality: [] };
  }
  
  const chars = animal.value.characteristics;
  return {
    environment: chars.environment || [],
    dressage: chars.dressage || [],
    personality: chars.personality || []
  };
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
    <div v-if="loading" class="loading">
      <p>Chargement...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="animal" class="profile-wrapper">
      <div class="photo-section">
        <BackButton @click="goBackToSwipe" variant="overlay" />
        
        <!-- Image Carousel -->
        <div 
          v-if="animal?.images && animal.images.length"
          class="image-carousel"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div 
            class="carousel-track"
            :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
          >
            <div 
              v-for="(image, index) in animal.images" 
              :key="index"
              class="carousel-slide"
            >
              <img 
                :src="image" 
                :alt="`${animal.name} ${index + 1}`"
                class="animal-photo"
                @error="handleImageError(`image-${index}`)"
              />
            </div>
          </div>

          <!-- Dots indicator -->
          <div class="carousel-dots">
            <button
              v-for="(image, index) in animal.images"
              :key="index"
              class="dot"
              :class="{ active: currentImageIndex === index }"
              @click="goToImage(index)"
              :aria-label="`Aller à l'image ${index + 1}`"
            ></button>
          </div>
        </div>
        
        <div v-else class="animal-placeholder">
          <div class="placeholder-content">
            <PawPrint :size="80" stroke-width="1.5" />
            <span>Aucune photo disponible</span>
          </div>
        </div>
      </div>

      <div class="content-section">
        <div class="animal-header">
          <div class="header-left">
            <div class="name-row">
              <h2 class="animal-name">{{ animal.name }}</h2>
              <div class="gender" :title="animal.gender">
                <Mars size="20" v-if="animal.gender === 'male'" />
                <Venus size="20" v-else />
              </div>
            </div>
            
            <p v-if="animal.race" class="animal-race">{{ animal.race }}</p>

            <div class="tags">
              <span class="tag">
                <Cat size="16" /> {{ animal.species || 'Animal' }}
              </span>
              <span class="tag">
                <MapPin size="16" /> {{ animal.address.city || '' }}
              </span>
            </div>
          </div>

          <div class="owner-link">
            <RouterLink v-if="ownerProfileTo" class="owner-logo" :to="ownerProfileTo" :title="ownerName">
              <img 
                v-if="animal?.ownerId?.image && !imageErrors['owner']" 
                :src="animal.ownerId.image" 
                alt="image propriétaire" 
                @error="handleImageError('owner')"
              />
              <div v-else class="owner-placeholder">
                <User />
              </div>
            </RouterLink>
            <p class="owner-name-text">{{ ownerName }}</p>
          </div>
        </div>

        <div class="stats-section">
          <div class="stat-item">
            <p class="stat-label">Âge</p>
            <p class="stat-value">{{ animal.age }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Taille</p>
            <p class="stat-value">{{ animal.size || '-' }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Poids</p>
            <p class="stat-value">{{ animal.weight || '-' }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Prix</p>
            <p class="stat-value">{{ formatPrice(animal.price) }}</p>
          </div>
        </div>

        <section class="description-section">
          <h2 class="section-title">Description</h2>
          <p class="description-text">{{ animal.description }}</p>
        </section>

        <section class="characteristics-section">
          <h2 class="section-title">Caractéristiques</h2>
          
          <div v-if="characteristicsByCategory.environment.length > 0" class="characteristic-group">
            <h3 class="category-title">Environnement</h3>
            <div class="tags-list">
              <span v-for="item in characteristicsByCategory.environment" :key="item" class="char-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="characteristicsByCategory.dressage.length > 0" class="characteristic-group">
            <h3 class="category-title">Dressage</h3>
            <div class="tags-list">
              <span v-for="item in characteristicsByCategory.dressage" :key="item" class="char-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="characteristicsByCategory.personality.length > 0" class="characteristic-group">
            <h3 class="category-title">Personnalité</h3>
            <div class="tags-list">
              <span v-for="item in characteristicsByCategory.personality" :key="item" class="char-tag">
                {{ item }}
              </span>
            </div>
          </div>
        </section>

        <div class="fav-btn-row">
          <button class="fav-btn" :class="{ liked: isLiked }" @click="toggleLike" aria-label="Favori">
            <Heart size="30" stroke-width="2" :fill="isLiked ? 'white' : 'none'" />
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

.profile-wrapper {
  display: flex;
  flex-direction: column;
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

/* Image Carousel Styles */
.image-carousel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: pan-y;
}

.carousel-track {
  display: flex;
  height: 100%;
  transition: transform 0.3s ease-out;
}

.carousel-slide {
  min-width: 100%;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-dots {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border-radius: 20px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.dot:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: scale(1.1);
}

.dot.active {
  background: white;
  border-color: white;
  width: 28px;
  border-radius: 6px;
}

.animal-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.animal-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-secondary-100, #fdf2f8) 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-secondary-300, #fda4af);
}


@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }

  50% {
    transform: scale(1.05);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 25px 30px;
  background: white;
  margin-top: -60px;
  border-radius: 20px 20px 0 0;
  position: relative;
  z-index: 1;
}

.animal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-top: 15px;
  position: relative;
}

.header-left {
  width: 70%;
  max-width: 70%;
  flex-shrink: 0;
}

.owner-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  max-width: 30%;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.animal-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
  word-break: break-word;
}

.animal-race {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.owner-name-text {
  margin: 4px 0 0 0;
  font-size: 12px;
  text-align: center;
  color: #666;
  word-break: break-word;
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
  background: linear-gradient(var(--color-secondary-200), var(--color-secondary-100));
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
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

.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

.characteristics-section {
  display: flex;
  flex-direction: column;
  padding: 15px 0;
  gap: 16px;
}

.characteristic-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.char-tag {
  display: inline-block;
  padding: 6px 12px;
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.description-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 15px;
}

.description-text {
  margin: 0;
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  text-align: justify;
}

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
  background: linear-gradient(var(--color-secondary-600), var(--color-secondary-300));
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