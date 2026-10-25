export type StatVignetteKey =
  | "sessions"
  | "time"
  | "weight"
  | "reps"
  | "volume"
  | "sets"
  | "totalReps"
  | "totalTime";

export interface StatVignetteOption {
  value: StatVignetteKey;
  label: string;
  description: string;
}

export const STAT_VIGNETTE_OPTIONS: StatVignetteOption[] = [
  {
    value: "sessions",
    label: "Séances d'entraînement",
    description: "Nombre total de séances réalisées",
  },
  {
    value: "time",
    label: "Minutes par séance en moyenne",
    description: "Durée moyenne d'une séance d'entraînement",
  },
  {
    value: "weight",
    label: "Kg soulevés en moyenne",
    description: "Charge moyenne déplacée par série",
  },
  {
    value: "reps",
    label: "Répétitions par série en moyenne",
    description: "Nombre moyen de répétitions par série",
  },
  {
    value: "volume",
    label: "Volume total soulevé (tonnage)",
    description: "Somme cumulée des charges × répétitions",
  },
  {
    value: "sets",
    label: "Séries effectuées au total",
    description: "Nombre total de séries complétées",
  },
  {
    value: "totalReps",
    label: "Répétitions effectuées au total",
    description: "Nombre cumulé de répétitions réalisées",
  },
  {
    value: "totalTime",
    label: "Minutes d'entraînement au total",
    description: "Temps d'entraînement cumulé sur la période",
  },
];

export const DEFAULT_STAT_VIGNETTES: [
  StatVignetteKey,
  StatVignetteKey,
  StatVignetteKey,
  StatVignetteKey
] = ["sessions", "time", "weight", "reps"];

export function isValidStatVignetteKey(value: unknown): value is StatVignetteKey {
  return (
    typeof value === "string" &&
    STAT_VIGNETTE_OPTIONS.some((option) => option.value === value)
  );
}

export function sanitizeStatVignettes(
  input: unknown
): [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey] {
  if (!Array.isArray(input)) {
    return [...DEFAULT_STAT_VIGNETTES];
  }

  const selected: StatVignetteKey[] = [];
  const seen = new Set<StatVignetteKey>();

  for (const item of input) {
    if (isValidStatVignetteKey(item) && !seen.has(item)) {
      selected.push(item);
      seen.add(item);
      if (selected.length === 4) break;
    }
  }

  // Si moins de 4, compléter avec les valeurs par défaut non utilisées
  if (selected.length < 4) {
    for (const fallback of DEFAULT_STAT_VIGNETTES) {
      if (!seen.has(fallback)) {
        selected.push(fallback);
        seen.add(fallback);
        if (selected.length === 4) break;
      }
    }
  }

  // Si toujours moins de 4 (cas extrême), compléter avec n'importe quelle option disponible
  if (selected.length < 4) {
    for (const opt of STAT_VIGNETTE_OPTIONS) {
      if (!seen.has(opt.value)) {
        selected.push(opt.value);
        seen.add(opt.value);
        if (selected.length === 4) break;
      }
    }
  }

  return [selected[0], selected[1], selected[2], selected[3]];
}
