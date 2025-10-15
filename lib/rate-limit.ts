// Fichier: lib/rate-limit.ts
// Système de limitation de débit (rate limiting) simple en mémoire
// Pour une production à grande échelle, utilisez Redis

interface RateLimit {
  count: number;
  resetTime: number;
  lastRequest: number;
}

// Map pour stocker les compteurs par identifier
const rateLimits = new Map<string, RateLimit>();

// Configuration par défaut
const DEFAULT_LIMITS = {
  messages: { limit: 10, windowMs: 60000 }, // 10 messages par minute
  giveaways: { limit: 3, windowMs: 3600000 }, // 3 giveaways par heure
  donations: { limit: 20, windowMs: 3600000 }, // 20 donations par heure
  translations: { limit: 30, windowMs: 3600000 }, // 30 traductions par heure
  admin_actions: { limit: 100, windowMs: 3600000 } // 100 actions admin par heure
};

// Types pour la configuration
export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  skipOnError?: boolean;
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Classe principale pour le rate limiting
class RateLimiter {
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Nettoyer les entrées expirées toutes les 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Méthode principale pour vérifier et appliquer les limites
  async limit(
    identifier: string, 
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const {
      limit = 10,
      windowMs = 60000,
      skipOnError = false
    } = config || {};

    const now = Date.now();
    const resetTime = now + windowMs;
    
    // Récupérer ou créer l'entrée de limitation
    let limitEntry = rateLimits.get(identifier);

    // Si pas d'entrée ou si la fenêtre a expiré, créer une nouvelle
    if (!limitEntry || now > limitEntry.resetTime) {
      limitEntry = {
        count: 1,
        resetTime,
        lastRequest: now
      };
      rateLimits.set(identifier, limitEntry);

      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetTime
      };
    }

    // Vérifier si la limite est dépassée
    if (limitEntry.count >= limit) {
      const retryAfter = Math.ceil((limitEntry.resetTime - now) / 1000);
      
      return {
        success: false,
        limit,
        remaining: 0,
        resetTime: limitEntry.resetTime,
        retryAfter
      };
    }

    // Incrémenter le compteur
    limitEntry.count++;
    limitEntry.lastRequest = now;

    return {
      success: true,
      limit,
      remaining: limit - limitEntry.count,
      resetTime: limitEntry.resetTime
    };
  }

  // Limites prédéfinies pour différents types d'actions
  async limitMessages(userId: string): Promise<RateLimitResult> {
    return this.limit(`messages:${userId}`, DEFAULT_LIMITS.messages);
  }

  async limitGiveaways(userId: string): Promise<RateLimitResult> {
    return this.limit(`giveaways:${userId}`, DEFAULT_LIMITS.giveaways);
  }

  async limitDonations(userId: string): Promise<RateLimitResult> {
    return this.limit(`donations:${userId}`, DEFAULT_LIMITS.donations);
  }

  async limitTranslations(userId: string): Promise<RateLimitResult> {
    return this.limit(`translations:${userId}`, DEFAULT_LIMITS.translations);
  }

  async limitAdminActions(userId: string): Promise<RateLimitResult> {
    return this.limit(`admin:${userId}`, DEFAULT_LIMITS.admin_actions);
  }

  // Limites par IP (pour les utilisateurs non authentifiés)
  async limitByIP(ip: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    const sanitizedIP = ip.replace(/[^0-9a-f:.]/gi, ''); // Nettoyer l'IP
    return this.limit(`ip:${sanitizedIP}`, config);
  }

  // Réinitialiser les limites pour un identifier
  reset(identifier: string): void {
    rateLimits.delete(identifier);
  }

  // Réinitialiser toutes les limites (à utiliser avec précaution)
  resetAll(): void {
    rateLimits.clear();
  }

  // Obtenir les statistiques pour un identifier
  getStats(identifier: string): RateLimit | null {
    return rateLimits.get(identifier) || null;
  }

  // Nettoyer les entrées expirées
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [identifier, limitEntry] of rateLimits.entries()) {
      if (now > limitEntry.resetTime) {
        rateLimits.delete(identifier);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Rate limiter cleaned ${cleanedCount} expired entries`);
    }
  }

  // Obtenir des statistiques globales
  getGlobalStats(): {
    totalEntries: number;
    activeEntries: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const [, limitEntry] of rateLimits.entries()) {
      if (now > limitEntry.resetTime) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      totalEntries: rateLimits.size,
      activeEntries,
      expiredEntries
    };
  }

  // Arrêter le nettoyage automatique
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Instance singleton
const rateLimiter = new RateLimiter();

// Export des méthodes principales pour faciliter l'usage
export const ratelimit = {
  limit: rateLimiter.limit.bind(rateLimiter),
  limitMessages: rateLimiter.limitMessages.bind(rateLimiter),
  limitGiveaways: rateLimiter.limitGiveaways.bind(rateLimiter),
  limitDonations: rateLimiter.limitDonations.bind(rateLimiter),
  limitTranslations: rateLimiter.limitTranslations.bind(rateLimiter),
  limitAdminActions: rateLimiter.limitAdminActions.bind(rateLimiter),
  limitByIP: rateLimiter.limitByIP.bind(rateLimiter),
  reset: rateLimiter.reset.bind(rateLimiter),
  resetAll: rateLimiter.resetAll.bind(rateLimiter),
  getStats: rateLimiter.getStats.bind(rateLimiter),
  getGlobalStats: rateLimiter.getGlobalStats.bind(rateLimiter)
};

// Export de la classe pour usage avancé
export { RateLimiter };

// Utilitaires pour Next.js middleware
export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  return async (identifier: string) => {
    return rateLimiter.limit(identifier, config);
  };
};

// Headers pour les réponses HTTP
export const addRateLimitHeaders = (headers: Headers, result: RateLimitResult): void => {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
};

export default ratelimit;