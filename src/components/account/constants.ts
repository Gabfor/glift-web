export const GENDER_OPTIONS = ['Homme', 'Femme', 'Non binaire'] as const

export const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Canada', 'Autre'] as const

export const COUNTRY_FLAG_ICON_MAP: Record<(typeof COUNTRIES)[number], string> = {
  France: '/flags/france.svg',
  Belgique: '/flags/belgique.svg',
  Suisse: '/flags/suisse.svg',
  Canada: '/flags/canada.svg',
  Autre: '/flags/autre.svg',
} as const

export const getCountryFlagIcon = (country: string) => {
  const normalized = country.trim().toLocaleLowerCase('fr-FR')
  const match = COUNTRIES.find(
    (value) => value.toLocaleLowerCase('fr-FR') === normalized,
  )

  return match ? COUNTRY_FLAG_ICON_MAP[match] : undefined
}

export const EXPERIENCE_OPTIONS = ['0', '1', '2', '3', '4', '5+'] as const

export const MAIN_GOALS = [
  "Prise de muscle",
  "Perte de graisse",
  "Gain de force",
  "Performance sportive",
  "Confiance & bien-être",
  "Prévention des blessures",
  "Santé & longévité",
  "Routine & discipline",
] as const

export const TRAINING_PLACES = ['Salle', 'Domicile', 'Les deux'] as const

export const WEEKLY_SESSIONS_OPTIONS = ['1', '2', '3', '4', '5', '6+'] as const

export const SUPPLEMENTS_OPTIONS = ['Oui', 'Non'] as const
