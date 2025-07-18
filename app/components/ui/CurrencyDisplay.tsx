import { motion } from 'framer-motion'
import { Coins, Gift, Euro } from 'lucide-react'

interface CurrencyDisplayProps {
  amount: number
  type: 'coins' | 'points' | 'euros'
  showIcon?: boolean
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CurrencyDisplay({ 
  amount, 
  type, 
  showIcon = true, 
  animate = false, 
  size = 'md' 
}: CurrencyDisplayProps) {
  const icons = {
    coins: Coins,
    points: Gift,
    euros: Euro
  }

  const colors = {
    coins: 'text-primary-600',
    points: 'text-purple-600',
    euros: 'text-green-600'
  }

  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }

  const Icon = icons[type]
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount)

  const component = (
    <div className={`flex items-center space-x-1 ${colors[type]} ${sizes[size]}`}>
      {showIcon && <Icon size={size === 'lg' ? 24 : size === 'md' ? 20 : 16} />}
      <span className="font-semibold">{formattedAmount}</span>
    </div>
  )

  if (animate) {
    return (
      <motion.div
        key={amount}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {component}
      </motion.div>
    )
  }

  return component
}