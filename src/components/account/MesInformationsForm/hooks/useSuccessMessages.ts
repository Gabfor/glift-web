import { useMemo, useRef, useState } from 'react'
import type { TouchedState } from '../utils/types'

type Params = {
  latchedTouched: TouchedState
  isEditingName: boolean
  name: string
  initialName: string
  country: string
  initialCountry: string
  experience: string
  initialExperience: string
  mainGoal: string
  initialMainGoal: string
  trainingPlace: string
  initialTrainingPlace: string
  weeklySessions: string
  initialWeeklySessions: string
  supplements: string
  initialSupplements: string
  gender: string
  initialGender: string
  currentBirthDate: string
  initialBirthDate: string
  isBirthDateValid: boolean
}

export function useSuccessMessages(params: Params) {
  const successRef = useRef<Record<string, string>>({})
  const [suppress, setSuppress] = useState(false)

  const successMessages = useMemo(() => {
    if (suppress) return {}

    const {
      latchedTouched,
      isEditingName,
      name,
      initialName,
      country,
      initialCountry,
      experience,
      initialExperience,
      mainGoal,
      initialMainGoal,
      trainingPlace,
      initialTrainingPlace,
      weeklySessions,
      initialWeeklySessions,
      supplements,
      initialSupplements,
      gender,
      initialGender,
      currentBirthDate,
      initialBirthDate,
      isBirthDateValid,
    } = params

    const msgs: Record<string, string> = { ...successRef.current }

    if (latchedTouched.gender && gender && gender !== initialGender) {
      msgs.gender =
        gender === 'Homme' ? 'Men power !' : gender === 'Femme' ? 'Women power !' : "C'est noté !"
    } else {
      delete msgs.gender
    }

    if (
      latchedTouched.name &&
      !isEditingName &&
      name.trim().length > 1 &&
      name.trim() !== initialName.trim()
    ) {
      msgs.name = `Très bien, à partir de maintenant ce sera ${name.trim()} !`
    } else {
      delete msgs.name
    }

    if (latchedTouched.country && country && country !== initialCountry) {
      msgs.country = "Ok, c'est un beau pays !"
    } else {
      delete msgs.country
    }

    if (latchedTouched.experience && experience && experience !== initialExperience) {
      msgs.experience = "Merci, on va passer les prochaines années ensemble !"
    } else {
      delete msgs.experience
    }

    if (latchedTouched.mainGoal && mainGoal && mainGoal !== initialMainGoal) {
      msgs.mainGoal = "C'est un bel objectif, let's go !"
    } else {
      delete msgs.mainGoal
    }

    if (latchedTouched.trainingPlace && trainingPlace && trainingPlace !== initialTrainingPlace) {
      msgs.trainingPlace = "Très bien, c'est noté !"
    } else {
      delete msgs.trainingPlace
    }

    if (
      latchedTouched.weeklySessions &&
      weeklySessions &&
      weeklySessions !== initialWeeklySessions
    ) {
      msgs.weeklySessions = 'Parfait, on va en tirer le maximum !'
    } else {
      delete msgs.weeklySessions
    }

    if (latchedTouched.supplements && supplements !== '' && supplements !== initialSupplements) {
      msgs.supplements = "Top, merci pour l'info !"
    } else {
      delete msgs.supplements
    }

    if (isBirthDateValid && currentBirthDate && currentBirthDate !== initialBirthDate) {
      msgs.birthDate = 'Super, maintenant on connaît la date de ton anniversaire !'
    } else {
      delete msgs.birthDate
    }

    successRef.current = msgs
    return msgs
  }, [params, suppress])

  return {
    successMessages,
    clearSuccess: () => {
      successRef.current = {}
    },
    suppress,
    resetSuppress: () => setSuppress(false),
    suppressOnce: () => setSuppress(true),
  }
}
