'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Phone, 
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

// Types pour les données du formulaire et notifications
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
      // Simuler l'envoi (remplacer par votre API)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showNotification('success', 'Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.')
      
      // Reset form
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
      description: "Réponse sous 24h"
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
      description: "Siège social"
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
      description: "Comment ça marche ?",
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
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 transition-colors duration-300">
      {/* Notification */}
      {notification.message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
            notification.type === 'error' 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' 
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
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

      {/* Hero Section */}
      <section className="py-16 transition-colors duration-300" style={{
        background: `linear-gradient(135deg, var(--hybrid-bg-secondary), var(--hybrid-bg-tertiary))`
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg" style={{
                background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
              }}>
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
              Contactez-nous
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
              Une question ? Un problème ? Notre équipe est là pour vous aider !
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <div key={index} className="text-center group">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors" style={{
                    backgroundColor: 'var(--hybrid-bg-secondary)',
                    color: 'var(--hybrid-accent-primary)'
                  }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 transition-colors">{info.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors">{info.content}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">{info.description}</p>
                </div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200/50 dark:border-gray-700/50 transition-colors">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">
                  Envoyez-nous un message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Catégorie
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-xl transition-all text-gray-900 dark:text-white hybrid-input"
                    >
                      <option value="general">Question générale</option>
                      <option value="order">Problème de commande</option>
                      <option value="technical">Problème technique</option>
                      <option value="billing">Facturation</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  {/* Name & Email */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="hybrid-input"
                        placeholder="Votre nom"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="hybrid-input"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Sujet
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="hybrid-input"
                      placeholder="Résumé de votre demande"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="hybrid-input resize-none"
                      style={{ height: 'auto', minHeight: '150px' }}
                      placeholder="Décrivez votre demande en détail..."
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="hybrid-btn hybrid-btn-primary hybrid-btn-lg hybrid-btn-full"
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
              className="space-y-8"
            >
              {/* Quick Help */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200/50 dark:border-gray-700/50 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <HelpCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                    Aide rapide
                  </h2>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
                  Consultez notre FAQ pour trouver rapidement une réponse à votre question.
                </p>

                <div className="space-y-4">
                  {faqCategories.map((category, index) => {
                    const Icon = category.icon
                    return (
                      <motion.a
                        key={index}
                        href={category.href}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group"
                      >
                        <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-800/30 transition-colors">
                          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                            {category.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                            {category.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                      </motion.a>
                    )
                  })}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 transition-colors">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2 transition-colors">
                  <AlertCircle className="h-5 w-5" />
                  Problème urgent ?
                </h3>
                <p className="text-red-700 dark:text-red-400 text-sm mb-4 transition-colors">
                  Pour les problèmes critiques nécessitant une intervention immédiate.
                </p>
                <a
                  href="mailto:urgent@reveelbox.fr"
                  className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  urgent@reveelbox.fr
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{
        background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Pas encore de réponse ?
            </h2>
            <p className="text-green-100 text-lg mb-8">
              Rejoignez notre communauté Discord pour obtenir de l'aide instantanée
            </p>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://discord.gg/reveelbox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-600 px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-200"
            >
              <Users className="h-5 w-5" />
              Rejoindre Discord
              <ArrowRight className="h-5 w-5" />
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}