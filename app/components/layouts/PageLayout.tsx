'use client'

import { motion } from 'framer-motion'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  breadcrumb?: { label: string; href?: string }[]
  className?: string
}

export function PageLayout({ children, title, subtitle, breadcrumb, className = '' }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header Section */}
      {(title || breadcrumb) && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {breadcrumb && (
              <nav className="mb-4">
                <ol className="flex items-center space-x-2 text-sm">
                  {breadcrumb.map((item, index) => (
                    <li key={index} className="flex items-center">
                      {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                      {item.href ? (
                        <a href={item.href} className="text-primary-600 hover:text-primary-700">
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-gray-500">{item.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            
            {title && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                {subtitle && (
                  <p className="text-lg text-gray-600">{subtitle}</p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}