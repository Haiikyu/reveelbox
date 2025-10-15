// Fichier: lib/sanitize.ts
// Utilitaire de nettoyage et validation du contenu utilisateur

// Listes des éléments et attributs dangereux
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
  'link', 'meta', 'style', 'base', 'frame', 'frameset', 'applet',
  'bgsound', 'isindex', 'layer', 'nextid', 'noscript'
];

const DANGEROUS_ATTRIBUTES = [
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
  'onmouseup', 'onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur',
  'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onbeforeunload',
  'onresize', 'onmove', 'ondragdrop', 'onactivate', 'onafterprint', 'onbeforeprint',
  'oncontextmenu', 'onhelp', 'onpropertychange', 'onreadystatechange',
  'onbeforeactivate', 'onbeforedeactivate', 'onbeforeeditfocus', 'onblur',
  'oncontrolselect', 'oncut', 'ondeactivate', 'ondrag', 'ondragend', 'ondragenter',
  'ondragleave', 'ondragover', 'ondragstart', 'ondrop', 'onerrorupdate',
  'onfilterchange', 'onfinish', 'onfocusin', 'onfocusout', 'onlayoutcomplete',
  'onlosecapture', 'onmouseenter', 'onmouseleave', 'onmousewheel', 'onmove',
  'onmoveend', 'onmovestart', 'onpaste', 'onpropertychange', 'onresize',
  'onresizeend', 'onresizestart', 'onselectstart', 'ontimeerror'
];

const DANGEROUS_PROTOCOLS = [
  'javascript:', 'vbscript:', 'data:', 'file:', 'ftp:'
];

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
];

const ALLOWED_ATTRIBUTES = [
  'class', 'id', 'title', 'lang', 'dir'
];

// Interface pour les options de sanitization
export interface SanitizeOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
  stripWhitespace?: boolean;
  allowEmojis?: boolean;
  allowLineBreaks?: boolean;
}

// Options par défaut
const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  allowHtml: false,
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  maxLength: 2000,
  stripWhitespace: true,
  allowEmojis: true,
  allowLineBreaks: true
};

/**
 * Fonction principale de sanitization du contenu HTML/texte
 * Protège contre les attaques XSS et nettoie le contenu utilisateur
 */
