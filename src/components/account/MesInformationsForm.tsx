'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useTouchedHelpers } from '@/components/account/MesInformationsForm/hooks/useTouchedHelpers'

import { useProfileInitials } from './MesInformationsForm/hooks/useProfileInitials'
import { useLatchedTouched } from './MesInformationsForm/hooks/useLatchedTouched'
import { useSuccessMessages } from './MesInformationsForm/hooks/useSuccessMessages'
import { useAvatar } from './MesInformationsForm/hooks/useAvatar'
import { useProfileSubmit } from './MesInformationsForm/hooks/useProfileSubmit'

import { buildBirthDate } from './MesInformationsForm/utils/buildBirthDate'
import { calculateCompletionPercentage } from './MesInformationsForm/utils/completion'
import { hasFormChanges } from './MesInformationsForm/utils/equality'
import type { InitialValues } from './MesInformationsForm/utils/types'
import { preprocessAvatar } from './MesInformationsForm/utils/image'

// parts (présentation pure, 0 logique)
import Loader from './MesInformationsForm/parts/Loader'
import CongratsAlert from './MesInformationsForm/parts/CongratsAlert'
import IncompleteAlert from './MesInformationsForm/parts/IncompleteAlert'
import AvatarBlock from './MesInformationsForm/parts/AvatarBlock'
import GenderRow from './MesInformationsForm/parts/GenderRow'
import NameRow from './MesInformationsForm/parts/NameRow'
import BirthDateRow from './MesInformationsForm/parts/BirthDateRow'
import EmailRow from './MesInformationsForm/parts/EmailRow'
import CountryRow from './MesInformationsForm/parts/CountryRow'
import ExperienceRow from './MesInformationsForm/parts/ExperienceRow'
import MainGoalRow from './MesInformationsForm/parts/MainGoalRow'
import TrainingPlaceRow from './MesInformationsForm/parts/TrainingPlaceRow'
import WeeklySessionsRow from './MesInformationsForm/parts/WeeklySessionsRow'
import SupplementsRow from './MesInformationsForm/parts/SupplementsRow'
import SubmitBar from './MesInformationsForm/parts/SubmitBar'
import { createClientComponentClient } from '@/lib/supabase/client'

const CACHE_KEY = 'glift:avatar_url'
const cacheGet = () => { try { return localStorage.getItem(CACHE_KEY) } catch { return null } }
const cacheSet = (url: string) => { try { localStorage.setItem(CACHE_KEY, url) } catch {} }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cacheClear = () => { try { localStorage.removeItem(CACHE_KEY) } catch {} }

// n’ajoute un cache-buster que pour des URLs http(s) ou relatives (évite blob:)
const withBuster = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('/')) {
    return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
  }
  return url
}

