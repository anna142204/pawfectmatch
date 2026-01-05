import { createRouter, createWebHistory } from 'vue-router'

// Public
import LoginPage from '../views/Shared/LoginPage.vue'
import RegisterPage from '../views/Shared/RegisterPage.vue'
import TestPage from '../views/TestPage.vue'
import PopupMatch from '../views/PopupMatch.vue'

// Adopter
import AdopterHomePage from '../views/Adopter/AdopterHomePage.vue'
import AdopterSwipe from '../views/Adopter/AdopterSwipe.vue'
import AdopterAnimalDetails from '../views/Adopter/AdopterAnimalDetails.vue'
import AdopterDiscussions from '../views/Adopter/AdopterDiscussions.vue'
import AdopterConversation from '../views/Adopter/AdopterConversation.vue'
import AdopterProfileEdit from '../views/Adopter/AdopterProfileEdit.vue'

// Owner
import OwnerAnimals from '../views/Owner/OwnerAnimals.vue'
import OwnerDiscussions from '../views/Owner/OwnerDiscussions.vue'
import OwnerConversation from '../views/Owner/OwnerConversation.vue'
import OwnerProfileEdit from '../views/Owner/OwnerProfileEdit.vue'

//General views
import AdopterProfile from '../views/Adopter/AdopterProfile.vue'
import OwnerProfile from '../views/Owner/OwnerProfile.vue'
import RequestsView from '../views/Shared/RequestsView.vue'
import ConversationView from '../views/Shared/ConversationView.vue'
import DiscussionView from '../views/Shared/DiscussionView.vue'

// Animal Form
import AnimalAddForm from '../views/Animal/AnimalAddForm.vue'

// Admin
import AdminDashboard from '../views/Admin/AdminDashboard.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/test',
    name: 'Test',
    component: TestPage
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/logout',
    name: 'Logout',
    beforeEnter: async (to, from, next) => {
      try {
        // Appeler l'API de logout
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      } finally {
        // Nettoyer le localStorage
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_id');
        localStorage.removeItem('token'); // Clear the JWT token
        // Rediriger vers la page de connexion
        next('/login');
      }
    }
  },
  {
    path: '/match',
    name: 'PopupMatch',
    component: PopupMatch,
    meta: { requiresAuth: true }
  },

  // Adopter Routes
  {
    path: '/adopter',
    name: 'AdopterHome',
    component: AdopterHomePage,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/adopter/profile',
    name: 'AdopterProfile',
    component: AdopterProfile,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
   {
    path: '/adopter/profile/edit',
    name: 'AdopterProfileEdit',
    component: AdopterProfileEdit,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  
  {
    path: '/adopter/swipe',
    name: 'AdopterSwipe',
    component: AdopterSwipe,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/adopter/animal/:id',
    name: 'AdopterAnimalDetails',
    component: AdopterAnimalDetails,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/adopter/discussions',
    name: 'AdopterDiscussions',
    component: DiscussionView,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/adopter/conversation/:id',
    name: 'AdopterConversation',
    component: ConversationView,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/adopter/requests',
    name: 'AdopterRequests',
    component: RequestsView,
    meta: { requiresAuth: true, userType: 'adopter' }
  },
  {
    path: '/adopter/owner/:id',
    name: 'AdopterProfileOwner',
    component: OwnerProfile,
    meta: { requiresAuth: true, userType: 'adopter' }
  },

  // Owner Routes
  {
    path: '/owner/profile',
    name: 'OwnerProfile',
    component: OwnerProfile,
    meta: { requiresAuth: true, userType: 'owner' }
  },
  {
    path: '/owner/profile/edit',
    name: 'OwnerProfileEdit',
    component: OwnerProfileEdit,
    meta: { requiresAuth: true, userType: 'owner' }
  },
  {
    path: '/owner/animals',
    name: 'OwnerAnimals',
    component: OwnerAnimals,
    meta: { requiresAuth: true, userType: 'owner' }
  },
  {
    path: '/owner/requests',
    name: 'OwnerRequests',
    component: RequestsView,
    meta: { requiresAuth: true, userType: 'owner' }
  },
  {
    path: '/owner/discussions',
    name: 'OwnerDiscussions',
    component: DiscussionView,
    meta: { requiresAuth: true, userType: 'owner' }
  },
  {
    path: '/owner/conversation/:id',
    name: 'OwnerConversation',
    component: ConversationView,
    meta: { requiresAuth: true, userType: 'owner' }
  },
  {
    path: '/owner/adopter/:id',
    name: 'OwnerProfileAdopter',
    component: AdopterProfile,
    meta: { requiresAuth: true, userType: 'owner' }
  },

  // Animal Edit
  {
    path: '/owner/animal/edit/:id',
    name: 'AnimalEditForm',
    component: AnimalAddForm,
    meta: { requiresAuth: true, userType: 'owner' }
  },

  // Animal Add Forms
  {
    path: '/owner/animal/add',
    name: 'AnimalAddForm',
    component: AnimalAddForm,
    meta: { requiresAuth: true, userType: 'owner' }
  },

  // Admin Routes
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, userType: 'admin' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard pour vérifier l'authentification
router.beforeEach((to, from, next) => {
  const userType = localStorage.getItem('user_type')

  if (to.meta.requiresAuth && !userType) {
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
