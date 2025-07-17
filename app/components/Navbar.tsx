// app/components/Navbar.tsx
'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { Package, User, LogOut, ShoppingBag } from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-green-500" />
            <span className="text-xl font-semibold text-gray-900">ReveelBox</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/boxes" 
              className="text-gray-600 hover:text-green-600 transition-colors flex items-center space-x-1"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Boutique</span>
            </Link>

            {user ? (
              <>
                <Link 
                  href="/inventory" 
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  Inventaire
                </Link>

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {profile?.virtual_currency || 0} coins
                  </span>

                  <button
                    onClick={signOut}
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}