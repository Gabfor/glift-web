# Vérification des emails utilisateur avec Supabase

Cette application utilise la vérification d'email native de Supabase pour valider chaque nouveau compte tout en laissant l'utilisateur compléter son inscription immédiatement.

## Flux global

1. L'API `/api/auth/signup` enregistre l'utilisateur via `supabase.auth.signUp` et injecte la variable d'environnement `NEXT_PUBLIC_SUPABASE_EMAIL_CONFIRM_REDIRECT_URL` dans l'option `emailRedirectTo`. Le mail envoyé par Supabase redirige donc vers `/inscription/informations` (ou toute URL configurée dans votre environnement) après validation.
2. Après l'inscription, le client conserve la session afin de permettre l'onboarding sans attendre la confirmation. Les métadonnées du profil sont stockées comme auparavant.
3. La page `/inscription/informations` affiche un bandeau persistant tant que `email_confirmed_at` est nul. Le bandeau propose :
   - un bouton **Renvoyer l'email** qui appelle `supabase.auth.resend({ type: "signup" })` ;
   - un bouton **J'ai confirmé mon email** qui rafraîchit la session et masque automatiquement le bandeau lorsque Supabase renvoie un utilisateur confirmé ;
   - un message de rappel (et un cooldown de 60 s) pour éviter les renvois multiples.
4. Un cron (pg_cron, tâche edge ou scheduler externe) doit supprimer ou désactiver les comptes dont `email_confirmed_at` est nul depuis plus de sept jours afin de respecter la politique annoncée aux utilisateurs.

## Points d'attention

- **Configuration Supabase**
  - Activez l'envoi des emails de confirmation dans *Authentication → Providers → Email*.
  - Ajoutez l'URL définie dans `NEXT_PUBLIC_SUPABASE_EMAIL_CONFIRM_REDIRECT_URL` aux redirections autorisées.
  - Vérifiez la configuration SMTP (ou le service par défaut de Supabase) pour garantir la délivrabilité.
- **Variables d'environnement**
  - Renseignez `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `NEXT_PUBLIC_SUPABASE_EMAIL_CONFIRM_REDIRECT_URL` dans `.env.local` (copie de `.env.local.example`).
  - Si vous modifiez l'URL de redirection, mettez à jour la configuration Supabase en conséquence.
- **Surveillance**
  - Utilisez les logs Supabase ou votre outil d'observabilité pour suivre les taux de renvoi (`resend`) et détecter les comptes qui restent non confirmés.
  - Planifiez et testez régulièrement le job de purge afin d'éviter de conserver des comptes inactifs plus de 7 jours.
