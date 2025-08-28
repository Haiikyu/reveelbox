'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Package, Image, Percent, Save, X, AlertCircle, 
  CheckCircle2, Loader2, Home, Star, Eye, EyeOff, Edit, Upload, 
  Moon, Sun, Monitor, Settings, TrendingUp, Users, DollarSign,
  Search, Filter, SortAsc, SortDesc, MoreHorizontal, Copy,
  GripVertical, ArrowUp, ArrowDown, BarChart3, PieChart,
  Calendar, Clock, Target, Zap, Palette, Layout, DatabaseIcon,
  Bell, Shield, Activity, Download, RefreshCw, UserCheck,
  Mail, FileText, CreditCard, ShoppingCart, Award, MapPin, LucideIcon
} from 'lucide-react';

// Supabase integration avec VRAIE clé API
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/types/database';

// Types
type LootBox = Database['public']['Tables']['loot_boxes']['Row'];
type Item = Database['public']['Tables']['items']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type BoxItem = Database['public']['Tables']['loot_box_items']['Row'] & {
  items?: Item | null;  // Accepte null
};

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  profiles?: { username?: string | null } | null;  // Accepte null
};

// Types pour les formulaires (gardez ceux-ci)
type BoxForm = {
  name: string;
  description: string;
  image_url: string;
  price_virtual: string;
  is_active: boolean;
  is_daily_free: boolean;
  is_featured: boolean;
};

type ItemForm = {
  name: string;
  description: string;
  image_url: string;
  market_value: string;
  rarity: string;
};

type BoxItemForm = {
  item_id: string;
  probability: string;
  display_order: string;  // ✅ Changer de number à string
};


type Toast = {
  message: string;
  type: 'success' | 'error' | 'info';
};


type Errors = {
  [key: string]: string;
};

type ThemeContextType = {
  theme: string;
  toggleTheme: () => void;
};

// REMPLACEZ PAR VOTRE VRAIE CLÉ API
const supabase = createClient<Database>(
  'https://pkweofbyzygbbkervpbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrd2VvZmJ5enlnYmJrZXJ2cGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQ1NTEsImV4cCI6MjA2ODM0MDU1MX0.ZiNODQ7cHX5QJmlvneEtu24LYmTUmtL3mxrT9qEbTI8'
);

// Theme Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<string>('light');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('reveelbox-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('reveelbox-theme', newTheme);
    document.documentElement.className = newTheme;
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// Utility functions
const formatPrice = (price: number | null | undefined): string => {
  if (!price) return '0,00';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const parseDecimalValue = (value: string | number | null | undefined): number => {
  if (!value) return 0;
  return parseFloat(value.toString().replace(',', '.')) || 0;
};

const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Enhanced UI Components
interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  [key: string]: any;
}

const Card = ({ children, className = '', gradient = false, ...props }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`
      bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700
      hover:shadow-md transition-all duration-300
      ${gradient ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </motion.div>
);

interface ButtonProps {
  children?: ReactNode;  // ✅ Rendre children optionnel
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;  // ✅ Permettre les fonctions async
  [key: string]: any;
}

const Button = ({ 
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
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-xl font-semibold transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2 ${className}
      `}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {Icon && !loading && <Icon size={16} />}
      {children}
    </motion.button>
  );
};

interface InputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
}

