'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Sword } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { DropsFeed } from '@/app/components/DropsFeed'
import PlayerHoverCard from '@/app/components/PlayerHoverCard'

// ─── Real platform coin logo ──────────────────────────────────────────────────
const COIN = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png'


interface CaseItem { id:string; name:string; image_url:string|null; market_value:number; rarity:string }
interface FloatCase {
  id:string; name:string; image_url:string|null; price_virtual:number; rarity:string|null; items:CaseItem[]
  left:number; top:number; size:number
  floatDur:number; floatDelay:number; rotAmp:number; z:number
  itemDir: 'right'|'left'|'left-down'|'up'|'down'|'center'
  maxItems?: number
}

// ─── Safe case slots ──────────────────────────────────────────────────────────
const SLOTS: Array<{left:number;top:number;size:number;floatDur:number;floatDelay:number;rotAmp:number;z:number;itemDir:FloatCase['itemDir']}> = [
  { left:11, top:79, size:110, floatDur:7.2, floatDelay:0,   rotAmp:8,  z:3, itemDir:'down'      },
  { left:27, top:77, size:95,  floatDur:9.1, floatDelay:1.5, rotAmp:10, z:2, itemDir:'right'     },
  { left:28, top:40, size:88,  floatDur:6.8, floatDelay:2.8, rotAmp:6,  z:2, itemDir:'right'     },
  { left:69, top:52, size:108, floatDur:8.5, floatDelay:0.8, rotAmp:7,  z:3, itemDir:'left-down' },
  { left:81, top:79, size:100, floatDur:10,  floatDelay:1.9, rotAmp:9,  z:3, itemDir:'left'      },
  { left:93, top:75, size:85,  floatDur:7.5, floatDelay:3.4, rotAmp:11, z:2, itemDir:'up'        },
]

// ─── Rarity ───────────────────────────────────────────────────────────────────
const RARITY: Record<string,{hex:string;rgb:string;label:string}> = {
  common:    {hex:'#94a3b8',rgb:'148,163,184',label:'Commun'},
  uncommon:  {hex:'#10b981',rgb:'16,185,129', label:'Peu Commun'},
  rare:      {hex:'#3b82f6',rgb:'59,130,246', label:'Rare'},
  epic:      {hex:'#a855f7',rgb:'168,85,247', label:'Épique'},
  legendary: {hex:'#f59e0b',rgb:'245,158,11', label:'Légendaire'},
}
const R = (k?:string|null) => RARITY[k?.toLowerCase()??'common'] ?? RARITY.common

// ─── Trajectory per direction ─────────────────────────────────────────────────
function getXY(idx:number, total:number, dir:FloatCase['itemDir'], caseSize:number): {x:number;y:number} {
  const d = caseSize * 0.85
  const positions = [
    { x: -d,      y: -d      }, // haut gauche
    { x:  d,      y: -d      }, // haut droit
    { x: -d,      y:  d      }, // bas gauche
    { x:  d,      y:  d      }, // bas droit
    { x:  0,      y:  d*1.1  }, // bas milieu
  ]
  return positions[idx % positions.length]
}

// ─── Web Audio ────────────────────────────────────────────────────────────────
class SFX {
  private ctx:AudioContext|null=null; muted=false
  private get ac(){
    if(this.muted) return null
    if(!this.ctx) try{this.ctx=new(window.AudioContext||(window as any).webkitAudioContext)()}catch{this.muted=true;return null}
    if(this.ctx.state==='suspended') this.ctx.resume(); return this.ctx
  }
  hover(){const c=this.ac;if(!c)return;const[o,g]=[c.createOscillator(),c.createGain()];o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.setValueAtTime(900,c.currentTime);o.frequency.exponentialRampToValueAtTime(1500,c.currentTime+0.06);g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(0.05,c.currentTime+0.01);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.14);o.start();o.stop(c.currentTime+0.16)}
  click(){const c=this.ac;if(!c)return;const[o1,g1]=[c.createOscillator(),c.createGain()];o1.connect(g1);g1.connect(c.destination);o1.type='sine';o1.frequency.setValueAtTime(190,c.currentTime);o1.frequency.exponentialRampToValueAtTime(50,c.currentTime+0.14);g1.gain.setValueAtTime(0.2,c.currentTime);g1.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.18);o1.start();o1.stop(c.currentTime+0.22);const[o2,g2]=[c.createOscillator(),c.createGain()];o2.connect(g2);g2.connect(c.destination);o2.type='triangle';o2.frequency.setValueAtTime(1200,c.currentTime+0.015);o2.frequency.exponentialRampToValueAtTime(2600,c.currentTime+0.1);g2.gain.setValueAtTime(0,c.currentTime);g2.gain.linearRampToValueAtTime(0.07,c.currentTime+0.025);g2.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.18);o2.start(c.currentTime+0.01);o2.stop(c.currentTime+0.22)}
  emerge(idx:number){const c=this.ac;if(!c)return;const t=c.currentTime+idx*0.045;const[o,f,g]=[c.createOscillator(),c.createBiquadFilter(),c.createGain()];o.connect(f);f.connect(g);g.connect(c.destination);f.type='bandpass';f.frequency.value=500+idx*140;o.type='sawtooth';o.frequency.setValueAtTime(300+idx*85,t);o.frequency.exponentialRampToValueAtTime(650+idx*85,t+0.08);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.03,t+0.015);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);o.start(t);o.stop(t+0.15)}
}
const audio = typeof window !== 'undefined' ? new SFX() : null

