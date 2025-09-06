import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, CheckCircle2, Loader2, X, ArrowUp, ArrowDown, 
  LucideIcon 
} from 'lucide-react';

// Card Component
interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  [key: string]: any;
}

export const Card = ({ children, className = '', gradient = false, ...props }: CardProps) => (	
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 ${gradient ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' : ''} ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

// Button Component
interface ButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  [key: string]: any;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  loading = false,
  className = '',
  disabled = false,
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl',
    warning: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
  };
  
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`${variants[variant]} ${sizes[size]} rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {Icon && !loading && <Icon size={16} />}
      {children}
    </motion.button>
  );
};

// Input Component
interface InputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
}

export const Input = ({ 
  label, 
  icon: Icon,
  error,
  className = '',
  ...props 
}: InputProps) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <Icon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      )}
      <input
        className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-200 ${error ? 'border-red-300 dark:border-red-600' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
      >
        <AlertCircle size={16} />
        {error}
      </motion.p>
    )}
  </div>
);

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Toast Component
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => (
  <motion.div
    initial={{ opacity: 0, x: 300 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 300 }}
    className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 ${
      type === 'success' 
        ? 'bg-green-100 border border-green-200 text-green-800' 
        : type === 'error'
        ? 'bg-red-100 border border-red-200 text-red-800'
        : 'bg-blue-100 border border-blue-200 text-blue-800'
    }`}
  >
    {type === 'success' && <CheckCircle2 size={20} />}
    {type === 'error' && <AlertCircle size={20} />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70">
      <X size={16} />
    </button>
  </motion.div>
);

// StatsCard Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'gray';
}

export const StatsCard = ({ title, value, change, icon: Icon, color = 'green' }: StatsCardProps) => {
  const colors = {
    green: 'from-green-400 to-emerald-500',
    blue: 'from-blue-400 to-indigo-500',
    purple: 'from-purple-400 to-pink-500',
    orange: 'from-orange-400 to-red-500',
    gray: 'from-gray-400 to-slate-500'
  };

  return (
    <Card className="p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg`}>
            <Icon size={24} />
          </div>
          {change !== undefined && (
            <div className="text-right">
              <span className={`text-sm font-semibold flex items-center gap-1 ${
                change > 0 ? 'text-green-600 dark:text-green-400' : 
                change < 0 ? 'text-red-600 dark:text-red-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {change > 0 ? <ArrowUp size={14} /> : change < 0 ? <ArrowDown size={14} /> : null}
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
      </div>
    </Card>
  );
};