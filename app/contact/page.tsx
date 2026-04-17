'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/app/components/ThemeProvider'
import Link from 'next/link'
import {
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
  Gift,
  Loader2,
  ArrowRight,
  Users,
  HelpCircle,
  Truck,
  Package
} from 'lucide-react'

interface FormData {
  name: string
  email: string
  subject: string
  message: string
  category: string
}

interface Notification {
  type: 'success' | 'error' | ''
  message: string
}

interface ContactInfo {
  icon: any
  title: string
  content: string
  description: string
}

interface FAQCategory {
  icon: any
  title: string
  description: string
  href: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  })
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<Notification>({ type: '', message: '' })
  const { resolvedTheme } = useTheme()

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.message) {
      showNotification('error', 'Veuillez remplir tous les champs requis')
      return
    }

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      showNotification('success', 'Message envoye avec succes ! Nous vous repondrons dans les plus brefs delais.')

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      })
    } catch (error) {
      showNotification('error', 'Erreur lors de l\'envoi du message')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo: ContactInfo[] = [
    {
      icon: Mail,
      title: "Email",
      content: "support@reveelbox.fr",
      description: "Reponse sous 24h"
    },
    {
      icon: Clock,
      title: "Horaires",
      content: "Lun - Ven : 9h - 18h",
      description: "Support client"
    },
    {
      icon: MapPin,
      title: "Adresse",
      content: "Paris, France",
      description: "Siege social"
    }
  ]

  const faqCategories: FAQCategory[] = [
    {
      icon: Package,
      title: "Commandes & Livraison",
      description: "Questions sur vos commandes",
      href: "/faq#orders"
    },
    {
      icon: Gift,
      title: "Loot Boxes",
      description: "Comment ca marche ?",
      href: "/faq#boxes"
    },
    {
      icon: Users,
      title: "Compte",
      description: "Gestion de votre profil",
      href: "/faq#account"
    },
    {
      icon: Truck,
      title: "Retours",
      description: "Politique de retour",
      href: "/faq#returns"
    }
  ]

  return (
    <div className="min-h-screen -mt-[80px] pt-[100px] pb-24 lg:pb-8 relative overflow-hidden"
      style={{ background: resolvedTheme === 'dark' ? '#0C1220' : '#f1f5f9' }}>
      {/* Dot grid */}
      {resolvedTheme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.015,
            backgroundImage: 'radial-gradient(rgba(59,130,246,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
        </div>
      )}

      {/* Notification */}
      {notification.message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg"
          style={{
            background: notification.type === 'error'
              ? (resolvedTheme === 'dark' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)')
              : (resolvedTheme === 'dark' ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'),
            border: notification.type === 'error'
              ? '1px solid rgba(239,68,68,0.3)'
              : '1px solid rgba(16,185,129,0.3)'
          }}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          <span className={`text-sm font-medium ${
            notification.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}>{notification.message}</span>
        </motion.div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: resolvedTheme === 'dark' ? 'rgba(59,130,246,0.7)' : 'rgba(59,130,246,0.8)' }}>
            ReveelBox
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4"
            style={{ color: resolvedTheme === 'dark' ? '#e2e8f0' : 'rgba(0,0,0,0.88)' }}>
            Contactez-nous
          </h1>
          <p className="text-base max-w-2xl mx-auto"
            style={{ color: resolvedTheme === 'dark' ? '#64748b' : '#94a3b8' }}>
            Une question ? Un probleme ? Notre equipe est la pour vous aider !
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {contactInfo.map((info, index) => {
            const Icon = info.icon
            return (
              <div
                key={index}
                className="text-center p-6 rounded-[28px]"
                style={{
                  background: resolvedTheme === 'dark'
                    ? 'rgba(18,28,48,0.95)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
                  border: resolvedTheme === 'dark' ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(148,163,184,0.2)',
                  boxShadow: resolvedTheme === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)'
                }}
              >
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{
                  background: resolvedTheme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)'
                }}>
                  <Icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{info.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{info.content}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{info.description}</p>
              </div>
            )
          })}
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="rounded-[28px] p-8" style={{
              background: resolvedTheme === 'dark'
                ? 'rgba(18,28,48,0.95)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
              border: resolvedTheme === 'dark' ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(148,163,184,0.2)',
              boxShadow: resolvedTheme === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)'
            }}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Envoyez-nous un message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categorie
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{
                      background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.8)',
                      border: resolvedTheme === 'dark' ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(148,163,184,0.2)'
                    }}
                  >
                    <option value="general">Question generale</option>
                    <option value="order">Probleme de commande</option>
                    <option value="technical">Probleme technique</option>
                    <option value="billing">Facturation</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                {/* Name & Email */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{
                        background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.8)',
                        border: resolvedTheme === 'dark' ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(148,163,184,0.2)'
                      }}
                      placeholder="Votre nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{
                        background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.8)',
                        border: resolvedTheme === 'dark' ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(148,163,184,0.2)'
                      }}
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sujet
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{
                      background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.8)',
                      border: resolvedTheme === 'dark' ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(148,163,184,0.2)'
                    }}
                    placeholder="Resume de votre demande"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    style={{
                      background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.8)',
                      border: resolvedTheme === 'dark' ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(148,163,184,0.2)',
                      minHeight: '150px'
                    }}
                    placeholder="Decrivez votre demande en detail..."
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full text-white px-6 py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.3)'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Envoyer le message
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* FAQ Quick Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Help */}
            <div className="rounded-[28px] p-8" style={{
              background: resolvedTheme === 'dark'
                ? 'rgba(18,28,48,0.95)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
              border: resolvedTheme === 'dark' ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(148,163,184,0.2)',
              boxShadow: resolvedTheme === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)'
            }}>
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Aide rapide
                </h2>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Consultez notre FAQ pour trouver rapidement une reponse a votre question.
              </p>

              <div className="space-y-3">
                {faqCategories.map((category, index) => {
                  const Icon = category.icon
                  return (
                    <motion.div key={index} whileHover={{ scale: 1.01 }}>
                      <Link
                        href={category.href}
                        className="flex items-center gap-4 p-4 rounded-xl transition-all group"
                        style={{
                          background: resolvedTheme === 'dark' ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.5)',
                          border: resolvedTheme === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(148,163,184,0.15)'
                        }}
                      >
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{
                          background: resolvedTheme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)'
                        }}>
                          <Icon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                            {category.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {category.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="rounded-[28px] p-6" style={{
              background: resolvedTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(234,88,12,0.05))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(234,88,12,0.03))',
              border: '1px solid rgba(239,68,68,0.15)'
            }}>
              <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Probleme urgent ?
              </h3>
              <p className="text-red-600/80 dark:text-red-400/80 text-sm mb-4">
                Pour les problemes critiques necessitant une intervention immediate.
              </p>
              <a
                href="mailto:urgent@reveelbox.fr"
                className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm transition-colors"
              >
                <Mail className="h-4 w-4" />
                urgent@reveelbox.fr
              </a>
            </div>

            {/* Discord CTA */}
            <div className="rounded-[28px] p-6 text-center" style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.25)'
            }}>
              <h3 className="text-xl font-bold text-white mb-2">
                Pas encore de reponse ?
              </h3>
              <p className="text-blue-100 text-sm mb-4">
                Rejoignez notre communaute Discord pour de l&apos;aide instantanee
              </p>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://discord.gg/reveelbox"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
              >
                <Users className="h-4 w-4" />
                Rejoindre Discord
                <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
