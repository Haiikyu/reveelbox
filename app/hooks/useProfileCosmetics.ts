'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sanitizeSvg } from '@/utils/sanitizeSvg'

export interface ProfileCosmetics {
  bannerContent: string | null // SVG code or image URL
  bannerType: 'svg' | 'image' | null
  frameContent: string | null // SVG code or image URL
  frameType: 'svg' | 'image' | null
  pins: Array<{ id: string; content: string; type: 'svg' | 'image' }>
  nameColor: string | null
  nameColorIsGradient: boolean
  backgroundContent: string | null
  backgroundType: 'image' | 'css' | 'svg' | null
}

const EMPTY: ProfileCosmetics = {
  bannerContent: null,
  bannerType: null,
  frameContent: null,
  frameType: null,
  pins: [],
  nameColor: null,
  nameColorIsGradient: false,
  backgroundContent: null,
  backgroundType: null,
}

export function useProfileCosmetics(userId: string | null | undefined): {
  cosmetics: ProfileCosmetics
  loading: boolean
} {
  const supabase = createClient()
  const [cosmetics, setCosmetics] = useState<ProfileCosmetics>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const fetchAll = async () => {
      try {
        const [bannerRes, frameRes, pinsRes, colorRes, bgRes] = await Promise.all([
          // Banner
          supabase
            .from('user_banners')
            .select('banner_id, shop_banners(svg_code, image_url)')
            .eq('user_id', userId)
            .eq('is_equipped', true)
            .maybeSingle(),
          // Frame
          supabase
            .from('user_frames')
            .select('frame_id, shop_frames(svg_code, image_url)')
            .eq('user_id', userId)
            .eq('is_equipped', true)
            .maybeSingle(),
          // Pins
          supabase
            .from('user_pins')
            .select('pin_id, slot_number, shop_pins(svg_code, image_url)')
            .eq('user_id', userId)
            .eq('is_equipped', true)
            .order('slot_number', { ascending: true })
            .limit(4),
          // Name color
          supabase
            .from('user_name_colors')
            .select('color_id, shop_name_colors(color_value, is_gradient)')
            .eq('user_id', userId)
            .eq('is_equipped', true)
            .maybeSingle(),
          // Background
          supabase
            .from('user_backgrounds')
            .select('background_id, shop_backgrounds(image_url, css_value, svg_code)')
            .eq('user_id', userId)
            .eq('is_equipped', true)
            .maybeSingle(),
        ])

        // Parse banner
        let bannerContent: string | null = null
        let bannerType: 'svg' | 'image' | null = null
        const bannerShop = bannerRes.data?.shop_banners as any
        if (bannerShop && !Array.isArray(bannerShop)) {
          if (bannerShop.image_url) { bannerContent = bannerShop.image_url; bannerType = 'image' }
          else if (bannerShop.svg_code) { bannerContent = bannerShop.svg_code; bannerType = 'svg' }
        }

        // Parse frame
        let frameContent: string | null = null
        let frameType: 'svg' | 'image' | null = null
        const frameShop = frameRes.data?.shop_frames as any
        if (frameShop && !Array.isArray(frameShop)) {
          if (frameShop.image_url) { frameContent = frameShop.image_url; frameType = 'image' }
          else if (frameShop.svg_code) { frameContent = frameShop.svg_code; frameType = 'svg' }
        }

        // Parse pins
        const pins = (pinsRes.data || [])
          .filter((p: any) => p.shop_pins && !Array.isArray(p.shop_pins))
          .map((p: any) => {
            const shop = p.shop_pins as { svg_code: string | null; image_url: string | null }
            const content = shop.image_url || shop.svg_code || ''
            return {
              id: p.pin_id,
              content,
              type: (shop.image_url ? 'image' : 'svg') as 'svg' | 'image',
            }
          })

        // Parse name color
        let nameColor: string | null = null
        let nameColorIsGradient = false
        const colorShop = colorRes.data?.shop_name_colors as any
        if (colorShop && !Array.isArray(colorShop)) {
          nameColor = colorShop.color_value || null
          nameColorIsGradient = colorShop.is_gradient || false
        }

        // Parse background
        let backgroundContent: string | null = null
        let backgroundType: 'image' | 'css' | 'svg' | null = null
        const bgShop = bgRes.data?.shop_backgrounds as any
        if (bgShop && !Array.isArray(bgShop)) {
          if (bgShop.svg_code) { backgroundContent = bgShop.svg_code; backgroundType = 'svg' }
          else if (bgShop.image_url) { backgroundContent = bgShop.image_url; backgroundType = 'image' }
          else if (bgShop.css_value) { backgroundContent = bgShop.css_value; backgroundType = 'css' }
        }

        setCosmetics({ bannerContent, bannerType, frameContent, frameType, pins, nameColor, nameColorIsGradient, backgroundContent, backgroundType })
      } catch (error) {
        console.error('Error fetching cosmetics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [userId])

  return { cosmetics, loading }
}
