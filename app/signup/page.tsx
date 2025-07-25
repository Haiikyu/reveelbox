'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Gift, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  Users,
  Star,
  Trophy
} from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'

// Interfaces TypeScript pour la sécurité des types
interface ReferralInfo {
  code: string
  username: string
  isDemo: boolean
}

interface ProfileData {
  username: string
}

interface AffiliateData {
  code: string
  profiles: ProfileData | ProfileData[] | null
}

// Composant pour gérer les paramètres de recherche
function SignUpForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    birthDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [notification, setNotification] = useState({ type: '', message: '' })
  const [referralCode, setReferralCode] = useState('')
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)
  const [checkingReferral, setCheckingReferral] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()

  // Récupérer le code de parrainage depuis l'URL
  useEffect(() => {
    const refParam = searchParams?.get('ref')
    if (refParam) {
      setReferralCode(refParam)
      validateReferralCode(refParam)
    }
  }, [searchParams])

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    if (!authLoading && user) {
      console.log('Utilisateur déjà connecté, redirection...')
      const redirectPath = localStorage.getItem('redirectAfterLogin') || localStorage.getItem('redirectAfterSignup')
      if (redirectPath && redirectPath !== '/login' && redirectPath !== '/signup') {
        localStorage.removeItem('redirectAfterLogin')
        localStorage.removeItem('redirectAfterSignup')
        router.push(redirectPath)
      } else {
        router.push('/boxes')
      }
    }
  }, [user, authLoading, router])

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 5000)
  }

  // Valider le code de parrainage avec gestion correcte des types
  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 3) return

    setCheckingReferral(true)
    try {
      // Vérifier si le code existe (avec fallback pour mode démo)
      const { data, error } = await supabase
        .from('affiliates')
        .select(`
          code,
          profiles!affiliates_user_id_fkey(username)
        `)
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.log('Code non trouvé en DB, utilisation mode démo')
        // Mode démo si la table n'existe pas
        setReferralInfo({
          code: code,
          username: 'Affilié VIP',
          isDemo: true
        })
      } else {
        // ✅ CORRECTION TypeScript - Gestion complète des types profiles
        const affiliateData = data as AffiliateData
        let username = 'Utilisateur'
        
        if (affiliateData.profiles) {
          if (Array.isArray(affiliateData.profiles)) {
            // Si c'est un tableau, prendre le premier élément
            username = affiliateData.profiles[0]?.username || 'Utilisateur'
          } else if (typeof affiliateData.profiles === 'object') {
            // Si c'est un objet direct
            username = affiliateData.profiles.username || 'Utilisateur'
          }
        }
        
        setReferralInfo({
          code: affiliateData.code,
          username: username,
          isDemo: false
        })
      }
    } catch (error) {
      console.error('Erreur validation code:', error)
      // Mode démo en cas d'erreur
      setReferralInfo({
        code: code,
        username: 'Affilié VIP',
        isDemo: true
      })
    } finally {
      setCheckingReferral(false)
    }
  }

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.username || !formData.birthDate) {
      showNotification('error', 'Tous les champs sont requis')
      return false
    }

    // Validation nom d'utilisateur
    if (formData.username.length < 3) {
      showNotification('error', 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
      return false
    }

    if (formData.username.length > 20) {
      showNotification('error', 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères')
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      showNotification('error', 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores')
      return false
    }

    // Validation âge
    const age = calculateAge(formData.birthDate)
    if (age < 18) {
      showNotification('error', 'Vous devez avoir au moins 18 ans pour vous inscrire')
      return false
    }

    // Validation mot de passe
    if (formData.password.length < 6) {
      showNotification('error', 'Le mot de passe doit contenir au moins 6 caractères')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification('error', 'Les mots de passe ne correspondent pas')
      return false
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showNotification('error', 'Email invalide')
      return false
    }

    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Formatage spécial pour le nom d'utilisateur
    if (name === 'username') {
      const cleanedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
      setFormData(prev => ({
        ...prev,
        [name]: cleanedValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase()
    setReferralCode(code)
    setReferralInfo(null)
    
    // Valider le code après un délai
    if (code.length >= 3) {
      setTimeout(() => validateReferralCode(code), 500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      // 1. Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: formData.username,
            birth_date: formData.birthDate,
            referral_code: referralCode || null
          }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          showNotification('error', 'Cet email est déjà utilisé')
        } else if (authError.message.includes('weak password')) {
          showNotification('error', 'Mot de passe trop faible')
        } else {
          showNotification('error', authError.message)
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        try {
          // 2. Créer le profil utilisateur
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              username: formData.username,
              birth_date: formData.birthDate,
              virtual_currency: referralCode && referralInfo ? 150 : 100, // Bonus si parrainage
              loyalty_points: 0,
              total_exp: 0,
              created_at: new Date().toISOString()
            })

          if (profileError) {
            console.error('Erreur création profil:', profileError)
            // Continue même si le profil n'a pas pu être créé
          }

          // 3. Transaction de bienvenue
          try {
            await supabase
              .from('transactions')
              .insert({
                user_id: authData.user.id,
                type: 'welcome_bonus',
                virtual_amount: referralCode && referralInfo ? 150 : 100,
                description: referralCode && referralInfo
                  ? `Bonus de bienvenue + parrainage (${referralCode})` 
                  : 'Bonus de bienvenue'
              })
          } catch (error) {
            console.error('Erreur transaction bienvenue:', error)
          }

          // 4. Traiter le parrainage si présent et valide
          if (referralCode && referralInfo && !referralInfo.isDemo) {
            try {
              // Utiliser la fonction RPC si disponible
              const { error: referralError } = await supabase.rpc('register_referral', {
                p_affiliate_code: referralCode,
                p_referred_user_id: authData.user.id
              })

              if (referralError) {
                console.error('Erreur traitement parrainage:', referralError)
              } else {
                console.log('Parrainage traité avec succès')
              }
            } catch (error) {
              console.error('Erreur RPC parrainage:', error)
              // Fallback : enregistrement manuel si RPC non disponible
              try {
                await supabase
                  .from('referrals')
                  .insert({
                    referrer_user_id: '00000000-0000-0000-0000-000000000000', // Placeholder
                    referred_user_id: authData.user.id,
                    affiliate_code: referralCode,
                    commission_earned: 5.00,
                    status: 'converted'
                  })
              } catch (fallbackError) {
                console.error('Erreur fallback parrainage:', fallbackError)
              }
            }
          }

        } catch (error) {
          console.error('Erreur post-inscription:', error)
        }

        // 5. Notification et redirection
        if (!authData.user.email_confirmed_at) {
          showNotification('success', 'Vérifiez votre email pour confirmer votre inscription')
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else {
          const successMessage = referralCode && referralInfo
            ? `Inscription réussie ! Bonus de parrainage de 50 coins supplémentaires !`
            : 'Inscription réussie ! 100 coins de bienvenue ajoutés !'
          
          showNotification('success', successMessage)
          
          setTimeout(() => {
            const redirectPath = localStorage.getItem('redirectAfterLogin') || localStorage.getItem('redirectAfterSignup')
            if (redirectPath && redirectPath !== '/login' && redirectPath !== '/signup') {
              localStorage.removeItem('redirectAfterLogin')
              localStorage.removeItem('redirectAfterSignup')
              router.push(redirectPath)
            } else {
              router.push('/boxes')
            }
          }, 2000)
        }
      }

    } catch (error) {
      console.error('Erreur inscription:', error)
      showNotification('error', 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  // Affichage du loading pendant la vérification de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre session...</p>
        </div>
      </div>
    )
  }

  // Si l'utilisateur est connecté, ne pas afficher la page
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Notification */}
      {notification.message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
            notification.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </motion.div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo et titre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Rejoindre ReveelBox
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Créez votre compte et commencez l'aventure
          </p>
          
          {/* Affichage du parrainage si présent */}
          {referralInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-green-800">
                    Parrainage de {referralInfo.username}
                  </p>
                  <p className="text-xs text-green-600">
                    +50 coins bonus à l'inscription !
                  </p>
                </div>
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
            </motion.div>
          )}

          {/* Indicateur de redirection si présent */}
          {typeof window !== 'undefined' && (localStorage.getItem('redirectAfterLogin') || localStorage.getItem('redirectAfterSignup')) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3"
            >
              <p className="text-sm text-blue-800">
                🔄 Vous serez redirigé vers votre page après inscription
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-lg sm:rounded-2xl sm:px-10 border border-gray-100"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="Haikyu"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                3-20 caractères, lettres, chiffres et _ uniquement
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="Répétez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
			
			{/* Date de naissance */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                  value={formData.birthDate}
                  onChange={handleChange}
                  disabled={loading}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Vous devez avoir au moins 18 ans
              </p>
              {formData.birthDate && calculateAge(formData.birthDate) < 18 && (
                <p className="mt-1 text-sm text-red-600">
                  Âge insuffisant ({calculateAge(formData.birthDate)} ans)
                </p>
              )}
            </div>
			
			{/* Code de parrainage */}
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
                Code de parrainage (optionnel)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Star className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white uppercase"
                  placeholder="REV12345"
                  value={referralCode}
                  onChange={handleReferralCodeChange}
                  disabled={loading}
                />
                {checkingReferral && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                {referralInfo && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              {referralCode && !checkingReferral && !referralInfo && (
                <p className="mt-1 text-sm text-red-600">Code de parrainage invalide</p>
              )}
            </div>

            {/* Bonus d'inscription */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Bonus d'inscription
                  </p>
                  <p className="text-xs text-green-600">
                    {referralInfo ? '150 coins' : '100 coins'} offerts pour commencer !
                    {referralInfo && (
                      <span className="block">+50 coins grâce au parrainage 🎉</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton inscription */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading || (formData.birthDate !== '' && calculateAge(formData.birthDate) < 18)}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Créer mon compte
                </>
              )}
            </motion.button>
          </form>

          {/* Lien connexion */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Déjà inscrit ?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                onClick={() => {
                  // Transférer la redirection vers login
                  const redirectPath = localStorage.getItem('redirectAfterSignup') || localStorage.getItem('redirectAfterLogin')
                  if (redirectPath) {
                    localStorage.setItem('redirectAfterLogin', redirectPath)
                    localStorage.removeItem('redirectAfterSignup')
                  }
                }}
              >
                Se connecter
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center text-xs text-gray-500"
        >
          En créant un compte, vous acceptez nos{' '}
          <Link href="/terms" className="text-green-600 hover:text-green-500">
            conditions d'utilisation
          </Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="text-green-600 hover:text-green-500">
            politique de confidentialité
          </Link>
        </motion.p>
      </div>
    </div>
  )
}

// Composant principal avec Suspense
export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}