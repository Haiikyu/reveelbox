// Utilitaires pour le système de chat et giveaways

/**
 * Vérification du captcha côté serveur
 * À remplacer par un vrai service captcha en production
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  if (!token || token.length < 10) {
    return false;
  }

  // En production, utiliser le vrai service
  const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');
  
  if (!recaptchaSecret) {
    console.warn('RECAPTCHA_SECRET_KEY not configured, using test mode');
    return true; // Mode test
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${recaptchaSecret}&response=${token}`
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Captcha verification error:', error);
    return false;
  }
}
/**
 * Génération d'un nombre aléatoire cryptographiquement sécurisé
 */
export function generateSecureRandom(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash sécurisé pour l'audit des tirages
 */
export async function generateSelectionHash(giveawayId: string, participantIds: string[], seed: string): Promise<string> {
  const data = `${giveawayId}-${participantIds.join(',')}-${seed}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validation des données d'entrée
 */
export function validateGiveawayParams(title: string, totalAmount: number, winnersCount: number, durationMinutes: number): void {
  if (!title || title.trim().length === 0) {
    throw new Error('Title cannot be empty');
  }
  
  if (title.length > 200) {
    throw new Error('Title too long (max 200 characters)');
  }
  
  if (totalAmount <= 0 || totalAmount > 1000000) {
    throw new Error('Invalid total amount (must be between 1 and 1,000,000)');
  }
  
  if (winnersCount <= 0 || winnersCount > 100) {
    throw new Error('Invalid winners count (must be between 1 and 100)');
  }
  
  if (durationMinutes < 1 || durationMinutes > 1440) { // Max 24h
    throw new Error('Invalid duration (must be between 1 minute and 24 hours)');
  }
}

/**
 * Nettoyage et validation du contenu des messages
 */
export function sanitizeMessageContent(content: string): string {
  if (!content) {
    throw new Error('Message content cannot be empty');
  }
  
  const cleaned = content.trim();
  
  if (cleaned.length === 0) {
    throw new Error('Message content cannot be empty');
  }
  
  if (cleaned.length > 1000) {
    throw new Error('Message too long (max 1000 characters)');
  }
  
  // Enlever les caractères de contrôle potentiellement dangereux
  return cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Vérification des permissions utilisateur
 */
export function checkUserPermissions(profile: any, action: string): boolean {
  switch (action) {
    case 'create_giveaway':
    case 'complete_giveaway':
    case 'cancel_giveaway':
    case 'send_system_message':
      return profile.is_admin === true;
    
    case 'join_giveaway':
      return profile.level >= 5 && !profile.is_banned;
    
    case 'send_message':
      return !profile.is_banned;
    
    default:
      return false;
  }
}

/**
 * Calcul de distribution équitable des prix
 */
export function calculatePrizeDistribution(totalAmount: number, winnersCount: number): number[] {
  if (winnersCount === 1) {
    return [totalAmount];
  }
  
  // Distribution décroissante : 1er = 40%, 2ème = 25%, 3ème = 15%, reste = équitable
  const prizes: number[] = [];
  let remaining = totalAmount;
  
  if (winnersCount >= 1) {
    const firstPrize = Math.floor(totalAmount * 0.4);
    prizes.push(firstPrize);
    remaining -= firstPrize;
  }
  
  if (winnersCount >= 2) {
    const secondPrize = Math.floor(totalAmount * 0.25);
    prizes.push(secondPrize);
    remaining -= secondPrize;
  }
  
  if (winnersCount >= 3) {
    const thirdPrize = Math.floor(totalAmount * 0.15);
    prizes.push(thirdPrize);
    remaining -= thirdPrize;
  }
  
  // Distribuer le reste équitablement
  const remainingWinners = winnersCount - prizes.length;
  if (remainingWinners > 0) {
    const equalPrize = Math.floor(remaining / remainingWinners);
    for (let i = 0; i < remainingWinners; i++) {
      prizes.push(equalPrize);
    }
  }
  
  return prizes;
}

const rateLimits = {
  'send_message': { max: 30, window: 60000 }, // 30 messages/minute
  'join_giveaway': { max: 5, window: 300000 }, // 5 participations/5min
  'create_giveaway': { max: 2, window: 3600000 } // 2 giveaways/heure
}

export function checkActionRateLimit(userId: string, action: string): boolean {
  const limit = rateLimits[action]
  if (!limit) return true

  return checkRateLimit(userId, limit.max, limit.window)
}

// Anti-spam pour les messages
export function detectSpam(content: string, recentMessages: string[]): boolean {
  // Messages identiques répétés
  const duplicateCount = recentMessages.filter(msg => msg === content).length
  if (duplicateCount >= 3) return true

  // Contenu suspect
  const spamPatterns = [
    /(.)\1{10,}/, // Caractères répétés
    /[A-Z]{20,}/, // Trop de majuscules
    /(https?:\/\/[^\s]+.*){3,}/, // Trop de liens
  ]

  return spamPatterns.some(pattern => pattern.test(content))
}

/**
 * Rate limiting basique
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}