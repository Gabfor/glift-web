export const CURVE_OPTIONS = [
  { value: "poids-moyen", label: "Poids moyen" },
  { value: "poids-maximum", label: "Poids maximum" },
  { value: "poids-total", label: "Poids total" },
  { value: "repetition-moyenne", label: "Répétition moyenne" },
  { value: "repetition-maximum", label: "Répétition maximum" },
  { value: "repetitions-totales", label: "Répétitions totales" },
] as const

export type CurveOptionValue = (typeof CURVE_OPTIONS)[number]["value"]
