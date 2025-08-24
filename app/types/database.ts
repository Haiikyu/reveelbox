// types/database.ts

export interface Profile {
  id: string
  username?: string | null
  email?: string | null
  virtual_currency: number
  loyalty_points: number
  created_at?: string
  updated_at?: string
  total_exp?: number
  last_freedrop_claim?: string | null
  consecutive_days?: number
  avatar_url?: string | null
  phone?: string | null
  birth_date?: string | null
  privacy_profile?: 'public' | 'private'
  notifications_email?: boolean
  notifications_push?: boolean
  bio?: string | null
  location?: string | null
  is_admin: boolean
  role: 'user' | 'admin'   // ✅ le champ manquant
}
