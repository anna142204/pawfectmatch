import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// État global
const user = ref(null)
const userType = ref(null)
const isAuthChecked = ref(false)

/**
 * Composable pour gérer l'authentification
 */
export function useAuth() {
  const router = useRouter()

  // État réactif de l'authentification
  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.sub || user.value?._id)

  /**
   * Initialise l'auth au chargement de l'app
   * Appelle /auth/me pour récupérer l'utilisateur courant via le cookie
   */
  const checkAuth = async () => {
    if (isAuthChecked.value) return
    
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (res.ok) {
        const data = await res.json()
        user.value = data.user
        userType.value = data.type
      } else if (res.status === 401) {
        user.value = null
        userType.value = null
      } else {
        // Autres erreurs (500, etc)
        console.warn(`Erreur au check auth: ${res.status} ${res.statusText}`)
        user.value = null
        userType.value = null
      }
    } catch (e) {
      // Erreur de réseau ou autre
      console.debug("Erreur lors de la vérification d'authentification (ignorée)", e.message)
      user.value = null
      userType.value = null
    } finally {
      isAuthChecked.value = true
    }
  }

  /**
   * Récupère les options de fetch avec les paramètres nécessaires pour les cookies
   * Le navigateur envoie automatiquement le cookie httpOnly grâce à credentials: 'include'
   * @param {Object} options - Options de fetch
   * @returns {Object} Options avec headers et credentials configurés
   */
  const getAuthFetchOptions = (options = {}) => {
    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include'
    }
  }

  /**
   * Sauvegarde les données d'authentification après login/register
   * @param {Object} authData - { user, type }
   */
  const setAuthData = (authData) => {
    user.value = authData.user
    userType.value = authData.type
    isAuthChecked.value = true
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} True si authentifié
   */
  const requireAuth = () => {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    return true
  }

  /**
   * Vérifie si l'utilisateur a le bon type
   * @param {string} requiredType - Type d'utilisateur requis ('adopter', 'owner', 'admin')
   * @returns {boolean} True si le type correspond
   */
  const requireUserType = (requiredType) => {
    if (!requireAuth()) return false
    
    if (userType.value !== requiredType) {
      router.push('/')
      return false
    }
    return true
  }

  /**
   * Déconnecte l'utilisateur
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', getAuthFetchOptions({ method: 'POST' }))
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      user.value = null
      userType.value = null
      isAuthChecked.value = true
      router.push('/login')
    }
  }

  /**
   * Gère une erreur d'authentification (401)
   * Efface l'état et redirige vers login
   */
  const handleAuthError = () => {
    user.value = null
    userType.value = null
    isAuthChecked.value = true
    router.push('/login')
  }

  return {
    isAuthenticated,
    userType,
    userId,
    user,
    isAuthChecked,
    
    checkAuth,
    getAuthFetchOptions,
    requireAuth,
    requireUserType,
    logout,
    setAuthData,
    handleAuthError
  }
}
