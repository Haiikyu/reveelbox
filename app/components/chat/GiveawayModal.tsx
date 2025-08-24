'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Shield, AlertCircle } from 'lucide-react';

interface GiveawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (answer: string) => Promise<void>;
  giveawayId: string;
}

interface CaptchaChallenge {
  a: number;
  b: number;
  operation: string;
  answer: number;
}

const GiveawayModal: React.FC<GiveawayModalProps> = ({
  isOpen,
  onClose,
  onValidate,
  giveawayId
}) => {
  const [participationTimer, setParticipationTimer] = useState(0);
  const [captchaChallenge, setCaptchaChallenge] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Démarrer le timer quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setParticipationTimer(10); // 10 secondes
      setCaptchaChallenge(null);
      setCaptchaAnswer('');
      setIsValidating(false);
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (participationTimer > 0) {
      const timer = setTimeout(() => {
        setParticipationTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (participationTimer === 0 && isOpen && !captchaChallenge) {
      generateCaptcha();
    }
  }, [participationTimer, isOpen, captchaChallenge]);

  const generateCaptcha = () => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let a: number, b: number, answer: number;

    switch (operation) {
      case '+':
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 30) + 10;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a - b;
        break;
      case '*':
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a * b;
        break;
      default:
        a = 1;
        b = 1;
        answer = 2;
    }

    setCaptchaChallenge({ a, b, operation, answer });
  };

  const handleValidation = async () => {
    if (!captchaChallenge || !captchaAnswer) return;

    setIsValidating(true);

    try {
      if (parseInt(captchaAnswer) === captchaChallenge.answer) {
        await onValidate(captchaAnswer);
        onClose();
      } else {
        alert('CAPTCHA incorrect ! Participation refusée.');
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la participation');
      onClose();
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && captchaAnswer && !isValidating) {
      handleValidation();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-6 max-w-md w-full border border-white/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mb-4">
                <Gift className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Participation au Giveaway</h3>
                <p className="text-gray-300 text-sm">Vérification anti-bot en cours...</p>
              </div>

              {participationTimer > 0 ? (
                // Phase d'attente
                <div className="space-y-4">
                  <motion.div
                    className="text-4xl font-bold text-blue-400"
                    key={participationTimer}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {participationTimer}
                  </motion.div>
                  <p className="text-gray-400 text-sm">Préparation de la vérification...</p>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(participationTimer / 10) * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              ) : captchaChallenge ? (
                // Phase CAPTCHA
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <span className="text-blue-400 font-semibold">Vérification Anti-Bot</span>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-white mb-2">
                        {captchaChallenge.a} {captchaChallenge.operation} {captchaChallenge.b} = ?
                      </div>
                      <p className="text-gray-400 text-sm">Résolvez cette équation pour participer</p>
                    </div>
                    
                    <input
                      type="number"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white text-center text-xl font-bold focus:outline-none focus:border-green-400"
                      placeholder="Votre réponse"
                      autoFocus
                      disabled={isValidating}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      disabled={isValidating}
                      className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleValidation}
                      disabled={!captchaAnswer || isValidating}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
                    >
                      {isValidating ? (
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Validation...
                        </div>
                      ) : (
                        'Participer'
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : null}

              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Une seule tentative autorisée par giveaway</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiveawayModal;