-- 1. Ajouter les colonnes is_admin, statut et langue si elles n'existent pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS statut BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS langue TEXT DEFAULT 'Français';

-- 2. Migrer les administrateurs existants basés sur auth.users (user_metadata)
UPDATE profiles 
SET is_admin = true,
    statut = COALESCE((SELECT (raw_user_meta_data->>'statut')::boolean FROM auth.users WHERE auth.users.id = profiles.id), true),
    langue = COALESCE((SELECT raw_user_meta_data->>'langue' FROM auth.users WHERE auth.users.id = profiles.id), 'Français')
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE (raw_user_meta_data->>'is_admin')::boolean = true
);

-- 3. Fonction pour protéger les colonnes sensibles lors des UPDATEs
CREATE OR REPLACE FUNCTION protect_is_admin_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la valeur de is_admin ou statut change
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin OR NEW.statut IS DISTINCT FROM OLD.statut THEN
    -- Autoriser uniquement si la requête provient du rôle service_role (Admin Client)
    -- ou si l'utilisateur qui fait la requête est déjà admin dans profiles
    IF NOT (
      current_setting('role', true) = 'service_role' OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
      )
    ) THEN
      -- Annuler la modification
      NEW.is_admin := OLD.is_admin;
      NEW.statut := OLD.statut;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà et le recréer
DROP TRIGGER IF EXISTS trigger_protect_is_admin ON profiles;
CREATE TRIGGER trigger_protect_is_admin
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_is_admin_column();

-- 4. Fonction pour forcer la sécurité lors des INSERTs par défaut (sécurité inscription)
CREATE OR REPLACE FUNCTION check_is_admin_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin = true OR NEW.statut = false THEN
    -- Autoriser uniquement si service_role ou si l'inséreur est déjà admin
    IF NOT (
      current_setting('role', true) = 'service_role' OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
      )
    ) THEN
      NEW.is_admin := false;
      NEW.statut := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà et le recréer
DROP TRIGGER IF EXISTS trigger_check_is_admin_on_insert ON profiles;
CREATE TRIGGER trigger_check_is_admin_on_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_is_admin_on_insert();
