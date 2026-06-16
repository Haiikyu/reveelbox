'use client'

import { createContext, useContext, useState } from 'react'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'

interface AuthModalContextType {
  openLoginModal: () => void
  openSignupModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)

  return (
    <AuthModalContext.Provider value={{
      openLoginModal: () => setIsLoginOpen(true),
      openSignupModal: () => setIsSignupOpen(true),
    }}>
      {children}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignup={() => { setIsLoginOpen(false); setIsSignupOpen(true) }}
      />
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSwitchToLogin={() => { setIsSignupOpen(false); setIsLoginOpen(true) }}
      />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider')
  return context
}
