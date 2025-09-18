export const countries = ['France', 'Belgique', 'Suisse', 'Canada', 'Autre'] as const
export const goals = ['Perte de poids', 'Prise de muscle', 'Remise en forme', 'Performance'] as const
export const trainingPlaces = ['Salle', 'Domicile', 'Les deux'] as const

export type Country = (typeof countries)[number]
export type Goal = (typeof goals)[number]
export type TrainingPlace = (typeof trainingPlaces)[number]
