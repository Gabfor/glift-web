# Guide UI – Page d'accueil

## Layout et contraintes
- Largeur max : `var(--layout-max-width)` (1152px) avec centrage horizontal et padding horizontal de `16px`.
- Fond principal : `var(--color-surface-primary)` ; texte par défaut `var(--color-text-strong)` et `var(--color-text-body)` pour le copy.
- Hauteurs et espacements clés :
  - Hero : `pt-[140px]`, `pb-[30px]`.
  - Sections outils (Création / Suivi / Notation / Visualisation) : `py-[30px]`, gap horizontal `gap-10`, images 466×350.
  - Bloc méthode : `pt-[80px]` ; bloc bonus : `pt-[50px]`, grid bonus `pt-[60px] pb-[90px]`.
  - Boutons arrondis : hauteur `var(--layout-button-height)` (44px) et rayon `var(--radius-pill)`.

## Inventaire des sections
1. **Hero** : titre + sous-titre + CTA primaire (plein) + CTA secondaire (outline) + badge d'essai (pastille verte). Mockup centré sous le hero.
2. **Mockups app/site** : image `/images/mockups-app-site.png` largeur 800px (affichée à max 700px) + flèches décoratives `arrow-left.png` et `arrow-right.png` positionnées en absolu.
3. **La méthode Glift** : titre centré.
4. **Outils (4 blocs)** : alternance texte/image, tag violet uppercase, titre bleu sombre, paragraphe, CTA outline.
5. **Bonus** : titre centré puis 2 cartes (Store & Shop) en grille responsive.

## Assets et ratios
| Élément | Chemin | Taille de référence |
| --- | --- | --- |
| Mockups multi-device | `public/images/mockups-app-site.png` | 800×400 (affiché max 700px) |
| Flèche gauche | `public/images/arrow-left.png` | 114×114 |
| Flèche droite | `public/images/arrow-right.png` | 114×114 |
| Illustration création | `public/images/illustration-creation.png` | 466×350 |
| Illustration suivi | `public/images/illustration-suivi.png` | 466×350 |
| Illustration notation | `public/images/illustration-notation.png` | 466×350 |
| Illustration visualisation | `public/images/illustration-visualisation.png` | 466×350 |
| Icône Store | `public/images/icon-store.png` | 60×60 |
| Icône Shop | `public/images/icon-shop.png` | 60×60 |

## Palette et tokens
- Couleurs issues de `src/constants/design-tokens.json` et exposées en CSS (`src/app/globals.css`) :
  - Violet principal : `--color-brand-primary` / hover `--color-brand-primary-hover`.
  - Bleu foncé CTA outline : `--color-brand-strong`.
  - Texte : `--color-text-heading`, `--color-text-body`, `--color-text-strong`.
  - Fond : `--color-surface-primary`, cartes `white`, survol cartes `--shadow-card-hover`.
  - Accent succès pastille : `--color-accent-success`.

## Responsive
- Grille : passages en colonne sur `md` pour les blocs outils (image/texte) et pour les cartes bonus.
- Texte du hero : `24px` mobile, `32px` sm, `30px` md ; sous-titre `15/16px`.
- Les flèches décoratives ne s'affichent qu'en `md` et plus.
- Les CTA conservent leur largeur pendant le chargement via `keepWidthWhileLoading` (composant `CTAButton`).

## Équivalences Flutter rapides
- **CTA** : `ElevatedButton` (plein) et `OutlinedButton` (outline) stylés avec `borderRadius.circular(22)` et couleurs des tokens.
- **Badges pastille** : `Stack` + `Container` `20dp` avec couleur `--color-accent-success` + `Opacity` animée.
- **Sections** : `ConstrainedBox(maxWidth: 1152)` + `Padding(horizontal: 16, vertical: ...)` ; alternance via `Row`/`Column` en fonction du breakpoint.
- **Cartes bonus** : `Material` avec `elevation` correspondant à `--shadow-card` et survol à `--shadow-card-hover` (Hover à simuler via `InkWell` si besoin sur web).
