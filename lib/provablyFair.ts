// lib/provablyFair.ts - Système Provably Fair pour ReveelBox
// Utilise SHA256 pour générer des résultats vérifiables et transparents

/**
 * Génère un hash SHA256 à partir d'une chaîne
 * Compatible navigateur et Node.js
 */
export async function sha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    // Browser environment
    const msgBuffer = new TextEncoder().encode(message)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    // Node.js environment (pour les edge functions / API routes)
    const crypto = await import('crypto')
    return crypto.createHash('sha256').update(message).digest('hex')
  }
}

/**
 * Génère un hash synchrone (version simplifiée pour le client)
 * Utilise une implémentation JS pure de SHA256
 */
export function sha256Sync(message: string): string {
  // Implémentation JS pure de SHA256 pour usage synchrone
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount))
  }

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19

  const bytes: number[] = []
  for (let i = 0; i < message.length; i++) {
    bytes.push(message.charCodeAt(i))
  }
  bytes.push(0x80)

  while ((bytes.length % 64) !== 56) {
    bytes.push(0)
  }

  const bitLength = message.length * 8
  for (let i = 7; i >= 0; i--) {
    bytes.push((bitLength >>> (i * 8)) & 0xff)
  }

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const w: number[] = []
    for (let i = 0; i < 16; i++) {
      w[i] = (bytes[chunk + i * 4] << 24) | (bytes[chunk + i * 4 + 1] << 16) |
             (bytes[chunk + i * 4 + 2] << 8) | bytes[chunk + i * 4 + 3]
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7

    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + k[i] + w[i]) >>> 0
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0

      h = g; g = f; f = e; e = (d + temp1) >>> 0
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map(h => h.toString(16).padStart(8, '0'))
    .join('')
}

/**
 * Génère un seed aléatoire sécurisé
 */
export function generateSeed(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    // Fallback pour SSR
    return Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }
}

/**
 * Hash un server seed pour le montrer publiquement avant le jeu
 * (Le vrai seed est révélé après)
 */
export function hashServerSeed(serverSeed: string): string {
  return sha256Sync(serverSeed)
}

/**
 * Calcule le résultat provably fair
 * @param serverSeed - Seed secret du serveur (révélé après le jeu)
 * @param clientSeed - Seed fourni par le client
 * @param nonce - Numéro du tour (incrémenté à chaque ouverture)
 * @returns Un nombre entre 0 et 1
 */
export function calculateProvablyFairResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`
  const hash = sha256Sync(combined)

  // Prendre les 8 premiers caractères du hash (32 bits)
  const hexSlice = hash.slice(0, 8)
  const decimal = parseInt(hexSlice, 16)

  // Normaliser entre 0 et 1
  return decimal / 0xFFFFFFFF
}

/**
 * Calcule le résultat comme un pourcentage (0-100)
 */
export function calculateProvablyFairPercentage(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  return calculateProvablyFairResult(serverSeed, clientSeed, nonce) * 100
}

/**
 * Sélectionne un item basé sur les probabilités et le résultat provably fair
 */
export function selectItemByProbability<T extends { probability: number }>(
  items: T[],
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { item: T; roll: number; hash: string } | null {
  if (!items || items.length === 0) return null

  const combined = `${serverSeed}:${clientSeed}:${nonce}`
  const hash = sha256Sync(combined)
  const roll = calculateProvablyFairPercentage(serverSeed, clientSeed, nonce)

  // Calculer les probabilités cumulées
  let cumulative = 0
  for (const item of items) {
    cumulative += item.probability
    if (roll <= cumulative) {
      return { item, roll, hash }
    }
  }

  // Fallback au dernier item
  return { item: items[items.length - 1], roll, hash }
}

/**
 * Vérifie un résultat provably fair
 * Permet aux utilisateurs de vérifier que le jeu était équitable
 */
export function verifyProvablyFairResult(
  serverSeed: string,
  serverSeedHash: string,
  clientSeed: string,
  nonce: number,
  expectedRoll: number
): { isValid: boolean; calculatedRoll: number; hashMatches: boolean } {
  // Vérifier que le hash du server seed correspond
  const calculatedHash = hashServerSeed(serverSeed)
  const hashMatches = calculatedHash === serverSeedHash

  // Recalculer le roll
  const calculatedRoll = calculateProvablyFairPercentage(serverSeed, clientSeed, nonce)

  // Vérifier que le roll correspond (avec une petite marge pour les erreurs de floating point)
  const isValid = hashMatches && Math.abs(calculatedRoll - expectedRoll) < 0.0001

  return {
    isValid,
    calculatedRoll,
    hashMatches
  }
}

/**
 * Génère les données provably fair pour une nouvelle session de jeu
 */
export function createProvablyFairSession(): {
  serverSeed: string
  serverSeedHash: string
  clientSeed: string
  nonce: number
} {
  const serverSeed = generateSeed()
  const serverSeedHash = hashServerSeed(serverSeed)
  const clientSeed = generateSeed()

  return {
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce: 0
  }
}

/**
 * Interface pour stocker l'état provably fair
 */
export interface ProvablyFairState {
  serverSeed: string
  serverSeedHash: string
  clientSeed: string
  nonce: number
  history: Array<{
    nonce: number
    roll: number
    hash: string
    timestamp: number
  }>
}

/**
 * Crée un état initial pour provably fair
 */
export function createInitialProvablyFairState(): ProvablyFairState {
  const session = createProvablyFairSession()
  return {
    ...session,
    history: []
  }
}
