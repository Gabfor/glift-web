-- ==============================================================================
-- Tâche Planifiée Supabase (pg_cron) : Expiration Automatique des Abonnements
-- ==============================================================================
-- Cette fonction rétrograde automatiquement les utilisateurs vers le plan 'starter'
-- si leur période d'essai de 30 jours est expirée ou si leur abonnement payant est terminé.
-- Les administrateurs (is_admin = true) sont protégés et ne sont jamais rétrogradés.

-- 1. Création de la fonction de rétrogradation
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Rétrograder les utilisateurs en Starter
  UPDATE profiles
  SET 
    subscription_plan = 'starter',
    cancellation = false,
    updated_at = NOW()
  WHERE 
    subscription_plan = 'premium'
    AND (is_admin IS NULL OR is_admin = false)
    AND (
      -- Cas 1 : Abonnement payant dont la date de fin est dépassée
      (premium_end_at IS NOT NULL AND premium_end_at < NOW())
      OR
      -- Cas 2 : Essai gratuit dont la date explicite de fin est dépassée
      (premium_end_at IS NULL AND premium_trial_end_at IS NOT NULL AND premium_trial_end_at < NOW())
      OR
      -- Cas 3 : Essai gratuit (calculé à J+30 depuis le début) dont la date est dépassée
      (premium_end_at IS NULL AND premium_trial_end_at IS NULL AND premium_trial_started_at IS NOT NULL AND premium_trial_started_at < NOW() - INTERVAL '30 days')
    );

  -- Mettre à jour la table de compatibilité user_subscriptions
  UPDATE user_subscriptions us
  SET 
    plan = 'starter',
    updated_at = NOW()
  FROM profiles p
  WHERE 
    us.user_id = p.id
    AND p.subscription_plan = 'starter'
    AND us.plan = 'premium';

END;
$$;

-- 2. (Optionnel) Planification quotidienne à 03h00 avec l'extension pg_cron de Supabase
-- Pour l'activer, exécutez ces deux lignes dans le SQL Editor de Supabase :
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('expire-subscriptions-daily', '0 3 * * *', 'SELECT expire_subscriptions();');
