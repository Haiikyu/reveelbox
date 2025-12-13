'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coins,
  ArrowRight,
  Package,
  TrendingUp,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'

// 4 Directions Professionnelles & Épurées
const themes = {
  corporateBlue: {
    name: 'Corporate Blue',
    description: 'Professionnel et épuré - Inspiration Stripe',
    identity: 'Design corporate minimaliste pour une plateforme sérieuse',
    css: {
      bgPrimary: '#0A1628',
      bgSecondary: '#0F1B2D',
      bgCard: '#152238',
      bgElevated: '#1A2842',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      accentPrimary: '#3B82F6',
      accentGlow: 'rgba(59, 130, 246, 0.15)',
      accentSecondary: '#60A5FA',
      borderSubtle: 'rgba(148, 163, 184, 0.1)',
      borderStrong: 'rgba(59, 130, 246, 0.2)',
      success: '#10B981',
      danger: '#EF4444',
      shadowCard: '0 1px 3px rgba(0, 0, 0, 0.2)',
      shadowGlow: '0 0 0 1px rgba(59, 130, 246, 0.1)',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'
    }
  },

  modernSlate: {
    name: 'Modern Slate',
    description: 'Élégant et raffiné - Inspiration Linear',
    identity: 'Sophistication et modernité pour une expérience premium',
    css: {
      bgPrimary: '#0F1419',
      bgSecondary: '#16181D',
      bgCard: '#1C1F26',
      bgElevated: '#22252D',
      textPrimary: '#FFFFFF',
      textSecondary: '#9CA3AF',
      textMuted: '#6B7280',
      accentPrimary: '#6366F1',
      accentGlow: 'rgba(99, 102, 241, 0.15)',
      accentSecondary: '#818CF8',
      borderSubtle: 'rgba(156, 163, 175, 0.1)',
      borderStrong: 'rgba(99, 102, 241, 0.25)',
      success: '#10B981',
      danger: '#F87171',
      shadowCard: '0 1px 2px rgba(0, 0, 0, 0.25)',
      shadowGlow: '0 0 0 1px rgba(99, 102, 241, 0.1)',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)'
    }
  },

  navyProfessional: {
    name: 'Navy Professional',
    description: 'Sobre et confiant - Inspiration Vercel',
    identity: 'Minimalisme radical pour une clarté absolue',
    css: {
      bgPrimary: '#0C1220',
      bgSecondary: '#111827',
      bgCard: '#1F2937',
      bgElevated: '#374151',
      textPrimary: '#F9FAFB',
      textSecondary: '#D1D5DB',
      textMuted: '#9CA3AF',
      accentPrimary: '#2563EB',
      accentGlow: 'rgba(37, 99, 235, 0.12)',
      accentSecondary: '#3B82F6',
      borderSubtle: 'rgba(209, 213, 219, 0.08)',
      borderStrong: 'rgba(37, 99, 235, 0.3)',
      success: '#059669',
      danger: '#DC2626',
      shadowCard: '0 1px 3px rgba(0, 0, 0, 0.3)',
      shadowGlow: '0 0 0 1px rgba(37, 99, 235, 0.08)',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
    }
  },

  midnightMinimal: {
    name: 'Midnight Minimal',
    description: 'Nuit profonde et épuré - Inspiration Apple',
    identity: 'Élégance discrète pour un design intemporel',
    css: {
      bgPrimary: '#0B0F19',
      bgSecondary: '#12151F',
      bgCard: '#181B25',
      bgElevated: '#1E212B',
      textPrimary: '#FAFAFA',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A',
      accentPrimary: '#0EA5E9',
      accentGlow: 'rgba(14, 165, 233, 0.12)',
      accentSecondary: '#38BDF8',
      borderSubtle: 'rgba(161, 161, 170, 0.08)',
      borderStrong: 'rgba(14, 165, 233, 0.25)',
      success: '#14B8A6',
      danger: '#EF4444',
      shadowCard: '0 1px 2px rgba(0, 0, 0, 0.35)',
      shadowGlow: '0 0 0 1px rgba(14, 165, 233, 0.08)',
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)'
    }
  }
}

const demoBoxes = [
  {
    id: '1',
    name: 'Louis Vuitton',
    description: 'Collection premium exclusive',
    price: 650,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop',
    badge: 'LIMITED'
  },
  {
    id: '2',
    name: 'GUCCI',
    description: 'Luxe et authenticité',
    price: 158,
    image: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=400&h=400&fit=crop',
    badge: null
  },
  {
    id: '3',
    name: 'POKEMON',
    description: 'Cartes collection rare',
    price: 105,
    image: 'https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=400&h=400&fit=crop',
    badge: 'HOT'
  },
  {
    id: '4',
    name: 'MINECRAFT',
    description: 'Gaming collector edition',
    price: 75,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop',
    badge: null
  }
]

