// Fichier: app/components/chat/modals/GiveawayModal.tsx
'use client';

import React, { useState } from 'react';
import { Gift, Users, Clock, DollarSign } from 'lucide-react';
import { z } from 'zod';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';

import type { CreateGiveawayParams } from '@/types/chat';

interface GiveawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: CreateGiveawayParams) => Promise<void>;
  isLoading: boolean;
}

interface FormData {
  title: string;
  amount: string;
  winners_count: string;
  max_participants: string;
  duration_minutes: string;
}

interface FormErrors {
  title?: string;
  amount?: string;
  winners_count?: string;
  max_participants?: string;
  duration_minutes?: string;
}

// Schema de validation avec Zod
const giveawaySchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  amount: z.number().min(1, 'Le montant doit être supérieur à 0').max(100000, 'Le montant ne peut pas dépasser 100,000 coins'),
  winners_count: z.number().min(1, 'Il faut au moins 1 gagnant').max(50, 'Maximum 50 gagnants'),
  max_participants: z.number().optional().refine(val => val === undefined || val > 0, 'Le nombre de participants doit être supérieur à 0'),
  duration_minutes: z.number().min(1, 'Durée minimum: 1 minute').max(10080, 'Durée maximum: 7 jours')
});

const GiveawayModal: React.FC<GiveawayModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    amount: '1000',
    winners_count: '1',
    max_participants: '',
    duration_minutes: '60'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      const parsed = {
        title: formData.title,
        amount: parseInt(formData.amount),
        winners_count: parseInt(formData.winners_count),
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        duration_minutes: parseInt(formData.duration_minutes)
      };

      giveawaySchema.parse(parsed);
      
      // Validation additionnelle: max_participants doit être >= winners_count
      if (parsed.max_participants && parsed.max_participants < parsed.winners_count) {
        setErrors({ max_participants: 'Le nombre max de participants doit être supérieur ou égal au nombre de gagnants' });
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            const field = err.path[0] as keyof FormErrors;
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }

    try {
      const params: CreateGiveawayParams = {
        title: formData.title.trim(),
        amount: parseInt(formData.amount),
        winners_count: parseInt(formData.winners_count),
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        duration_minutes: parseInt(formData.duration_minutes)
      };

      await onSubmit(params);
      
      // Reset form
      setFormData({
        title: '',
        amount: '1000',
        winners_count: '1',
        max_participants: '',
        duration_minutes: '60'
      });
      
    } catch (error) {
      console.error('Erreur création giveaway:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setErrors({});
    }
  };

  // Templates prédéfinis
  const templates = [
    { name: 'Petit Giveaway', amount: 1000, winners: 1, duration: 30 },
    { name: 'Giveaway Standard', amount: 5000, winners: 3, duration: 60 },
    { name: 'Gros Giveaway', amount: 15000, winners: 5, duration: 120 },
    { name: 'Mega Giveaway', amount: 50000, winners: 10, duration: 360 }
  ];

  const applyTemplate = (template: typeof templates[0]) => {
    setFormData(prev => ({
      ...prev,
      amount: template.amount.toString(),
      winners_count: template.winners.toString(),
      duration_minutes: template.duration.toString()
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Créer un Giveaway"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Templates rapides */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Templates rapides
          </label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => applyTemplate(template)}
                className="text-left p-2 text-xs border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {template.amount} coins • {template.winners} gagnant(s)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Titre du Giveaway
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ex: Giveaway de Noël 🎄"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Montant (coins)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              min="1"
              max="100000"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Nombre de gagnants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Gift className="inline w-4 h-4 mr-1" />
              Gagnants
            </label>
            <input
              type="number"
              value={formData.winners_count}
              onChange={(e) => handleInputChange('winners_count', e.target.value)}
              min="1"
              max="50"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.winners_count ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.winners_count && (
              <p className="text-red-500 text-xs mt-1">{errors.winners_count}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Participants max */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Users className="inline w-4 h-4 mr-1" />
              Max participants
            </label>
            <input
              type="number"
              value={formData.max_participants}
              onChange={(e) => handleInputChange('max_participants', e.target.value)}
              placeholder="Illimité"
              min="1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.max_participants ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.max_participants && (
              <p className="text-red-500 text-xs mt-1">{errors.max_participants}</p>
            )}
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Clock className="inline w-4 h-4 mr-1" />
              Durée (minutes)
            </label>
            <select
              value={formData.duration_minutes}
              onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 heure</option>
              <option value="120">2 heures</option>
              <option value="360">6 heures</option>
              <option value="720">12 heures</option>
              <option value="1440">24 heures</option>
            </select>
            {errors.duration_minutes && (
              <p className="text-red-500 text-xs mt-1">{errors.duration_minutes}</p>
            )}
          </div>
        </div>

        {/* Aperçu */}
        {formData.title && formData.amount && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 rounded-lg border">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aperçu du message
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border text-sm">
              🎉 GIVEAWAY: {formData.title} - {formData.amount} coins pour {formData.winners_count} gagnant{parseInt(formData.winners_count) > 1 ? 's' : ''} !
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || !formData.title || !formData.amount}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Création...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Créer le Giveaway
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GiveawayModal;