export default function MesInformationsForm({ user }: { user: any }) {
  const {
    initialRef,
    initialValues,
    setInitials,
    initialBirthDate,
    initialBirthDay,
    initialBirthMonth,
    initialBirthYear,
    ready,
  } = useProfileInitials(user)

  const [name, setName] = useState<string>(initialValues.name)
  const [gender, setGender] = useState<string>(initialValues.gender)
  const [country, setCountry] = useState<string>(initialValues.country)
  const [experience, setExperience] = useState<string>(initialValues.experience)
  const [mainGoal, setMainGoal] = useState<string>(initialValues.mainGoal)
  const [trainingPlace, setTrainingPlace] = useState<string>(initialValues.trainingPlace)
  const [weeklySessions, setWeeklySessions] = useState<string>(initialValues.weeklySessions)
  const [supplements, setSupplements] = useState<string>(initialValues.supplements)
  const [birthDay, setBirthDay] = useState<string>(initialBirthDay)
  const [birthMonth, setBirthMonth] = useState<string>(initialBirthMonth)
  const [birthYear, setBirthYear] = useState<string>(initialBirthYear)
  const [isEditingName, setIsEditingName] = useState(false)

  const { profileImageUrl, setProfileImageUrl, uploadAvatar, removeAvatar } = useAvatar(
    user,
    initialRef.current?.avatar_url || ''
  )

  // === Diffusion du prénom : UNIQUEMENT à la sauvegarde ===
  const broadcastName = useCallback((n: string) => {
    try { localStorage.setItem('glift:display_name', n) } catch {}
    try { window.dispatchEvent(new CustomEvent('glift:name-updated', { detail: { name: n } })) } catch {}
    try { window.dispatchEvent(new CustomEvent('glift:profile-updated', { detail: { name: n } })) } catch {}
    try { window.dispatchEvent(new CustomEvent('glift:user-updated', { detail: { name: n } })) } catch {}
  }, [])

  /** Anti-écrasement court après action locale (preview / upload / remove) */
  const avatarOverrideRef = useRef<{ value: string; expiresAt: number } | null>(null)
  const setAvatarUi = (url: string) => {
    const busted = withBuster(url || '')
    setProfileImageUrl(busted)
    try { cacheSet(busted) } catch {}
    avatarOverrideRef.current = { value: busted, expiresAt: Date.now() + 2500 }
  }

  // 0) Init depuis cache si présent (évite le “flash” au (re)montage)
  useEffect(() => {
    const cached = cacheGet()
    if (cached !== null) setProfileImageUrl((cur) => (cur === cached ? cur : cached))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 1) Écoute l’event global (émis par useAvatar) → priorité immédiate
  useEffect(() => {
    const handler = (e: any) => {
      const url: string | null = e?.detail?.url ?? null
      setAvatarUi(url || '')
    }
    window.addEventListener('glift:avatar-updated', handler)
    return () => window.removeEventListener('glift:avatar-updated', handler)
  }, [])

  // 2) Hydratation des champs texte quand initialValues change
  useEffect(() => {
    setName(initialValues.name || '')
    setGender(initialValues.gender || '')
    setCountry(initialValues.country || '')
    setExperience(initialValues.experience || '')
    setMainGoal(initialValues.mainGoal || '')
    setTrainingPlace(initialValues.trainingPlace || '')
    setWeeklySessions(initialValues.weeklySessions || '')
    setSupplements(initialValues.supplements || '')
  }, [initialValues])

  // 3) Hydratation date (JJ/MM/AAAA)
  useEffect(() => {
    setBirthDay(initialBirthDay || '')
    setBirthMonth(initialBirthMonth || '')
    setBirthYear(initialBirthYear || '')
  }, [initialBirthDay, initialBirthMonth, initialBirthYear])

  // 4) Hydratation avatar depuis DB MAIS on respecte l’override et le cache
  useEffect(() => {
    const now = Date.now()
    const override = avatarOverrideRef.current
    if (override && now < override.expiresAt) return

    const cached = cacheGet()
    const dbUrl = initialValues.avatar_url || ''
    const prefer = (cached !== null ? cached : dbUrl) || ''
    const busted = withBuster(prefer)
    setProfileImageUrl((cur) => (cur === busted ? cur : busted))
  }, [initialValues.avatar_url, setProfileImageUrl])

  // === Baseline avatar pour la comparaison (même logique que l’UI): cache → DB/meta
  const initialAvatarBaseline = useMemo(() => {
    const cached = cacheGet()
    const fromDbOrMeta = initialValues.avatar_url || user?.user_metadata?.avatar_url || ''
    const prefer = (cached !== null ? cached : fromDbOrMeta) || ''
    return withBuster(prefer) // le cache-buster sera ignoré côté equality.ts
  }, [initialValues.avatar_url, user?.user_metadata?.avatar_url])

  const { touched, setTouched, latchedTouched, resetLatched, clearAllTouched } = useLatchedTouched()

  const currentBirthDate = useMemo(
    () => buildBirthDate({ birthDay, birthMonth, birthYear }),
    [birthDay, birthMonth, birthYear]
  )

  const isBirthDateValid = Boolean(
    birthDay &&
      birthMonth &&
      birthYear &&
      (latchedTouched.birthDay || latchedTouched.birthMonth || latchedTouched.birthYear)
  )

  const { successMessages, clearSuccess, resetSuppress } = useSuccessMessages({
    latchedTouched,
    isEditingName,
    name,
    initialName: initialValues.name,
    country,
    initialCountry: initialValues.country,
    experience,
    initialExperience: initialValues.experience,
    mainGoal,
    initialMainGoal: initialValues.mainGoal,
    trainingPlace,
    initialTrainingPlace: initialValues.trainingPlace,
    weeklySessions,
    initialWeeklySessions: initialValues.weeklySessions,
    supplements,
    initialSupplements: initialValues.supplements,
    gender,
    initialGender: initialValues.gender,
    currentBirthDate,
    initialBirthDate,
    isBirthDateValid,
  })

  const { markTouched, changeAndTouch } = useTouchedHelpers(resetSuppress, setTouched)

  const profileCompletion = useMemo(
    () =>
      calculateCompletionPercentage({
        email: user?.email,
        name,
        birthDay,
        birthMonth,
        birthYear,
        gender,
        country,
        experience,
        mainGoal,
        trainingPlace,
        weeklySessions,
        supplements,
      }),
    [
      user?.email,
      name,
      birthDay,
      birthMonth,
      birthYear,
      gender,
      country,
      experience,
      mainGoal,
      trainingPlace,
      weeklySessions,
      supplements,
    ]
  )

  const missing = {
    name: name.trim().length === 0,
    birthDate: !(birthDay && birthMonth && birthYear),
    gender: !gender,
    country: !country,
    experience: !experience,
    mainGoal: !mainGoal,
    trainingPlace: !trainingPlace,
    weeklySessions: !weeklySessions,
    supplements: supplements === '',
    email: !user?.email,
  }

  const hasIncomplete =
    missing.name ||
    missing.birthDate ||
    missing.gender ||
    missing.country ||
    missing.experience ||
    missing.mainGoal ||
    missing.trainingPlace ||
    missing.weeklySessions ||
    missing.supplements

  const valuesForCompare = {
    name,
    gender,
    country,
    experience,
    mainGoal,
    trainingPlace,
    weeklySessions,
    supplements,
    birthDay,
    birthMonth,
    birthYear,
    profileImageUrl,
  }

  // Désactive le CTA tant que rien n'a changé ET tant que le form n'est pas prêt
  const hasChanges = ready && hasFormChanges(valuesForCompare, initialValues, initialAvatarBaseline)

  const [showCompletionAlert, setShowCompletionAlert] = useState(false)
  useEffect(() => {
    if (hasChanges) setShowCompletionAlert(false)
  }, [hasChanges])

  // Submit hook
  const { submit, loading: submitLoading, error } = useProfileSubmit()

  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    if (!submitLoading) setSubmitting(false)
  }, [submitLoading])

  useEffect(() => {
    if (!submitting) return
    const t = setTimeout(() => setSubmitting(false), 20000)
    return () => clearTimeout(t)
  }, [submitting])

  const clearSuccessAndBorders = () => {
    clearSuccess()
    resetLatched()
    clearAllTouched()
  }

  // === Upload wrapper : preview + preprocess (512x512 JPEG) + upload via hook ===
  const uploadAvatarWithPreprocess = async (file: File) => {
    const okType =
      /^image\/(png|jpeg|jpg|webp|heic|heif)$/i.test(file.type) ||
      /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name)
    if (!okType) {
      alert('Format non supporté. Utilisez PNG, JPG ou WebP.')
      return
    }
    const maxMB = 10
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Fichier trop volumineux (> ${maxMB} Mo).`)
      return
    }

    // preview optimiste
    try {
      const preview = URL.createObjectURL(file)
      setAvatarUi(preview) // (blob:… pas de cache-buster)
    } catch {}

    // prétraitement (carré 512 + compression 90%)
    let processed = file
    try {
      processed = await preprocessAvatar(file, { size: 512, mimeType: 'image/jpeg', quality: 0.9 })
    } catch (e) {
      console.warn('[avatar] preprocess failed, fallback to original file', e)
    }

    await uploadAvatar(processed)
  }

  if (!ready) return <Loader />

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (submitting || submitLoading || !hasChanges) return

        setSubmitting(true)
        try {
          await submit({
            values: {
              name,
              birthDate: currentBirthDate,
              gender,
              country,
              experience,
              mainGoal,
              trainingPlace,
              weeklySessions,
              supplements,
              // ⚠️ pas d'avatar_url ici (géré via Auth metadata)
            },
            applyInitials: (patch: Partial<InitialValues>) => {
              setInitials(patch)
            },
            onAfterPersist: () => {
              clearSuccessAndBorders()
              setIsEditingName(false)
              // ✅ MAJ du header UNIQUEMENT après la persistance
              broadcastName(name)

              // ✅ Aligne explicitement la baseline (initialValues) sur les valeurs actuelles
              setInitials({
                name: name ?? '',
                gender: gender ?? '',
                country: country ?? '',
                experience: experience ?? '',
                mainGoal: mainGoal ?? '',
                trainingPlace: trainingPlace ?? '',
                weeklySessions: weeklySessions ?? '',
                supplements: supplements ?? '',
                birthDate: currentBirthDate ?? '',
              })

              if (!hasIncomplete) setShowCompletionAlert(true)
            },
          })
        } finally {
          setSubmitting(false)
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault()
      }}
      className="flex flex-col items-center gap-2"
    >
      {error && (
        <div className="w-[368px] text-red-500 text-[13px] font-medium mb-2 text-left">
          {error}
        </div>
      )}

      {showCompletionAlert && !hasIncomplete && <CongratsAlert />}

      {!showCompletionAlert && hasIncomplete && <IncompleteAlert />}

      <AvatarBlock
        profileImageUrl={profileImageUrl}
        profileCompletion={profileCompletion}
        setAvatarUi={setAvatarUi}
        uploadAvatar={uploadAvatarWithPreprocess}
        setInitials={setInitials}
        setTouched={setTouched}
        removeAvatar={removeAvatar}  // ⬅️ direct: le hook fait tout (Storage + DB + Auth + cache + event)
      />

      <GenderRow
        missing={missing.gender}
        gender={gender}
        resetSuppress={resetSuppress}
        setGender={setGender}
        markTouched={markTouched}
        latchedTouched={latchedTouched}
        success={successMessages.gender}
      />

      <NameRow
        missing={missing.name}
        name={name}
        resetSuppress={resetSuppress}
        setName={setName}  // MAJ header faite après sauvegarde uniquement
        markTouched={markTouched}
        setIsEditingName={setIsEditingName}
        setTouched={setTouched}
        success={successMessages.name}
      />

      <BirthDateRow
        missing={missing.birthDate}
        birthDay={birthDay}
        birthMonth={birthMonth}
        birthYear={birthYear}
        setBirthDay={setBirthDay}
        setBirthMonth={setBirthMonth}
        setBirthYear={setBirthYear}
        changeAndTouch={changeAndTouch}
        resetSuppress={resetSuppress}
        setTouched={setTouched}
        latchedTouched={latchedTouched}
        successMessage={successMessages.birthDate || ''}
        initialBirthDay={initialBirthDay}
        initialBirthMonth={initialBirthMonth}
        initialBirthYear={initialBirthYear}
      />

      <EmailRow missing={missing.email} email={user?.email || ''} />

      <CountryRow
        missing={missing.country}
        country={country}
        resetSuppress={resetSuppress}
        changeAndTouch={changeAndTouch}
        latchedTouched={latchedTouched}
        markTouched={markTouched}
        success={successMessages.country}
        setCountry={setCountry}
      />

      <ExperienceRow
        missing={missing.experience}
        experience={experience}
        changeAndTouch={changeAndTouch}
        latchedTouched={latchedTouched}
        markTouched={markTouched}
        success={successMessages.experience}
        setExperience={setExperience}
      />

      <MainGoalRow
        missing={missing.mainGoal}
        mainGoal={mainGoal}
        resetSuppress={resetSuppress}
        changeAndTouch={changeAndTouch}
        latchedTouched={latchedTouched}
        markTouched={markTouched}
        success={successMessages.mainGoal}
        setMainGoal={setMainGoal}
      />

      <TrainingPlaceRow
        missing={missing.trainingPlace}
        trainingPlace={trainingPlace}
        changeAndTouch={changeAndTouch}
        latchedTouched={latchedTouched}
        markTouched={markTouched}
        success={successMessages.trainingPlace}
        setTrainingPlace={setTrainingPlace}
      />

      <WeeklySessionsRow
        missing={missing.weeklySessions}
        weeklySessions={weeklySessions}
        changeAndTouch={changeAndTouch}
        latchedTouched={latchedTouched}
        markTouched={markTouched}
        success={successMessages.weeklySessions}
        setWeeklySessions={setWeeklySessions}
      />

      <SupplementsRow
        missing={missing.supplements}
        supplements={supplements}
        changeAndTouch={changeAndTouch}
        latchedTouched={latchedTouched}
        markTouched={markTouched}
        success={successMessages.supplements}
        setSupplements={setSupplements}
      />

      <SubmitBar
        submitting={submitting}
        submitLoading={submitLoading}
        hasChanges={hasChanges}
        clearSuccessAndBorders={clearSuccessAndBorders}
      />
    </form>
  )
}