const Input = ({ 
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
        className={`
          w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 
          bg-white dark:bg-gray-700 
          border-2 border-gray-200 dark:border-gray-600
          rounded-xl text-gray-900 dark:text-gray-100
          focus:border-green-500 focus:ring-4 focus:ring-green-500/20
          transition-all duration-200
          ${error ? 'border-red-300 dark:border-red-600' : ''}
          ${className}
        `}
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

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
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
            <div className={`
              bg-white dark:bg-gray-800 rounded-2xl shadow-2xl 
              ${sizes[size]} w-full max-h-[90vh] overflow-hidden
              border border-gray-200 dark:border-gray-700
            `}>
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

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="md"
      onClick={toggleTheme}
      className="rounded-full w-10 h-10"
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
};

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => (
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

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'gray';
}

const StatsCard = ({ title, value, change, icon: Icon, color = 'green' }: StatsCardProps) => {
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

interface DragDropItemListProps {
  items: BoxItem[];
  onReorder: (newOrder: BoxItem[]) => void;
  onEdit?: (item: BoxItem) => void;
  onDelete: (itemId: string) => void;
  onUpdateProbability: (itemId: string, probability: number) => Promise<void>;
}

const DragDropItemList = ({ items, onReorder, onEdit, onDelete, onUpdateProbability }: DragDropItemListProps) => {
  const [draggedItems, setDraggedItems] = useState<BoxItem[]>(items);
  const [editingProbability, setEditingProbability] = useState<string | null>(null);
  const [tempProbability, setTempProbability] = useState<string>('');

  useEffect(() => {
    setDraggedItems(items);
  }, [items]);

  const handleReorder = (newOrder: BoxItem[]) => {
    setDraggedItems(newOrder);
    onReorder(newOrder);
  };

const getRarityColor = (rarity: string | null) => {
  const colors = {
    common: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    legendary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  };
  return colors[(rarity || 'common') as keyof typeof colors] || colors.common;
};

  const startEditProbability = (item: BoxItem) => {
    setEditingProbability(item.id);
    setTempProbability(item.probability.toString());
  };

  const saveProbability = async (itemId: string) => {
    const newProbability = parseFloat(tempProbability);
    if (newProbability > 0 && newProbability <= 100) {
      await onUpdateProbability(itemId, newProbability);
      setEditingProbability(null);
      setTempProbability('');
    }
  };

  return (
    <div className="space-y-3">
      <Reorder.Group axis="y" values={draggedItems} onReorder={handleReorder}>
        {draggedItems.map((item, index) => {
          return (
            <Reorder.Item key={item.id} value={item}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 cursor-move hover:border-green-300 dark:hover:border-green-600 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical size={16} />
                    <span className="text-sm font-medium bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-600 shrink-0">
                    <img 
                      src={item.items?.image_url || '/placeholder-item.jpg'} 
                      alt={item.items?.name || 'Item'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkl0ZW08L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.items?.name || 'Item inconnu'}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-2">
                        <Percent size={14} className="text-gray-400" />
                        {editingProbability === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={tempProbability}
                              onChange={(e) => setTempProbability(e.target.value)}
                              className="w-24 px-2 py-1 text-xs border rounded dark:bg-gray-600 dark:border-gray-500"
                              step="0.000001"
                              min="0"
                              max="100"
                            />
                            <Button size="xs" onClick={() => saveProbability(item.id)}>
                              <CheckCircle2 size={12} />
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => setEditingProbability(null)}>
                              <X size={12} />
                            </Button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startEditProbability(item)}
                            className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
                          >
                            {parseFloat(item.probability?.toString() || '0').toFixed(6)}%
                          </button>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatPrice(item.items?.market_value || 0)}€
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getRarityColor(item.items?.rarity || 'common')}`}>
                        {item.items?.rarity || 'common'}
                      </span>
                    </div>
                  </div>
                  
<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
  <Button variant="ghost" size="sm" onClick={() => onEdit && onEdit(item)}>
    <Edit2 className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
                </div>
              </motion.div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
};

// Main Admin Panel Component
const AdvancedAdminPanel = () => {
  const { theme } = useTheme();
  
  // State management
  const [activeTab, setActiveTab] = useState<string>('dashboard');
const [boxes, setBoxes] = useState<LootBox[]>([]);
const [items, setItems] = useState<Item[]>([]);
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
const [selectedBox, setSelectedBox] = useState<LootBox | null>(null);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>('');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states
  const [boxForm, setBoxForm] = useState<BoxForm>({
    name: '',
    description: '',
    image_url: '',
    price_virtual: '100.00',
    is_active: true,
    is_daily_free: false,
    is_featured: false
  });

  const [itemForm, setItemForm] = useState<ItemForm>({
    name: '',
    description: '',
    image_url: '',
    market_value: '10.00',
    rarity: 'common'
  });

const [boxItemForm, setBoxItemForm] = useState<BoxItemForm>({
  item_id: '',
  probability: '',
  display_order: '1'  // ✅ String au lieu de 1
});

  const [errors, setErrors] = useState<Errors>({});

  // Utility functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleError = (error: any, context: string = '') => {
    console.error(`Error ${context}:`, error);
    const message = error.message || 'Une erreur est survenue';
    setErrors({ general: message });
    showToast(message, 'error');
  };

  // Load all data from Supabase
const loadData = async () => {
  setLoading(true);
  try {
    // Load boxes
    const { data: boxesData, error: boxesError } = await supabase
      .from('loot_boxes')
      .select('*')
      .order('created_at', { ascending: false });

    if (boxesError) throw boxesError;
    setBoxes(boxesData || []);

    // Load items
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;
    setItems(itemsData || []);

    // Load box items with item details
    const { data: boxItemsData, error: boxItemsError } = await supabase
      .from('loot_box_items')
      .select(`
        *,
        items(*)
      `)
      .order('display_order', { ascending: true });

    if (boxItemsError) throw boxItemsError;
    
    // ✅ Transformer les nulls en undefined pour BoxItems
    const safeBoxItems = (boxItemsData || []).map(item => ({
      ...item,
      items: item.items || undefined
    }));
    
    setBoxItems(safeBoxItems);

    // Load users
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (usersError) throw usersError;
    setUsers(usersData || []);

    // Load recent transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        profiles(username)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (transactionsError) throw transactionsError;
    
    // ✅ Transformer les nulls en undefined pour Transactions
    const safeTransactions = (transactionsData || []).map(transaction => ({
      ...transaction,
      profiles: transaction.profiles || undefined
    }));
    
    setTransactions(safeTransactions);

    // Calculate stats
    setStats({
      boxes: boxesData?.length || 0,
      items: itemsData?.length || 0,
      users: usersData?.length || 0,
      transactions: transactionsData?.length || 0,
      activeBoxes: boxesData?.filter(b => b.is_active === true).length || 0,
      featuredBoxes: boxesData?.filter(b => b.is_featured === true).length || 0
    });

  } catch (error) {
    handleError(error, 'loading data');
  }
  setLoading(false);
};

  // CRUD Operations
  const createBox = async () => {
    if (submitting) return;
    
    const validationErrors: Errors = {};
    if (!boxForm.name.trim()) validationErrors.name = 'Le nom est requis';
    if (!boxForm.image_url.trim()) validationErrors.image_url = 'L\'image est requise';
    if (!boxForm.price_virtual || parseFloat(boxForm.price_virtual) < 0) {
      validationErrors.price_virtual = 'Le prix doit être positif';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('loot_boxes')
        .insert([{
          name: boxForm.name.trim(),
          description: boxForm.description?.trim() || null,
          image_url: boxForm.image_url.trim(),
          price_virtual: parseFloat(boxForm.price_virtual) || 100,
          is_active: boxForm.is_active,
          is_daily_free: boxForm.is_daily_free,
          is_featured: boxForm.is_featured
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadData();
      closeModal();
      showToast('Box créée avec succès');
    } catch (error) {
      handleError(error, 'creating box');
    } finally {
      setSubmitting(false);
    }
  };

  const updateBox = async () => {
    if (!selectedBox || submitting) return;
    
    const validationErrors: Errors = {};
    if (!boxForm.name.trim()) validationErrors.name = 'Le nom est requis';
    if (!boxForm.image_url.trim()) validationErrors.image_url = 'L\'image est requise';
    if (!boxForm.price_virtual || parseFloat(boxForm.price_virtual) < 0) {
      validationErrors.price_virtual = 'Le prix doit être positif';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('loot_boxes')
        .update({
          name: boxForm.name.trim(),
          description: boxForm.description?.trim() || null,
          image_url: boxForm.image_url.trim(),
          price_virtual: parseFloat(boxForm.price_virtual) || 100,
          is_active: boxForm.is_active,
          is_daily_free: boxForm.is_daily_free,
          is_featured: boxForm.is_featured
        })
        .eq('id', selectedBox.id);

      if (error) throw error;

      await loadData();
      closeModal();
      showToast('Box mise à jour avec succès');
    } catch (error) {
      handleError(error, 'updating box');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBox = async (boxId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette box ?')) return;

    try {
      const { error } = await supabase
        .from('loot_boxes')
        .delete()
        .eq('id', boxId);

      if (error) throw error;

      await loadData();
      showToast('Box supprimée avec succès');
    } catch (error) {
      handleError(error, 'deleting box');
    }
  };

  const createItem = async () => {
    if (submitting) return;
    
    const validationErrors: Errors = {};
    if (!itemForm.name.trim()) validationErrors.name = 'Le nom est requis';
    if (!itemForm.image_url.trim()) validationErrors.image_url = 'L\'image est requise';
    if (!itemForm.market_value || parseFloat(itemForm.market_value) < 0) {
      validationErrors.market_value = 'La valeur doit être positive';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('items')
        .insert([{
          name: itemForm.name.trim(),
          description: itemForm.description?.trim() || null,
          image_url: itemForm.image_url.trim(),
          market_value: parseFloat(itemForm.market_value) || 10,
          rarity: itemForm.rarity
        }]);

      if (error) throw error;

      await loadData();
      closeModal();
      showToast('Item créé avec succès');
    } catch (error) {
      handleError(error, 'creating item');
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = async () => {
    if (!selectedItem || submitting) return;
    
    const validationErrors: Errors = {};
    if (!itemForm.name.trim()) validationErrors.name = 'Le nom est requis';
    if (!itemForm.image_url.trim()) validationErrors.image_url = 'L\'image est requise';
    if (!itemForm.market_value || parseFloat(itemForm.market_value) < 0) {
      validationErrors.market_value = 'La valeur doit être positive';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({
          name: itemForm.name.trim(),
          description: itemForm.description?.trim() || null,
          image_url: itemForm.image_url.trim(),
          market_value: parseFloat(itemForm.market_value) || 10,
          rarity: itemForm.rarity
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      await loadData();
      closeModal();
      showToast('Item mis à jour avec succès');
    } catch (error) {
      handleError(error, 'updating item');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await loadData();
      showToast('Item supprimé avec succès');
    } catch (error) {
      handleError(error, 'deleting item');
    }
  };
  
const addItemToBox = async () => {
  if (!selectedBox || submitting) return;
    
    const validationErrors: Errors = {};
    if (!boxItemForm.item_id) validationErrors.item_id = 'Sélectionnez un item';
    const probability = parseFloat(boxItemForm.probability);
    if (!boxItemForm.probability || probability <= 0 || probability > 100) {
      validationErrors.probability = 'Le pourcentage doit être entre 0.000001 et 100';
    }
    
    // Vérifier le total des probabilités
    const currentTotal = getTotalDropRate(selectedBox.id);
    if (currentTotal + probability > 100) {
      validationErrors.probability = `Le total dépasserait 100% (actuellement ${currentTotal.toFixed(6)}%)`;
    }
    
    // Vérifier les doublons
    const existingItem = boxItems.find(bi => 
      bi.loot_box_id === selectedBox.id && bi.item_id === boxItemForm.item_id
    );
    if (existingItem) {
      validationErrors.item_id = 'Cet item est déjà dans la box';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
  setSubmitting(true);
  try {
const { error } = await supabase
  .from('loot_box_items')
  .insert([{
    loot_box_id: selectedBox.id,
    item_id: boxItemForm.item_id,
    probability: probability,
    display_order: parseInt(boxItemForm.display_order) || getBoxItems(selectedBox.id).length + 1
  }]);

    if (error) throw error;

    await loadData();
    setBoxItemForm({ item_id: '', probability: '', display_order: '1' });  // ✅ Reset avec string
    setErrors({});
    showToast('Item ajouté à la box');
  } catch (error) {
    handleError(error, 'adding item to box');
  } finally {
    setSubmitting(false);
  }
};

  const updateBoxItemProbability = async (boxItemId: string, newProbability: number) => {
    try {
      const { error } = await supabase
        .from('loot_box_items')
        .update({ probability: newProbability })
        .eq('id', boxItemId);

      if (error) throw error;

      await loadData();
      showToast('Probabilité mise à jour');
    } catch (error) {
      handleError(error, 'updating probability');
    }
  };

  const deleteBoxItem = async (boxItemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet item de la box ?')) return;

    try {
      const { error } = await supabase
        .from('loot_box_items')
        .delete()
        .eq('id', boxItemId);

      if (error) throw error;

      await loadData();
      showToast('Item retiré de la box');
    } catch (error) {
      handleError(error, 'deleting box item');
    }
  };

  const updateItemOrder = async (boxId: string, newOrder: BoxItem[]) => {
    try {
      const updates = newOrder.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('loot_box_items')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      await loadData();
    } catch (error) {
      handleError(error, 'updating item order');
    }
  };

  // Utility functions
const openModal = (type: string, data?: LootBox | Item | null) => {
  setModalType(type);
  setShowModal(true);
  setErrors({});
  
  if (data) {
    if (type === 'editBox') {
      // Type guard pour s'assurer que c'est une LootBox
      const boxData = data as LootBox;
      setSelectedBox(boxData);
      setBoxForm({
        name: boxData.name,
        description: boxData.description || '',
        image_url: boxData.image_url || '',
        price_virtual: (boxData.price_virtual || 100).toString(),
        is_active: boxData.is_active ?? true,
        is_daily_free: boxData.is_daily_free ?? false,
        is_featured: boxData.is_featured ?? false
      });
    } else if (type === 'editItem') {
      // Type guard pour s'assurer que c'est un Item
      const itemData = data as Item;
      setSelectedItem(itemData);
      setItemForm({
        name: itemData.name,
        description: itemData.description || '',
        image_url: itemData.image_url || '',
        market_value: (itemData.market_value || 10).toString(),
        rarity: itemData.rarity
      });
    } else if (type === 'manageItems') {
      const boxData = data as LootBox;
      setSelectedBox(boxData);
    }
  }
};

const closeModal = () => {
  setShowModal(false);
  setSelectedBox(null);
  setSelectedItem(null);
  setErrors({});
  setBoxForm({
    name: '',
    description: '',
    image_url: '',
    price_virtual: '100.00',
    is_active: true,
    is_daily_free: false,
    is_featured: false
  });
  setItemForm({
    name: '',
    description: '',
    image_url: '',
    market_value: '10.00',
    rarity: 'common'
  });
  setBoxItemForm({
    item_id: '',
    probability: '',
    display_order: '1'  // ✅ String
  });
};

  const getBoxItems = (boxId: string): BoxItem[] => {
    return boxItems
      .filter(bi => bi.loot_box_id === boxId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  const getTotalDropRate = (boxId: string): number => {
    return boxItems
      .filter(bi => bi.loot_box_id === boxId)
      .reduce((total, bi) => total + (parseFloat(bi.probability?.toString() || '0') || 0), 0);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    showToast('Données actualisées');
  };

  const exportData = async (type: string) => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'boxes':
          data = boxes;
          filename = 'loot_boxes.json';
          break;
        case 'items':
          data = items;
          filename = 'items.json';
          break;
        case 'users':
          data = users;
          filename = 'users.json';
          break;
        case 'transactions':
          data = transactions;
          filename = 'transactions.json';
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Export ${type} terminé`);
    } catch (error) {
      handleError(error, 'exporting data');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Tab navigation items
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'boxes', label: 'Loot Boxes', icon: Package },
    { id: 'items', label: 'Items', icon: Image },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'system', label: 'Système', icon: DatabaseIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  ReveelBox Admin Pro
                </h1>
              </div>
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                v3.0 - Production Ready
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm focus:ring-2 focus:ring-green-500 w-64"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={refreshData} loading={refreshing} icon={RefreshCw} />
              <ThemeToggle />
              <Button variant="primary" size="sm" icon={Plus} onClick={() => openModal('createBox')}>
                Nouveau
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <Card className="p-1 sticky top-24">
              <nav className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                        ${activeTab === tab.id 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon size={20} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Dashboard Analytics
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Vue d'ensemble en temps réel de votre plateforme ReveelBox
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatsCard
                      title="Loot Boxes"
                      value={stats.boxes || 0}
                      change={12.5}
                      icon={Package}
                      color="green"
                    />
                    <StatsCard
                      title="Items Disponibles"
                      value={stats.items || 0}
                      change={8.2}
                      icon={Image}
                      color="blue"
                    />
                    <StatsCard
                      title="Utilisateurs"
                      value={stats.users || 0}
                      change={15.3}
                      icon={Users}
                      color="purple"
                    />
                  </div>

                  {/* Quick Actions */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Actions Rapides
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        variant="outline" 
                        className="flex-col h-20 gap-2" 
                        onClick={() => openModal('createBox')}
                      >
                        <Plus size={20} />
                        Nouvelle Box
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-col h-20 gap-2" 
                        onClick={() => openModal('createItem')}
                      >
                        <Image size={20} />
                        Nouvel Item
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-col h-20 gap-2" 
                        onClick={() => exportData('boxes')}
                      >
                        <Download size={20} />
                        Export
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-col h-20 gap-2" 
                        onClick={() => setActiveTab('system')}
                      >
                        <Settings size={20} />
                        Système
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Boxes Tab */}
              {activeTab === 'boxes' && (
                <motion.div
                  key="boxes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Gestion des Loot Boxes
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {boxes.length} box(es) • {stats.activeBoxes || 0} active(s) • {stats.featuredBoxes || 0} featured
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" icon={Download} onClick={() => exportData('boxes')}>
                        Export
                      </Button>
                      <Button icon={Plus} onClick={() => openModal('createBox')}>
                        Nouvelle Box
                      </Button>
                    </div>
                  </div>

                  {/* Boxes Grid */}
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1,2,3,4,5,6].map(i => (
                        <Card key={i} className="p-6 animate-pulse">
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </Card>
                      ))}
                    </div>
                  ) : boxes.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Package size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Aucune box créée
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Commencez par créer votre première loot box
                      </p>
                      <Button onClick={() => openModal('createBox')} icon={Plus}>
                        Créer une box
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {boxes
                        .filter(box => !searchQuery || box.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((box, index) => (
                        <motion.div
                          key={box.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="overflow-hidden hover:shadow-lg group">
                            {/* Image */}
                            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
                              <img 
                                src={box.image_url || '/placeholder-box.jpg'} 
                                alt={box.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJveCBlPC90ZXh0Pgo8L3N2Zz4K';
                                }}
                              />
                              <div className="absolute top-3 right-3 flex flex-col gap-2">
{box.is_active && (
  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
    Actif
  </span>
)}

{box.is_featured && (
  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
    Featured
  </span>
)}
                                {box.is_daily_free && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                                    FreeDrop
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-5">
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                {box.name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                {box.description || 'Aucune description'}
                              </p>
                              
                              <div className="flex items-center justify-between text-sm mb-4">
                                <span className="text-gray-500 dark:text-gray-400">
                                  {getBoxItems(box.id).length} items
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    {box.price_virtual} coins
                                  </span>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => openModal('manageItems', box)}
                                >
                                  Gérer Items
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  icon={Edit2}
                                  onClick={() => openModal('editBox', box)}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => deleteBox(box.id)}
                                />
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Items Tab */}
              {activeTab === 'items' && (
                <motion.div
                  key="items"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Catalogue d'Items
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {items.length} item(s) dans le catalogue
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" icon={Download} onClick={() => exportData('items')}>
                        Export
                      </Button>
                      <Button icon={Plus} onClick={() => openModal('createItem')}>
                        Nouvel Item
                      </Button>
                    </div>
                  </div>

                  {/* Items Grid */}
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <Card key={i} className="p-4 animate-pulse">
                          <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </Card>
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Image size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Aucun item créé
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Commencez par créer votre premier item
                      </p>
                      <Button onClick={() => openModal('createItem')} icon={Plus}>
                        Créer un item
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items
                        .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="overflow-hidden hover:shadow-lg group">
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
                              <img 
                                src={item.image_url || '/placeholder-item.jpg'} 
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkl0ZW08L3RleHQ+Cjwvc3ZnPgo=';
                                }}
                              />
                              <div className="absolute top-2 right-2">
                                <span className={`
                                  px-2 py-1 text-xs rounded-full font-medium capitalize
                                  ${item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                                    item.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                                    item.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'}
                                `}>
                                  {item.rarity}
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                {item.name}
                              </h3>
                              <p className="text-green-600 dark:text-green-400 font-bold text-lg mb-3">
                                {formatPrice(item.market_value || 0)}€
                              </p>
                              
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  icon={Edit2} 
                                  className="flex-1"
                                  onClick={() => openModal('editItem', item)}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  icon={Trash2} 
                                  className="flex-1"
                                  onClick={() => deleteItem(item.id)}
                                />
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Administration Système
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Outils et paramètres système avancés
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* System Status */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <DatabaseIcon size={20} />
                        État du Système
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Base de données</span>
                          <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Opérationnelle
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">API Supabase</span>
                          <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Connectée
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* Export Tools */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Download size={20} />
                        Outils d'Export
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" size="sm" onClick={() => exportData('boxes')}>
                          Export Boxes
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportData('items')}>
                          Export Items
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportData('users')}>
                          Export Users
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportData('transactions')}>
                          Export Transactions
                        </Button>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Create/Edit Box Modal */}
      <Modal
        isOpen={showModal && (modalType === 'createBox' || modalType === 'editBox')}
        onClose={closeModal}
        title={modalType === 'editBox' ? 'Modifier la Box' : 'Nouvelle Box'}
        size="lg"
      >
        <div className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nom de la box *"
              value={boxForm.name}
              onChange={(e) => setBoxForm({...boxForm, name: e.target.value})}
              placeholder="Ex: Tech Mystery Box"
              error={errors.name}
            />

            <Input
              label="Prix en coins *"
              type="number"
              step="0.01"
              min="0"
              value={boxForm.price_virtual}
              onChange={(e) => setBoxForm({...boxForm, price_virtual: e.target.value})}
              placeholder="100.50"
              error={errors.price_virtual}
            />
          </div>

          <Input
            label="Description"
            value={boxForm.description}
            onChange={(e) => setBoxForm({...boxForm, description: e.target.value})}
            placeholder="Description de la box..."
          />

          <Input
            label="URL de l'image *"
            value={boxForm.image_url}
            onChange={(e) => setBoxForm({...boxForm, image_url: e.target.value})}
            placeholder="https://exemple.com/image.jpg"
            error={errors.image_url}
          />

          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={boxForm.is_active}
                onChange={(e) => setBoxForm({...boxForm, is_active: e.target.checked})}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={boxForm.is_featured}
                onChange={(e) => setBoxForm({...boxForm, is_featured: e.target.checked})}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={boxForm.is_daily_free}
                onChange={(e) => setBoxForm({...boxForm, is_daily_free: e.target.checked})}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FreeDrop</span>
            </label>
          </div>

          <div className="flex gap-4 pt-6">
            <Button 
              variant="primary" 
              icon={Save} 
              onClick={modalType === 'editBox' ? updateBox : createBox}
              loading={submitting}
              className="flex-1"
            >
              {modalType === 'editBox' ? 'Mettre à jour' : 'Créer la Box'}
            </Button>
            <Button variant="outline" onClick={closeModal} disabled={submitting}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Item Modal */}
      <Modal
        isOpen={showModal && (modalType === 'createItem' || modalType === 'editItem')}
        onClose={closeModal}
        title={modalType === 'editItem' ? 'Modifier l\'Item' : 'Nouvel Item'}
      >
        <div className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <Input
            label="Nom de l'item *"
            value={itemForm.name}
            onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
            placeholder="Ex: Casque Gaming RGB"
            error={errors.name}
          />

          <Input
            label="Description"
            value={itemForm.description}
            onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
            placeholder="Description de l'item..."
          />

          <Input
            label="URL de l'image *"
            value={itemForm.image_url}
            onChange={(e) => setItemForm({...itemForm, image_url: e.target.value})}
            placeholder="https://exemple.com/image.jpg"
            error={errors.image_url}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valeur marché (€) *"
              type="number"
              step="0.01"
              min="0"
              value={itemForm.market_value}
              onChange={(e) => setItemForm({...itemForm, market_value: e.target.value})}
              placeholder="10.99"
              error={errors.market_value}
            />

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Rareté *
              </label>
              <select
                value={itemForm.rarity}
                onChange={(e) => setItemForm({...itemForm, rarity: e.target.value})}
                className="w-full px-3 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-200"
              >
                <option value="common">Commun</option>
                <option value="rare">Rare</option>
                <option value="epic">Épique</option>
                <option value="legendary">Légendaire</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button 
              variant="primary" 
              icon={Save} 
              onClick={modalType === 'editItem' ? updateItem : createItem} 
              loading={submitting}
              className="flex-1"
            >
              {modalType === 'editItem' ? 'Mettre à jour' : 'Créer l\'Item'}
            </Button>
            <Button variant="outline" onClick={closeModal} disabled={submitting}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Items Modal */}
      <Modal
        isOpen={showModal && modalType === 'manageItems'}
        onClose={closeModal}
        title={selectedBox ? `Gérer les items - ${selectedBox.name}` : ''}
        size="xl"
      >
        {selectedBox && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {getBoxItems(selectedBox.id).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Items</div>
              </Card>
              <Card className="p-4 text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {getTotalDropRate(selectedBox.id).toFixed(6)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Drop Rate Total</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  €{(getBoxItems(selectedBox.id).reduce((sum, bi) => {
                    const item = items.find(i => i.id === bi.item_id);
                    return sum + (item ? (item.market_value || 0) * (bi.probability || 0) / 100 : 0);
                  }, 0)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Valeur Moyenne</div>
              </Card>
              <Card className="p-4 text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Configuration</div>
              </Card>
            </div>

            {/* Add Item Form */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ajouter un item</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select 
                  value={boxItemForm.item_id}
                  onChange={(e) => setBoxItemForm({...boxItemForm, item_id: e.target.value})}
                  className={`px-3 py-2 bg-white dark:bg-gray-700 border rounded-xl text-sm col-span-2 ${
                    errors.item_id ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Sélectionner un item</option>
                  {items
                    .filter(item => !boxItems.some(bi => bi.loot_box_id === selectedBox.id && bi.item_id === item.id))
                    .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.rarity})
                    </option>
                  ))}
                </select>
                
                <Input
                  type="number"
                  placeholder="Probabilité (%)"
                  step="0.000001"
                  min="0"
                  max="100"
                  value={boxItemForm.probability}
                  onChange={(e) => setBoxItemForm({...boxItemForm, probability: e.target.value})}
                  className="text-sm"
                  error={errors.probability}
                />
                
                <Input
                  type="number"
                  placeholder="Ordre"
                  min="1"
                  value={boxItemForm.display_order}
                  onChange={(e) => setBoxItemForm({...boxItemForm, display_order: e.target.value || '1'})}
                  className="text-sm"
                />
                
                <Button icon={Plus} onClick={addItemToBox} loading={submitting} className="h-full">
                  Ajouter
                </Button>
              </div>
              {(errors.item_id || errors.probability) && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.item_id || errors.probability}
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Support jusqu'à 6 décimales pour les probabilités ultra-précises (ex: 0.000001%)
              </div>
            </Card>

            {/* Items List with Drag & Drop */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GripVertical size={20} />
                Items dans cette box (Glisser-déposer pour réorganiser)
              </h3>
              {getBoxItems(selectedBox.id).length === 0 ? (
                <Card className="p-12 text-center">
                  <Package size={48} className="mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucun item dans cette box
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Commencez par ajouter des items avec leurs probabilités
                  </p>
                </Card>
              ) : (
                <DragDropItemList
                  items={getBoxItems(selectedBox.id)}
                  onReorder={(newOrder) => updateItemOrder(selectedBox.id, newOrder)}
                  onEdit={(item) => console.log('Edit item', item)}
                  onDelete={deleteBoxItem}
                  onUpdateProbability={updateBoxItemProbability}
                />
              )}
            </div>

            {/* Configuration Validation */}
            {getBoxItems(selectedBox.id).length > 0 && (
              <Card className={`p-4 border-2 ${
                Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                  : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
              }`}>
                <div className="flex items-center gap-3">
                  {Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-orange-800 dark:text-orange-200'
                    }`}>
                      {Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 
                        ? 'Configuration valide !' 
                        : 'Configuration incomplète'
                      }
                    </p>
                    <p className={`text-sm ${
                      Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-orange-700 dark:text-orange-300'
                    }`}>
                      {Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 
                        ? 'Les probabilités totalisent exactement 100%' 
                        : `Total actuel: ${getTotalDropRate(selectedBox.id).toFixed(6)}% (doit être 100%)`
                      }
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// Root component with theme provider
const App = () => {
  return (
    <ThemeProvider>
      <AdvancedAdminPanel />
    </ThemeProvider>
  );
};

export default App;