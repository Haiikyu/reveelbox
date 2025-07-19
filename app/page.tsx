'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  Gift, 
  Package, 
  Truck, 
  Shield, 
  Star, 
  Play,
  ArrowRight,
  CheckCircle,
  Users,
  Trophy,
  Sparkles,
  Heart
} from 'lucide-react'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const supabase = createClientComponentClient()

  // Refs pour animations
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const statsRef = useRef(null)
  const ctaRef = useRef(null)

  const heroInView = useInView(heroRef, { once: true })
  const featuresInView = useInView(featuresRef, { once: true })
  const statsInView = useInView(statsRef, { once: true })
  const ctaInView = useInView(ctaRef, { once: true })

  // Check auth state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  }

  const features = [
    {
      icon: Gift,
      title: "Objets Réels",
      description: "Chaque boîte contient de vrais produits premium livrés directement chez vous"
    },
    {
      icon: Truck,
      title: "Livraison Rapide",
      description: "Expédition sous 24h et suivi en temps réel de votre commande"
    },
    {
      icon: Shield,
      title: "Garanti Authentique",
      description: "Tous nos produits sont 100% authentiques et vérifiés par nos experts"
    },
    {
      icon: Sparkles,
      title: "Expérience Unique",
      description: "Animations immersives et surprises exclusives à chaque ouverture"
    }
  ]

  const stats = [
    { number: "50K+", label: "Boîtes ouvertes", icon: Package },
    { number: "15K+", label: "Utilisateurs actifs", icon: Users },
    { number: "98%", label: "Satisfaction", icon: Heart },
    { number: "4.9★", label: "Note moyenne", icon: Star }
  ]

  const testimonials = [
    {
      name: "Alex M.",
      comment: "J'ai reçu des sneakers incroyables ! La surprise était totale.",
      rating: 5,
      avatar: "/api/placeholder/40/40"
    },
    {
      name: "Sarah L.",
      comment: "Livraison ultra rapide et produits de qualité premium.",
      rating: 5,
      avatar: "/api/placeholder/40/40"
    },
    {
      name: "Tom R.", 
      comment: "L'animation d'ouverture est dingue, vraiment addictif !",
      rating: 5,
      avatar: "/api/placeholder/40/40"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-20 pb-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            className="text-center"
          >
            <motion.div
              variants={itemVariants}
              className="flex justify-center mb-8"
            >
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Nouveau : Boîtes exclusives disponibles
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Déballez la
              <span className="block bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                Surprise
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Découvrez l'excitation de l'unboxing avec des produits réels premium. 
              Chaque boîte est une aventure unique qui vous sera livrée directement chez vous.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link
                href={user ? "/boxes" : "/signup"}
                className="group bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <Gift className="h-5 w-5" />
                {user ? "Découvrir les boîtes" : "Commencer maintenant"}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button className="group flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors px-6 py-4">
                <div className="h-12 w-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center group-hover:border-green-300 transition-colors">
                  <Play className="h-5 w-5 ml-1" />
                </div>
                <span className="font-medium">Voir la démo</span>
              </button>
            </motion.div>

            {/* Hero Image/Animation */}
            <motion.div
              variants={itemVariants}
              className="relative max-w-5xl mx-auto"
            >
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Sneaker Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                      {/* Badge populaire */}
                      <div className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                        % POPULAIRE
                      </div>
                      
                      {/* Contenu de la boîte */}
                      <div className="relative z-10 mt-8">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-8 h-8 bg-red-500 rounded transform rotate-12"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-8 h-8 bg-white rounded transform -rotate-12"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-8 h-8 bg-gray-300 rounded transform rotate-45"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-8 h-8 bg-blue-400 rounded transform -rotate-45"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center text-white">
                          <h3 className="font-bold text-lg mb-1">SNEAKER BOX</h3>
                          <p className="text-blue-100 text-sm mb-3">Premium Sneakers Collection</p>
                          <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                            <span className="font-bold">150</span>
                            <span className="text-blue-100 ml-1">coins</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Effet de brillance au hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
                    </div>
                  </motion.div>

                  {/* Tech Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                      <div className="relative z-10 mt-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-gray-800 rounded-sm"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-8 h-4 bg-white rounded-full"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-blue-400 rounded"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-8 h-2 bg-green-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center text-white">
                          <h3 className="font-bold text-lg mb-1">TECH BOX</h3>
                          <p className="text-purple-100 text-sm mb-3">Latest Gadgets & Electronics</p>
                          <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                            <span className="font-bold">200</span>
                            <span className="text-purple-100 ml-1">coins</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
                    </div>
                  </motion.div>

                  {/* Fashion Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                      <div className="relative z-10 mt-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-8 bg-black rounded-t-full"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-8 h-6 bg-white rounded-full"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-red-400 rounded-full"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-4 h-8 bg-yellow-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center text-white">
                          <h3 className="font-bold text-lg mb-1">FASHION BOX</h3>
                          <p className="text-pink-100 text-sm mb-3">Trendy Accessories & Style</p>
                          <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                            <span className="font-bold">120</span>
                            <span className="text-pink-100 ml-1">coins</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
                    </div>
                  </motion.div>

                  {/* Luxury Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                      <div className="relative z-10 mt-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-yellow-300 rounded-full"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-8 h-4 bg-white rounded-full"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-orange-400 rounded"></div>
                            </div>
                            <div className="aspect-square bg-white/30 rounded-lg flex items-center justify-center">
                              <div className="w-4 h-8 bg-red-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center text-white">
                          <h3 className="font-bold text-lg mb-1">LUXURY BOX</h3>
                          <p className="text-yellow-100 text-sm mb-3">Exclusive Premium Items</p>
                          <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                            <span className="font-bold">500</span>
                            <span className="text-yellow-100 ml-1">coins</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Pourquoi choisir ReveelBox ?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Une expérience d'unboxing révolutionnaire avec des garanties uniques
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center group"
                >
                  <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-green-500 mr-2" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez leurs expériences ReveelBox
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-2xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {testimonial.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-20 bg-gradient-to-br from-green-500 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Prêt pour votre première surprise ?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-green-100 mb-8 max-w-2xl mx-auto"
            >
              Rejoignez des milliers d'utilisateurs qui découvrent déjà l'excitation de ReveelBox
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href={user ? "/boxes" : "/signup"}
                className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <Gift className="h-5 w-5" />
                {user ? "Ouvrir une boîte" : "Créer mon compte"}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-600 transition-all duration-300"
                >
                  J'ai déjà un compte
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">REVEELBOX</span>
            </div>
            
            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <Link href="/boxes" className="hover:text-white transition-colors">
                Loot Boxes
              </Link>
              <Link href="/battles" className="hover:text-white transition-colors">
                Battles
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Conditions
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
            </div>
            
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              © 2024 ReveelBox
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}