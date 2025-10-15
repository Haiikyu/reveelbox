'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import '../styles/hybrid-design-system.css'

export default function HybridDesignSystemPage() {
  const [isDark, setIsDark] = useState(false)

  // Detect system preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(prefersDark)
  }, [])

  // Apply theme class to body
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('hybrid-dark')
      document.documentElement.classList.remove('hybrid-light')
    } else {
      document.documentElement.classList.add('hybrid-light')
      document.documentElement.classList.remove('hybrid-dark')
    }
  }, [isDark])

  return (
    <div className="hybrid-container">
      {/* Header with Theme Toggle */}
      <header className="hybrid-header">
        <div className="hybrid-wrapper">
          <div className="hybrid-header-content">
            <div>
              <h1 className="hybrid-header-title">Design System Hybride ReveelBox</h1>
              <p className="hybrid-header-subtitle">
                {isDark
                  ? '🌙 Dark Mode - Refined Depth (Sophistication tech)'
                  : '🌞 Light Mode - Sensorial Minimalism (Chaleur premium)'
                }
              </p>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="hybrid-theme-toggle"
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="hybrid-main">
        <div className="hybrid-wrapper">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hybrid-hero"
          >
            <h2 className="hybrid-display">
              Le Meilleur des Deux Mondes
            </h2>
            <p className="hybrid-lead">
              {isDark
                ? 'Mode sombre sophistiqué avec profondeur stratifiée et accents indigo. Parfait pour les sessions prolongées et les power users.'
                : 'Mode clair chaleureux avec palette terreuse et textures subtiles. Accueillant et premium pour la découverte.'
              }
            </p>
          </motion.section>

          {/* Design Philosophy */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Philosophie du Design Hybride</h3>
            <div className="hybrid-grid hybrid-grid-3">
              <div className="hybrid-card">
                <div className="hybrid-card-icon">🌞</div>
                <h4 className="hybrid-card-title">Light Mode</h4>
                <p className="hybrid-card-text">
                  Sensorial Minimalism pour l'accueil : chaleureux, accessible, rassurant.
                  Parfait pour la découverte et l'onboarding.
                </p>
              </div>
              <div className="hybrid-card">
                <div className="hybrid-card-icon">🌙</div>
                <h4 className="hybrid-card-title">Dark Mode</h4>
                <p className="hybrid-card-text">
                  Refined Depth pour l'immersion : sophistiqué, tech, confortable.
                  Idéal pour les sessions prolongées.
                </p>
              </div>
              <div className="hybrid-card">
                <div className="hybrid-card-icon">⚡</div>
                <h4 className="hybrid-card-title">Transition Fluide</h4>
                <p className="hybrid-card-text">
                  Changement instantané avec cohérence visuelle maintenue.
                  Design tokens unifiés.
                </p>
              </div>
            </div>
          </section>

          {/* Buttons */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Boutons</h3>
            <p className="hybrid-section-description">
              Boutons adaptatifs qui changent de style selon le thème actif
            </p>

            <div className="hybrid-showcase">
              <div className="hybrid-showcase-group">
                <h4 className="hybrid-showcase-label">Tailles</h4>
                <div className="hybrid-button-group">
                  <button className="hybrid-btn hybrid-btn-primary hybrid-btn-sm">
                    Small
                  </button>
                  <button className="hybrid-btn hybrid-btn-primary hybrid-btn-md">
                    Medium
                  </button>
                  <button className="hybrid-btn hybrid-btn-primary hybrid-btn-lg">
                    Large
                  </button>
                </div>
              </div>

              <div className="hybrid-showcase-group">
                <h4 className="hybrid-showcase-label">Variantes</h4>
                <div className="hybrid-button-group">
                  <button className="hybrid-btn hybrid-btn-primary">Primary</button>
                  <button className="hybrid-btn hybrid-btn-secondary">Secondary</button>
                  <button className="hybrid-btn hybrid-btn-outline">Outline</button>
                  <button className="hybrid-btn hybrid-btn-ghost">Ghost</button>
                </div>
              </div>

              <div className="hybrid-showcase-group">
                <h4 className="hybrid-showcase-label">États</h4>
                <div className="hybrid-button-group">
                  <button className="hybrid-btn hybrid-btn-success">
                    <span className="hybrid-btn-icon">✓</span>
                    Success
                  </button>
                  <button className="hybrid-btn hybrid-btn-primary hybrid-btn-loading">
                    <span className="hybrid-spinner"></span>
                    Loading
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Cards */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Cards</h3>
            <p className="hybrid-section-description">
              Cards qui s'adaptent automatiquement au thème avec transitions fluides
            </p>

            <div className="hybrid-grid hybrid-grid-2">
              <article className="hybrid-card hybrid-card-interactive">
                <div className="hybrid-card-header">
                  <h4 className="hybrid-card-title">Card Interactive</h4>
                  <span className="hybrid-badge hybrid-badge-neutral">Default</span>
                </div>
                <p className="hybrid-card-text">
                  Card standard qui change d'apparence selon le thème actif.
                  Effet hover différent en light et dark mode.
                </p>
                <div className="hybrid-card-footer">
                  <button className="hybrid-btn hybrid-btn-ghost hybrid-btn-sm">
                    En savoir plus →
                  </button>
                </div>
              </article>

              <article className="hybrid-card hybrid-card-featured">
                <div className="hybrid-card-badge-corner">Premium</div>
                <div className="hybrid-card-header">
                  <h4 className="hybrid-card-title">Card Featured</h4>
                  <span className="hybrid-badge hybrid-badge-primary">
                    Nouveau
                  </span>
                </div>
                <p className="hybrid-card-text">
                  Card mise en avant avec accent selon le mode actif :
                  terracotta en light, indigo en dark.
                </p>
                <div className="hybrid-card-footer">
                  <button className="hybrid-btn hybrid-btn-primary hybrid-btn-sm">
                    Découvrir
                  </button>
                </div>
              </article>
            </div>
          </section>

          {/* Badges & Labels */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Badges & Labels</h3>
            <div className="hybrid-showcase">
              <div className="hybrid-showcase-group">
                <h4 className="hybrid-showcase-label">Status</h4>
                <div className="hybrid-badge-group">
                  <span className="hybrid-badge hybrid-badge-success">Success</span>
                  <span className="hybrid-badge hybrid-badge-warning">Warning</span>
                  <span className="hybrid-badge hybrid-badge-error">Error</span>
                  <span className="hybrid-badge hybrid-badge-info">Info</span>
                  <span className="hybrid-badge hybrid-badge-neutral">Neutral</span>
                </div>
              </div>

              <div className="hybrid-showcase-group">
                <h4 className="hybrid-showcase-label">Rarity</h4>
                <div className="hybrid-badge-group">
                  <span className="hybrid-badge hybrid-badge-rarity hybrid-badge-legendary">
                    LEGENDARY
                  </span>
                  <span className="hybrid-badge hybrid-badge-rarity hybrid-badge-epic">
                    EPIC
                  </span>
                  <span className="hybrid-badge hybrid-badge-rarity hybrid-badge-rare">
                    RARE
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Inputs & Forms */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Inputs & Forms</h3>
            <div className="hybrid-grid hybrid-grid-2">
              <div className="hybrid-form-group">
                <label className="hybrid-label">Email</label>
                <input
                  type="email"
                  className="hybrid-input"
                  placeholder="vous@exemple.com"
                />
                <span className="hybrid-hint">Votre adresse email professionnelle</span>
              </div>

              <div className="hybrid-form-group">
                <label className="hybrid-label">
                  Mot de passe
                  <span className="hybrid-label-optional">(optionnel)</span>
                </label>
                <input
                  type="password"
                  className="hybrid-input"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </section>

          {/* Mystery Box - Complete Example */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Mystery Box - Exemple Complet</h3>
            <p className="hybrid-section-description">
              Component phare qui s'adapte complètement au thème
            </p>

            <article className="hybrid-mystery-box">
              <div className="hybrid-mystery-box-image">
                <div className="hybrid-mystery-box-icon">🎁</div>
                <span className="hybrid-mystery-box-badge">
                  <span className="hybrid-badge hybrid-badge-rarity hybrid-badge-legendary">
                    LEGENDARY
                  </span>
                </span>
              </div>

              <div className="hybrid-mystery-box-content">
                <div className="hybrid-mystery-box-header">
                  <div>
                    <h4 className="hybrid-mystery-box-title">
                      Premium Mystery Box
                    </h4>
                    <p className="hybrid-mystery-box-subtitle">
                      Collection exclusive d'objets rares et désirables
                    </p>
                  </div>
                  <div className="hybrid-mystery-box-price">
                    <span className="hybrid-mystery-box-price-value">500</span>
                    <span className="hybrid-mystery-box-price-currency">€</span>
                  </div>
                </div>

                <div className="hybrid-mystery-box-stats">
                  <div className="hybrid-mystery-box-stat">
                    <div className="hybrid-mystery-box-stat-value">156</div>
                    <div className="hybrid-mystery-box-stat-label">Items possibles</div>
                  </div>
                  <div className="hybrid-mystery-box-stat">
                    <div className="hybrid-mystery-box-stat-value">42</div>
                    <div className="hybrid-mystery-box-stat-label">Fois ouverte</div>
                  </div>
                  <div className="hybrid-mystery-box-stat">
                    <div className="hybrid-mystery-box-stat-value">98.5%</div>
                    <div className="hybrid-mystery-box-stat-label">Taux de gain</div>
                  </div>
                </div>

                <div className="hybrid-mystery-box-features">
                  <div className="hybrid-feature">
                    <span className="hybrid-feature-icon">✓</span>
                    <span className="hybrid-feature-text">Livraison gratuite mondiale</span>
                  </div>
                  <div className="hybrid-feature">
                    <span className="hybrid-feature-icon">✓</span>
                    <span className="hybrid-feature-text">Garantie authenticité 100%</span>
                  </div>
                  <div className="hybrid-feature">
                    <span className="hybrid-feature-icon">✓</span>
                    <span className="hybrid-feature-text">Support prioritaire 24/7</span>
                  </div>
                </div>

                <div className="hybrid-mystery-box-actions">
                  <button className="hybrid-btn hybrid-btn-primary hybrid-btn-lg hybrid-btn-full">
                    Ouvrir la box maintenant
                  </button>
                  <button className="hybrid-btn hybrid-btn-outline hybrid-btn-lg">
                    Voir les détails
                  </button>
                </div>
              </div>
            </article>
          </section>

          {/* Color Palette Display */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Palette de Couleurs Active</h3>
            <p className="hybrid-section-description">
              Couleurs qui changent automatiquement selon le thème
            </p>

            <div className="hybrid-color-grid">
              <div className="hybrid-color-swatch">
                <div className="hybrid-color-preview hybrid-color-bg-primary"></div>
                <div className="hybrid-color-info">
                  <span className="hybrid-color-name">Background Primary</span>
                  <span className="hybrid-color-var">--hybrid-bg-primary</span>
                </div>
              </div>
              <div className="hybrid-color-swatch">
                <div className="hybrid-color-preview hybrid-color-text-primary"></div>
                <div className="hybrid-color-info">
                  <span className="hybrid-color-name">Text Primary</span>
                  <span className="hybrid-color-var">--hybrid-text-primary</span>
                </div>
              </div>
              <div className="hybrid-color-swatch">
                <div className="hybrid-color-preview hybrid-color-accent-primary"></div>
                <div className="hybrid-color-info">
                  <span className="hybrid-color-name">Accent Primary</span>
                  <span className="hybrid-color-var">--hybrid-accent-primary</span>
                </div>
              </div>
              <div className="hybrid-color-swatch">
                <div className="hybrid-color-preview hybrid-color-accent-secondary"></div>
                <div className="hybrid-color-info">
                  <span className="hybrid-color-name">Accent Secondary</span>
                  <span className="hybrid-color-var">--hybrid-accent-secondary</span>
                </div>
              </div>
            </div>
          </section>

          {/* Typography Scale */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Échelle Typographique</h3>
            <div className="hybrid-typography-showcase">
              <h1 className="hybrid-typo-display">Display Title - 56px</h1>
              <h2 className="hybrid-typo-h1">Heading 1 - 40px</h2>
              <h3 className="hybrid-typo-h2">Heading 2 - 32px</h3>
              <h4 className="hybrid-typo-h3">Heading 3 - 24px</h4>
              <p className="hybrid-typo-body-large">
                Body Large - 18px. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <p className="hybrid-typo-body">
                Body Regular - 16px. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p className="hybrid-typo-body-small">
                Body Small - 14px. Ut enim ad minim veniam, quis nostrud exercitation.
              </p>
            </div>
          </section>

          {/* Design Tokens Summary */}
          <section className="hybrid-section">
            <h3 className="hybrid-section-title">Design Tokens Unifiés</h3>
            <div className="hybrid-grid hybrid-grid-3">
              <div className="hybrid-card">
                <h4 className="hybrid-card-title">Spacing</h4>
                <div className="hybrid-token-list">
                  <div className="hybrid-token">xs: 4px</div>
                  <div className="hybrid-token">sm: 8px</div>
                  <div className="hybrid-token">md: 16px</div>
                  <div className="hybrid-token">lg: 24px</div>
                  <div className="hybrid-token">xl: 32px</div>
                </div>
              </div>

              <div className="hybrid-card">
                <h4 className="hybrid-card-title">Border Radius</h4>
                <div className="hybrid-token-list">
                  <div className="hybrid-token">sm: 8px</div>
                  <div className="hybrid-token">md: 12px</div>
                  <div className="hybrid-token">lg: 16px</div>
                  <div className="hybrid-token">xl: 24px</div>
                  <div className="hybrid-token">full: 9999px</div>
                </div>
              </div>

              <div className="hybrid-card">
                <h4 className="hybrid-card-title">Transitions</h4>
                <div className="hybrid-token-list">
                  <div className="hybrid-token">fast: 150ms</div>
                  <div className="hybrid-token">base: 200ms</div>
                  <div className="hybrid-token">slow: 300ms</div>
                  <div className="hybrid-token">theme: 200ms</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="hybrid-footer">
        <div className="hybrid-wrapper">
          <p className="hybrid-footer-text">
            🎨 Design System Hybride ReveelBox • Light: Sensorial Minimalism • Dark: Refined Depth
          </p>
        </div>
      </footer>
    </div>
  )
}
