"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Image from "next/image"

import AccountAccordionSection from "../AccountAccordionSection"
import SubmitButton from "../fields/SubmitButton"
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal"
import {
  PasswordField,
  getPasswordValidationState,
} from "@/components/forms/PasswordField"
import type { PasswordFieldProps } from "@/components/forms/PasswordField"
import { createClient } from "@/lib/supabaseClient"
import ModalMessage from "@/components/ui/ModalMessage"
import { useUser } from "@/context/UserContext"

const INVALID_CURRENT_PASSWORD_MESSAGE =
  "L’ancien mot de passe que tu as renseigné ne correspond pas au mot de passe actuellement utilisé pour te connecter à ton compte."

function PasswordCriteriaItem({ valid, text }: { valid: boolean; text: string }) {
  const icon = valid ? "/icons/check-success.svg" : "/icons/check-neutral.svg"

  return (
    <div className="flex items-center justify-between gap-4 font-semibold">
      <span className={valid ? "text-[#00D591]" : "text-[#D7D4DC]"}>{text}</span>
      <Image src={icon} alt="État" width={16} height={16} className="h-4 w-4" />
    </div>
  )
}

export const SECTION_ID = "mot-de-passe"

export default function MotDePasseSection() {
  const supabase = useMemo(() => createClient(), [])
  const { user, updateUserMetadata } = useUser()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [repeatPasswordTouched, setRepeatPasswordTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null)
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null)
  const [newPasswordStatusOverride, setNewPasswordStatusOverride] = useState<
    PasswordFieldProps["statusOverride"]
  >()
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [hasCreatedPassword, setHasCreatedPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<{ hasPassword: boolean; provider?: string } | null>(null)

  useEffect(() => {
    let isCancelled = false
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/account/password-status")
        if (res.ok) {
          const data = await res.json()
          if (!isCancelled) {
            setPasswordStatus(data)
          }
        }
      } catch (e) {
        console.error("[MotDePasseSection] checkStatus error", e)
      }
    }
    void checkStatus()
    return () => {
      isCancelled = true
    }
  }, [user?.id])

  const providers = useMemo(() => {
    return ((user?.app_metadata?.providers as string[] | undefined) ?? [])
  }, [user?.app_metadata?.providers])

  const isOAuthOnly = useMemo(() => {
    if (hasCreatedPassword) return false
    if (passwordStatus !== null) {
      return !passwordStatus.hasPassword
    }
    if (user?.user_metadata?.has_password === true) return false
    if (user?.app_metadata?.has_password === true) return false
    if (providers.includes("email") || user?.app_metadata?.provider === "email") {
      return false
    }
    return (
      providers.includes("google") ||
      providers.includes("apple") ||
      user?.app_metadata?.provider === "google" ||
      user?.app_metadata?.provider === "apple"
    )
  }, [hasCreatedPassword, passwordStatus, providers, user?.app_metadata, user?.user_metadata])

  const providerName = useMemo(() => {
    if (passwordStatus?.provider === "google" || providers.includes("google") || user?.app_metadata?.provider === "google") {
      return "Google"
    }
    if (passwordStatus?.provider === "apple" || providers.includes("apple") || user?.app_metadata?.provider === "apple") {
      return "Apple"
    }
    return "un compte social"
  }, [passwordStatus?.provider, providers, user?.app_metadata?.provider])

  const validation = useMemo(() => getPasswordValidationState(newPassword), [newPassword])

  const passwordsMatch = repeatPassword.length > 0 && repeatPassword === newPassword
  const repeatPasswordError =
    repeatPasswordTouched && repeatPassword.length > 0 && repeatPassword !== newPassword
      ? "Les deux mots de passe ne correspondent pas."
      : null

  const isFormReady = isOAuthOnly
    ? validation.isValid && passwordsMatch
    : currentPassword.trim() !== "" && validation.isValid

  const canSubmit = isFormReady && !loading

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading || !canSubmit) {
      return
    }

    const hadPreviousSuccess = success

    setLoading(true)
    setError(null)
    setSuccess(false)
    setCurrentPasswordError(null)
    setNewPasswordError(null)
    setNewPasswordStatusOverride(undefined)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "same-origin",
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | { success?: boolean }
        | null

      if (!response.ok) {
        const errorCode = payload && "error" in payload ? payload.error : undefined

        switch (errorCode) {
          case "invalid-current-password":
            setError(INVALID_CURRENT_PASSWORD_MESSAGE)
            break
          case "same-password":
            setError("Ton nouveau mot de passe doit être différent de l’actuel.")
            setNewPasswordStatusOverride("neutral")
            if (hadPreviousSuccess) {
              setSuccess(true)
            }
            break
          case "invalid-password-format":
            setNewPasswordError("Ton nouveau mot de passe ne respecte pas les critères requis.")
            setNewPasswordStatusOverride(undefined)
            setError("Impossible de mettre à jour le mot de passe.")
            break
          case "not-authenticated":
            setError("Tu dois être connecté.")
            break
          case "missing-fields":
          case "invalid-body":
            setError("Informations manquantes pour modifier ton mot de passe.")
            break
          case "user-fetch-failed":
          case "missing-email":
          case "update-failed":
          case "unexpected-error":
            setError("Impossible de mettre à jour le mot de passe.")
            break
          default:
            setError("Impossible de mettre à jour le mot de passe.")
            break
        }

        return
      }

      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setRepeatPassword("")
      setRepeatPasswordTouched(false)
      setNewPasswordStatusOverride(undefined)
      setHasCreatedPassword(true)
      setPasswordStatus({ hasPassword: true })
      updateUserMetadata({ has_password: true })
    } catch (unknownError) {
      console.error("[MotDePasseSection] unexpected error", unknownError)
      setError("Une erreur est survenue. Merci de réessayer dans quelques instants.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AccountAccordionSection value={SECTION_ID} title="Mon mot de passe">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center"
      >
        {isOAuthOnly && !success && (
          <div className="mt-4 flex w-full justify-center">
            <ModalMessage
              variant="info"
              title={`Connexion via ${providerName}`}
              description={`Tu es connecté avec ton compte ${providerName}. Tu n’as pas besoin de mot de passe pour accéder à Glift. Si tu souhaites aussi pouvoir te connecter avec un mot de passe, renseigne les champs ci-dessous.`}
              className="w-full max-w-[564px]"
            />
          </div>
        )}

        {error ? (
          <div className="mt-4 flex w-full justify-center">
            <ModalMessage
              variant="warning"
              title="Attention"
              description={error}
              className="w-full max-w-[564px]"
            />
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 flex w-full justify-center">
            <ModalMessage
              variant="success"
              title="Félicitations !"
              description={
                hasCreatedPassword
                  ? `Ton mot de passe a été enregistré avec succès. Tu peux désormais te connecter avec ton adresse email et ce mot de passe, ou continuer à utiliser ${providerName}.`
                  : "Ton mot de passe a été modifié avec succès. Tu devras utiliser ton nouveau mot de passe sécurisé pour te connecter la prochaine fois."
              }
              className="w-full max-w-[564px]"
            />
          </div>
        ) : null}

        <div className="mt-[30px] flex w-full flex-col items-center">
          {/* Classic user: Ancien mot de passe */}
          {!isOAuthOnly && (
            <div className="flex w-full justify-center">
              <PasswordField
                id="current-password"
                name="current-password"
                label="Ancien mot de passe"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(nextValue) => {
                  setCurrentPassword(nextValue)
                  if (currentPasswordError) {
                    setCurrentPasswordError(null)
                  }
                  if (error) {
                    setError(null)
                  }
                  if (success) {
                    setSuccess(false)
                  }
                }}
                externalError={currentPasswordError}
                containerClassName="w-full max-w-[368px]"
                messageContainerClassName="mt-2 min-h-[20px] text-left text-[13px] font-medium"
                autoComplete="current-password"
              />
            </div>
          )}

          {/* Nouveau mot de passe (or Mot de passe for OAuth) */}
          <div className="flex w-full justify-center">
            <PasswordField
              id="new-password"
              name="new-password"
              label={isOAuthOnly ? "Mot de passe" : "Nouveau mot de passe"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(nextValue) => {
                setNewPassword(nextValue)
                if (newPasswordError) {
                  setNewPasswordError(null)
                }
                if (newPasswordStatusOverride) {
                  setNewPasswordStatusOverride(undefined)
                }
                if (error) {
                  setError(null)
                }
                if (success) {
                  setSuccess(false)
                }
              }}
              validate={(value) => getPasswordValidationState(value).isValid}
              criteriaRenderer={({ isFocused }) =>
                isFocused ? (
                  <div
                    className="mt-3 space-y-2 rounded-[8px] bg-white px-4 py-3 text-[12px] font-semibold text-[#5D6494]"
                    style={{ boxShadow: "1px 1px 9px 1px rgba(0, 0, 0, 0.12)" }}
                  >
                    <PasswordCriteriaItem valid={validation.hasMinLength} text="Au moins 8 caractères" />
                    <PasswordCriteriaItem valid={validation.hasLetter} text="Au moins 1 lettre" />
                    <PasswordCriteriaItem valid={validation.hasNumber} text="Au moins 1 chiffre" />
                    <PasswordCriteriaItem valid={validation.hasSymbol} text="Au moins 1 symbole" />
                  </div>
                ) : null
              }
              blurDelay={100}
              externalError={newPasswordError}
              statusOverride={newPasswordStatusOverride}
              containerClassName="w-full max-w-[368px]"
              messageContainerClassName="mt-[5px] min-h-[20px] text-left text-[13px] font-semibold"
              autoComplete="new-password"
            />
          </div>

          {/* OAuth user: Répéter le mot de passe */}
          {isOAuthOnly && (
            <div className="flex w-full justify-center">
              <PasswordField
                id="repeat-password"
                name="repeat-password"
                label="Répéter le mot de passe"
                placeholder="••••••••"
                value={repeatPassword}
                onChange={(nextValue) => {
                  setRepeatPassword(nextValue)
                  if (error) {
                    setError(null)
                  }
                  if (success) {
                    setSuccess(false)
                  }
                }}
                onBlur={() => setRepeatPasswordTouched(true)}
                validate={(value) => value.length > 0 && value === newPassword}
                externalError={repeatPasswordError}
                containerClassName="w-full max-w-[368px]"
                messageContainerClassName="mt-[5px] min-h-[20px] text-left text-[13px] font-semibold"
                autoComplete="new-password"
              />
            </div>
          )}
        </div>

        <SubmitButton
          label={isOAuthOnly ? "Enregistrer mon mot de passe" : "Modifier mon mot de passe"}
          loading={loading}
          disabled={!isFormReady || loading}
          containerClassName="mt-4 mb-[16px]"
          buttonClassName="w-full max-w-[368px] sm:w-auto sm:max-w-none"
        />

        {!isOAuthOnly && (
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="mb-8 text-[14px] font-semibold text-[#7069FA] transition-colors hover:text-[#6660E4]"
          >
            Mot de passe oublié ?
          </button>
        )}
      </form>

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmail={user?.email ?? undefined}
      />
    </AccountAccordionSection>
  )
}
