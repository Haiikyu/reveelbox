'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2, AlertCircle, CheckCircle, Gift } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState({ type: '', message: '' })
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 5000)
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      showNotification('error', 'Tous les champs sont requis')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showNotification('error', 'Email invalide')
      return false
    }

    return true
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          showNotification('error', 'Email ou mot de passe incorrect')
        } else if (error.message.includes('Email not confirmed')) {
          showNotification('error', 'Veuillez confirmer votre email avant de vous connecter')
        } else if (error.message.includes('Too many requests')) {
          showNotification('error', 'Trop de tentatives. Réessayez dans quelques minutes')
        } else {
          showNotification('error', 'Erreur de connexion. Vérifiez vos identifiants')
        }
        return
      }

      if (data.user) {
        showNotification('success', 'Connexion réussie ! Redirection...')
        setTimeout(() => {
          router.push('/boxes')
        }, 1500)
      }

    } catch (error) {
      console.error('Erreur connexion:', error)
      showNotification('error', 'Une erreur est survenue lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      showNotification('error', 'Entrez votre email pour réinitialiser le mot de passe')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        showNotification('error', 'Erreur lors de l\'envoi de l\'email')
      } else {
        showNotification('success', 'Email de réinitialisation envoyé !')
      }
    } catch (error) {
      showNotification('error', 'Une erreur est survenue')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Notification */}
      {notification.message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-soft-lg border ${
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
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-soft-lg">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accédez à votre compte ReveelBox
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-soft-lg sm:rounded-2xl sm:px-10 border border-gray-100"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  placeholder="Votre mot de passe"
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

            {/* Mot de passe oublié */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </>
              )}
            </motion.button>
          </form>

          {/* Séparateur et lien inscription */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Nouveau sur ReveelBox ?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/signup"
                className="w-full flex justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
              >
                Créer un compte
              </Link>
            </div>
          </div>

          {/* Bonus nouveau compte */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Pas encore inscrit ?
                </p>
                <p className="text-xs text-green-600">
                  Créez un compte et recevez 100 coins gratuits !
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer légal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-gray-500">
            Problème de connexion ?{' '}
            <Link href="/support" className="text-green-600 hover:text-green-500">
              Contactez le support
            </Link>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            En vous connectant, vous acceptez nos{' '}
            <Link href="/terms" className="text-green-600 hover:text-green-500">
              conditions d'utilisation
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}