-- 026_shop_backgrounds_svg.sql
-- Ajout colonne svg_code + fonds SVG préfabriqués

-- Ajouter svg_code à shop_backgrounds
ALTER TABLE shop_backgrounds ADD COLUMN IF NOT EXISTS svg_code text;

-- Mettre à jour la contrainte pour autoriser svg_code aussi
ALTER TABLE shop_backgrounds DROP CONSTRAINT IF EXISTS chk_bg_content;
ALTER TABLE shop_backgrounds ADD CONSTRAINT chk_bg_content
  CHECK (image_url IS NOT NULL OR css_value IS NOT NULL OR svg_code IS NOT NULL);

-- =============================================
-- INSÉRER LES FONDS SVG / GRADIENT PRÉFABRIQUÉS
-- =============================================

INSERT INTO shop_backgrounds (name, description, price, rarity, css_value, svg_code) VALUES

-- 1. Nébuleuse Cosmique (CSS)
(
  'Nébuleuse Cosmique',
  'Un voyage à travers les étoiles avec des teintes violettes et bleues',
  500,
  'rare',
  'radial-gradient(ellipse at 20% 50%, #6d28d9 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #1d4ed8 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #0f172a 0%, #1e0a3c 100%)',
  NULL
),

-- 2. Aurora Boréale (CSS)
(
  'Aurora Boréale',
  'Les lumières mystérieuses du nord illuminent votre profil',
  750,
  'epic',
  'linear-gradient(180deg, #0f172a 0%, #064e3b 30%, #065f46 50%, #14532d 65%, #0f172a 100%)',
  NULL
),

-- 3. Feu & Braise (CSS)
(
  'Feu & Braise',
  'L''ardeur des flammes capturée dans votre profil',
  600,
  'rare',
  'radial-gradient(ellipse at 50% 100%, #dc2626 0%, #ea580c 30%, #78350f 60%, #1c0a00 100%)',
  NULL
),

-- 4. Vagues Océaniques (SVG)
(
  'Vagues Océaniques',
  'Des vagues apaisantes qui déferlent sur votre profil',
  450,
  'rare',
  NULL,
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="ocean-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0c1445"/><stop offset="100%" stop-color="#0d2d6b"/></linearGradient><linearGradient id="wave1-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e40af" stop-opacity="0.7"/><stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.3"/></linearGradient><linearGradient id="wave2-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.5"/><stop offset="100%" stop-color="#60a5fa" stop-opacity="0.2"/></linearGradient><linearGradient id="wave3-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#93c5fd" stop-opacity="0.3"/><stop offset="100%" stop-color="#bfdbfe" stop-opacity="0.1"/></linearGradient></defs><rect width="1440" height="560" fill="url(#ocean-bg)"/><path d="M0,280 C180,220 360,320 540,280 C720,240 900,340 1080,280 C1260,220 1350,300 1440,260 L1440,560 L0,560 Z" fill="url(#wave1-grad)"/><path d="M0,340 C200,280 400,380 600,330 C800,280 1000,380 1200,320 C1320,280 1400,340 1440,310 L1440,560 L0,560 Z" fill="url(#wave2-grad)"/><path d="M0,400 C240,350 480,430 720,390 C960,350 1200,430 1440,380 L1440,560 L0,560 Z" fill="url(#wave3-grad)"/></svg>'
),

-- 5. Réseau Hexagonal (SVG)
(
  'Réseau Hexagonal',
  'Un motif tech géométrique à l''infini',
  800,
  'epic',
  NULL,
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="hex-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0a0f1e"/><stop offset="100%" stop-color="#0f1a35"/></linearGradient><pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse"><polygon points="30,2 56,16 56,36 30,50 4,36 4,16" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-opacity="0.4"/><polygon points="30,8 50,20 50,32 30,44 10,32 10,20" fill="none" stroke="#3b82f6" stroke-width="0.3" stroke-opacity="0.2"/></pattern><radialGradient id="hex-glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#1d4ed8" stop-opacity="0.15"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs><rect width="1440" height="560" fill="url(#hex-bg)"/><rect width="1440" height="560" fill="url(#hex)"/><rect width="1440" height="560" fill="url(#hex-glow)"/></svg>'
),

