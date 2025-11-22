# Référentiel UI – CTAButton et Header

## Source des design tokens
- Données uniques : `src/constants/design-tokens.json` (+ typage `design-tokens.ts`).
- Export Flutter/web : `npm run export:tokens` génère `public/design-tokens.json` et `design-tokens.arb` (clé aplatie : `colors.brandPrimary`, `shadows.card`, etc.).
- Variables CSS injectées dans `src/app/globals.css` (`--color-brand-primary`, `--shadow-card`, `--radius-pill`, ...).

## CTAButton
- **Props principales** :
  - `variant`: `active` (plein violet), `inactive` (fond `--color-surface-muted`, texte `--color-border-soft`), `danger` (rouge).
  - `loading` (contrôlé) ou `disableAutoLoading`: désactive l’autogestion pendant les actions async.
  - `keepWidthWhileLoading`: mémorise la largeur (par défaut `true`).
  - `href`: rend le bouton navigable via `next/link`; navigation déclenchée après l’action asynchrone si non annulée.
  - `loadingText`: texte affiché avec le `Spinner` intégré.
- **États visuels** :
  - Actif : `bg --color-brand-primary`, hover `--color-brand-primary-hover`, focus ring `--color-brand-primary`.
  - Inactif : `bg --color-surface-muted`, texte/ring `--color-border-soft`, hover `--color-surface-subtle`.
  - Danger : `bg --color-accent-danger`, hover `--color-accent-danger-hover`, focus ring `--color-accent-danger`.
- **Spécs Flutter** (équivalences) :
  | Prop / état | Flutter | Notes |
  | --- | --- | --- |
  | `variant="active"` | `ElevatedButton` couleur `brandPrimary`, `onSurface` désactivé `borderSoft` | Rayon `radiusPill`, hauteur 44px. |
  | `variant="inactive"` | `ElevatedButton` désactivé + couleurs custom (`surfaceMuted` / `borderSoft`) | Pas de hover sur mobile. |
  | `variant="danger"` | `ElevatedButton` thème erreur (`accentDanger`) | Focus ring `accentDanger`. |
  | `keepWidthWhileLoading` | Conserver la largeur mesurée avant `setState` | Mesurer `context.size?.width` avant spinner. |
  | `disableAutoLoading` | Gestion manuelle du loader | Sinon, `CTAButton` active automatiquement le loader pendant la promesse. |

## Header
- **Modes** :
  - Déconnecté (`disconnected` ou utilisateur absent) : menu public + CTA inscription (`CTAButton`).
  - Connecté : menu dashboard + avatar (initiale sur fond `brandPrimary` si pas d’avatar) + dropdown compte.
  - Bannière de vérification e-mail : s’affiche si `isEmailVerified === false` ou période de grâce non expirée (72h par défaut via `DEFAULT_GRACE_PERIOD_HOURS`). Message recalculé chaque minute.
- **Comportement sticky** :
  - Background passe de `--color-surface-primary` à `white` avec ombre `--shadow-card-hover` dès `scrollY > 0`.
  - Décalage vertical `top-[36px]` si bannière active.
- **Dropdown compte** :
  - Fond blanc, bord `--color-surface-subtle`, survol lignes `--color-surface-highlight`.
  - Lien déconnexion en rouge (`--color-accent-danger`, hover `--color-accent-danger-hover`, fond `--color-danger-surface`).
  - Navigation interne à `/compte` : empêche le changement de page et force un `hashchange` si déjà sur la vue.
- **Spécs Flutter** :
  | Élément | Flutter | Notes |
  | --- | --- | --- |
  | Barre sticky | `SliverAppBar` pinned, fond `surfacePrimary` → `white` avec `BoxShadow` `shadowCardHover` quand scrolled | Banner hauteur 36px optionnelle au-dessus. |
  | Bannière vérif e-mail | `Container` 36px couleur `brandPrimary`, texte centre `14px` semibold | Timer recalculé chaque minute depuis date d’expiration. |
  | Dropdown | `PopupMenuButton` custom avec bord `surfaceSubtle`, fond blanc, highlight `surfaceHighlight` | Chevron animé (rotation 180°). |
  | Avatar placeholder | `CircleAvatar` fond `brandPrimary`, initiale uppercase | Remplacé par `Image.network` si avatar dispo. |
