/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs principales ReveelBox
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
        
        // Gris système
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

        // États et feedback
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',

        // Raretés avec thème clair (depuis votre code)
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
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'primary': '0 4px 15px rgba(34, 197, 94, 0.3)',
        'primary-lg': '0 6px 20px rgba(34, 197, 94, 0.4)',
      },

      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'pulse-soft': 'pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },

      keyframes: {
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
        }
      },

      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #86efac 0%, #22c55e 100%)',
        'gradient-surface': 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      }
    },
  },
  plugins: [],
}