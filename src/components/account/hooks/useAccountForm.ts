"use client"

import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { User } from "@supabase/supabase-js"

import { useUser } from "@/context/UserContext"
import { createClient } from "@/lib/supabaseClient"
import type { Database } from "@/lib/supabase/types"

const supabase = createClient()

type BirthDateParts = {
  birthDay: string
  birthMonth: string
  birthYear: string
}

type FormValues = {
  name: string
  gender: string
  country: string
  experience: string
  mainGoal: string
  trainingPlace: string
  weeklySessions: string
  supplements: string
  birthDate: BirthDateParts
}

type FlatValues = Omit<FormValues, "birthDate"> & { birthDate: string }

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

type SuccessMessages = Partial<
  Record<
    | "gender"
    | "name"
    | "country"
    | "experience"
    | "mainGoal"
    | "trainingPlace"
    | "weeklySessions"
    | "supplements"
    | "birthDate",
    string
  >
>

const EMPTY_BIRTH_DATE: BirthDateParts = {
  birthDay: "",
  birthMonth: "",
  birthYear: "",
}

const defaultTouchedState: TouchedState = {
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

const createDefaultTouched = (): TouchedState => ({ ...defaultTouchedState })

const parseBirthDate = (raw: unknown): BirthDateParts => {
  if (typeof raw === "string" && raw.includes("-")) {
    const [year, month, day] = raw.split("-")
    return {
      birthDay: day || "",
      birthMonth: month || "",
      birthYear: year || "",
    }
  }
  return { ...EMPTY_BIRTH_DATE }
}

const formatBirthDate = (parts: BirthDateParts) => {
  if (parts.birthYear && parts.birthMonth && parts.birthDay) {
    return `${parts.birthYear}-${parts.birthMonth}-${parts.birthDay}`
  }
  return ""
}

const toFlatValues = (values: FormValues): FlatValues => ({
  name: values.name,
  gender: values.gender,
  country: values.country,
  experience: values.experience,
  mainGoal: values.mainGoal,
  trainingPlace: values.trainingPlace,
  weeklySessions: values.weeklySessions,
  supplements: values.supplements,
  birthDate: formatBirthDate(values.birthDate),
})

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileDetails = Partial<ProfileRow> | null | undefined

const pickString = (
  profileValue: unknown,
  metadata: Record<string, unknown>,
  metadataKey: string
) => {
  if (typeof profileValue === "string") {
    return profileValue
  }

  if (profileValue === null) {
    return ""
  }

  const fallback = metadata[metadataKey]
  return typeof fallback === "string" ? fallback : ""
}

const buildSnapshot = (
  profile: ProfileDetails,
  metadata: Record<string, unknown> | undefined
): { values: FormValues; flat: FlatValues } => {
  const safeMetadata = metadata && typeof metadata === "object" ? metadata : {}

  const values: FormValues = {
    name: pickString(profile?.name, safeMetadata, "name"),
    gender: pickString(profile?.gender, safeMetadata, "gender"),
    country: pickString(profile?.country, safeMetadata, "country"),
    experience: pickString(profile?.experience, safeMetadata, "experience"),
    mainGoal: pickString(profile?.main_goal, safeMetadata, "main_goal"),
    trainingPlace: pickString(
      profile?.training_place,
      safeMetadata,
      "training_place"
    ),
    weeklySessions: pickString(
      profile?.weekly_sessions,
      safeMetadata,
      "weekly_sessions"
    ),
    supplements: pickString(profile?.supplements, safeMetadata, "supplements"),
    birthDate: parseBirthDate(
      typeof profile?.birth_date === "string"
        ? profile?.birth_date
        : safeMetadata.birth_date
    ),
  }

  return {
    values,
    flat: toFlatValues(values),
  }
}

const useLatchedTouched = (
  touched: TouchedState,
  resetCounter: number
): TouchedState => {
  const prevRef = useRef<TouchedState>(createDefaultTouched())
  const resetVersion = useRef<number>(resetCounter)
  const [latched, setLatched] = useState<TouchedState>(touched)

  useEffect(() => {
    if (resetVersion.current !== resetCounter) {
      resetVersion.current = resetCounter
      prevRef.current = { ...touched }
      setLatched({ ...touched })
      return
    }

    setLatched((prev) => {
      const next: TouchedState = { ...touched }
      for (const key of Object.keys(prev) as Array<keyof TouchedState>) {
        if (prev[key] && !touched[key]) {
          next[key] = true
        }
      }
      prevRef.current = next
      return next
    })
  }, [resetCounter, touched])

  return latched
}

const useSuccessMessages = (params: {
  latchedTouched: TouchedState
  isEditingName: boolean
  values: FormValues
  initialFlat: FlatValues
  isBirthDateValid: boolean
  successRef: MutableRefObject<Record<string, string>>
  suppress: boolean
}): SuccessMessages => {
  const {
    latchedTouched,
    isEditingName,
    values,
    initialFlat,
    isBirthDateValid,
    successRef,
    suppress,
  } = params

  return useMemo(() => {
    if (suppress) return {}

    const next: Record<string, string> = { ...successRef.current }

    if (latchedTouched.gender && values.gender && values.gender !== initialFlat.gender) {
      next.gender =
        values.gender === "Homme"
          ? "Men power !"
          : values.gender === "Femme"
          ? "Women power !"
          : "C'est noté !"
    } else {
      delete next.gender
    }

    if (
      latchedTouched.name &&
      !isEditingName &&
      values.name.trim().length > 1 &&
      values.name.trim() !== initialFlat.name.trim()
    ) {
      next.name = `Très bien, à partir de maintenant ce sera ${values.name.trim()} !`
    } else {
      delete next.name
    }

    if (latchedTouched.country && values.country && values.country !== initialFlat.country) {
      next.country =
        values.country === "Autre"
          ? "Ok, c'est noté."
          : "Ok, c'est un beau pays !"
    } else {
      delete next.country
    }

    if (
      latchedTouched.experience &&
      values.experience &&
      values.experience !== initialFlat.experience
    ) {
      next.experience = "Merci, on va passer les prochaines années ensemble !"
    } else {
      delete next.experience
    }

    if (latchedTouched.mainGoal && values.mainGoal && values.mainGoal !== initialFlat.mainGoal) {
      next.mainGoal = "C'est un bel objectif, let's go !"
    } else {
      delete next.mainGoal
    }

    if (
      latchedTouched.trainingPlace &&
      values.trainingPlace &&
      values.trainingPlace !== initialFlat.trainingPlace
    ) {
      next.trainingPlace = "Très bien, c'est noté !"
    } else {
      delete next.trainingPlace
    }

    if (
      latchedTouched.weeklySessions &&
      values.weeklySessions &&
      values.weeklySessions !== initialFlat.weeklySessions
    ) {
      next.weeklySessions = "Parfait, on va en tirer le maximum !"
    } else {
      delete next.weeklySessions
    }

    if (
      latchedTouched.supplements &&
      values.supplements !== "" &&
      values.supplements !== initialFlat.supplements
    ) {
      next.supplements = "Top, merci pour l'info !"
    } else {
      delete next.supplements
    }

    const currentBirthDate = toFlatValues(values).birthDate
    if (isBirthDateValid && currentBirthDate && currentBirthDate !== initialFlat.birthDate) {
      next.birthDate = "Super, maintenant on connaît la date de ton anniversaire !"
    } else {
      delete next.birthDate
    }

    successRef.current = next
    return next
  }, [
    initialFlat.birthDate,
    initialFlat.country,
    initialFlat.experience,
    initialFlat.gender,
    initialFlat.mainGoal,
    initialFlat.name,
    initialFlat.supplements,
    initialFlat.trainingPlace,
    initialFlat.weeklySessions,
    isBirthDateValid,
    isEditingName,
    latchedTouched,
    suppress,
    successRef,
    values,
  ])
}

const formatErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message
  return "Une erreur est survenue lors de la mise à jour. Veuillez réessayer."
}

