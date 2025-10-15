/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Activation du mode sombre par classe
  theme: {
    extend: {
      colors: {
        // Couleurs utilisant les variables CSS du système de thème
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--primary-dark) / <alpha-value>)',
        'primary-light': 'rgb(var(--primary-light) / <alpha-value>)',
        
        // Surfaces et backgrounds
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        
        // Bordures
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-hover': 'rgb(var(--border-hover) / <alpha-value>)',
        
        // Textes
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--text-secondary) / <alpha-value>)', // Alias pour text-secondary
        muted: 'rgb(var(--text-muted) / <alpha-value>)', // Alias pour text-muted
        
        // États
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        
        // Raretés
        'rarity-common': 'rgb(var(--rarity-common) / <alpha-value>)',
        'rarity-rare': 'rgb(var(--rarity-rare) / <alpha-value>)',
        'rarity-epic': 'rgb(var(--rarity-epic) / <alpha-value>)',
        'rarity-legendary': 'rgb(var(--rarity-legendary) / <alpha-value>)',
        
        // Couleurs ReveelBox conservées (palette étendue)
        primary: {
          50: '#f0fdf4',   // Très clair
          100: '#dcfce7',  // Clair
          200: '#bbf7d0',  // 
          300: '#86efac',  // 
          400: '#4ade80',  // 
          500: '#22c55e',  // Principal (actuel)
          600: '#16a34a',  // Foncé (actuel primary-dark)
          700: '#15803d',  // Plus foncé
          800: '#166534',  // Très foncé
          900: '#14532d',  // Le plus foncé
        },
        
        // Gris système conservé
        gray: {
          50: '#f9fafb',   // bg-surface actuel
          100: '#f3f4f6',
          200: '#e5e7eb',  // border-color actuel
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',  // text-secondary actuel
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',  // text-primary actuel
          900: '#111827',
        },

        // Raretés avec thème clair conservées (compatibilité)
        rarity: {
          common: {
            bg: '#f3f4f6',
            border: '#9ca3af',
            text: '#6b7280'
          },
          rare: {
            bg: '#dbeafe',
            border: '#3b82f6',
            text: '#1d4ed8'
          },
          epic: {
            bg: '#e9d5ff',
            border: '#9333ea',
            text: '#7c3aed'
          },
          legendary: {
            bg: '#fef3c7',
            border: '#f59e0b',
            text: '#d97706'
          }
        }
      },

      boxShadow: {
        // Ombres existantes conservées
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'primary': '0 4px 15px rgba(34, 197, 94, 0.3)',
        'primary-lg': '0 6px 20px rgba(34, 197, 94, 0.4)',
        
        // Nouvelles ombres avec variables CSS
        'theme': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'theme-md': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'theme-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },

      animation: {
        // Animations existantes conservées
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'pulse-soft': 'pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',

        // Nouvelles animations pour le thème
        'theme-transition': 'theme-transition 0.3s ease',

        // Animations pour le profil
        'spin-slow': 'spin 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },

      keyframes: {
        // Keyframes existantes conservées
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },

        // Nouvelle keyframe pour les transitions de thème
        'theme-transition': {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '1' }
        },

        // Keyframes pour le profil
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.8)' }
        }
      },

      backgroundImage: {
        // Gradients existants conservés
        'gradient-primary': 'linear-gradient(135deg, #86efac 0%, #22c55e 100%)',
        'gradient-surface': 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',

        // Nouveaux gradients avec variables CSS
        'gradient-theme-primary': 'linear-gradient(135deg, rgb(var(--primary-light) / 0.1) 0%, rgb(var(--primary) / 0.05) 100%)',
        'gradient-theme-surface': 'linear-gradient(135deg, rgb(var(--surface)) 0%, rgb(var(--surface-elevated)) 100%)',
      },

      // 3D perspective for upgrade animations
      perspective: {
        '1000': '1000px',
        '2000': '2000px',
      }
    },
  },
  plugins: [
    // Plugin pour les classes utilitaires personnalisées avec système de thème
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Classes de conteneur
        '.container-reveelbox': {
          maxWidth: theme('maxWidth.7xl'),
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },
        
        // Surfaces avec système de thème
        '.surface': {
          backgroundColor: 'rgb(var(--surface))',
          border: '1px solid rgb(var(--border))',
        },
        '.surface-elevated': {
          backgroundColor: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border))',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        
        // Textes avec système de thème
        '.text-primary': {
          color: 'rgb(var(--text-primary))',
        },
        '.text-secondary': {
          color: 'rgb(var(--text-secondary))',
        },
        '.text-muted': {
          color: 'rgb(var(--text-muted))',
        },
        
        // États avec système de thème
        '.state-success': {
          color: 'rgb(var(--success))',
          backgroundColor: 'rgb(var(--success) / 0.1)',
          borderColor: 'rgb(var(--success) / 0.3)',
        },
        '.state-warning': {
          color: 'rgb(var(--warning))',
          backgroundColor: 'rgb(var(--warning) / 0.1)',
          borderColor: 'rgb(var(--warning) / 0.3)',
        },
        '.state-error': {
          color: 'rgb(var(--error))',
          backgroundColor: 'rgb(var(--error) / 0.1)',
          borderColor: 'rgb(var(--error) / 0.3)',
        },
        '.state-info': {
          color: 'rgb(var(--info))',
          backgroundColor: 'rgb(var(--info) / 0.1)',
          borderColor: 'rgb(var(--info) / 0.3)',
        },
        
        // Boutons avec système de thème
        '.btn-primary': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.xl'),
          fontWeight: theme('fontWeight.semibold'),
          backgroundColor: 'rgb(var(--primary))',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgb(var(--primary-dark))',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
        },
        '.btn-secondary': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.xl'),
          fontWeight: theme('fontWeight.semibold'),
          backgroundColor: 'rgb(var(--surface-elevated))',
          color: 'rgb(var(--text-primary))',
          border: '1px solid rgb(var(--border))',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'rgb(var(--border-hover))',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
        },
        
        // Cards avec système de thème
        '.card': {
          borderRadius: theme('borderRadius.2xl'),
          padding: theme('spacing.6'),
          backgroundColor: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border))',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
        
        // Gradients avec système de thème
        '.bg-gradient-primary': {
          background: 'linear-gradient(135deg, rgb(var(--primary-light) / 0.1) 0%, rgb(var(--primary) / 0.05) 100%)',
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, rgb(var(--primary-dark)) 0%, rgb(var(--primary)) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
      }
      
      addUtilities(newUtilities)
    },
  ],
}