export default function ThemeDemoPage() {
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>('corporateBlue')
  const themeKeys = Object.keys(themes) as Array<keyof typeof themes>
  const currentIndex = themeKeys.indexOf(selectedTheme)
  const theme = themes[selectedTheme]

  const nextTheme = () => {
    const nextIndex = (currentIndex + 1) % themeKeys.length
    setSelectedTheme(themeKeys[nextIndex])
  }

  const prevTheme = () => {
    const prevIndex = (currentIndex - 1 + themeKeys.length) % themeKeys.length
    setSelectedTheme(themeKeys[prevIndex])
  }

  return (
    <div
      className="min-h-screen transition-all duration-500"
      style={{
        backgroundColor: theme.css.bgPrimary,
        color: theme.css.textPrimary
      }}
    >
      {/* Header Fixe */}
      <div
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-500"
        style={{
          backgroundColor: `${theme.css.bgSecondary}F2`,
          borderColor: theme.css.borderSubtle
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Info */}
            <div>
              <h1 className="text-lg font-bold mb-0.5" style={{ color: theme.css.textPrimary }}>
                {theme.name}
              </h1>
              <p className="text-sm" style={{ color: theme.css.textSecondary }}>
                {theme.description}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={prevTheme}
                className="p-2.5 rounded-lg transition-all duration-200 hover:bg-opacity-80"
                style={{
                  backgroundColor: theme.css.bgCard,
                  border: `1px solid ${theme.css.borderSubtle}`,
                  color: theme.css.textPrimary
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <div
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: theme.css.bgCard,
                  border: `1px solid ${theme.css.borderSubtle}`,
                  color: theme.css.textSecondary
                }}
              >
                {currentIndex + 1} / {themeKeys.length}
              </div>

              <button
                onClick={nextTheme}
                className="p-2.5 rounded-lg transition-all duration-200 hover:bg-opacity-80"
                style={{
                  backgroundColor: theme.css.bgCard,
                  border: `1px solid ${theme.css.borderSubtle}`,
                  color: theme.css.textPrimary
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="pt-24 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTheme}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hero */}
            <section className="py-20">
              <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-16">
                  <h2
                    className="text-6xl md:text-7xl font-bold mb-6 tracking-tight"
                    style={{ color: theme.css.textPrimary }}
                  >
                    Déballez l'
                    <span
                      style={{
                        background: theme.css.gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      Impossible
                    </span>
                  </h2>

                  <p
                    className="text-xl mb-10 max-w-2xl mx-auto"
                    style={{ color: theme.css.textSecondary }}
                  >
                    Plateforme d'unboxing authentique et sécurisée
                  </p>

                  {/* Balance */}
                  <div
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-xl"
                    style={{
                      backgroundColor: theme.css.bgCard,
                      border: `1px solid ${theme.css.borderSubtle}`
                    }}
                  >
                    <Coins size={22} style={{ color: theme.css.accentPrimary }} />
                    <span
                      className="text-2xl font-bold"
                      style={{ color: theme.css.textPrimary }}
                    >
                      162,257
                    </span>
                  </div>
                </div>

                {/* Grid Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                  {demoBoxes.map((box, index) => (
                    <motion.div
                      key={box.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                      style={{
                        backgroundColor: theme.css.bgCard,
                        border: `1px solid ${theme.css.borderSubtle}`,
                        boxShadow: theme.css.shadowCard
                      }}
                    >
                      {/* Badge */}
                      {box.badge && (
                        <div className="absolute top-3 right-3 z-10">
                          <span
                            className="px-2.5 py-1 rounded-md text-xs font-semibold"
                            style={{
                              backgroundColor: theme.css.accentPrimary,
                              color: '#FFFFFF'
                            }}
                          >
                            {box.badge}
                          </span>
                        </div>
                      )}

                      {/* Contenu */}
                      <div className="p-5">
                        <div
                          className="w-full h-40 mb-4 rounded-lg overflow-hidden"
                          style={{ backgroundColor: theme.css.bgElevated }}
                        >
                          <img
                            src={box.image}
                            alt={box.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <h3
                          className="text-lg font-bold mb-1"
                          style={{ color: theme.css.textPrimary }}
                        >
                          {box.name}
                        </h3>

                        <p
                          className="text-sm mb-4"
                          style={{ color: theme.css.textSecondary }}
                        >
                          {box.description}
                        </p>

                        {/* Prix */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Coins size={18} style={{ color: theme.css.textSecondary }} />
                          <span
                            className="text-xl font-bold"
                            style={{ color: theme.css.textPrimary }}
                          >
                            {box.price}
                          </span>
                        </div>

                        {/* Bouton */}
                        <button
                          className="w-full py-2.5 rounded-lg font-semibold transition-all duration-200"
                          style={{
                            backgroundColor: theme.css.accentPrimary,
                            color: '#FFFFFF'
                          }}
                        >
                          Ouvrir
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: theme.css.accentPrimary,
                      color: '#FFFFFF'
                    }}
                  >
                    <Package size={20} />
                    Voir toutes les boîtes
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section
              className="py-16 border-y transition-all duration-500"
              style={{
                backgroundColor: theme.css.bgSecondary,
                borderColor: theme.css.borderSubtle
              }}
            >
              <div className="max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { icon: Package, number: '125K+', label: 'Boîtes ouvertes' },
                    { icon: Users, number: '45K+', label: 'Utilisateurs' },
                    { icon: TrendingUp, number: '99.2%', label: 'Satisfaction' },
                    { icon: Star, number: '4.9', label: 'Note' }
                  ].map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <div key={index} className="text-center">
                        <div className="flex justify-center mb-3">
                          <div
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: theme.css.bgCard,
                              border: `1px solid ${theme.css.borderSubtle}`
                            }}
                          >
                            <Icon size={24} style={{ color: theme.css.accentPrimary }} />
                          </div>
                        </div>
                        <div
                          className="text-3xl font-bold mb-1"
                          style={{ color: theme.css.textPrimary }}
                        >
                          {stat.number}
                        </div>
                        <div className="text-sm" style={{ color: theme.css.textSecondary }}>
                          {stat.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* UI Elements */}
            <section className="py-16">
              <div className="max-w-7xl mx-auto px-8">
                <h3
                  className="text-2xl font-bold mb-8 text-center"
                  style={{ color: theme.css.textPrimary }}
                >
                  Éléments d'Interface
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Boutons */}
                  <div
                    className="p-6 rounded-xl"
                    style={{
                      backgroundColor: theme.css.bgCard,
                      border: `1px solid ${theme.css.borderSubtle}`
                    }}
                  >
                    <h4
                      className="text-base font-bold mb-4"
                      style={{ color: theme.css.textPrimary }}
                    >
                      Boutons
                    </h4>
                    <div className="space-y-3">
                      <button
                        className="w-full py-2.5 rounded-lg font-semibold"
                        style={{
                          backgroundColor: theme.css.accentPrimary,
                          color: '#FFFFFF'
                        }}
                      >
                        Principal
                      </button>
                      <button
                        className="w-full py-2.5 rounded-lg font-semibold"
                        style={{
                          backgroundColor: 'transparent',
                          border: `1px solid ${theme.css.borderStrong}`,
                          color: theme.css.accentPrimary
                        }}
                      >
                        Secondaire
                      </button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div
                    className="p-6 rounded-xl"
                    style={{
                      backgroundColor: theme.css.bgCard,
                      border: `1px solid ${theme.css.borderSubtle}`
                    }}
                  >
                    <h4
                      className="text-base font-bold mb-4"
                      style={{ color: theme.css.textPrimary }}
                    >
                      Cards
                    </h4>
                    <div className="space-y-3">
                      <div
                        className="p-4 rounded-lg"
                        style={{
                          backgroundColor: theme.css.bgElevated,
                          border: `1px solid ${theme.css.borderSubtle}`
                        }}
                      >
                        <p className="text-sm font-semibold mb-1" style={{ color: theme.css.textPrimary }}>
                          Titre
                        </p>
                        <p className="text-sm" style={{ color: theme.css.textSecondary }}>
                          Description
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div
                    className="p-6 rounded-xl"
                    style={{
                      backgroundColor: theme.css.bgCard,
                      border: `1px solid ${theme.css.borderSubtle}`
                    }}
                  >
                    <h4
                      className="text-base font-bold mb-4"
                      style={{ color: theme.css.textPrimary }}
                    >
                      Typography
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm font-bold" style={{ color: theme.css.textPrimary }}>
                        Texte principal
                      </p>
                      <p className="text-sm" style={{ color: theme.css.textSecondary }}>
                        Texte secondaire
                      </p>
                      <p className="text-sm" style={{ color: theme.css.textMuted }}>
                        Texte discret
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
