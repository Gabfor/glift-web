"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

import {
  COUNTRIES,
  EXPERIENCE_OPTIONS,
  GENDER_OPTIONS,
  MAIN_GOALS,
  SUPPLEMENTS_OPTIONS,
  TRAINING_PLACES,
  WEEKLY_SESSIONS_OPTIONS,
} from "./constants"
import { useAccountForm } from "./hooks/useAccountForm"
import { useAvatar } from "./hooks/useAvatar"
import BirthDateField from "./fields/BirthDateField"
import DropdownField from "./fields/DropdownField"
import EmailInfoAdornment from "./fields/EmailInfoAdornment"
import SubmitButton from "./fields/SubmitButton"
import TextField from "./fields/TextField"
import ToggleField from "./fields/ToggleField"
import IncompleteAlert from "./IncompleteAlert"
import ProfileCompleteAlert from "./ProfileCompleteAlert"
import MissingField from "./fields/MissingField"
import ProfilePictureBlock from "./fields/ProfilePictureBlock"

export default function MesInformationsForm({ user }: { user: User | null }) {
  const {
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
  } = useAccountForm(user)

  const {
    displayUrl: avatarDisplayUrl,
    isWorking: isAvatarWorking,
    error: avatarError,
    uploadAvatar,
    removeAvatar,
  } = useAvatar(user)

  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  const trimmedName = values.name.trim()
  const missing = {
    gender: !values.gender,
    name: trimmedName.length === 0,
    birthDate:
      !values.birthDate.birthDay ||
      !values.birthDate.birthMonth ||
      !values.birthDate.birthYear,
    country: !values.country,
    experience: !values.experience,
    mainGoal: !values.mainGoal,
    trainingPlace: !values.trainingPlace,
    weeklySessions: !values.weeklySessions,
    supplements: values.supplements === "",
    email: !user?.email,
  }

  const completionEntries = [
    !missing.gender,
    !missing.name,
    !missing.birthDate,
    !missing.country,
    !missing.experience,
    !missing.mainGoal,
    !missing.trainingPlace,
    !missing.weeklySessions,
    !missing.supplements,
    !missing.email,
  ]

  const completionRatio = completionEntries.length
    ? completionEntries.filter(Boolean).length / completionEntries.length
    : 0
  const profileCompletion = Math.round(completionRatio * 100)

  const hasIncomplete = Object.values(missing).some(Boolean)
  const hasTopMessage = Boolean(
    error || avatarError || hasIncomplete || showSuccessBanner,
  )

  useEffect(() => {
    if (hasIncomplete) {
      setShowSuccessBanner(false)
    }
  }, [hasIncomplete])

  useEffect(() => {
    if (hasChanges) {
      setShowSuccessBanner(false)
    }
  }, [hasChanges])

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setShowSuccessBanner(false)
        const submitSucceeded = await handleSubmit()
        if (submitSucceeded && !hasIncomplete) {
          setShowSuccessBanner(true)
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
        }
      }}
      className="flex flex-col items-center gap-2"
    >
      {error && (
        <div className="w-[368px] text-red-500 text-[13px] font-medium mb-2 text-left">
          {error}
        </div>
      )}

      {avatarError && (
        <div className="w-[368px] text-red-500 text-[13px] font-medium mb-2 text-left">
          {avatarError}
        </div>
      )}

      {hasIncomplete ? <IncompleteAlert /> : showSuccessBanner ? <ProfileCompleteAlert /> : null}

      <div
        className={`w-[368px] flex flex-col items-center mb-[30px]${
          hasTopMessage ? "" : " mt-[30px]"
        }`}
      >
        <ProfilePictureBlock
          imageUrl={avatarDisplayUrl}
          profileCompletion={profileCompletion}
          onImageChange={async (file) => {
            setShowSuccessBanner(false)
            return uploadAvatar(file)
          }}
          onImageRemove={async () => {
            setShowSuccessBanner(false)
            await removeAvatar()
          }}
          isBusy={isAvatarWorking}
        />
      </div>

      <MissingField show={missing.gender}>
        <ToggleField
          label="Sexe"
          value={values.gender}
          options={Array.from(GENDER_OPTIONS)}
          onChange={(option) => {
            resetSuppress()
            updateValue("gender", (current) => (current === option ? "" : option))
            markTouched({ gender: true })
          }}
          touched={latchedTouched.gender}
          setTouched={() => {
            resetSuppress()
            markTouched({ gender: true })
          }}
          success={successMessages.gender}
        />
      </MissingField>

      <MissingField show={missing.name}>
        <TextField
          label="Prénom"
          value={values.name}
          onChange={(next) => {
            resetSuppress()
            updateValue("name", next)
          }}
          onBlur={() => {
            endNameEdition()
          }}
          onFocus={() => {
            resetSuppress()
            startNameEdition()
          }}
          success={successMessages.name}
        />
      </MissingField>

      <MissingField show={missing.birthDate}>
        <BirthDateField
          birthDay={values.birthDate.birthDay}
          birthMonth={values.birthDate.birthMonth}
          birthYear={values.birthDate.birthYear}
          setBirthDay={(next) => {
            resetSuppress()
            updateBirthDatePart("birthDay", next)
            markTouched({ birthDay: true })
          }}
          setBirthMonth={(next) => {
            resetSuppress()
            updateBirthDatePart("birthMonth", next)
            markTouched({ birthMonth: true })
          }}
          setBirthYear={(next) => {
            resetSuppress()
            updateBirthDatePart("birthYear", next)
            markTouched({ birthYear: true })
          }}
          touched={{
            birthDay: latchedTouched.birthDay,
            birthMonth: latchedTouched.birthMonth,
            birthYear: latchedTouched.birthYear,
          }}
          setTouched={(partial) => {
            resetSuppress()
            markTouched(partial)
          }}
          successMessage={successMessages.birthDate ?? ""}
          initialBirthDay={initialBirthParts.birthDay}
          initialBirthMonth={initialBirthParts.birthMonth}
          initialBirthYear={initialBirthParts.birthYear}
        />
      </MissingField>

      <MissingField show={missing.email}>
        <TextField
          label="Email"
          value={user?.email || ""}
          disabled
          endAdornment={<EmailInfoAdornment />}
        />
      </MissingField>

      <MissingField show={missing.country}>
        <div
          onMouseDown={() => {
            resetSuppress()
          }}
        >
          <DropdownField
            label="Pays de résidence"
            placeholder="Sélectionnez un pays"
            selected={values.country}
            onSelect={(option) => {
              resetSuppress()
              updateValue("country", option)
              markTouched({ country: true })
            }}
            options={Array.from(COUNTRIES).map((country) => ({
              value: country,
              label: country,
            }))}
            touched={latchedTouched.country}
            setTouched={(isTouched) => {
              if (isTouched) {
                resetSuppress()
                markTouched({ country: true })
              }
            }}
            success={successMessages.country}
          />
        </div>
      </MissingField>

      <MissingField show={missing.experience}>
        <ToggleField
          label="Années de pratique"
          value={values.experience}
          options={Array.from(EXPERIENCE_OPTIONS)}
          onChange={(option) => {
            resetSuppress()
            updateValue("experience", option)
            markTouched({ experience: true })
          }}
          touched={latchedTouched.experience}
          setTouched={() => {
            resetSuppress()
            markTouched({ experience: true })
          }}
          success={successMessages.experience}
          variant="boxed"
        />
      </MissingField>

      <MissingField show={missing.mainGoal}>
        <div
          onMouseDown={() => {
            resetSuppress()
          }}
        >
          <DropdownField
            label="Objectif principal"
            placeholder="Sélectionnez un objectif"
            selected={values.mainGoal}
            onSelect={(option) => {
              resetSuppress()
              updateValue("mainGoal", option)
              markTouched({ mainGoal: true })
            }}
            options={Array.from(MAIN_GOALS).map((goal) => ({ value: goal, label: goal }))}
            touched={latchedTouched.mainGoal}
            setTouched={(isTouched) => {
              if (isTouched) {
                resetSuppress()
                markTouched({ mainGoal: true })
              }
            }}
            success={successMessages.mainGoal}
          />
        </div>
      </MissingField>

      <MissingField show={missing.trainingPlace}>
        <ToggleField
          label="Lieu d’entraînement"
          value={values.trainingPlace}
          options={Array.from(TRAINING_PLACES)}
          onChange={(option) => {
            resetSuppress()
            updateValue("trainingPlace", option)
            markTouched({ trainingPlace: true })
          }}
          touched={latchedTouched.trainingPlace}
          setTouched={() => {
            resetSuppress()
            markTouched({ trainingPlace: true })
          }}
          success={successMessages.trainingPlace}
        />
      </MissingField>

      <MissingField show={missing.weeklySessions}>
        <ToggleField
          label="Nombre de séances par semaine"
          value={values.weeklySessions}
          options={Array.from(WEEKLY_SESSIONS_OPTIONS)}
          onChange={(option) => {
            resetSuppress()
            updateValue("weeklySessions", option)
            markTouched({ weeklySessions: true })
          }}
          touched={latchedTouched.weeklySessions}
          setTouched={() => {
            resetSuppress()
            markTouched({ weeklySessions: true })
          }}
          success={successMessages.weeklySessions}
          variant="boxed"
        />
      </MissingField>

      <MissingField show={missing.supplements}>
        <ToggleField
          label="Prise de compléments alimentaires"
          value={values.supplements}
          options={Array.from(SUPPLEMENTS_OPTIONS)}
          onChange={(option) => {
            resetSuppress()
            updateValue("supplements", option)
            markTouched({ supplements: true })
          }}
          touched={latchedTouched.supplements}
          setTouched={() => {
            resetSuppress()
            markTouched({ supplements: true })
          }}
          success={successMessages.supplements}
          className="w-[246px]"
        />
      </MissingField>

      <SubmitButton loading={loading} disabled={!hasChanges || loading} />
    </form>
  )
}
