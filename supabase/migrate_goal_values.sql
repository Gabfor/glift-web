-- Migration SQL : Harmonisation des objectifs vers les 4 piliers essentiels
-- 1. Prise de muscle
-- 2. Perte de graisse
-- 3. Force & Performance
-- 4. Remise en forme & Santé

-- ==========================================
-- 1. Table `profiles` (colonne: main_goal)
-- ==========================================

-- Mappage Force & Performance
UPDATE profiles
SET main_goal = 'Force & Performance'
WHERE main_goal IN ('Gain de force', 'Performance sportive', 'Performance');

-- Mappage Perte de graisse
UPDATE profiles
SET main_goal = 'Perte de graisse'
WHERE main_goal IN ('Perte de poids');

-- Mappage Remise en forme & Santé
UPDATE profiles
SET main_goal = 'Remise en forme & Santé'
WHERE main_goal IN (
  'Remise en forme',
  'Confiance & bien-être',
  'Prévention des blessures',
  'Santé & longévité',
  'Routine & discipline',
  'Routine & Discipline'
);

-- ==========================================
-- 2. Table `program_store` (colonne: goal)
-- ==========================================

-- Mappage Force & Performance
UPDATE program_store
SET goal = 'Force & Performance'
WHERE goal IN ('Gain de force', 'Performance sportive', 'Performance');

-- Mappage Perte de graisse
UPDATE program_store
SET goal = 'Perte de graisse'
WHERE goal IN ('Perte de poids');

-- Mappage Remise en forme & Santé
UPDATE program_store
SET goal = 'Remise en forme & Santé'
WHERE goal IN (
  'Remise en forme',
  'Confiance & bien-être',
  'Prévention des blessures',
  'Santé & longévité',
  'Routine & discipline',
  'Routine & Discipline'
);

-- ==========================================
-- 3. Table `blog_articles` (colonne: objectif)
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_articles' AND column_name = 'objectif'
  ) THEN
    UPDATE blog_articles
    SET objectif = 'Force & Performance'
    WHERE objectif IN ('Gain de force', 'Performance sportive', 'Performance');

    UPDATE blog_articles
    SET objectif = 'Perte de graisse'
    WHERE objectif IN ('Perte de poids');

    UPDATE blog_articles
    SET objectif = 'Remise en forme & Santé'
    WHERE objectif IN (
      'Remise en forme',
      'Confiance & bien-être',
      'Prévention des blessures',
      'Santé & longévité',
      'Routine & discipline',
      'Routine & Discipline'
    );
  END IF;
END $$;
