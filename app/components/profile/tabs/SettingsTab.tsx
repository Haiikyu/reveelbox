'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Save, Loader2, Copy, Check, Link2, ChevronDown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'

interface SettingsTabProps {
  profile: {
    username: string | null
    bio: string | null
    location: string | null
    birth_date: string | null
    phone: string | null
    privacy_profile: string
    notifications_email: boolean
    notifications_push: boolean
    id_rev: string | null
    custom_slug: string | null
  }
  onDeleteAccount: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold mb-6">
      {children}
    </h3>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-gray-500 mb-1.5 block">{children}</label>
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-0 py-2 bg-transparent border-b border-white/[0.05] text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-white/15 transition-colors"
    />
  )
}

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [day, setDay] = useState(parsed ? String(parsed.getDate()) : '')
  const [month, setMonth] = useState(parsed ? String(parsed.getMonth() + 1) : '')
  const [year, setYear] = useState(parsed ? String(parsed.getFullYear()) : '')

  // Minimum 18 ans révolus
  const currentYear = new Date().getFullYear()
  const maxYear = currentYear - 18
  const years = Array.from({ length: 100 }, (_, i) => maxYear - i)
  const daysInMonth = month && year ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  useEffect(() => {
    if (day && month && year) {
      const d = parseInt(day).toString().padStart(2, '0')
      const m = parseInt(month).toString().padStart(2, '0')
      onChange(`${year}-${m}-${d}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, month, year])

  const selectBase = `
    py-1.5 px-2 text-sm text-white bg-transparent border-b border-white/[0.06]
    focus:outline-none focus:border-white/20 transition-colors cursor-pointer
    appearance-none w-full
  `

  return (
    <div className="flex items-end gap-4">
      <div className="flex flex-col gap-1 w-14">
        <span className="text-[10px] text-gray-600">Jour</span>
        <select value={day} onChange={e => setDay(e.target.value)} className={selectBase} style={{ background: 'transparent' }}>
          <option value="" style={{ background: '#0f172a' }}>—</option>
          {days.map(d => <option key={d} value={String(d)} style={{ background: '#0f172a' }}>{d}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1 w-20">
        <span className="text-[10px] text-gray-600">Mois</span>
        <select value={month} onChange={e => setMonth(e.target.value)} className={selectBase} style={{ background: 'transparent' }}>
          <option value="" style={{ background: '#0f172a' }}>—</option>
          {MONTHS_SHORT.map((m, i) => <option key={i} value={String(i + 1)} style={{ background: '#0f172a' }}>{m}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1 w-20">
        <span className="text-[10px] text-gray-600">Année</span>
        <select value={year} onChange={e => setYear(e.target.value)} className={selectBase} style={{ background: 'transparent' }}>
          <option value="" style={{ background: '#0f172a' }}>—</option>
          {years.map(y => <option key={y} value={String(y)} style={{ background: '#0f172a' }}>{y}</option>)}
        </select>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => { setDay(''); setMonth(''); setYear(''); onChange('') }}
          className="text-[10px] text-gray-700 hover:text-gray-400 pb-2 transition-colors whitespace-nowrap"
        >
          Effacer
        </button>
      )}
    </div>
  )
}

export default function SettingsTab({ profile, onDeleteAccount }: SettingsTabProps) {
  const { user, refreshProfile } = useAuth()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const genRandom = () => 'user_' + Math.floor(1000000 + Math.random() * 9000000)
  const initUsername = (profile.username || '').length > 12 ? genRandom() : (profile.username || '')

  const [form, setForm] = useState({
    username: initUsername,
    bio: profile.bio || '',
    location: profile.location || '',
    birth_date: profile.birth_date || '',
    phone: profile.phone || '',
  })
  const [privacy, setPrivacy] = useState(profile.privacy_profile || 'public')
  const [notifEmail, setNotifEmail] = useState(profile.notifications_email)
  const [notifPush, setNotifPush] = useState(profile.notifications_push)

  // Custom slug
  const [customSlug, setCustomSlug] = useState(profile.custom_slug || '')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugCopied, setSlugCopied] = useState(false)
  const [idRevCopied, setIdRevCopied] = useState(false)

  // No leading/trailing hyphens, 3-24 chars, alphanumeric + internal hyphens
  const slugRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{1,22}[a-zA-Z0-9]|[a-zA-Z0-9]{0,22})$/

  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug === profile.custom_slug) {
      setSlugStatus('idle')
      return
    }
    if (!slugRegex.test(slug)) {
      setSlugStatus('invalid')
      return
    }
    setSlugStatus('checking')
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .ilike('custom_slug', slug)
      .maybeSingle()
    setSlugStatus(data ? 'taken' : 'available')
  }, [supabase, profile.custom_slug])

  useEffect(() => {
    const timer = setTimeout(() => checkSlugAvailability(customSlug), 500)
    return () => clearTimeout(timer)
  }, [customSlug, checkSlugAvailability])

  const profileUrl = customSlug && slugRegex.test(customSlug) && (slugStatus === 'available' || customSlug === profile.custom_slug)
    ? `reveelbox.com/profile/${customSlug}`
    : profile.id_rev
      ? `reveelbox.com/profile/${profile.id_rev}`
      : null

  const copyToClipboard = (text: string, type: 'slug' | 'idrev') => {
    navigator.clipboard.writeText(`https://${text}`)
    if (type === 'slug') { setSlugCopied(true); setTimeout(() => setSlugCopied(false), 2000) }
    else { setIdRevCopied(true); setTimeout(() => setIdRevCopied(false), 2000) }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updateData: Record<string, unknown> = {
        username: form.username,
        bio: form.bio,
        location: form.location,
        birth_date: form.birth_date || null,
        phone: form.phone,
        privacy_profile: privacy,
        notifications_email: notifEmail,
        notifications_push: notifPush,
      }
      // Only update slug if valid
      if (customSlug && slugRegex.test(customSlug) && (slugStatus === 'available' || customSlug === profile.custom_slug)) {
        updateData.custom_slug = customSlug
      } else if (!customSlug) {
        updateData.custom_slug = null
      }
      const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-14">

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-emerald-400/80"
        >
          ✓ Sauvegardé
        </motion.div>
      )}

      {/* Account */}
      <section>
        <SectionTitle>Compte</SectionTitle>
        <div className="space-y-5">
          <div>
            <FieldLabel>Pseudo</FieldLabel>
            <FieldInput
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value.slice(0, 12) }))}
              maxLength={12}
            />
          </div>
          <div>
            <FieldLabel>Bio</FieldLabel>
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              rows={2}
              maxLength={200}
              className="w-full px-0 py-2 bg-transparent border-b border-white/[0.05] text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-white/15 transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <FieldLabel>Localisation</FieldLabel>
              <FieldInput
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Téléphone</FieldLabel>
              <FieldInput
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Date de naissance</FieldLabel>
            <DatePicker
              value={form.birth_date}
              onChange={v => setForm(p => ({ ...p, birth_date: v }))}
            />
          </div>
        </div>
      </section>

      {/* URL personnalisée */}
      <section>
        <SectionTitle>URL du profil</SectionTitle>
        <div className="space-y-5">
          {/* IDRev (read-only) */}
          {profile.id_rev && (
            <div>
              <FieldLabel>Identifiant unique (IDRev)</FieldLabel>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 font-mono">{profile.id_rev}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`reveelbox.com/profile/${profile.id_rev}`, 'idrev')}
                  className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                >
                  {idRevCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">Identifiant permanent, ne peut pas être changé</p>
            </div>
          )}

          {/* Custom slug */}
          <div>
            <FieldLabel>URL personnalisée</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">reveelbox.com/profile/</span>
              <input
                value={customSlug}
                onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                maxLength={24}
                placeholder="mon-pseudo"
                className="flex-1 px-0 py-2 bg-transparent border-b border-white/[0.05] text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-white/15 transition-colors"
              />
            </div>
            {customSlug && (
              <div className="mt-1.5 flex items-center gap-1.5">
                {slugStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
                {slugStatus === 'available' && <span className="text-[11px] text-emerald-400">Disponible</span>}
                {slugStatus === 'taken' && <span className="text-[11px] text-red-400">Déjà pris</span>}
                {slugStatus === 'invalid' && <span className="text-[11px] text-red-400">3-24 caractères, lettres/chiffres/tirets (sans tiret au début/fin)</span>}
              </div>
            )}
          </div>

          {/* Preview URL */}
          {profileUrl && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <Link2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate">{profileUrl}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(profileUrl, 'slug')}
                className="ml-auto p-1 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0"
              >
                {slugCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Privacy */}
      <section>
        <SectionTitle>Confidentialité</SectionTitle>
        <div className="space-y-4">
          {([
            { value: 'public', label: 'Public', desc: 'Tout le monde peut voir votre profil' },
            { value: 'friends', label: 'Amis uniquement', desc: 'Seuls vos amis voient votre profil' },
            { value: 'private', label: 'Privé', desc: 'Votre profil est masqué' },
          ] as const).map(opt => (
            <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
              <div className={`w-4 h-4 mt-0.5 rounded-full border transition-colors flex items-center justify-center ${
                privacy === opt.value ? 'border-white bg-white' : 'border-gray-600 group-hover:border-gray-400'
              }`}>
                {privacy === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[#0b1120]" />}
              </div>
              <div>
                <input type="radio" name="privacy" value={opt.value} checked={privacy === opt.value} onChange={() => setPrivacy(opt.value)} className="sr-only" />
                <p className="text-sm text-white">{opt.label}</p>
                <p className="text-xs text-gray-600">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section>
        <SectionTitle>Notifications</SectionTitle>
        <div className="space-y-4">
          {[
            { label: 'Email', value: notifEmail, toggle: () => setNotifEmail(!notifEmail) },
            { label: 'Push', value: notifPush, toggle: () => setNotifPush(!notifPush) },
          ].map(n => (
            <label key={n.label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-400">{n.label}</span>
              <button
                type="button"
                onClick={n.toggle}
                className={`w-9 h-5 rounded-full transition-colors relative ${n.value ? 'bg-white' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                  n.value ? 'left-[18px] bg-[#0b1120]' : 'left-0.5 bg-gray-500'
                }`} />
              </button>
            </label>
          ))}
        </div>
      </section>

      {/* Save */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 text-sm font-medium text-white hover:text-[#4578be] transition-colors disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer les modifications
        </button>
      </div>

      {/* Danger zone */}
      <section className="pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <SectionTitle>Zone dangereuse</SectionTitle>
        <p className="text-xs text-gray-600 mb-4">
          Votre compte sera supprimé après 30 jours. Vous pouvez annuler en vous reconnectant.
        </p>
        <button
          onClick={onDeleteAccount}
          className="text-sm text-red-400/60 hover:text-red-400 transition-colors"
        >
          Supprimer mon compte
        </button>
      </section>
    </div>
  )
}