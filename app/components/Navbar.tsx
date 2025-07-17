// app/components/Navbar.js
'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { Coins, Package, User, LogOut, ShoppingBag, History } from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="bg-gray-900/50 backdrop-blur-md border-b border-purple-500/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold text-white">LootBox Paradise</span>
          </Link>

          {/* Navigation principale */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/boxes" 
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Boutique</span>
            </Link>

            {user && (
              <>
                <Link 
                  href="/inventory" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <Package className="w-4 h-4" />
                  <span>Inventaire</span>
                </Link>

                <Link 
                  href="/history" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <History className="w-4 h-4" />
                  <span>Historique</span>
                </Link>
              </>
            )}
          </div>

          {/* Section utilisateur */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Solde de monnaie virtuelle */}
                <div className="flex items-center space-x-2 bg-yellow-500/20 px-3 py-1.5 rounded-lg">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-500 font-semibold">
                    {profile?.virtual_currency || 0}
                  </span>
                </div>

                {/* Menu utilisateur */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                    <User className="w-5 h-5" />
                    <span>{profile?.username || user.email}</span>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-t-lg"
                    >
                      Mon profil
                    </Link>
                    <Link 
                      href="/buy-coins" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Acheter des coins
                    </Link>
                    <button 
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-b-lg flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>

                {/* Points de fidélité */}
                <div className="text-sm text-purple-400">
                  {profile?.loyalty_points || 0} pts
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Connexion
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}