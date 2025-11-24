import { createRouter, createWebHistory } from 'vue-router'
import TheLoginPage from '../views/TheLoginPage.vue'
import AdoptantHomePage from '../views/AdoptantHomePage.vue'
import AdoptantProfile from '../views/AdoptantProfile.vue'
import OwnerHomePage from '../views/OwnerHomePage.vue'
import OwnerProfile from '../views/OwnerProfile.vue'
import Swipe from '../views/Swipe.vue'
import AnimalDetails from '../views/AnimalDetails.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: TheLoginPage
  },
  {
    path: '/adoptant',
    name: 'AdoptantHome',
    component: AdoptantHomePage,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/adoptant/profile',
    name: 'AdoptantProfile',
    component: AdoptantProfile,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/adoptant/swipe',
    name: 'Swipe',
    component: Swipe,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/owner',
    name: 'OwnerHome',
    component: OwnerHomePage,
    meta: { requiresAuth: true, userType: 'owner' }
  },
  {
    path: '/owner/profile',
    name: 'OwnerProfile',
    component: OwnerProfile,
    meta: { requiresAuth: true, userType: 'owner' }
  },
  {
    path: '/animal/:id',
    name: 'AnimalDetails',
    component: AnimalDetails,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard pour vérifier l'authentification
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  const userType = localStorage.getItem('user_type')
  
  if (to.meta.requiresAuth && !token) {
    // Rediriger vers login si authentification requise
    next('/login')
  } else if (to.meta.userType && to.meta.userType !== userType) {
    // Rediriger si le type d'utilisateur ne correspond pas
    next('/')
  } else {
    next()
  }
})

export default router