export const sanitizeHtml = (
  input: string, 
  options: SanitizeOptions = {}
): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const config = { ...DEFAULT_OPTIONS, ...options };
  let sanitized = input;

  // 1. Limiter la longueur
  if (config.maxLength > 0) {
    sanitized = sanitized.substring(0, config.maxLength);
  }

  // 2. Supprimer les tags dangereux
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    
    // Supprimer aussi les tags auto-fermants
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?\\s*>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  // 3. Supprimer les attributs dangereux
  DANGEROUS_ATTRIBUTES.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>]*`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // 4. Supprimer les protocoles dangereux
  DANGEROUS_PROTOCOLS.forEach(protocol => {
    const regex = new RegExp(protocol, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // 5. Si HTML n'est pas autorisé, échapper tous les caractères HTML
  if (!config.allowHtml) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } else {
    // 6. Si HTML autorisé, ne garder que les tags autorisés
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
    sanitized = sanitized.replace(tagRegex, (match, tagName) => {
      if (!config.allowedTags.includes(tagName.toLowerCase())) {
        return '';
      }
      
      // Nettoyer les attributs du tag autorisé
      const cleanedTag = cleanAttributes(match, config.allowedAttributes);
      return cleanedTag;
    });
  }

  // 7. Nettoyer les espaces si nécessaire
  if (config.stripWhitespace) {
    sanitized = sanitized
      .replace(/\s+/g, ' ') // Remplacer plusieurs espaces par un seul
      .trim(); // Supprimer les espaces en début/fin
  }

  // 8. Gérer les sauts de ligne
  if (!config.allowLineBreaks) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // 9. Validation finale des emojis si nécessaire
  if (!config.allowEmojis) {
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }

  return sanitized;
};

/**
 * Nettoie les attributs d'un tag HTML
 */
const cleanAttributes = (tag: string, allowedAttributes: string[]): string => {
  return tag.replace(/(\s+[\w-]+)\s*=\s*(["\'][^"\']*["\']|[^\s>]+)/gi, (match, attrName, attrValue) => {
    const cleanAttrName = attrName.trim().toLowerCase();
    
    if (!allowedAttributes.includes(cleanAttrName)) {
      return '';
    }
    
    // Nettoyer la valeur de l'attribut
    const cleanValue = attrValue.replace(/[<>"']/g, '');
    return `${attrName}="${cleanValue}"`;
  });
};

/**
 * Sanitize spécialement pour les messages de chat
 */
export const sanitizeChatMessage = (message: string): string => {
  return sanitizeHtml(message, {
    allowHtml: false,
    maxLength: 2000,
    stripWhitespace: true,
    allowEmojis: true,
    allowLineBreaks: false
  });
};

/**
 * Sanitize pour les titres de giveaways/sondages
 */
export const sanitizeTitle = (title: string): string => {
  return sanitizeHtml(title, {
    allowHtml: false,
    maxLength: 100,
    stripWhitespace: true,
    allowEmojis: true,
    allowLineBreaks: false
  });
};

/**
 * Sanitize pour les descriptions plus longues
 */
export const sanitizeDescription = (description: string): string => {
  return sanitizeHtml(description, {
    allowHtml: false,
    maxLength: 500,
    stripWhitespace: true,
    allowEmojis: true,
    allowLineBreaks: true
  });
};

/**
 * Validation des noms d'utilisateur
 */
export const sanitizeUsername = (username: string): string => {
  if (!username || typeof username !== 'string') {
    return '';
  }

  return username
    .replace(/[<>"'&]/g, '') // Supprimer caractères dangereux
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim()
    .substring(0, 50); // Limiter la longueur
};

/**
 * Validation des URLs
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Supprimer les protocoles dangereux
  let cleanUrl = url.trim();
  
  DANGEROUS_PROTOCOLS.forEach(protocol => {
    if (cleanUrl.toLowerCase().startsWith(protocol)) {
      return '';
    }
  });

  // S'assurer que l'URL commence par http:// ou https://
  if (!cleanUrl.match(/^https?:\/\//i)) {
    cleanUrl = 'https://' + cleanUrl;
  }

  try {
    const urlObj = new URL(cleanUrl);
    return urlObj.toString();
  } catch {
    return '';
  }
};

/**
 * Détection de contenu potentiellement malveillant
 */
export const detectMaliciousContent = (content: string): {
  isSafe: boolean;
  threats: string[];
} => {
  const threats: string[] = [];
  const lowerContent = content.toLowerCase();

  // Détecter les scripts
  if (lowerContent.includes('<script') || lowerContent.includes('javascript:')) {
    threats.push('script_injection');
  }

  // Détecter les iframes
  if (lowerContent.includes('<iframe') || lowerContent.includes('<object') || lowerContent.includes('<embed')) {
    threats.push('frame_injection');
  }

  // Détecter les event handlers
  const eventHandlerRegex = /on\w+\s*=/i;
  if (eventHandlerRegex.test(content)) {
    threats.push('event_handler');
  }

  // Détecter les protocoles dangereux
  const dangerousProtocolRegex = /(?:javascript|vbscript|data|file):\s*[^\s]*/i;
  if (dangerousProtocolRegex.test(content)) {
    threats.push('dangerous_protocol');
  }

  // Détecter le spam (répétition excessive)
  const words = content.split(/\s+/);
  const wordCount = new Map();
  words.forEach(word => {
    const count = wordCount.get(word) || 0;
    wordCount.set(word, count + 1);
  });

  const maxRepeatedWord = Math.max(...wordCount.values());
  if (maxRepeatedWord > words.length * 0.7) {
    threats.push('potential_spam');
  }

  return {
    isSafe: threats.length === 0,
    threats
  };
};

/**
 * Validation complète d'un message de chat
 */
export const validateChatMessage = (message: string): {
  isValid: boolean;
  sanitizedMessage: string;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!message || typeof message !== 'string') {
    errors.push('Message vide ou invalide');
    return { isValid: false, sanitizedMessage: '', errors };
  }

  if (message.length > 2000) {
    errors.push('Message trop long (maximum 2000 caractères)');
  }

  if (message.trim().length === 0) {
    errors.push('Message vide après nettoyage');
  }

  const { isSafe, threats } = detectMaliciousContent(message);
  if (!isSafe) {
    errors.push(`Contenu potentiellement malveillant détecté: ${threats.join(', ')}`);
  }

  const sanitizedMessage = sanitizeChatMessage(message);
  
  if (sanitizedMessage.trim().length === 0) {
    errors.push('Message vide après sanitization');
  }

  return {
    isValid: errors.length === 0,
    sanitizedMessage,
    errors
  };
};

export default {
  sanitizeHtml,
  sanitizeChatMessage,
  sanitizeTitle,
  sanitizeDescription,
  sanitizeUsername,
  sanitizeUrl,
  detectMaliciousContent,
  validateChatMessage
};