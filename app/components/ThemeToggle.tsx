// app/components/ThemeToggle.tsx
'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showSystemOption?: boolean
  variant?: 'button' | 'dropdown'
}

export function ThemeToggle({ 
  className = '', 
  size = 'md', 
  showSystemOption = false,
  variant = 'button'
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8 p-1.5'
      case 'lg': return 'w-14 h-14 p-3'
      default: return 'w-10 h-10 p-2'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16
      case 'lg': return 24
      default: return 20
    }
  }

  // Version simple toggle light/dark
  if (variant === 'button' && !showSystemOption) {
    const toggleTheme = () => {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    return (
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          ${getSizeClasses()}
          surface-elevated
          rounded-full 
          shadow-lg hover:shadow-xl 
          transition-all duration-300
          flex items-center justify-center
          relative overflow-hidden
          ${className}
        `}
        title={resolvedTheme === 'dark' ? 'Basculer vers le mode clair' : 'Basculer vers le mode sombre'}
      >
        {/* Background animé */}
        <motion.div
          animate={{
            scale: resolvedTheme === 'dark' ? 1 : 0,
            opacity: resolvedTheme === 'dark' ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 rounded-full"
        />
        
        <motion.div
          animate={{
            scale: resolvedTheme === 'light' ? 1 : 0,
            opacity: resolvedTheme === 'light' ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full"
        />

        {/* Icônes */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {resolvedTheme === 'dark' ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Moon size={getIconSize()} className="text-gray-300" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Sun size={getIconSize()} className="text-gray-800" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Particules animées */}
        <AnimatePresence>
          <motion.div
            key={resolvedTheme}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {resolvedTheme === 'dark' ? (
              // Étoiles pour le mode sombre
              <div className="relative w-full h-full">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      x: [0, Math.random() * 20 - 10],
                      y: [0, Math.random() * 20 - 10]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: i * 0.2,
                      ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full"
                  />
                ))}
              </div>
            ) : (
              // Rayons pour le mode clair
              <div className="relative w-full h-full">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: i * 60 }}
                    animate={{ 
                      scale: [0, 1.5, 0],
                      rotate: i * 60 + 30
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: i * 0.05,
                      ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-orange-300 origin-bottom"
                    style={{
                      transform: `translate(-50%, -100%) rotate(${i * 60}deg)`
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    )
  }

  // Version dropdown avec option système
  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          ${getSizeClasses()}
          surface-elevated
          rounded-full 
          shadow-lg hover:shadow-xl 
          transition-all duration-300
          flex items-center justify-center
          relative
        `}
      >
        <AnimatePresence mode="wait">
          {resolvedTheme === 'dark' ? (
            <Moon key="moon" size={getIconSize()} className="text-primary" />
          ) : (
            <Sun key="sun" size={getIconSize()} className="text-primary" />
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 surface-elevated rounded-xl shadow-xl py-2 min-w-[150px] z-50"
          >
            <button
              onClick={() => {
                setTheme('light')
                setIsDropdownOpen(false)
              }}
              className={`w-full px-4 py-2 text-left hover:bg-[rgb(var(--surface))] flex items-center gap-3 text-primary transition-colors ${
                theme === 'light' ? 'state-success' : ''
              }`}
            >
              <Sun size={16} />
              Clair
            </button>
            <button
              onClick={() => {
                setTheme('dark')
                setIsDropdownOpen(false)
              }}
              className={`w-full px-4 py-2 text-left hover:bg-[rgb(var(--surface))] flex items-center gap-3 text-primary transition-colors ${
                theme === 'dark' ? 'state-success' : ''
              }`}
            >
              <Moon size={16} />
              Sombre
            </button>
            {showSystemOption && (
              <button
                onClick={() => {
                  setTheme('system')
                  setIsDropdownOpen(false)
                }}
                className={`w-full px-4 py-2 text-left hover:bg-[rgb(var(--surface))] flex items-center gap-3 text-primary transition-colors ${
                  theme === 'system' ? 'state-success' : ''
                }`}
              >
                <Monitor size={16} />
                Système
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}