'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, CheckCircle, Gift } from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState({ type: '', message: '' })

  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      const redirectPath = localStorage.getItem('redirectAfterLogin')
      if (redirectPath && redirectPath !== '/login' && redirectPath !== '/signup') {
        localStorage.removeItem('redirectAfterLogin')
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
          showNotification('error', 'Veuillez confirmer votre email')
        } else {
          showNotification('error', 'Erreur de connexion')
        }
        setLoading(false)
        return
      }

      if (data.user) {
        showNotification('success', 'Connexion réussie !')
        setTimeout(() => {
          const redirectPath = localStorage.getItem('redirectAfterLogin')
          if (redirectPath && redirectPath !== '/login' && redirectPath !== '/signup') {
            localStorage.removeItem('redirectAfterLogin')
            router.push(redirectPath)
          } else {
            router.push('/boxes')
          }
        }, 1000)
      }
    } catch (error) {
      showNotification('error', 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      showNotification('error', 'Entrez votre email pour réinitialiser')
      return
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) {
        showNotification('error', 'Erreur lors de l\'envoi')
      } else {
        showNotification('success', 'Email de réinitialisation envoyé !')
      }
    } catch (error) {
      showNotification('error', 'Une erreur est survenue')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen hybrid-container flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--hybrid-accent-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen hybrid-container flex overflow-hidden">
      {/* Bouton retour */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 backdrop-blur-sm text-white rounded-xl font-medium transition-all"
        style={{
          background: 'var(--hybrid-text-primary)',
          color: 'var(--hybrid-text-inverse)'
        }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour
      </Link>

      {/* Notification */}
      {notification.message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white"
          style={{
            background: notification.type === 'error' ? 'var(--hybrid-error)' : 'var(--hybrid-success)'
          }}
        >
          {notification.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="text-sm font-semibold">{notification.message}</span>
        </motion.div>
      )}

      {/* Panneau gauche - 3D Boxes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--hybrid-accent-primary) 0%, var(--hybrid-accent-secondary) 50%, var(--hybrid-accent-tertiary) 100%)'
        }}
      >
        {/* Effets de fond améliorés */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-white/5 to-transparent"></div>
        </div>

        {/* Grille de points décorative */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Conteneur des boxes 3D multiples */}
        <div className="relative z-10 flex items-center justify-center w-full h-full p-12">
          <div className="relative w-full h-full max-w-2xl">
            {/* Box centrale principale */}
            <motion.div
              animate={{
                rotateY: [0, 360],
                rotateX: [0, 20, 0, -20, 0],
                z: [0, 50, 0]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1500px'
              }}
            >
              <div className="relative w-72 h-72">
                {/* Faces du cube avec dégradés */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/30 via-cyan-400/30 to-pink-500/30 backdrop-blur-2xl border-2 border-white/40 rounded-3xl shadow-2xl"
                     style={{ transform: 'translateZ(80px)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-3xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gift className="w-32 h-32 text-white drop-shadow-2xl" />
                  </div>
                </div>

                {/* Face arrière */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-cyan-400/30 backdrop-blur-2xl border-2 border-white/30 rounded-3xl"
                     style={{ transform: 'translateZ(-80px) rotateY(180deg)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-3xl"></div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-cyan-400 to-pink-500 blur-3xl opacity-40 rounded-3xl"></div>
              </div>
            </motion.div>

            {/* Box secondaire - Haut gauche */}
            <motion.div
              animate={{
                rotateY: [360, 0],
                rotateZ: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-16 left-16"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 via-pink-500/30 to-orange-400/30 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl"
                     style={{ transform: 'translateZ(40px)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-2xl"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 blur-2xl opacity-30 rounded-2xl"></div>
              </div>
            </motion.div>

            {/* Box secondaire - Bas droite */}
            <motion.div
              animate={{
                rotateX: [0, 360],
                rotateY: [0, 180, 360],
                scale: [1, 0.9, 1]
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-20 right-20"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 via-blue-500/30 to-violet-400/30 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-xl"
                     style={{ transform: 'translateZ(50px)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-2xl"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-400 blur-2xl opacity-30 rounded-2xl"></div>
              </div>
            </motion.div>

            {/* Box flottante - Droite */}
            <motion.div
              animate={{
                y: [0, -30, 0],
                rotateY: [0, 360],
                rotateZ: [0, -10, 0, 10, 0]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/3 right-8"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-orange-500/30 to-red-500/30 backdrop-blur-xl border-2 border-white/30 rounded-xl shadow-xl"
                     style={{ transform: 'translateZ(30px)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-xl"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 blur-xl opacity-30 rounded-xl"></div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Texte décoratif */}
        <div className="absolute bottom-12 left-12 z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
              Découvrez vos box mystères
            </h2>
            <p className="text-white/80 text-lg drop-shadow-md">
              Des surprises uniques vous attendent
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Panneau droit - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 lg:w-1/2"
        style={{ background: 'var(--hybrid-bg-secondary)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--hybrid-accent-primary)',
                opacity: 0.1,
                border: '1px solid var(--hybrid-accent-primary)'
              }}>
              <Gift className="h-6 w-6" style={{ color: 'var(--hybrid-accent-primary)', opacity: 3 }} />
            </div>
          </div>

          {/* Titre */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2"
              style={{ color: 'var(--hybrid-text-primary)' }}>
              Bienvenue sur ReveelBox
            </h1>
            <p style={{ color: 'var(--hybrid-text-secondary)' }}>
              Pas encore de compte ?{' '}
              <Link href="/signup" className="font-semibold transition-colors"
                style={{ color: 'var(--hybrid-accent-primary)' }}>
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="hybrid-input"
              />
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="hybrid-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--hybrid-text-secondary)' }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm transition-colors font-medium"
                style={{ color: 'var(--hybrid-accent-primary)' }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton connexion */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className="hybrid-btn hybrid-btn-primary hybrid-btn-md hybrid-btn-full"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </motion.button>
          </form>

          {/* Séparateur */}
          <div className="my-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid var(--hybrid-border-default)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4" style={{
                  background: 'var(--hybrid-bg-secondary)',
                  color: 'var(--hybrid-text-secondary)'
                }}>Ou</span>
              </div>
            </div>
          </div>

          {/* Connexion sociale */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                  }
                })
                if (error) {
                  showNotification('error', 'Erreur de connexion avec Google')
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-medium transition-all"
              style={{
                background: 'var(--hybrid-bg-elevated)',
                border: '1px solid var(--hybrid-border-default)',
                color: 'var(--hybrid-text-primary)'
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-medium transition-all"
              style={{
                background: 'var(--hybrid-bg-elevated)',
                border: '1px solid var(--hybrid-border-default)',
                color: 'var(--hybrid-text-primary)'
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continuer avec Apple
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
