-- Script complet pour initialiser la base de données ReveelBox
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. CRÉATION DES TABLES
-- =====================

-- Table des profils utilisateurs
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    virtual_currency INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table des loot boxes
CREATE TABLE loot_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_virtual INTEGER NOT NULL,
    price_real DECIMAL(10,2),
    image_url TEXT,
    animation_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table des objets réels
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    image_url TEXT,
    market_value INTEGER DEFAULT 0,
    is_physical BOOLEAN DEFAULT true,
    shipping_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table de liaison loot boxes et objets
CREATE TABLE loot_box_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loot_box_id UUID REFERENCES loot_boxes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    drop_rate DECIMAL(5,2) NOT NULL CHECK (drop_rate > 0 AND drop_rate <= 100),
    UNIQUE(loot_box_id, item_id)
);

-- Table inventaire utilisateur
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    obtained_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    is_on_market BOOLEAN DEFAULT false,
    is_shipped BOOLEAN DEFAULT false,
    shipping_address TEXT
);

-- Table des transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('purchase_currency', 'purchase_box', 'open_box', 'market_sale')),
    amount DECIMAL(10,2),
    virtual_amount INTEGER,
    loot_box_id UUID REFERENCES loot_boxes(id),
    item_id UUID REFERENCES items(id),
    stripe_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table du marché secondaire
CREATE TABLE market_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES user_inventory(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    sold_at TIMESTAMP WITH TIME ZONE
);

-- 2. FONCTIONS ET TRIGGERS
-- ========================

-- Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger création profil
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Fonction update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger update timestamp
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS POLICIES
-- ===============

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_box_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies pour loot_boxes
CREATE POLICY "Everyone can view active loot boxes" ON loot_boxes
    FOR SELECT USING (is_active = true);

-- Policies pour items
CREATE POLICY "Everyone can view items" ON items
    FOR SELECT USING (true);

-- Policies pour user_inventory
CREATE POLICY "Users can view own inventory" ON user_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can add to inventory" ON user_inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour market_listings
CREATE POLICY "Everyone can view active listings" ON market_listings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create own listings" ON market_listings
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own listings" ON market_listings
    FOR UPDATE USING (auth.uid() = seller_id);

-- 4. FONCTIONS RPC
-- ================

-- Copier toutes les fonctions RPC du fichier supabase-functions.sql ici

-- 5. DONNÉES DE DÉMO
-- ==================

-- Insérer des loot boxes de démo
INSERT INTO loot_boxes (name, description, price_virtual, price_real, image_url) VALUES
    ('Mystery Tech Box', 'Gadgets et accessoires tech surprises', 200, 19.99, '/images/tech-box.png'),
    ('Gaming Treasure', 'Objets collector pour gamers', 500, 49.99, '/images/gaming-box.png'),
    ('Lifestyle Premium', 'Articles de mode et lifestyle de luxe', 1000, 99.99, '/images/lifestyle-box.png');

-- Insérer des objets réels de démo
INSERT INTO items (name, description, rarity, image_url, market_value, shipping_info) VALUES
    ('Écouteurs Bluetooth', 'Écouteurs sans fil haute qualité', 'common', '/images/earbuds.png', 50, 'Livraison standard 5-7 jours'),
    ('Souris Gaming RGB', 'Souris gaming professionnelle', 'uncommon', '/images/mouse.png', 80, 'Livraison standard 5-7 jours'),
    ('Smartwatch Sport', 'Montre connectée avec tracker fitness', 'rare', '/images/smartwatch.png', 200, 'Livraison express 2-3 jours'),
    ('Console Rétro Mini', 'Console de jeux rétro portable', 'epic', '/images/console.png', 150, 'Livraison express 2-3 jours'),
    ('Drone avec Caméra 4K', 'Drone professionnel compact', 'legendary', '/images/drone.png', 500, 'Livraison sécurisée 3-5 jours'),
    ('T-shirt Collector Édition Limitée', 'T-shirt gaming exclusif', 'uncommon', '/images/tshirt.png', 40, 'Livraison standard 5-7 jours'),
    ('Figurine Anime Exclusive', 'Figurine collector numérotée', 'rare', '/images/figurine.png', 120, 'Livraison sécurisée 3-5 jours'),
    ('Casque VR Mobile', 'Casque de réalité virtuelle pour smartphone', 'epic', '/images/vr-headset.png', 300, 'Livraison express 2-3 jours');

-- Lier les objets aux boxes (ajuster les taux selon vos besoins)
-- Tech Box
INSERT INTO loot_box_items (loot_box_id, item_id, drop_rate) VALUES
    ((SELECT id FROM loot_boxes WHERE name = 'Mystery Tech Box'), (SELECT id FROM items WHERE name = 'Écouteurs Bluetooth'), 40.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Mystery Tech Box'), (SELECT id FROM items WHERE name = 'Souris Gaming RGB'), 30.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Mystery Tech Box'), (SELECT id FROM items WHERE name = 'Smartwatch Sport'), 20.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Mystery Tech Box'), (SELECT id FROM items WHERE name = 'Drone avec Caméra 4K'), 10.0);

-- Gaming Box
INSERT INTO loot_box_items (loot_box_id, item_id, drop_rate) VALUES
    ((SELECT id FROM loot_boxes WHERE name = 'Gaming Treasure'), (SELECT id FROM items WHERE name = 'Souris Gaming RGB'), 35.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Gaming Treasure'), (SELECT id FROM items WHERE name = 'T-shirt Collector Édition Limitée'), 25.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Gaming Treasure'), (SELECT id FROM items WHERE name = 'Figurine Anime Exclusive'), 20.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Gaming Treasure'), (SELECT id FROM items WHERE name = 'Console Rétro Mini'), 15.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Gaming Treasure'), (SELECT id FROM items WHERE name = 'Casque VR Mobile'), 5.0);

-- Lifestyle Box
INSERT INTO loot_box_items (loot_box_id, item_id, drop_rate) VALUES
    ((SELECT id FROM loot_boxes WHERE name = 'Lifestyle Premium'), (SELECT id FROM items WHERE name = 'Smartwatch Sport'), 30.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Lifestyle Premium'), (SELECT id FROM items WHERE name = 'Écouteurs Bluetooth'), 25.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Lifestyle Premium'), (SELECT id FROM items WHERE name = 'Drone avec Caméra 4K'), 25.0),
    ((SELECT id FROM loot_boxes WHERE name = 'Lifestyle Premium'), (SELECT id FROM items WHERE name = 'Casque VR Mobile'), 20.0);