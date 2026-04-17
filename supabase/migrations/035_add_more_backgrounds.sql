-- Migration 035: Add more shop backgrounds
-- Adds diverse CSS gradient and animated backgrounds to shop_backgrounds

INSERT INTO shop_backgrounds (name, description, price, rarity, css_value, image_url, svg_code) VALUES

-- Common (gratuits / bon marché)
('Nuit Bleue', 'Un fond bleu nuit profond apaisant', 500, 'common',
 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', NULL, NULL),

('Forêt Sombre', 'Teintes vertes mystérieuses', 500, 'common',
 'linear-gradient(135deg, #0a1628 0%, #0d2b1a 50%, #071020 100%)', NULL, NULL),

('Coucher de Soleil', 'Dégradé chaud du soleil couchant', 500, 'common',
 'linear-gradient(135deg, #f093fb 0%, #f5576c 40%, #fda085 100%)', NULL, NULL),

('Océan Profond', 'Les abysses marines', 600, 'common',
 'linear-gradient(180deg, #001a33 0%, #003366 40%, #006699 100%)', NULL, NULL),

('Brume Violette', 'Vapeurs mystiques violettes', 600, 'common',
 'linear-gradient(135deg, #1a0533 0%, #3d1466 50%, #6b21a8 100%)', NULL, NULL),

-- Rare
('Aurora', 'Aurore boréale aux teintes magiques', 1500, 'rare',
 'linear-gradient(135deg, #00c6ff 0%, #0072ff 25%, #a855f7 50%, #22d3ee 75%, #00c6ff 100%)', NULL, NULL),

('Ember', 'Braises ardentes, rouge et orange', 1500, 'rare',
 'linear-gradient(135deg, #1a0505 0%, #7f1d1d 30%, #dc2626 60%, #f97316 85%, #fbbf24 100%)', NULL, NULL),

('Minuit Rose', 'Rose et noir, élégance nocturne', 1800, 'rare',
 'linear-gradient(135deg, #0d0d0d 0%, #1f0a1f 40%, #831843 70%, #f43f5e 100%)', NULL, NULL),

('Cyberpunk', 'Néons cyan et magenta électriques', 2000, 'rare',
 'linear-gradient(135deg, #000000 0%, #0d1b2a 30%, #00ffff 60%, #ff00ff 80%, #000000 100%)', NULL, NULL),

('Galaxie', 'Poussière d''étoiles multicolore', 2200, 'rare',
 'radial-gradient(ellipse at 20% 50%, #7c3aed 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #2563eb 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #0891b2 0%, transparent 50%), linear-gradient(135deg, #0a0a1a 0%, #1a1040 100%)', NULL, NULL),

-- Epic
('Feu Glacial', 'Fusion de glace et de feu', 4000, 'epic',
 'linear-gradient(135deg, #0c1445 0%, #1d4ed8 25%, #7c3aed 50%, #dc2626 75%, #f97316 100%)', NULL, NULL),

('Néon Ville', 'Skyline cyberpunk baignée de néons', 5000, 'epic',
 'radial-gradient(ellipse at top, #312e81 0%, #1e1b4b 40%, #0f0c29 100%)', NULL, NULL),

('Spectre', 'Arc-en-ciel sombre et mystérieux', 5500, 'epic',
 'linear-gradient(135deg, #ff0080 0%, #7928ca 20%, #0070f3 40%, #00dfd8 60%, #ff0080 80%, #7928ca 100%)', NULL, NULL),

('Cosmos Doré', 'L''univers aux teintes d''or', 6000, 'epic',
 'radial-gradient(ellipse at center, #78350f 0%, #92400e 30%, #1c1917 60%, #0c0a09 100%)', NULL, NULL),

-- Legendary
('Infini', 'Le vide infini de l''espace-temps', 12000, 'legendary',
 'radial-gradient(ellipse at 10% 20%, #4c1d95 0%, transparent 40%), radial-gradient(ellipse at 90% 80%, #1e3a8a 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, #0f172a 0%, #000000 100%)', NULL, NULL),

('Dieu Mode', 'Réservé aux légendes absolues', 20000, 'legendary',
 'linear-gradient(135deg, #ffd700 0%, #ff8c00 15%, #ff0000 30%, #ff69b4 45%, #da70d6 60%, #9400d3 75%, #4b0082 90%, #ffd700 100%)', NULL, NULL)

ON CONFLICT DO NOTHING;