type ValueUpdater = string | ((previous: string) => string)

type BirthDateUpdater = string | ((previous: string) => string)

export const useAccountForm = (user: User | null) => {
  const { updateUserMetadata } = useUser()
  const [profile, setProfile] = useState<ProfileDetails>(undefined)
  const snapshot = useMemo(
    () =>
      buildSnapshot(
        profile,
        user?.user_metadata as Record<string, unknown> | undefined
      ),
    [profile, user?.user_metadata]
  )

  const [values, setValues] = useState<FormValues>(snapshot.values)
  const [initialFlat, setInitialFlat] = useState<FlatValues>(snapshot.flat)
  const [initialBirthParts, setInitialBirthParts] = useState<BirthDateParts>(
    snapshot.values.birthDate
  )
  const [touched, setTouched] = useState<TouchedState>(createDefaultTouched())
  const [resetCounter, setResetCounter] = useState(0)
  const latchedTouched = useLatchedTouched(touched, resetCounter)

  const successRef = useRef<Record<string, string>>({})
  const [suppressSuccess, setSuppressSuccess] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetFeedback = useCallback(() => {
    successRef.current = {}
    setTouched(createDefaultTouched())
    setResetCounter((c) => c + 1)
    setSuppressSuccess(true)
  }, [])

  useEffect(() => {
    setValues(snapshot.values)
    setInitialFlat(snapshot.flat)
    setInitialBirthParts(snapshot.values.birthDate)
    setError(null)
    setIsEditingName(false)
    resetFeedback()
  }, [resetFeedback, snapshot])

  useEffect(() => {
    const userId = user?.id

    if (!userId) {
      setProfile(null)
      return
    }

    let cancelled = false

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, birth_date, gender, country, experience, main_goal, training_place, weekly_sessions, supplements"
        )
        .eq("id", userId)
        .maybeSingle<ProfileRow>()

      if (cancelled) {
        return
      }

      if (error && error.code !== "PGRST116") {
        console.error("[useAccountForm] failed to load profile", error)
        setProfile(null)
        return
      }

      setProfile(data ?? null)
    }

    void fetchProfile()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const markTouched = useCallback((updates: Partial<TouchedState>) => {
    setTouched((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetSuppress = useCallback(() => {
    setSuppressSuccess((prev) => (prev ? false : prev))
  }, [])

  const updateValue = useCallback(
    (field: keyof Omit<FormValues, "birthDate">, input: ValueUpdater) => {
      setValues((prev) => {
        const current = prev[field]
        const nextValue = typeof input === "function" ? input(current) : input
        if (current === nextValue) return prev
        return { ...prev, [field]: nextValue }
      })
    },
    []
  )

  const updateBirthDatePart = useCallback(
    (part: keyof BirthDateParts, input: BirthDateUpdater) => {
      setValues((prev) => {
        const current = prev.birthDate[part]
        const nextValue = typeof input === "function" ? input(current) : input
        if (current === nextValue) return prev
        return {
          ...prev,
          birthDate: {
            ...prev.birthDate,
            [part]: nextValue,
          },
        }
      })
    },
    []
  )

  const currentFlat = useMemo(() => toFlatValues(values), [values])

  const isBirthDateValid = useMemo(() => {
    return Boolean(
      values.birthDate.birthDay &&
        values.birthDate.birthMonth &&
        values.birthDate.birthYear &&
        (latchedTouched.birthDay ||
          latchedTouched.birthMonth ||
          latchedTouched.birthYear)
    )
  }, [
    latchedTouched.birthDay,
    latchedTouched.birthMonth,
    latchedTouched.birthYear,
    values.birthDate,
  ])

  const successMessages = useSuccessMessages({
    latchedTouched,
    isEditingName,
    values,
    initialFlat,
    isBirthDateValid,
    successRef,
    suppress: suppressSuccess,
  })

  const hasChanges = useMemo(() => {
    return (
      currentFlat.name !== initialFlat.name ||
      currentFlat.country !== initialFlat.country ||
      currentFlat.experience !== initialFlat.experience ||
      currentFlat.mainGoal !== initialFlat.mainGoal ||
      currentFlat.trainingPlace !== initialFlat.trainingPlace ||
      currentFlat.weeklySessions !== initialFlat.weeklySessions ||
      currentFlat.supplements !== initialFlat.supplements ||
      currentFlat.gender !== initialFlat.gender ||
      currentFlat.birthDate !== initialFlat.birthDate
    )
  }, [currentFlat, initialFlat])

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    resetFeedback()
    setLoading(true)
    setError(null)

    try {
      if (!user?.id) {
        throw new Error("Vous devez être connecté pour modifier vos informations.")
      }

      const trimmedName = currentFlat.name.trim()

      const profilePatch: Database["public"]["Tables"]["profiles"]["Update"] & {
        id: string
      } = {
        id: user.id,
        name: trimmedName,
        birth_date: currentFlat.birthDate || null,
        gender: currentFlat.gender,
        country: currentFlat.country,
        experience: currentFlat.experience,
        main_goal: currentFlat.mainGoal,
        training_place: currentFlat.trainingPlace,
        weekly_sessions: currentFlat.weeklySessions,
        supplements: currentFlat.supplements,
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert(profilePatch, { onConflict: "id" })

      if (updateError) throw updateError

      const metadataPatch = { ...profilePatch }
      delete metadataPatch.id
      const { error: metadataUpdateError } = await supabase.auth.updateUser({
        data: { name: trimmedName },
      })

      if (metadataUpdateError) throw metadataUpdateError
      updateUserMetadata(metadataPatch)

      setProfile((prev) => ({ ...(prev ?? {}), ...profilePatch }))

      setInitialFlat({ ...currentFlat })
      setInitialBirthParts({ ...values.birthDate })
      successRef.current = {}
      setIsEditingName(false)
      return true
    } catch (submitError) {
      console.error("Erreur mise à jour", submitError)
      setError(formatErrorMessage(submitError))
      return false
    } finally {
      setLoading(false)
    }
  }, [
    currentFlat,
    resetFeedback,
    updateUserMetadata,
    user?.id,
    values.birthDate,
  ])

  const startNameEdition = useCallback(() => {
    setIsEditingName(true)
    markTouched({ name: false })
  }, [markTouched])

  const endNameEdition = useCallback(() => {
    setIsEditingName(false)
    markTouched({ name: true })
  }, [markTouched])

  return {
    values,
    updateValue,
    updateBirthDatePart,
    markTouched,
    latchedTouched,
    successMessages,
    handleSubmit,
    loading,
    error,
    hasChanges,
    resetSuppress,
    initialBirthParts,
    startNameEdition,
    endNameEdition,
    isEditingName,
  }
}

export type { BirthDateParts, SuccessMessages, TouchedState }
