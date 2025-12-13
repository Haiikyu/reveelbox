/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // ✅ Configuration spécifique pour Framer Motion
  experimental: {
    optimizePackageImports: ['framer-motion']
  },
  
  // ✅ Transpiler les packages ESM
  transpilePackages: ['framer-motion'],
  
  // ✅ Configuration du compilateur
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // ✅ Configuration Webpack optimisée pour éviter les erreurs ENOENT
  webpack: (config, { dev, isServer }) => {
    // Optimisations pour le développement
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      }
    }
    
    // ✅ CORRECTION POUR ERREUR routes-manifest.json
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname
    }
    
    // Optimisation des modules
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto'
    })
    
    return config
  },
  
  // ✅ Configuration des images (domaines autorisés)
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.stockx.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
  
  // ✅ Configuration TypeScript stricte
  typescript: {
    // En développement, on peut ignorer temporairement
    ignoreBuildErrors: process.env.NODE_ENV === 'development'
  },
  
  // ✅ Configuration pour éviter les erreurs de manifest
  generateBuildId: async () => {
    return 'reveelbox-build-' + Date.now()
  }
}

module.exports = nextConfig