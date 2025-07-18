import { motion } from 'framer-motion'

interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingState({ size = 'md', text }: LoadingStateProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} border-4 border-gray-200 border-t-primary-500 rounded-full`}
      />
      {text && (
        <p className="mt-4 text-gray-600 text-center">{text}</p>
      )}
    </div>
  )
}