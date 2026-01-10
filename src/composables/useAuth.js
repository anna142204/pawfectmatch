import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Composable pour gérer l'authentification de manière centralisée
 */
export function useAuth() {
  const router = useRouter()

  // État réactif de l'authentification
  const isAuthenticated = computed(() => {
    return !!localStorage.getItem('token') && !!localStorage.getItem('user_id')
  })

  const userType = computed(() => localStorage.getItem('user_type'))
  const userId = computed(() => localStorage.getItem('user_id'))
  const token = computed(() => localStorage.getItem('token'))

  /**
   * Récupère les headers d'authentification pour les requêtes API
   * @param {Object} additionalHeaders - Headers additionnels à fusionner
   * @returns {Object} Headers avec Authorization si authentifié
   */
  const getAuthHeaders = (additionalHeaders = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    }
    
    const currentToken = localStorage.getItem('token')
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`
    }
    
    return headers
  }

  /**
   * Récupère les options de fetch avec authentification
   * @param {Object} options - Options de fetch
   * @returns {Object} Options avec headers et credentials
   */
  const getAuthFetchOptions = (options = {}) => {
    return {
      ...options,
      headers: getAuthHeaders(options.headers),
      credentials: 'include'
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié, sinon redirige vers login
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
   * Vérifie si l'utilisateur a le bon type, sinon redirige
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
      clearAuthData()
      router.push('/login')
    }
  }

  /**
   * Efface les données d'authentification du localStorage
   */
  const clearAuthData = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_type')
  }

  /**
   * Sauvegarde les données d'authentification
   * @param {Object} authData - Données d'authentification
   */
  const setAuthData = ({ token, userId, userType }) => {
    if (token) localStorage.setItem('token', token)
    if (userId) localStorage.setItem('user_id', userId)
    if (userType) localStorage.setItem('user_type', userType)
  }

  /**
   * Gère une erreur d'authentification (401)
   */
  const handleAuthError = () => {
    clearAuthData()
    router.push('/login')
  }

  return {
    // État
    isAuthenticated,
    userType,
    userId,
    token,
    
    // Méthodes
    getAuthHeaders,
    getAuthFetchOptions,
    requireAuth,
    requireUserType,
    logout,
    setAuthData,
    clearAuthData,
    handleAuthError
  }
}
