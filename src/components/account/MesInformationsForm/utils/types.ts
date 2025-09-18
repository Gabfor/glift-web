export type TouchedState = {
  name: boolean
  birthDay: boolean
  birthMonth: boolean
  birthYear: boolean
  gender: boolean
  country: boolean
  experience: boolean
  mainGoal: boolean
  trainingPlace: boolean
  weeklySessions: boolean
  supplements: boolean
}

export type InitialValues = {
  name: string
  gender: string
  country: string
  experience: string
  mainGoal: string
  trainingPlace: string
  weeklySessions: string
  supplements: string
  /** YYYY-MM-DD (ou '') */
  birthDate: string
  /** url ou '' */
  avatar_url: string
}

export type FormSlices = {
  name: string
  gender: string
  country: string
  experience: string
  mainGoal: string
  trainingPlace: string
  weeklySessions: string
  supplements: string
  birthDay: string
  birthMonth: string
  birthYear: string
  profileImageUrl: string
}
