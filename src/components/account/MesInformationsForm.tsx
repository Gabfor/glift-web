"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabaseClient"
import DropdownField from "./fields/DropdownField"
import ToggleField from "./fields/ToggleField"
import TextField from "./fields/TextField"
import BirthDateField from "./fields/BirthDateField"
import SubmitButton from "./fields/SubmitButton"

const supabase = createClient()

const countries = ['France', 'Belgique', 'Suisse', 'Canada', 'Autre']
const goals = ['Perte de poids', 'Prise de muscle', 'Remise en forme', 'Performance']
const trainingPlaces = ['Salle', 'Domicile', 'Les deux']

type TouchedState = {
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

function useLatchedTouched(
  current: TouchedState,
  prevRef: React.MutableRefObject<TouchedState>,
  resetCounter: number
) {
  const [latched, setLatched] = useState<TouchedState>({ ...current })

  useEffect(() => {
    if (resetCounter > 0) {
      prevRef.current = { ...current }
      setLatched({ ...current })
      return
    }
    setLatched((prev) => {
      const next: TouchedState = { ...current }
      for (const key of Object.keys(prev) as Array<keyof TouchedState>) {
        if (prev[key] && !current[key]) {
          next[key] = true
        }
      }
      prevRef.current = next
      return next
    })
  }, [current, prevRef, resetCounter])

  return latched
}

function useSuccessMessages(params: {
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
  successRef: React.MutableRefObject<Record<string, string>>
  suppress: boolean
}) {
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
    successRef,
    suppress,
  } = params

  return useMemo(() => {
    if (suppress) return {}

    const msgs: Record<string, string> = { ...successRef.current }

    if (latchedTouched.gender && gender && gender !== initialGender) {
      msgs.gender =
        gender === 'Homme'
          ? 'Men power !'
          : gender === 'Femme'
          ? 'Women power !'
          : "C'est noté !"
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

    if (
      latchedTouched.trainingPlace &&
      trainingPlace &&
      trainingPlace !== initialTrainingPlace
    ) {
      msgs.trainingPlace = "Très bien, c'est noté !"
    } else {
      delete msgs.trainingPlace
    }

    if (
      latchedTouched.weeklySessions &&
      weeklySessions &&
      weeklySessions !== initialWeeklySessions
    ) {
      msgs.weeklySessions = "Parfait, on va en tirer le maximum !"
    } else {
      delete msgs.weeklySessions
    }

    if (
      latchedTouched.supplements &&
      supplements !== '' &&
      supplements !== initialSupplements
    ) {
      msgs.supplements = "Top, merci pour l'info !"
    } else {
      delete msgs.supplements
    }

    if (isBirthDateValid && currentBirthDate && currentBirthDate !== initialBirthDate) {
      msgs.birthDate = "Super, maintenant on connaît la date de ton anniversaire !"
    } else {
      delete msgs.birthDate
    }

    successRef.current = msgs
    return msgs
  }, [
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
    successRef,
    suppress,
  ])
}

const buildBirthDate = (birthDate: {
  birthDay: string
  birthMonth: string
  birthYear: string
}) => {
  if (birthDate.birthYear && birthDate.birthMonth && birthDate.birthDay) {
    return `${birthDate.birthYear}-${birthDate.birthMonth}-${birthDate.birthDay}`
  }
  return ''
}

export default function MesInformationsForm({ user }: { user: User | null }) {
  const prevLatchedRef = useRef<TouchedState>({
    name: false,
    birthDay: false,
    birthMonth: false,
    birthYear: false,
    gender: false,
    country: false,
    experience: false,
    mainGoal: false,
    trainingPlace: false,
    weeklySessions: false,
    supplements: false,
  })

  const successRef = useRef<Record<string, string>>({})
  const [suppressSuccess, setSuppressSuccess] = useState(false)
  const [latchedResetCounter, setLatchedResetCounter] = useState(0)

  const initialMetadataRef = useRef(user?.user_metadata || {})
  useEffect(() => {
    if (user?.user_metadata) {
      initialMetadataRef.current = user.user_metadata
    }
  }, [user?.user_metadata])

  const initial = (field: string) => initialMetadataRef.current?.[field] || ''

  const initialName = initial('name') as string
  const initialCountry = initial('country') as string
  const initialExperience = initial('experience_years') as string
  const initialMainGoal = initial('main_goal') as string
  const initialTrainingPlace = initial('training_place') as string
  const initialWeeklySessions = initial('weekly_sessions') as string
  const initialSupplements = initial('supplements') as string
  const initialGender = initial('gender') as string
  const rawInitialBirth = initial('birth_date')
  const initialBirthDate = typeof rawInitialBirth === 'string' ? rawInitialBirth : ''
  const [initialBirthYear, initialBirthMonth, initialBirthDay] =
    initialBirthDate.includes('-') ? initialBirthDate.split('-') : ['', '', '']

  const [name, setName] = useState(initialName)
  const [birthDate, setBirthDate] = useState(() => {
    if (initialBirthDate.includes('-')) {
      const [year, month, day] = initialBirthDate.split('-')
      return { birthDay: day, birthMonth: month, birthYear: year }
    }
    return { birthDay: '', birthMonth: '', birthYear: '' }
  })
  const [gender, setGender] = useState(initialGender)
  const [country, setCountry] = useState(initialCountry)
  const [experience, setExperience] = useState(initialExperience)
  const [mainGoal, setMainGoal] = useState(initialMainGoal)
  const [trainingPlace, setTrainingPlace] = useState(initialTrainingPlace)
  const [weeklySessions, setWeeklySessions] = useState(initialWeeklySessions)
  const [supplements, setSupplements] = useState(initialSupplements)
  const [loading, setLoading] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [touched, setTouched] = useState<TouchedState>({
    name: false,
    birthDay: false,
    birthMonth: false,
    birthYear: false,
    gender: false,
    country: false,
    experience: false,
    mainGoal: false,
    trainingPlace: false,
    weeklySessions: false,
    supplements: false,
  })

  const latchedTouched = useLatchedTouched(touched, prevLatchedRef, latchedResetCounter)

  const currentBirthDate = buildBirthDate(birthDate)

  const isBirthDateValid = Boolean(
    birthDate.birthDay &&
      birthDate.birthMonth &&
      birthDate.birthYear &&
      (latchedTouched.birthDay || latchedTouched.birthMonth || latchedTouched.birthYear)
  )

  const [initialValues, setInitialValues] = useState({
    name: initialName,
    country: initialCountry,
    experience: initialExperience,
    mainGoal: initialMainGoal,
    trainingPlace: initialTrainingPlace,
    weeklySessions: initialWeeklySessions,
    supplements: initialSupplements,
    gender: initialGender,
    birthDate: initialBirthDate,
  })

  const successMessages = useSuccessMessages({
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
    initialBirthDate: initialValues.birthDate,
    isBirthDateValid,
    successRef,
    suppress: suppressSuccess,
  })

  const computeHasChanges = () => {
    return (
      name !== initialValues.name ||
      country !== initialValues.country ||
      experience !== initialValues.experience ||
      mainGoal !== initialValues.mainGoal ||
      trainingPlace !== initialValues.trainingPlace ||
      weeklySessions !== initialValues.weeklySessions ||
      supplements !== initialValues.supplements ||
      gender !== initialValues.gender ||
      currentBirthDate !== initialValues.birthDate
    )
  }
  const hasChanges = computeHasChanges()

  const clearSuccessAndBorders = () => {
    successRef.current = {}
    setTouched({
      name: false,
      birthDay: false,
      birthMonth: false,
      birthYear: false,
      gender: false,
      country: false,
      experience: false,
      mainGoal: false,
      trainingPlace: false,
      weeklySessions: false,
      supplements: false,
    })
    prevLatchedRef.current = {
      name: false,
      birthDay: false,
      birthMonth: false,
      birthYear: false,
      gender: false,
      country: false,
      experience: false,
      mainGoal: false,
      trainingPlace: false,
      weeklySessions: false,
      supplements: false,
    }
    setSuppressSuccess(true)
    setLatchedResetCounter((c) => c + 1)
  }

  const resetSuppress = () => {
    if (suppressSuccess) setSuppressSuccess(false)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name,
          birth_date: currentBirthDate || null,
          gender,
          country,
          experience_years: experience,
          main_goal: mainGoal,
          training_place: trainingPlace,
          weekly_sessions: weeklySessions,
          supplements,
        },
      })
      if (error) throw error

      const updatedInitials = {
        name,
        country,
        experience,
        mainGoal,
        trainingPlace,
        weeklySessions,
        supplements,
        gender,
        birthDate: currentBirthDate,
      }

      initialMetadataRef.current = {
        ...(initialMetadataRef.current || {}),
        name,
        country,
        experience_years: experience,
        main_goal: mainGoal,
        training_place: trainingPlace,
        weekly_sessions: weeklySessions,
        supplements,
        gender,
        birth_date: currentBirthDate || null,
      }

      setInitialValues({
        name: updatedInitials.name,
        country: updatedInitials.country,
        experience: updatedInitials.experience,
        mainGoal: updatedInitials.mainGoal,
        trainingPlace: updatedInitials.trainingPlace,
        weeklySessions: updatedInitials.weeklySessions,
        supplements: updatedInitials.supplements,
        gender: updatedInitials.gender,
        birthDate: updatedInitials.birthDate,
      })

      setTouched({
        name: false,
        birthDay: false,
        birthMonth: false,
        birthYear: false,
        gender: false,
        country: false,
        experience: false,
        mainGoal: false,
        trainingPlace: false,
        weeklySessions: false,
        supplements: false,
      })
      prevLatchedRef.current = {
        name: false,
        birthDay: false,
        birthMonth: false,
        birthYear: false,
        gender: false,
        country: false,
        experience: false,
        mainGoal: false,
        trainingPlace: false,
        weeklySessions: false,
        supplements: false,
      }
      successRef.current = {}
      setIsEditingName(false)
    } catch (e) {
      console.error('Erreur mise à jour', e)
      setError('Une erreur est survenue lors de la mise à jour. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
        }
      }}
      className="flex flex-col items-center gap-2"
    >
      {error && (
        <div className="w-[368px] text-red-500 text-[13px] font-medium mb-2 text-left">
          {error}
        </div>
      )}

      <ToggleField
        label="Sexe"
        value={gender}
        options={['Homme', 'Femme', 'Non binaire']}
        onChange={(v) => {
          resetSuppress()
          setGender(gender === v ? '' : v)
          setTouched((t) => ({ ...t, gender: true }))
        }}
        touched={latchedTouched.gender}
        setTouched={() => {
          resetSuppress()
          setTouched((t) => ({ ...t, gender: true }))
        }}
        success={successMessages.gender}
      />

      <TextField
        label="Prénom"
        value={name}
        onChange={(v) => {
          resetSuppress()
          setName(v)
        }}
        onBlur={() => {
          setTouched((t) => ({ ...t, name: true }))
          setIsEditingName(false)
        }}
        onFocus={() => {
          setIsEditingName(true)
          setTouched((t) => ({ ...t, name: false }))
        }}
        success={successMessages.name}
      />

      <BirthDateField
        birthDay={birthDate.birthDay}
        birthMonth={birthDate.birthMonth}
        birthYear={birthDate.birthYear}
        setBirthDay={(val) => {
          resetSuppress()
          setBirthDate((prev) => ({ ...prev, birthDay: val }))
          setTouched((t) => ({ ...t, birthDay: true }))
        }}
        setBirthMonth={(val) => {
          resetSuppress()
          setBirthDate((prev) => ({ ...prev, birthMonth: val }))
          setTouched((t) => ({ ...t, birthMonth: true }))
        }}
        setBirthYear={(val) => {
          resetSuppress()
          setBirthDate((prev) => ({ ...prev, birthYear: val }))
          setTouched((t) => ({ ...t, birthYear: true }))
        }}
        touched={{
          birthDay: latchedTouched.birthDay,
          birthMonth: latchedTouched.birthMonth,
          birthYear: latchedTouched.birthYear,
        }}
        setTouched={(partial) => {
          resetSuppress()
          setTouched((t) => ({
            ...t,
            ...(partial.birthDay !== undefined && { birthDay: partial.birthDay }),
            ...(partial.birthMonth !== undefined && { birthMonth: partial.birthMonth }),
            ...(partial.birthYear !== undefined && { birthYear: partial.birthYear }),
          }))
        }}
        successMessage={successMessages.birthDate}
        initialBirthDay={initialBirthDay}
        initialBirthMonth={initialBirthMonth}
        initialBirthYear={initialBirthYear}
      />

      <TextField label="Email" value={user?.email || ''} disabled />

      <div onMouseDown={() => resetSuppress()}>
        <DropdownField
          label="Pays de résidence"
          placeholder="Sélectionnez un pays"
          selected={country}
          onSelect={(v) => {
            if (v !== country) {
              resetSuppress()
              setCountry(v)
              setTouched((t) => ({ ...t, country: true }))
            }
          }}
          options={countries.map((v) => ({ value: v, label: v }))}
          touched={latchedTouched.country}
          setTouched={(val) => {
            if (val) {
              resetSuppress()
              setTouched((t) => ({ ...t, country: true }))
            }
          }}
          success={successMessages.country}
        />
      </div>

      <ToggleField
        label="Années de pratique"
        value={experience}
        options={['0', '1', '2', '3', '4', '5+']}
        onChange={(v) => {
          resetSuppress()
          setExperience(v)
          setTouched((t) => ({ ...t, experience: true }))
        }}
        touched={latchedTouched.experience}
        setTouched={() => {
          resetSuppress()
          setTouched((t) => ({ ...t, experience: true }))
        }}
        success={successMessages.experience}
      />

      <div onMouseDown={() => resetSuppress()}>
        <DropdownField
          label="Objectif principal"
          placeholder="Sélectionnez un objectif"
          selected={mainGoal}
          onSelect={(v) => {
            if (v !== mainGoal) {
              resetSuppress()
              setMainGoal(v)
              setTouched((t) => ({ ...t, mainGoal: true }))
            }
          }}
          options={goals.map((v) => ({ value: v, label: v }))}
          touched={latchedTouched.mainGoal}
          setTouched={(val) => {
            if (val) {
              resetSuppress()
              setTouched((t) => ({ ...t, mainGoal: true }))
            }
          }}
          success={successMessages.mainGoal}
        />
      </div>

      <ToggleField
        label="Lieu d’entraînement"
        value={trainingPlace}
        options={trainingPlaces}
        onChange={(v) => {
          resetSuppress()
          setTrainingPlace(v)
          setTouched((t) => ({ ...t, trainingPlace: true }))
        }}
        touched={latchedTouched.trainingPlace}
        setTouched={() => {
          resetSuppress()
          setTouched((t) => ({ ...t, trainingPlace: true }))
        }}
        success={successMessages.trainingPlace}
      />

      <ToggleField
        label="Nombre de sessions par semaine"
        value={weeklySessions}
        options={['1', '2', '3', '4', '5', '6+']}
        onChange={(v) => {
          resetSuppress()
          setWeeklySessions(v)
          setTouched((t) => ({ ...t, weeklySessions: true }))
        }}
        touched={latchedTouched.weeklySessions}
        setTouched={() => {
          resetSuppress()
          setTouched((t) => ({ ...t, weeklySessions: true }))
        }}
        success={successMessages.weeklySessions}
      />

      <ToggleField
        label="Prise de compléments alimentaires"
        value={supplements}
        options={['Oui', 'Non']}
        onChange={(v) => {
          resetSuppress()
          setSupplements(v)
          setTouched((t) => ({ ...t, supplements: true }))
        }}
        touched={latchedTouched.supplements}
        setTouched={() => {
          resetSuppress()
          setTouched((t) => ({ ...t, supplements: true }))
        }}
        success={successMessages.supplements}
        className="w-[246px]"
      />

      <SubmitButton
        loading={loading}
        disabled={!hasChanges || loading}
        onClick={() => {
          clearSuccessAndBorders()
        }}
      />
    </form>
  )
}