// ─── Floating item — LARGE, visible, no containers ───────────────────────────
function FloatItem({item, idx, total, active, caseSize, dir}:{
  item:CaseItem; idx:number; total:number; active:boolean; caseSize:number; dir:FloatCase['itemDir']
}) {
  const r = R(item.rarity)
  const {x,y} = getXY(idx, total, dir, caseSize)

  // Item image size: large for valuable items
  const imgSize = item.market_value > 400 ? 100
                : item.market_value > 200 ? 90
                : item.market_value > 80  ? 80
                : 70

  const floatOffset = -4 - (idx % 3) * 2
  const baseRotate  = 0

  useEffect(()=>{ if(active) audio?.emerge(idx) },[active,idx])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={item.id}
          initial={{ x:0, y: caseSize * 0.15, scale:0.05, opacity:0 }}
          animate={{ x, y, scale:1, opacity:1, rotate: 0 }}
          exit={{
            x: x*0.3, y: y*0.3, scale:0, opacity:0,
            transition:{ duration:0.22, ease:[0.4,0,1,1] }
          }}
          transition={{ type:'spring', stiffness:180, damping:16, delay:idx*0.06 }}
          style={{
            position:'absolute', top:'50%', left:'50%',
            marginTop: -imgSize/2, marginLeft: -imgSize/2,
            zIndex:60, pointerEvents:'none',
            paddingBottom: 28,
          }}
        >
          {/* Gentle float once out */}
          <motion.div
            animate={{ y:[0, floatOffset, 0] }}
            transition={{duration:2.2+idx*0.3, repeat:Infinity, ease:'easeInOut', delay:idx*0.22}}
          >
            {/* ── OUTER GLOW réduit ── */}
            <div style={{
              position:'absolute',
              top: -(imgSize*0.4), left: -(imgSize*0.4),
              width: imgSize*1.8, height: imgSize*1.8,
              borderRadius:'50%',
              background:`radial-gradient(circle, rgba(${r.rgb},0.25) 0%, rgba(${r.rgb},0.08) 40%, transparent 70%)`,
              filter:'blur(8px)',
              pointerEvents:'none',
            }}/>
            {/* ── THE IMAGE ── */}
            <div style={{ width:imgSize, height:imgSize, position:'relative' }}>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{
                    width:'100%', height:'100%', objectFit:'contain', display:'block',
                    filter:[
                      `drop-shadow(0 0 6px rgba(${r.rgb},0.5))`,
                      'brightness(1.05)',
                    ].join(' '),
                  }}
                  onError={e=>((e.target as HTMLImageElement).style.visibility='hidden')}
                />
              ) : (
                <div style={{
                  width:'100%', height:'100%', borderRadius:'50%',
                  background:`radial-gradient(circle, rgba(${r.rgb},0.85) 0%, rgba(${r.rgb},0.3) 60%, transparent 100%)`,
                  filter:`drop-shadow(0 0 16px ${r.hex})`,
                }}/>
              )}
            </div>

            {/* ── Value badge — centered under image, coin RIGHT of number ── */}
            <motion.div
              initial={{opacity:0, scale:0.5, y:4}}
              animate={{opacity:1, scale:1, y:0}}
              transition={{delay:idx*0.06+0.3}}
              style={{
                position:'absolute',
                top: imgSize + 6,
                left: '50%',
                transform: 'translateX(-50%)',
                display:'inline-flex', alignItems:'center', gap:3,
                padding:'4px 8px 4px 7px', borderRadius:999,
                background:`rgba(${r.rgb},0.22)`,
                border:`1.5px solid rgba(${r.rgb},0.6)`,
                whiteSpace:'nowrap',
                boxShadow:`0 2px 12px rgba(${r.rgb},0.35)`,
                overflow:'hidden',
              }}
            >
              <span style={{
                fontSize:12, fontWeight:900,
                color: r.hex,
                textShadow:`0 0 8px rgba(${r.rgb},0.9)`,
                lineHeight:1,
              }}>
                {item.market_value.toLocaleString()}
              </span>
              <img src={COIN} alt="coin" style={{width:16,height:16,objectFit:'contain',borderRadius:'50%',flexShrink:0,display:'block'}}
                onError={e=>((e.target as HTMLImageElement).style.display='none')}/>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── One floating case ────────────────────────────────────────────────────────
