<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Home, Layers, MessageCircle, Paperclip, User, PawPrint, ClipboardList, GalleryHorizontalEnd } from 'lucide-vue-next'

const props = defineProps({
    userType: {
        type: String,
        required: false,
        default: null,
        validator: (value) => value === null || ['adopter', 'owner'].includes(value)
    }
})

const route = useRoute()
const currentUserType = ref(props.userType || 'adopter')

onMounted(() => {
    if (!props.userType) {
        const storedUserType = localStorage.getItem('user_type')
        if (storedUserType) {
            currentUserType.value = storedUserType
        }
    }
})

const menuItems = computed(() => {
    if (currentUserType.value === 'adopter') {
        return [
            { name: 'accueil', icon: Home, route: '/adopter' },
            { name: 'swipe', icon: GalleryHorizontalEnd, route: '/adopter/swipe' },
            { name: 'messages', icon: MessageCircle, route: '/adopter/discussions' },
            { name: 'adoption', icon: Paperclip, route: '/adopter/requests' },
            { name: 'profil', icon: User, route: '/adopter/profile' }
        ]
    } else {
        return [
            { name: 'accueil', icon: Home, route: '/owner' },
            { name: 'demandes', icon: ClipboardList, route: '/owner/requests' },
            { name: 'messages', icon: MessageCircle, route: '/owner/discussions' },
            { name: 'animaux', icon: PawPrint, route: '/owner/animals' },
            { name: 'profil', icon: User, route: '/owner/profile' }
        ]
    }
})

const isActive = (routePath) => {
    // Pour la page d'accueil, vérifier l'égalité exacte
    if (routePath === '/adopter' || routePath === '/owner') {
        return route.path === routePath
    }
    // Pour les autres pages, vérifier si le path commence par la route
    return route.path.startsWith(routePath)
}
</script>

<template>
    <nav class="menu">
        <router-link v-for="item in menuItems" :key="item.name" :to="item.route"
            :class="['menu-item', { active: isActive(item.route) }]">
            <div class="icon-wrapper">
                <component :is="item.icon" :size="24" :stroke-width="2" class="icon" />
            </div>
            <span class="menu-label text-label-base">{{ item.name }}</span>
        </router-link>
    </nav>
</template>

<style scoped>
.menu {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: stretch;
    gap: 0;
    background-color: var(--color-neutral-white);
    border-top: 1px solid var(--color-neutral-200);
    padding: var(--spacing-3) var(--spacing-2);
    padding-bottom: calc(var(--spacing-3) + env(safe-area-inset-bottom));
    z-index: 1000;
    box-shadow: var(--shadow-lg);
}

.menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: var(--spacing-1);
    padding: var(--spacing-2) var(--spacing-1);
    text-decoration: none;
    color: var(--color-neutral-900);
    transition: all 0.3s ease;
    border-radius: var(--radius-base);
}

.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.icon {
    display: block;
    flex-shrink: 0;
    transition: all 0.3s ease;
}

.menu-label {
    display: block;
    font-size: 13px;
    font-weight: var(--font-weight-normal);
    transition: all 0.3s ease;
    text-align: center;
    white-space: nowrap;
    line-height: 1.2;
    width: 100%;
    flex-shrink: 0;
}

.menu-item.active {
    background-color: var(--color-primary-50);
}

.menu-item.active .icon {
    stroke: var(--color-primary-700);
}

.menu-item.active .menu-label {
    color: var(--color-primary-700);
    font-weight: var(--font-weight-semibold);
}

.menu-item:hover .icon-wrapper {
    background-color: var(--color-primary-50);
}

.menu-item:hover .icon {
    stroke: var(--color-primary-600);
}
</style>
