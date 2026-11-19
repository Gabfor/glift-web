/**
 * Palette de marque Glift (web + mobile).
 *
 * `defaultHex` correspond à la valeur écrite en dur dans le code. Les surcharges
 * éditées depuis l'admin (/colors) sont stockées dans la table `settings` sous
 * la clé `color_<id>` ; une valeur identique au défaut = pas de surcharge.
 */

export type PaletteToken = {
  id: string;
  label: string;
  defaultHex: string;
  /** Variable CSS globale à surcharger en plus des classes Tailwind (globals.css). */
  cssVar?: string;
};

export type PaletteGroup = {
  id: string;
  label: string;
  tokens: PaletteToken[];
};

export const COLOR_SETTING_PREFIX = "color_";

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    id: "violet",
    label: "Violet",
    tokens: [
      { id: "brandPrimaryHover", label: "Violet principal (hover)", defaultHex: "#6660E4", cssVar: "--color-brand-primary-hover" },
      { id: "brandPrimary", label: "Violet principal", defaultHex: "#7069FA", cssVar: "--color-brand-primary" },
      { id: "focusRing", label: "Violet clair (focus)", defaultHex: "#A1A5FD", cssVar: "--color-focus-ring" },
      { id: "violetTint", label: "Violet très clair", defaultHex: "#F4F5FE" },
      { id: "violetSoft", label: "Violet pâle", defaultHex: "#E6E6FF" },
      { id: "violetSofter", label: "Violet pâle 2", defaultHex: "#D6D6FF" },
      { id: "violetSoftest", label: "Violet pâle 3", defaultHex: "#C2C2FF" },
    ],
  },
  {
    id: "bleu",
    label: "Bleu",
    tokens: [
      { id: "navyDeep", label: "Bleu nuit profond", defaultHex: "#2E3142" },
      { id: "brandStrongHover", label: "Bleu nuit (hover)", defaultHex: "#2E3459", cssVar: "--color-brand-strong-hover" },
      { id: "brandStrong", label: "Bleu nuit (titres)", defaultHex: "#3A416F", cssVar: "--color-brand-strong" },
      { id: "textBody", label: "Bleu gris (texte)", defaultHex: "#5D6494", cssVar: "--color-text-body" },
    ],
  },
  {
    id: "gris",
    label: "Gris",
    tokens: [
      { id: "borderSoft", label: "Bordure", defaultHex: "#D7D4DC", cssVar: "--color-border-soft" },
      { id: "greyMedium", label: "Gris moyen", defaultHex: "#C2BFC6" },
      { id: "surfaceSubtle", label: "Gris clair", defaultHex: "#ECE9F1", cssVar: "--color-surface-subtle" },
      { id: "surfaceMuted", label: "Gris très clair", defaultHex: "#F2F1F6", cssVar: "--color-surface-muted" },
      { id: "greyBlue", label: "Gris bleuté", defaultHex: "#B1BACC" },
    ],
  },
  {
    id: "fonds",
    label: "Fonds",
    tokens: [
      { id: "surfacePrimary", label: "Fond principal", defaultHex: "#FBFCFE", cssVar: "--color-surface-primary" },
      { id: "surfaceHighlight", label: "Fond surligné", defaultHex: "#F6F6FA", cssVar: "--color-surface-highlight" },
      { id: "surfaceAlt", label: "Fond alternatif", defaultHex: "#FAFAFF" },
      { id: "surfaceLavender", label: "Fond lavande", defaultHex: "#F7F7FF" },
    ],
  },
  {
    id: "succes",
    label: "Succès",
    tokens: [
      { id: "accentSuccess", label: "Vert", defaultHex: "#00D591", cssVar: "--color-accent-success" },
      { id: "successSurface", label: "Fond vert", defaultHex: "#DCFAF1" },
    ],
  },
  {
    id: "erreur",
    label: "Erreur",
    tokens: [
      { id: "accentDanger", label: "Rouge", defaultHex: "#EF4F4E", cssVar: "--color-accent-danger" },
      { id: "accentDangerHover", label: "Rouge (hover)", defaultHex: "#BA2524", cssVar: "--color-accent-danger-hover" },
      { id: "dangerSurface", label: "Fond rouge", defaultHex: "#FFF1F1", cssVar: "--color-danger-surface" },
    ],
  },
  {
    id: "jaune",
    label: "Jaune",
    tokens: [
      { id: "warning", label: "Jaune", defaultHex: "#E2BA00" },
      { id: "gold", label: "Or", defaultHex: "#F0C863" },
      { id: "warningSurface", label: "Fond jaune", defaultHex: "#FFF7CB" },
    ],
  },
];

export const ALL_PALETTE_TOKENS: PaletteToken[] = PALETTE_GROUPS.flatMap((g) => g.tokens);

