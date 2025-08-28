import Link from 'next/link'
import { Gift } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-8">
          {/* Top section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
            {/* Logo and description */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">REVEELBOX</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-md transition-colors">
                L'expérience d'unboxing révolutionnaire avec de vrais produits premium livrés chez vous.
              </p>
            </div>
            
            {/* Newsletter signup */}
            <div className="flex flex-col space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white transition-colors">Restez informé</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                />
                <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-r-xl hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium">
                  S'abonner
                </button>
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 transition-colors">Produits</h5>
              <ul className="space-y-2">
                <li>
                  <Link href="/boxes" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Unboxing
                  </Link>
                </li>
                <li>
                  <Link href="/battles" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Battles
                  </Link>
                </li>
                <li>
                  <Link href="/games" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Games
                  </Link>
                </li>
                <li>
                  <Link href="/freedrop" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Free Drop
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 transition-colors">Support</h5>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Livraison
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 transition-colors">Légal</h5>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 transition-colors">Suivez-nous</h5>
              <div className="flex space-x-3">
                <div className="h-8 w-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-green-500 hover:text-green-600 dark:hover:border-green-400 dark:hover:text-green-400 text-gray-700 dark:text-gray-300 transition-all cursor-pointer">
                  <span className="text-xs font-bold">IG</span>
                </div>
                <div className="h-8 w-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-green-500 hover:text-green-600 dark:hover:border-green-400 dark:hover:text-green-400 text-gray-700 dark:text-gray-300 transition-all cursor-pointer">
                  <span className="text-xs font-bold">TW</span>
                </div>
                <div className="h-8 w-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-green-500 hover:text-green-600 dark:hover:border-green-400 dark:hover:text-green-400 text-gray-700 dark:text-gray-300 transition-all cursor-pointer">
                  <span className="text-xs font-bold">DC</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom section */}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-6 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 transition-colors">
            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
              © 2024 ReveelBox. Tous droits réservés.
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 transition-colors">
              <span>Fait avec ❤️ en France</span>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 transition-colors"></div>
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}