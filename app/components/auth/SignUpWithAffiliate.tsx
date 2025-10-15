// components/auth/SignUpWithAffiliate.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Gift, 
  CheckCircle,
  AlertCircle,
  Loader,
  Star
} from 'lucide-react'

interface AffiliateInfo {
  referrer_username: string
  referrer_tier: string
  bonus_amount: number
  commission_rate: number
}

interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  username: string
  acceptTerms: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  username?: string
  general?: string
  terms?: string
}

export default function SignUpWithAffiliate(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get('ref')
  
  // États du formulaire
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    acceptTerms: false
  })
  
  // États UI
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  // États affiliation
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null)
  const [loadingAffiliate, setLoadingAffiliate] = useState<boolean>(false)
  const [affiliateError, setAffiliateError] = useState<string>('')

  // Vérifier le code d'affiliation au chargement
  useEffect(() => {
    if (affiliateCode) {
      verifyAffiliateCode(affiliateCode)
    }
  }, [affiliateCode])

  // Vérifier la validité du code d'affiliation
  const verifyAffiliateCode = async (code: string): Promise<void> => {
    setLoadingAffiliate(true)
    setAffiliateError('')
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .select(`
          user_id,
          tier_name,
          commission_rate,
          profiles:user_id(username)
        `)
        .eq('affiliate_code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error('Erreur vérification code:', error)
        setAffiliateError('Erreur lors de la vérification du code')
        return
      }

      if (!data) {
        setAffiliateError('Code d\'affiliation invalide ou inactif')
        return
      }

      // Calculer le bonus basé sur le tier
      const bonusMap: Record<string, number> = {
        'Rookie': 5,
        'Explorer': 10,
        'Adventurer': 15,
        'Hunter': 20,
        'Elite': 25,
        'Master': 30,
        'Champion': 40,
        'Legend': 50,
        'Mythic': 75,
        'Divine': 100
      }

      // Handle profiles being returned as array or object
      const profileData = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles

      setAffiliateInfo({
        referrer_username: profileData?.username || 'Utilisateur',
        referrer_tier: data.tier_name,
        bonus_amount: bonusMap[data.tier_name] || 5,
        commission_rate: data.commission_rate
      })
    } catch (error) {
      console.error('Erreur vérification affiliation:', error)
      setAffiliateError('Erreur lors de la vérification du code')
    } finally {
      setLoadingAffiliate(false)
    }
  }

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email
    if (!formData.email) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    // Mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    }

    // Confirmation mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation est requise'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    // Nom d'utilisateur
    if (!formData.username) {
      newErrors.username = 'Le nom d\'utilisateur est requis'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, - et _'
    }

    // Conditions
    if (!formData.acceptTerms) {
      newErrors.terms = 'Vous devez accepter les conditions d\'utilisation'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Gérer les changements de formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Effacer l'erreur du champ modifié
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  // Inscription avec gestion du parrainage
  const handleSignUp = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setErrors({})

    try {
      const supabase = createClient()

      // Créer le compte utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte')
      }

      // Créer le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: formData.username,
          email: formData.email
        })

      if (profileError) {
        console.error('Erreur création profil:', profileError)
      }

      // Si code d'affiliation valide, créer la relation de parrainage
      if (affiliateCode && affiliateInfo) {
        try {
          // Récupérer l'ID du référent
          const { data: referrerData } = await supabase
            .from('affiliate_profiles')
            .select('user_id, commission_rate')
            .eq('affiliate_code', affiliateCode.toUpperCase())
            .single()

          if (referrerData) {
            // Créer la relation de parrainage
            const { error: referralError } = await supabase
              .from('affiliate_referrals')
              .insert({
                referrer_user_id: referrerData.user_id,
                referred_user_id: authData.user.id,
                affiliate_code: affiliateCode.toUpperCase(),
                commission_earned: 0, // Sera calculé lors du premier dépôt
                deposit_amount: 0,
                status: 'pending'
              })

            if (referralError) {
              console.error('Erreur création parrainage:', referralError)
            } else {
              // Ajouter des coins bonus au nouvel utilisateur
              await supabase
                .from('profiles')
                .update({ 
                  coins_balance: affiliateInfo.bonus_amount 
                })
                .eq('id', authData.user.id)

              // Créer une notification pour le référent
              await supabase
                .from('affiliate_notifications')
                .insert({
                  user_id: referrerData.user_id,
                  type: 'new_referral',
                  title: 'Nouveau parrainage !',
                  message: `${formData.username} s'est inscrit grâce à votre lien d'affiliation !`
                })
            }
          }
        } catch (error) {
          console.error('Erreur traitement parrainage:', error)
          // Ne pas bloquer l'inscription si le parrainage échoue
        }
      }

      // Rediriger vers la page de confirmation
      router.push('/auth/confirm-email?message=Vérifiez votre email pour confirmer votre compte')
      
    } catch (error: any) {
      console.error('Erreur inscription:', error)
      setErrors({
        general: error.message || 'Une erreur est survenue lors de l\'inscription'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Carte d'affiliation si code présent */}
        {affiliateCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200"
          >
            <div className="text-center mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Invitation de parrainage
              </h3>
            </div>

            {loadingAffiliate ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="h-5 w-5 animate-spin text-green-600 mr-2" />
                <span className="text-gray-600">Vérification du code...</span>
              </div>
            ) : affiliateError ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-sm">{affiliateError}</span>
              </div>
            ) : affiliateInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-900">
                      Invité par {affiliateInfo.referrer_username}
                    </div>
                    <div className="text-xs text-green-700">
                      Niveau {affiliateInfo.referrer_tier}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-yellow-800">
                      {affiliateInfo.bonus_amount}
                    </div>
                    <div className="text-xs text-yellow-700">Coins bonus</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-800">
                      {(affiliateInfo.commission_rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-blue-700">Commission référent</div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Formulaire d'inscription */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Créer un compte
            </h1>
            <p className="text-gray-600">
              Rejoignez ReveelBox et découvrez l'unboxing révolutionnaire !
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Erreur générale */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-sm">{errors.general}</span>
              </motion.div>
            )}

            {/* Nom d'utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre nom d'utilisateur"
                />
              </div>
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="votre@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirmez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Conditions */}
            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <div className={`text-sm ${errors.terms ? 'text-red-600' : 'text-gray-600'}`}>
                  J'accepte les{' '}
                  <a href="/terms" className="text-green-600 hover:underline">
                    conditions d'utilisation
                  </a>
                  {' '}et la{' '}
                  <a href="/privacy" className="text-green-600 hover:underline">
                    politique de confidentialité
                  </a>
                </div>
              </label>
              {errors.terms && (
                <p className="text-red-600 text-sm mt-1">{errors.terms}</p>
              )}
            </div>

            {/* Bouton inscription */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <User className="h-5 w-5" />
              )}
              {isLoading ? 'Inscription en cours...' : 'Créer mon compte'}
            </motion.button>
          </form>

          {/* Lien connexion */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <a 
                href="/login" 
                className="text-green-600 hover:text-green-700 font-medium hover:underline"
              >
                Se connecter
              </a>
            </p>
          </div>
        </div>

        {/* Avantages si code d'affiliation */}
        {affiliateInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white"
          >
            <div className="text-center">
              <Star className="h-8 w-8 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">
                Avantages de votre parrainage
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{affiliateInfo.bonus_amount}</div>
                  <div className="text-sm opacity-90">Coins gratuits</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">🎁</div>
                  <div className="text-sm opacity-90">Bonus exclusifs</div>
                </div>
              </div>
              <p className="text-sm opacity-90 mt-3">
                Profitez d'avantages exclusifs grâce au parrainage de {affiliateInfo.referrer_username}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}