export type ColorOverrides = Record<string, string>;

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function normalizeHex(value: string): string | null {
  const v = value.trim();
  const withHash = v.startsWith("#") ? v : `#${v}`;
  return HEX_RE.test(withHash) ? withHash.toUpperCase() : null;
}

/** Extrait les surcharges valides (différentes du défaut) depuis la table settings. */
export function extractColorOverrides(settings: Record<string, string>): ColorOverrides {
  const overrides: ColorOverrides = {};
  for (const token of ALL_PALETTE_TOKENS) {
    const raw = settings[`${COLOR_SETTING_PREFIX}${token.id}`];
    const hex = raw ? normalizeHex(raw) : null;
    if (hex && hex !== token.defaultHex.toUpperCase()) overrides[token.id] = hex;
  }
  return overrides;
}

/** Palette complète (défauts + surcharges), pour l'API consommée par le mobile. */
export function resolvePalette(overrides: ColorOverrides): Record<string, string> {
  return Object.fromEntries(
    ALL_PALETTE_TOKENS.map((t) => [t.id, overrides[t.id] ?? t.defaultHex.toUpperCase()])
  );
}

/* ------------------------------------------------------------------ */
/* Génération du CSS de surcharge (classes Tailwind à valeur arbitraire) */
/* ------------------------------------------------------------------ */

type Utility = { prefix: string; decl: (hex: string) => string; suffix?: string };

const UTILITIES: Utility[] = [
  { prefix: "text", decl: (h) => `color:${h}` },
  { prefix: "bg", decl: (h) => `background-color:${h}` },
  { prefix: "border", decl: (h) => `border-color:${h}` },
  { prefix: "border-t", decl: (h) => `border-top-color:${h}` },
  { prefix: "border-b", decl: (h) => `border-bottom-color:${h}` },
  { prefix: "border-l", decl: (h) => `border-left-color:${h}` },
  { prefix: "border-r", decl: (h) => `border-right-color:${h}` },
  { prefix: "fill", decl: (h) => `fill:${h}` },
  { prefix: "stroke", decl: (h) => `stroke:${h}` },
  { prefix: "ring", decl: (h) => `--tw-ring-color:${h}` },
  { prefix: "outline", decl: (h) => `outline-color:${h}` },
  { prefix: "caret", decl: (h) => `caret-color:${h}` },
  { prefix: "accent", decl: (h) => `accent-color:${h}` },
  { prefix: "decoration", decl: (h) => `text-decoration-color:${h}` },
  { prefix: "placeholder", decl: (h) => `color:${h}`, suffix: "::placeholder" },
];

const STATE_VARIANTS: { variant: string; pseudo: string; group?: boolean }[] = [
  { variant: "", pseudo: "" },
  { variant: "hover", pseudo: ":hover" },
  { variant: "focus", pseudo: ":focus" },
  { variant: "active", pseudo: ":active" },
  { variant: "disabled", pseudo: ":disabled" },
  { variant: "focus-within", pseudo: ":focus-within" },
  { variant: "group-hover", pseudo: "", group: true },
];

const BREAKPOINTS: Record<string, string> = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
};

function rulesFor(defaultHex: string, newHex: string): string {
  const rules: string[] = [];
  const responsive: Record<string, string[]> = { sm: [], md: [], lg: [], xl: [] };

  for (const u of UTILITIES) {
    for (const v of STATE_VARIANTS) {
      const token = `${v.variant ? `${v.variant}:` : ""}${u.prefix}-[${defaultHex}]`;
      const attr = `[class~="${token}" i]`;
      const target = `${attr}${v.pseudo}${u.suffix ?? ""}`;
      const sel = v.group ? `.group:hover ${target}` : target;
      const rule = `${sel}{${u.decl(newHex)}}`;
      rules.push(rule);

      if (!v.variant) {
        for (const bp of Object.keys(BREAKPOINTS)) {
          const bpAttr = `[class~="${bp}:${u.prefix}-[${defaultHex}]" i]${u.suffix ?? ""}`;
          responsive[bp].push(`${bpAttr}{${u.decl(newHex)}}`);
        }
      }
    }
  }

  const media = Object.entries(responsive)
    .map(([bp, list]) => `@media (min-width:${BREAKPOINTS[bp]}){${list.join("")}}`)
    .join("");

  return rules.join("") + media;
}

/**
 * Construit le CSS à injecter en fin de <body>. Sans surcharge → chaîne vide
 * (aucun impact sur le rendu existant).
 */
export function buildColorOverridesCss(overrides: ColorOverrides): string {
  const ids = Object.keys(overrides);
  if (ids.length === 0) return "";

  const vars: string[] = [];
  const rules: string[] = [];

  for (const token of ALL_PALETTE_TOKENS) {
    const hex = overrides[token.id];
    if (!hex) continue;
    if (token.cssVar) vars.push(`${token.cssVar}:${hex}`);
    rules.push(rulesFor(token.defaultHex, hex));
  }

  return `:root{${vars.join(";")}}${rules.join("")}`;
}
