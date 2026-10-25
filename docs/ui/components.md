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

## Modal & ModalMessage (`Modal.tsx`, `ModalMessage.tsx`)
- **`Modal`** : Conteneur de dialogue accessible avec arrière-plan estompé (`bg-black/60 backdrop-blur-xs`), verrouillage du focus, fermeture à la touche Échap et au clic extérieur, z-index élevé (`z-50`).
  - Titre standardisé en tête avec bouton de fermeture croix SVG.
  - Largeurs paramétrables (`maxWidthClass` : `max-w-md`, `max-w-lg`, etc.).
- **`ModalMessage`** : Boîte d'information et d'alerte contextuelle insérée en haut de formulaire modal.
  - Variantes : `info` (bleu/violet), `warning` (ambre), `error` (rouge), `success` (vert).
  - Structure : icône vectorielle dédiée + titre en gras + texte descriptif explicatif.

## Modale des Vignettes de Statistiques (`StatVignettesModal.tsx`, `StatVignettesFields.tsx`)
- **Règles d'espacement strictes** :
  - Espacement vertical entre les champs dropdowns : **20px** (`space-y-[20px]`).
  - Espacement entre le dernier champ et les boutons d'action (CTA) : **30px** (`footerWrapperClassName="!mt-[30px]"`).
- **Positionnement intelligent des menus déroulants (`placement`)** :
  - Dropdowns 1 et 2 : ouverture descendante (`placement="auto"` ou `"bottom"`).
  - Dropdowns 3 et 4 : ouverture ascendante forcée (`placement="top"`) pour éviter la coupure du menu hors de l'écran sur mobile et petits écrans.
- **Boutons d'action** :
  - "Annuler" (`variant="secondary"`).
  - "Enregistrer" (`variant="active"`, avec indicateur de chargement `loading={isSaving}`).

## Infobulle d'Information Interactive (`InfoTooltipAdornment.tsx`)
- **Comportement & Rendu Portal** :
  - Infobulle montée sur `document.body` via React Portal pour s'affranchir de tout contexte d'empilement (`overflow: hidden` ou conteneurs parents).
  - Rendu conditionné à l'état `ready: true` avec calcul synchrone par `useIsomorphicLayoutEffect` et événement clic/survol, éliminant tout clignotement ou apparition fugitive au point d'origine `(0, 0)`.
- **Découplage Positionnement / Animation** :
  - Conteneur externe fixe : gère strictement les coordonnées cartésiennes absolues et la translation de centrage de flèche (`translate-y-[-50%]` ou `translate-x-[-50%]`).
  - Bulle interne animée : applique l'animation d'apparition Tailwind avec glissement directionnel fluide sans écraser la translation du conteneur (`slide-in-from-top-1` si flèche en haut, `slide-in-from-left-1` si flèche à droite, `slide-in-from-right-1` si flèche à gauche).

## Règle Globale d'Espacement du Footer
- **Dégagement vertical minimal garanti au-dessus du footer** sur l'ensemble des pages du site :
  - Sur ordinateur (Desktop) : **100px minimum** (`md:mt-[100px]`).
  - Sur mobile / tablette (Responsive) : **50px minimum** (`mt-[50px]`).
  - Implémenté sur `ClientLayout.tsx`, `FooterPublic.tsx` et `FooterLogged.tsx`.