function FloatCaseCard({fc}:{fc:FloatCase}) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [gone,    setGone]    = useState(false)
  const r = R(fc.rarity)

  // Top items by value (maxItems per slot, default 5)
  const items = fc.items
    .sort((a,b)=>b.market_value-a.market_value)
    .slice(0, Math.min(fc.maxItems ?? 5, fc.items.length))

  const onEnter = useCallback(()=>{ setHovered(true);  audio?.hover() },[])
  const onLeave = useCallback(()=>{ setHovered(false) },[])
  const onClick = useCallback(()=>{
    if(gone) return; setGone(true); audio?.click()
    setTimeout(()=>router.push(`/boxes/${fc.id}`), 200)
  },[fc.id,router,gone])

  return (
    <motion.div
      style={{
        position:'absolute',
        left:`${fc.left}%`, top:`${fc.top}%`,
        zIndex: hovered ? 80 : fc.z,
      }}
      // Idle float
      animate={{
        y: [0, -(10 * fc.size/110), 0],
        rotate: [-fc.rotAmp/2, fc.rotAmp/2, -fc.rotAmp/2],
      }}
      transition={{
        y:      {duration:fc.floatDur,         delay:fc.floatDelay, repeat:Infinity, ease:'easeInOut'},
        rotate: {duration:fc.floatDur*1.4,     delay:fc.floatDelay, repeat:Infinity, ease:'easeInOut'},
      }}
      onHoverStart={onEnter}
      onHoverEnd={onLeave}
      onClick={onClick}
      className="cursor-pointer select-none"
    >
      {/* Items — anchored to case centre */}
      <div style={{position:'absolute', top:'50%', left:'50%', width:0, height:0}}>
        {items.map((item,i) => (
          <FloatItem
            key={item.id} item={item} idx={i} total={items.length}
            active={hovered} caseSize={fc.size} dir={fc.itemDir}
          />
        ))}
      </div>

      {/* Case — bare image + glow + price, no container */}
      <motion.div
        animate={{ scale: hovered ? 1.15 : 1 }}
        transition={{type:'spring', stiffness:260, damping:22}}
        style={{width:fc.size, height:fc.size, position:'relative', display:'flex', flexDirection:'column', alignItems:'center'}}
      >
        {/* Outer ambient glow */}
        <motion.div
          animate={{opacity: hovered ? 0.7 : 0.18, scale: hovered ? 1.3 : 1}}
          transition={{duration:0.35}}
          style={{
            position:'absolute',
            top: -(fc.size*0.45), left: -(fc.size*0.45),
            width: fc.size*2.9, height: fc.size*2.9,
            borderRadius:'50%', pointerEvents:'none',
            background:`radial-gradient(circle, rgba(${r.rgb},0.75) 0%, rgba(${r.rgb},0.25) 32%, transparent 65%)`,
            filter:'blur(22px)',
          }}
        />
        {/* Mid glow */}
        <motion.div
          animate={{opacity: hovered ? 0.6 : 0.1}}
          transition={{duration:0.3}}
          style={{
            position:'absolute',
            top:-12, left:-12, width:fc.size+24, height:fc.size+24,
            borderRadius:'50%', pointerEvents:'none',
            background:`radial-gradient(circle, rgba(${r.rgb},0.55) 0%, transparent 60%)`,
            filter:'blur(8px)',
          }}
        />

        {/* Bare case image */}
        {fc.image_url ? (
          <img src={fc.image_url} alt={fc.name} style={{
            width:fc.size, height:fc.size, objectFit:'contain', display:'block',
            filter: hovered
              ? `drop-shadow(0 0 28px rgba(${r.rgb},1)) drop-shadow(0 0 12px ${r.hex}) drop-shadow(0 0 4px ${r.hex}) brightness(1.18)`
              : `drop-shadow(0 0 10px rgba(${r.rgb},0.45)) brightness(1)`,
            transition:'filter 0.3s',
          }}
            onError={e=>((e.target as HTMLImageElement).style.opacity='0')}
          />
        ) : (
          <div style={{
            width:fc.size, height:fc.size, borderRadius:'50%',
            background:`radial-gradient(circle,rgba(${r.rgb},0.8),rgba(${r.rgb},0.2))`,
            filter:`drop-shadow(0 0 18px ${r.hex})`,
          }}/>
        )}

        {/* Price badge — just below image, coin RIGHT */}
        <div style={{
          marginTop:8,
          display:'inline-flex', alignItems:'center', gap:4,
          padding:'4px 10px', borderRadius:999,
          background:'rgba(255,255,255,0.07)',
          border:'1px solid rgba(255,255,255,0.12)',
          fontSize:11, fontWeight:900, color:r.hex,
          whiteSpace:'nowrap',
          backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
          boxShadow:'0 2px 12px rgba(0,0,0,0.2)',
        }}>
          {fc.price_virtual.toLocaleString()}
          <img src={COIN} alt="coin"
            style={{width:15,height:15,objectFit:'contain',borderRadius:'50%',flexShrink:0}}
            onError={e=>((e.target as HTMLImageElement).style.display='none')}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}


// ─── Glass Panel (murphy-style switchable) ────────────────────────────────────
const PANEL_W = 'clamp(300px, 20.8vw, 480px)'
const PANEL_H = 'clamp(160px, 10.4vw, 240px)'

const PANEL_SLIDES = [
  {
    label: '🔥 Top Drop',
    value: '€ 1 440',
    detail: 'Hoodie Nike Air',
    badge: 'Légendaire',
    sub: 'il y a 3 min · valeur réelle garantie',
    accent: '#f59e0b',
    rgb: '245,158,11',
    icon: '👟',
  },
  {
    label: '📊 Stats Live',
    value: '2 847',
    detail: "ouvertures aujourd'hui",
    badge: '+12% vs hier',
    sub: 'données en temps réel',
    accent: '#4578be',
    rgb: '69,120,190',
    icon: '📈',
  },
  {
    label: '⚡ Battle en cours',
    value: '€ 2 380',
    detail: '4 joueurs · pot total',
    badge: '00:42 restant',
    sub: 'rejoindre la partie →',
    accent: '#a855f7',
    rgb: '168,85,247',
    icon: '⚔️',
  },
]


const LEGENDARY_ITEMS_GIVEAWAY = [{"name": "Nintendo Switch Lite", "img": "https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/SWITCH%20GAME%20BOX/Nintendo_Switch_Lite_HDHSBBZAA-removebg-preview.png"}, {"name": "Gucci Zip Jacket", "img": "https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/GUCCI%20BOX/Gucci_GG_Technical_Jersey_Zip_Jacket-removebg-preview.png"}, {"name": "Dior x Cactus Jack", "img": "https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/T-Shirt%20BOX/Dior_x_CACTUS_JACK_Oversized_T-shirt-removebg-preview.png"}, {"name": "Steam 170$", "img": "https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/CARTES%20CADEAUX%20BOX/carte_cadeau_steam-removebg-preview.png"}, {"name": "Amazon 200$", "img": "https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/CARTES%20CADEAUX%20BOX/Carte_cadeau_Amazon-removebg-preview%20(1).png"}, {"name": "Burberry x Minecraft Coat", "img": "https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/MINECRAFT%20BOX/Burberry_x_Minecraft_Monogram_Motif_Cotton_Gabardine_Car_Coat-removebg-preview.png"}, {"name": "Nintendo Switch 2", "img": "https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/SWITCH%20GAME%20BOX/Nintendo_Switch_2_GameCube_Controller-removebg-preview.png"}]