-- 6. Galaxie Stellaire (SVG)
(
  'Galaxie Stellaire',
  'Une galaxie de milliers d''étoiles sur fond d''espace profond',
  1200,
  'legendary',
  NULL,
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="galaxy-bg" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#1a0533"/><stop offset="40%" stop-color="#0d0820"/><stop offset="100%" stop-color="#020208"/></radialGradient><radialGradient id="galaxy-core" cx="50%" cy="50%" r="30%"><stop offset="0%" stop-color="#7c3aed" stop-opacity="0.4"/><stop offset="60%" stop-color="#4c1d95" stop-opacity="0.15"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="1440" height="560" fill="url(#galaxy-bg)"/><rect width="1440" height="560" fill="url(#galaxy-core)"/><g filter="url(#glow)" fill="white"><circle cx="72" cy="45" r="1.2" opacity="0.9"/><circle cx="185" cy="120" r="0.8" opacity="0.7"/><circle cx="340" cy="35" r="1.5" opacity="0.95"/><circle cx="520" cy="90" r="0.9" opacity="0.6"/><circle cx="680" cy="25" r="1.1" opacity="0.85"/><circle cx="820" cy="75" r="0.7" opacity="0.8"/><circle cx="960" cy="40" r="1.3" opacity="0.9"/><circle cx="1100" cy="100" r="0.8" opacity="0.65"/><circle cx="1280" cy="55" r="1.0" opacity="0.75"/><circle cx="1380" cy="130" r="1.4" opacity="0.9"/><circle cx="130" cy="200" r="0.9" opacity="0.7"/><circle cx="260" cy="160" r="1.2" opacity="0.85"/><circle cx="450" cy="180" r="0.7" opacity="0.6"/><circle cx="600" cy="210" r="1.5" opacity="0.95"/><circle cx="750" cy="150" r="0.8" opacity="0.7"/><circle cx="900" cy="195" r="1.1" opacity="0.8"/><circle cx="1050" cy="170" r="0.9" opacity="0.75"/><circle cx="1200" cy="220" r="1.3" opacity="0.85"/><circle cx="1350" cy="190" r="0.7" opacity="0.65"/><circle cx="50" cy="300" r="1.0" opacity="0.8"/><circle cx="210" cy="280" r="1.4" opacity="0.9"/><circle cx="380" cy="320" r="0.8" opacity="0.7"/><circle cx="550" cy="270" r="1.2" opacity="0.85"/><circle cx="710" cy="310" r="0.9" opacity="0.75"/><circle cx="870" cy="285" r="1.5" opacity="0.9"/><circle cx="1020" cy="330" r="0.7" opacity="0.65"/><circle cx="1160" cy="295" r="1.1" opacity="0.8"/><circle cx="1310" cy="315" r="1.0" opacity="0.75"/><circle cx="1420" cy="270" r="1.3" opacity="0.85"/><circle cx="90" cy="420" r="0.8" opacity="0.7"/><circle cx="250" cy="400" r="1.2" opacity="0.9"/><circle cx="420" cy="445" r="0.9" opacity="0.75"/><circle cx="580" cy="410" r="1.4" opacity="0.85"/><circle cx="740" cy="435" r="0.7" opacity="0.65"/><circle cx="900" cy="400" r="1.1" opacity="0.8"/><circle cx="1060" cy="450" r="1.3" opacity="0.9"/><circle cx="1220" cy="415" r="0.8" opacity="0.7"/><circle cx="1390" cy="440" r="1.0" opacity="0.75"/><circle cx="170" cy="510" r="1.1" opacity="0.8"/><circle cx="330" cy="490" r="0.9" opacity="0.7"/><circle cx="490" cy="520" r="1.4" opacity="0.9"/><circle cx="650" cy="500" r="0.7" opacity="0.65"/><circle cx="810" cy="530" r="1.2" opacity="0.85"/><circle cx="970" cy="505" r="1.0" opacity="0.75"/><circle cx="1130" cy="520" r="0.8" opacity="0.7"/><circle cx="1290" cy="495" r="1.3" opacity="0.85"/><circle cx="720" cy="280" r="12" opacity="0.08" fill="#a855f7"/><circle cx="720" cy="280" r="6" opacity="0.12" fill="#c084fc"/><circle cx="720" cy="280" r="2" opacity="0.6" fill="white"/></g></svg>'
),

-- 7. Neon Cyber (SVG)
(
  'Neon Cyber',
  'L''esthétique cyberpunk avec ses lignes néon dans le noir',
  900,
  'epic',
  NULL,
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="cyber-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#020c10"/><stop offset="100%" stop-color="#051015"/></linearGradient><filter id="neon-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="line-cyan" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="transparent"/><stop offset="30%" stop-color="#06b6d4"/><stop offset="70%" stop-color="#22d3ee"/><stop offset="100%" stop-color="transparent"/></linearGradient><linearGradient id="line-pink" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="transparent"/><stop offset="30%" stop-color="#ec4899"/><stop offset="70%" stop-color="#f472b6"/><stop offset="100%" stop-color="transparent"/></linearGradient><linearGradient id="line-purple" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="transparent"/><stop offset="30%" stop-color="#a855f7"/><stop offset="70%" stop-color="#c084fc"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs><rect width="1440" height="560" fill="url(#cyber-bg)"/><g filter="url(#neon-glow)"><line x1="0" y1="140" x2="1440" y2="140" stroke="url(#line-cyan)" stroke-width="1.5" stroke-opacity="0.7"/><line x1="0" y1="280" x2="1440" y2="280" stroke="url(#line-pink)" stroke-width="1.5" stroke-opacity="0.7"/><line x1="0" y1="420" x2="1440" y2="420" stroke="url(#line-purple)" stroke-width="1.5" stroke-opacity="0.7"/><line x1="360" y1="0" x2="360" y2="560" stroke="#06b6d4" stroke-width="0.8" stroke-opacity="0.2"/><line x1="720" y1="0" x2="720" y2="560" stroke="#a855f7" stroke-width="0.8" stroke-opacity="0.2"/><line x1="1080" y1="0" x2="1080" y2="560" stroke="#ec4899" stroke-width="0.8" stroke-opacity="0.2"/><rect x="690" y="250" width="60" height="60" fill="none" stroke="#22d3ee" stroke-width="1" stroke-opacity="0.5"/><rect x="700" y="260" width="40" height="40" fill="none" stroke="#a855f7" stroke-width="0.5" stroke-opacity="0.4"/><circle cx="720" cy="280" r="8" fill="none" stroke="#f472b6" stroke-width="1" stroke-opacity="0.6"/></g><rect width="1440" height="560" fill="url(#cyber-bg)" opacity="0.3"/></svg>'
),

-- 8. Coucher de Soleil Doré (CSS)
(
  'Coucher de Soleil',
  'Les teintes chaudes d''un coucher de soleil sur l''horizon',
  400,
  'common',
  'linear-gradient(to bottom, #1a1a2e 0%, #16213e 20%, #0f3460 35%, #533483 50%, #e94560 65%, #f5a623 80%, #f7d08a 95%, #ffe4b5 100%)',
  NULL
)

ON CONFLICT DO NOTHING;
