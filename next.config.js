// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuration spécifique pour Framer Motion
  experimental: {
    optimizePackageImports: ['framer-motion']
  },
  
  // Transpiler les packages ESM
  transpilePackages: ['framer-motion'],
  
  // Configuration du compilateur
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Configuration Webpack optimisée
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
    
    // Optimisation des modules
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto'
    })
    
    return config
  },
  
  // Configuration des images (si nécessaire)
  images: {
    domains: ['i.imgur.com', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.imgur.com',
        port: '',
        pathname: '/**',
      },
    ],
  }
}

module.exports = nextConfig