function GiveawayLegendaryBox() {
  const [idx, setIdx] = useState(0)
  const ITEMS = LEGENDARY_ITEMS_GIVEAWAY
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ITEMS.length), 10000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <AnimatePresence mode="wait">
        <motion.img key={idx} src={ITEMS[idx].img}
          initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
          transition={{duration:0.3}}
          style={{width:96,height:96,objectFit:'contain'}}
        />
      </AnimatePresence>
    </div>
  )
}

function GiveawayPanel({ left, top, floatDelay = 0 }: { left: string; top: string; floatDelay?: number }) {
  return (
    <motion.div
      style={{ position: 'absolute', left, top, zIndex: 5, width: PANEL_W, pointerEvents: 'auto' }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: floatDelay }}
    >
      <div style={{
        width: PANEL_W, height: PANEL_H, borderRadius: 18,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ height: 1, flexShrink: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.8) 40%, rgba(245,158,11,0.4) 70%, transparent 100%)' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', padding: '6px 14px 0', gap: 10 }}>
          {/* Coins */}
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <span style={{fontSize:8,visibility:'hidden'}}>x</span>
            <div style={{width:'100%',height:116,borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
              <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" style={{width:80,height:80,objectFit:'contain'}}/>
              <span style={{position:'absolute',bottom:6,left:0,right:0,textAlign:'center',fontSize:8,fontWeight:700,color:'rgba(255,255,255,0.55)',letterSpacing:'0.06em',textTransform:'uppercase'}}>Coins</span>
            </div>
          </div>
          {/* Diamonds */}
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <span style={{fontSize:8,fontWeight:700,color:'rgba(255,255,255,0.55)',letterSpacing:'0.06em',textTransform:'uppercase'}}>Drop dans le chat</span>
            <div style={{width:'100%',height:116,borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
              <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/diamant.png" style={{width:64,height:64,objectFit:'contain'}}/>
              <span style={{position:'absolute',bottom:6,left:0,right:0,textAlign:'center',fontSize:8,fontWeight:700,color:'rgba(255,255,255,0.55)',letterSpacing:'0.06em',textTransform:'uppercase'}}>Reevs</span>
            </div>
          </div>
          {/* Legendary */}
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <span style={{fontSize:8,visibility:'hidden'}}>x</span>
            <div style={{width:'100%',height:116,borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',position:'relative',overflow:'hidden'}}>
              <GiveawayLegendaryBox />
              <span style={{position:'absolute',bottom:6,left:0,right:0,textAlign:'center',fontSize:8,fontWeight:700,color:'rgba(255,255,255,0.55)',letterSpacing:'0.06em',textTransform:'uppercase'}}>Item</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{
            width: '100%', padding: '6px 0', borderRadius: 8, border: 'none',
            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
            fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
            textAlign: 'center',
          }}>
            🎁 Giveaway Chat
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function GlassPanel({
  left, top, floatDelay = 0, initSlide = 0,
}: {
  left: string; top: string; floatDelay?: number; initSlide?: number
}) {
  const [slide, setSlide] = useState(initSlide)
  const s = PANEL_SLIDES[slide]

  return (
    <motion.div
      style={{ position: 'absolute', left, top, zIndex: 5, width: PANEL_W, pointerEvents: 'auto' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: floatDelay }}
    >
      {/* Outer glow */}
      <div style={{
        position: 'absolute', inset: -1, borderRadius: 18, pointerEvents: 'none',
        background: `linear-gradient(135deg, rgba(${s.rgb},0.35) 0%, transparent 60%)`,
        filter: 'blur(1px)',
      }} />

      <div style={{
        width: PANEL_W, height: PANEL_H, borderRadius: 18,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.35s, box-shadow 0.35s',
      }}>
        {/* Top shimmer line */}
        <div style={{
          height: 1, flexShrink: 0,
          background: `linear-gradient(90deg, transparent 0%, rgba(${s.rgb},0.8) 40%, rgba(${s.rgb},0.4) 70%, transparent 100%)`,
          transition: 'background 0.35s',
        }} />

        {/* Main content row */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center',
              padding: '0 14px', gap: 10,
            }}
          >
            {/* Icon circle */}
            {s.icon && (
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `rgba(${s.rgb},0.12)`,
              border: `1px solid rgba(${s.rgb},0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              {s.icon}
            </div>
            )}

            {/* Text block */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: s.accent, textTransform: 'uppercase', marginBottom: 3,
                textShadow: `0 0 8px rgba(${s.rgb},0.7)`,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 22, fontWeight: 900, lineHeight: 1, color: '#fff',
                marginBottom: 3,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {s.detail}
              </div>
            </div>

            {/* Right badge + sub */}
            {s.badge && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 800,
                padding: '3px 8px', borderRadius: 6,
                background: `rgba(${s.rgb},0.15)`,
                border: `1px solid rgba(${s.rgb},0.35)`,
                color: s.accent, marginBottom: 6,
                whiteSpace: 'nowrap',
              }}>
                {s.badge}
              </div>
              <div style={{
                fontSize: 9, color: 'rgba(255,255,255,0.25)',
                lineHeight: 1.35, maxWidth: 80,
              }}>
                {s.sub}
              </div>
            </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tab nav */}
        <div style={{
          display: 'flex', gap: 5, padding: '0 14px 12px',
        }}>
          {PANEL_SLIDES.map((ps, i) => (
            <button key={i} onClick={() => setSlide(i)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontSize: 9, fontWeight: 800,
                letterSpacing: '0.04em',
                transition: 'all 0.22s',
                background: i === slide ? s.accent : 'rgba(255,255,255,0.05)',
                color: i === slide ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: i === slide ? `0 0 14px rgba(${s.rgb},0.55)` : 'none',
              }}
            >
              {ps.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}



// ─── Games Panel ──────────────────────────────────────────────────────────────
const GAMES_DATA = [
  { name:'Crash',    href:'/games/crash',   icon:'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(64).png', gradient:'linear-gradient(135deg,#ef4444,#f97316,#ec4899)', available:true },
  { name:'Mines',    href:'/games/mines',   icon:'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(63).png', gradient:'linear-gradient(135deg,#a855f7,#ec4899,#f43f5e)', available:true },
  { name:'Upgrade',  href:'/games/upgrade', icon:'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(61).png', gradient:'linear-gradient(135deg,#4578be,#5588ce,#6598de)', available:true },
  { name:'Coinflip', href:'/games/coinflip',icon:'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(65).png', gradient:'linear-gradient(135deg,#3b82f6,#06b6d4,#14b8a6)', available:true },
  { name:'Roulette', href:'/games/roulette',icon:'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(66).png', gradient:'linear-gradient(135deg,#f59e0b,#f97316)', available:false },
]

function GamesPanel({ left, top }: { left: string; top: string }) {
  const router = useRouter()
  return (
    <motion.div
      style={{ position: 'absolute', left, top, zIndex: 5, width: 400, pointerEvents: 'auto' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 1.0 }}
    >
      <div style={{
        borderRadius: 18,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        overflow: 'hidden', padding: '12px 14px 14px',
      }}>
        <div style={{ height: 1, marginBottom: 10, background: 'linear-gradient(90deg,transparent,rgba(69,120,190,0.8) 40%,rgba(69,120,190,0.4) 70%,transparent)' }} />
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          🎮 Nos Jeux
        </div>

        {/* Available games — horizontal row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {GAMES_DATA.map((g, i) => (
            <motion.div key={g.name}
              onClick={() => router.push(g.href)}
              whileHover={g.available ? { y: -4, scale: 1.04 } : {}} whileTap={g.available ? { scale: 0.96 } : {}}
              style={{ flex: 1, cursor: g.available ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: g.available ? 1 : 0.45, filter: g.available ? 'none' : 'grayscale(1)' }}
            >
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 14, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
              }}>
                <img src={g.icon} alt={g.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity='0.3' }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{g.name}</span>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                style={{
                  width: '100%', padding: '6px 0', borderRadius: 8, border: 'none',
                  background: g.gradient, color: '#fff',
                  fontSize: 9.5, fontWeight: 800, cursor: g.available ? 'pointer' : 'default',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
{g.available ? 'Jouer →' : 'Soon'}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Coming soon */}

      </div>
    </motion.div>
  )
}

// ─── Leaderboard Panel ────────────────────────────────────────────────────────
const MEDAL = ['🥇','🥈','🥉']
const MEDAL_IMGS = [
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/medaille.png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/medaille%20(1).png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/medaille%20(2).png',
]
const GAGNANT = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/gagnant.png'
const MEDAL_COLOR = ['#f59e0b','#94a3b8','#cd7c3a']
const MEDAL_GLOW  = ['rgba(245,158,11,0.35)','rgba(148,163,184,0.25)','rgba(205,124,58,0.25)']
const BAR_H = [52, 38, 28] // podium bar heights in px

function LeaderboardPanel({ left, top }: { left: string; top: string }) {
  const [players, setPlayers] = useState<{id:string;username:string;avatar_url:string|null;total_exp:number|null;level:number|null}[]>([])
  const sb = createClient()

  useEffect(() => {
    sb.from('profiles')
      .select('id, username, avatar_url, total_exp, level')
      .not('username','is',null)
      .order('total_exp',{ascending:false})
      .limit(3)
      .then(({data,error}) => {
        if (error) { console.error('leaderboard error:', error); return }
        if (data) setPlayers(data as any)
      })
  }, [])

  // reorder for podium: 2nd, 1st, 3rd
  const podium = players.length === 3
    ? [players[1], players[0], players[2]]
    : players

  return (
    <motion.div
      style={{ position:'absolute', left, top, zIndex:5, width:PANEL_W, pointerEvents:'auto' }}
      initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.55,delay:1.1}}
    >
      <div style={{
        borderRadius:18,
        background:'rgba(255,255,255,0.04)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        border:'1px solid rgba(255,255,255,0.08)',
        boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
        overflow:'hidden', padding:'12px 14px 14px',
        width: PANEL_W, height: PANEL_H, boxSizing: 'border-box' as const,
      }}>
        <div style={{height:1,marginBottom:10,background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.8) 40%,rgba(245,158,11,0.4) 70%,transparent)'}}/>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>
          <img src={GAGNANT} alt="" style={{width:18,height:18,objectFit:'contain'}}/>
          Leaderboard
        </div>

        {players.length === 0 ? (
          <div style={{textAlign:'center',color:'rgba(255,255,255,0.2)',fontSize:11,padding:'20px 0'}}>Chargement…</div>
        ) : (
          <>
          <style>{`
            .lb-hover-wrap [data-radix-popper-content-wrapper],
            .lb-hover-wrap [role="tooltip"],
            .lb-hover-wrap .player-hover-card {
              right: 0 !important;
              left: auto !important;
              transform-origin: top right !important;
            }
          `}</style>
          <div className="lb-hover-wrap" style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:8,height:130,marginTop:4}}>
            {podium.map((p, podiumIdx) => {
              const rankIdx = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2
              const barH = BAR_H[rankIdx]
              return (
                <div key={p.username} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1}}>
                  {/* Avatar with hover card */}
                  <PlayerHoverCard userId={p.id} isBot={false}>
                  <div style={{position:'relative',marginBottom:4}}>
                    <div style={{
                      width:36,height:36,borderRadius:'50%',overflow:'hidden',
                      border:`2px solid ${MEDAL_COLOR[rankIdx]}`,
                      boxShadow:`0 0 10px ${MEDAL_GLOW[rankIdx]}`,
                    }}>
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt={p.username} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <div style={{width:'100%',height:'100%',background:'rgba(69,120,190,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff',fontWeight:800}}>
                            {p.username?.[0]?.toUpperCase()}
                          </div>
                      }
                    </div>
                    <span style={{position:'absolute',bottom:-6,right:-6,fontSize:12,display:'none'}}>{MEDAL[rankIdx]}</span>
                  </div>
                  </PlayerHoverCard>
                  {/* Username */}
                  <span style={{fontSize:9,fontWeight:700,color:'#fff',maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center',marginBottom:4}}>
                    {p.username}
                  </span>
                  {/* Medal image above bar */}
                  <img src={MEDAL_IMGS[rankIdx]} alt="" style={{width:28,height:28,objectFit:'contain',marginBottom:2}}/>
                  {/* Podium bar */}
                  <div style={{
                    width:'100%',height:barH,borderRadius:'6px 6px 0 0',
                    background:`linear-gradient(180deg,${MEDAL_COLOR[rankIdx]}33,${MEDAL_COLOR[rankIdx]}11)`,
                    border:`1px solid ${MEDAL_COLOR[rankIdx]}55`,
                    borderBottom:'none',
                    display:'flex',alignItems:'center',justifyContent:'center',
                  }}>
                    <span style={{fontSize:8.5,fontWeight:800,color:MEDAL_COLOR[rankIdx]}}>
                      {(p.total_exp ?? 0).toLocaleString('fr-FR')} XP
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── Atmospheric background ───────────────────────────────────────────────────
// ─── TrustBadge — expands independently downward ─────────────────────────────
function TrustBadge({ icon, label, description, delay }: {
  icon: React.ReactNode; label: string; description: React.ReactNode; delay: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay}}
      onHoverStart={()=>setOpen(true)}
      onHoverEnd={()=>setOpen(false)}
      style={{
        alignSelf:'flex-start',       // ← clé : grandit vers le bas sans pousser les voisins
        overflow:'hidden', borderRadius:12, width:200,
        background: open ? 'rgba(69,120,190,0.1)' : 'rgba(var(--surface-elevated),0.6)',
        border: open ? '1px solid rgba(69,120,190,0.4)' : '1px solid rgb(var(--border))',
        backdropFilter:'blur(8px)', cursor:'default',
        transition:'background 0.25s, border 0.25s',
      }}
    >
      {/* Header — toujours visible */}
      <div style={{
        display:'flex', alignItems:'center', gap:6,
        fontSize:12, fontWeight:600, padding:'8px 14px',
        color: open ? '#7ba3d8' : 'rgb(var(--text-secondary))',
        transition:'color 0.25s', userSelect:'none',
      }}>
        <span style={{display:'flex',flexShrink:0}}>{icon}</span>
        {label}
        <motion.svg
          animate={{rotate: open ? 180 : 0}} transition={{duration:0.22}}
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          style={{marginLeft:'auto', opacity:0.45, flexShrink:0}}
        >
          <polyline points="6 9 12 15 18 9"/>
        </motion.svg>
      </div>

      {/* Description — s'ouvre vers le bas indépendamment */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{height:0, opacity:0}}
            animate={{height:'auto', opacity:1}}
            exit={{height:0, opacity:0}}
            transition={{duration:0.26, ease:[0.4,0,0.2,1]}}
            style={{overflow:'hidden'}}
          >
            <div style={{
              padding:'10px 14px 12px',
              fontSize:11, lineHeight:1.7,
              color:'rgba(255,255,255,0.52)',
              borderTop:'1px solid rgba(69,120,190,0.15)',
            }}>
              {description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AtmoBG() {
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf: number, t = 0

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    // Orbs config — 5 large blurred light sources
    const orbs = [
      { x: 0.18, y: 0.22, r: 0.38, color: [69, 120, 190],   speed: 0.00018, ox: 0.06, oy: 0.05 },
      { x: 0.78, y: 0.18, r: 0.32, color: [139, 92, 246],   speed: 0.00024, ox: 0.05, oy: 0.07 },
      { x: 0.55, y: 0.72, r: 0.30, color: [20, 184, 166],   speed: 0.00020, ox: 0.07, oy: 0.04 },
      { x: 0.88, y: 0.65, r: 0.26, color: [245, 158, 11],   speed: 0.00016, ox: 0.04, oy: 0.06 },
      { x: 0.30, y: 0.80, r: 0.22, color: [99, 102, 241],   speed: 0.00022, ox: 0.05, oy: 0.03 },
    ]

    // Mesh noise lines
    const LINES = 9
    const linePhases = Array.from({length: LINES}, (_, i) => i * 0.7)

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // ── Orbs ──
      orbs.forEach((o, i) => {
        const px = (o.x + Math.sin(t * o.speed * 1000 + i * 1.3) * o.ox) * W
        const py = (o.y + Math.cos(t * o.speed * 800  + i * 0.9) * o.oy) * H
        const rr = o.r * Math.min(W, H)
        const [r, g, b] = o.color
        const grd = ctx.createRadialGradient(px, py, 0, px, py, rr)
        grd.addColorStop(0,   `rgba(${r},${g},${b},0.13)`)
        grd.addColorStop(0.4, `rgba(${r},${g},${b},0.07)`)
        grd.addColorStop(1,   `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)
      })

      // ── Mesh wave lines (Linear-style) ──
      ctx.save()
      for (let l = 0; l < LINES; l++) {
        const yBase = (l / (LINES - 1)) * H
        const alpha = 0.028 + (l % 3 === 0 ? 0.018 : 0)
        ctx.beginPath()
        ctx.moveTo(0, yBase)
        for (let x = 0; x <= W; x += 4) {
          const wave =
            Math.sin(x * 0.003 + t * 0.6 + linePhases[l]) * 18 +
            Math.sin(x * 0.007 + t * 0.4 + linePhases[l] * 1.4) * 10 +
            Math.sin(x * 0.0015 + t * 0.25 + l) * 28
          ctx.lineTo(x, yBase + wave)
        }
        ctx.strokeStyle = `rgba(130,170,255,${alpha})`
        ctx.lineWidth = l % 3 === 0 ? 1.2 : 0.6
        ctx.stroke()
      }
      ctx.restore()

      // ── Noise grain overlay (Stripe-style) ──
      // Subtle — just 40 random bright dots per frame
      for (let i = 0; i < 40; i++) {
        const gx = Math.random() * W
        const gy = Math.random() * H
        const a = Math.random() * 0.025
        ctx.fillStyle = `rgba(200,220,255,${a})`
        ctx.fillRect(gx, gy, 1, 1)
      }

      // ── Top center glow (Vercel-style hero beam) ──
      const beam = ctx.createRadialGradient(W * 0.5, -H * 0.05, 0, W * 0.5, -H * 0.05, W * 0.55)
      beam.addColorStop(0,   'rgba(90,140,255,0.18)')
      beam.addColorStop(0.5, 'rgba(90,140,255,0.06)')
      beam.addColorStop(1,   'rgba(90,140,255,0)')
      ctx.fillStyle = beam
      ctx.fillRect(0, 0, W, H)

      // ── Vignette ──
      const vig = ctx.createRadialGradient(W*.5, H*.5, 0, W*.5, H*.5, Math.max(W,H)*.75)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.32)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      t += 0.016
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <>
      {/* Base gradient — dark mode deep space */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'linear-gradient(135deg, #06091a 0%, #0a0e1a 40%, #080b18 70%, #06091f 100%)',
      }}/>
      {/* Animated canvas on top */}
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HeroSection() {
  const [cases, setCases] = useState<FloatCase[]>([])

  useEffect(()=>{
    ;(async()=>{
      try {
        const sb = createClient()
        const { data } = await sb
          .from('loot_boxes')
          .select(`
            id, name, image_url, price_virtual, rarity,
            loot_box_items (
              probability, display_order,
              items ( id, name, image_url, market_value, rarity )
            )
          `)
          .eq('is_active', true)
          .neq('is_daily_free', true)   // no free drop cases
          .gt('price_virtual', 0)        // only purchasable
          .order('price_virtual', {ascending:false})
          .limit(6)

        if (data?.length) {
          setCases(data.slice(0, SLOTS.length).map((b:any, i) => ({
            id: b.id, name: b.name, image_url: b.image_url,
            price_virtual: b.price_virtual, rarity: b.rarity,
            items: (b.loot_box_items??[])
              .filter((li:any)=>li?.items?.id)
              .map((li:any)=>({
                id:li.items.id, name:li.items.name,
                image_url:li.items.image_url,
                market_value:li.items.market_value,
                rarity:li.items.rarity,
              }))
              .sort((a:CaseItem,b:CaseItem)=>b.market_value-a.market_value),
            ...SLOTS[i],
          })))
        }
      } catch { /* fail silently */ }
    })()
  },[])

  return (
    <section style={{position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
      <AtmoBG/>

      {cases.map(fc => <FloatCaseCard key={fc.id} fc={fc}/>)}

      {/* ── Glass Panels ── */}
      {/* Panel 1 — Top Drop : gauche, aligné avec DropsFeed */}
      <GiveawayPanel left="1vw" top="11%" floatDelay={0.5} />
      {/* Panel 2 — Battle : droite, aligné avec DropsFeed */}
      <GlassPanel left="calc(100% - 1vw - clamp(300px, 20.8vw, 480px))" top="11%" floatDelay={0.9} initSlide={2} />
      {/* Panel 3 — Jeux : en dessous de Battle */}
      <GamesPanel left="1vw" top="calc(11% + clamp(160px, 10.4vw, 240px) + 3%)" />
      <LeaderboardPanel left="calc(100% - 1vw - clamp(300px, 20.8vw, 480px))" top="calc(11% + clamp(160px, 10.4vw, 240px) + 3%)" />

      {/* Live/Legendary drops panel — below Lego */}
      {/* Live drops — below trust strip */}
      <motion.div
        style={{ position:'absolute', left:`calc(1vw + clamp(300px, 20.8vw, 480px) + 1vw)`, top:'11%', width:`calc(100% - 2*(1vw + clamp(300px, 20.8vw, 480px) + 1vw))`, zIndex:5, pointerEvents:'auto' }}
        initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.55,delay:1.2}}
      >
        <div style={{
          borderRadius:16,
          background:'rgba(255,255,255,0.04)',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
          overflow:'hidden', minHeight:200, height:200,
        }}>
          <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(69,120,190,0.8) 40%,rgba(69,120,190,0.4) 70%,transparent)'}}/>
          <DropsFeed className="" />
        </div>
      </motion.div>

      {/* ── Copy ── */}
      <div style={{position:'relative', zIndex:10, textAlign:'center', padding:'0 24px', maxWidth:880, margin:'0 auto', marginTop:'38vh'}}>

        {/* Headline */}
        <motion.h1
          initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.1}}
          style={{
            fontSize:'clamp(52px,9vw,96px)', fontWeight:900,
            lineHeight:0.92, letterSpacing:'-0.03em',
            color:'rgb(var(--text-primary))', marginBottom:22,
            position:'relative', top:'-10vh',
          }}
        >
          {/* ── COPY: Final Version (highest-converting) ──
              A/B Test 1 variant:
              Line 1: "Luck Is Calling."
              Line 2: "Will You Answer?"
              Sub:    "Open mystery boxes. Win real items. Shipped straight to your door."
          */}
          <motion.span style={{display:'block'}} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:0.16}}>Fortune Favors</motion.span>
          <motion.span
            style={{
              display:'block',
              background:'linear-gradient(135deg,#4578be 0%,#7ba3d8 28%,#f59e0b 62%,#ef4444 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}
            initial={{opacity:0,scale:0.86}} animate={{opacity:1,scale:1}} transition={{delay:0.28}}
          >
            The Bold.
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.34}}
          style={{fontSize:'clamp(16px,2.2vw,22px)', color:'rgb(var(--text-secondary))', maxWidth:480, margin:'0 auto 38px', lineHeight:1.6, position:'relative', top:'-10vh'}}
        >
          Open mystery boxes. Win real items.{' '}
          <strong style={{color:'rgb(var(--text-primary))'}}>Shipped straight to your door.</strong>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.55,delay:0.46}}
          style={{display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', position:'relative', top:'-10vh'}}
        >
          <Link href="/boxes">
            <motion.button
              onHoverStart={()=>audio?.hover()} onClick={()=>audio?.click()}
              whileHover={{scale:1.04, boxShadow:'0 22px 55px rgba(69,120,190,0.52)'}}
              whileTap={{scale:0.96}}
              style={{
                position:'relative', overflow:'hidden',
                padding:'18px 40px', borderRadius:18,
                fontWeight:900, fontSize:17, color:'#fff',
                background:'linear-gradient(135deg,#4578be 0%,#2d5aa0 100%)',
                border:'2px solid transparent', cursor:'pointer',
              }}
            >
              <motion.div
                style={{position:'absolute',inset:0,pointerEvents:'none',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)'}}
                animate={{x:['-100%','200%']}} transition={{duration:2.8,repeat:Infinity,ease:'linear',repeatDelay:1.4}}
              />
              <span style={{position:'relative'}}><Package className="inline w-4 h-4 mr-1 mb-0.5" /> Open a Box</span>
            </motion.button>
          </Link>
          <Link href="/battles">
            <motion.button
              onHoverStart={()=>audio?.hover()} onClick={()=>audio?.click()}
              whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              style={{
                padding:'18px 40px', borderRadius:18,
                fontWeight:700, fontSize:17,
                background:'rgba(69,120,190,0.08)', border:'2px solid rgba(69,120,190,0.28)',
                color:'rgb(var(--text-primary))', cursor:'pointer',
              }}
            >
              <Sword className="inline w-4 h-4 mr-1 mb-0.5" /> Battle Now
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.7}}
          style={{
            display:'flex', flexWrap:'wrap', gap:10,
            justifyContent:'center', alignItems:'flex-start', // ← empêche l'étirement vertical
            marginTop:16, position:'relative', top:'-5vh'
          }}
        >
          <TrustBadge delay={0.76} label="Provably Fair"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>}
            description={<>Every box opening uses a <span style={{color:'#7ba3d8',fontWeight:600}}>cryptographically verified</span> random algorithm. Results are generated before you open — publicly auditable. We cannot manipulate outcomes.</>}
          />
          <TrustBadge delay={0.83} label="Worldwide Shipping"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
            description={<>Win an item and withdraw it — we ship it <span style={{color:'#22c55e',fontWeight:600}}>anywhere in the world</span>, straight to your door. Fast, tracked and fully insured.</>}
          />
          <TrustBadge delay={0.90} label="Real Physical Items"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>}
            description={<>Every item is real and withdrawable. If unavailable, we guarantee a <span style={{color:'#f59e0b',fontWeight:600}}>swap of equal or higher value</span>. You always win something real.</>}
          />
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        style={{position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:10}}
        animate={{y:[0,9,0]}} transition={{duration:1.9,repeat:Infinity}}
      >
        <div style={{
          width:24, height:40, borderRadius:12,
          border:'2px solid rgb(var(--border))',
          display:'flex', alignItems:'flex-start', justifyContent:'center', padding:4,
        }}>
          <motion.div
            style={{width:6,height:12,borderRadius:3,background:'#4578be'}}
            animate={{opacity:[1,0],y:[0,14]}} transition={{duration:1.9,repeat:Infinity}}
          />
        </div>
      </motion.div>
    </section>
  )
}