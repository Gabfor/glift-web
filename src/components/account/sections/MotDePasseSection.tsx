"use client"

import { FormEvent, useMemo, useState } from "react"
import Image from "next/image"

import AccountAccordionSection from "../AccountAccordionSection"
import CTAButton from "@/components/CTAButton"
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal"
import {
  PasswordField,
  getPasswordValidationState,
} from "@/components/forms/PasswordField"
import type { PasswordFieldProps } from "@/components/forms/PasswordField"
import { createClient } from "@/lib/supabaseClient"
import ModalMessage from "@/components/ui/ModalMessage"

const INVALID_CURRENT_PASSWORD_MESSAGE =
  "L’ancien mot de passe que vous avez renseigné ne correspond pas au mot de passe actuellement utilisé pour vous connecter à votre compte."

function PasswordCriteriaItem({ valid, text }: { valid: boolean; text: string }) {
  const icon = valid ? "/icons/check-success.svg" : "/icons/check-neutral.svg"

  return (
    <div className="flex items-center justify-between gap-4">
      <span className={valid ? "text-[#00D591]" : "text-[#C2BFC6]"}>{text}</span>
      <Image src={icon} alt="État" width={16} height={16} className="h-4 w-4" />
    </div>
  )
}

export const SECTION_ID = "mot-de-passe"

export default function MotDePasseSection() {
  const supabase = useMemo(() => createClient(), [])
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null)
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null)
  const [newPasswordStatusOverride, setNewPasswordStatusOverride] = useState<
    PasswordFieldProps["statusOverride"]
  >()
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const validation = useMemo(() => getPasswordValidationState(newPassword), [newPassword])
  const isFormReady = currentPassword.trim() !== "" && validation.isValid
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
            setError("Votre nouveau mot de passe doit être différent de l’actuel.")
            setNewPasswordStatusOverride("neutral")
            if (hadPreviousSuccess) {
              setSuccess(true)
            }
            break
          case "invalid-password-format":
            setNewPasswordError("Votre nouveau mot de passe ne respecte pas les critères requis.")
            setNewPasswordStatusOverride(undefined)
            setError("Impossible de mettre à jour le mot de passe.")
            break
          case "not-authenticated":
            setError("Vous devez être connecté.")
            break
          case "missing-fields":
          case "invalid-body":
            setError("Informations manquantes pour modifier votre mot de passe.")
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
      setNewPasswordStatusOverride(undefined)
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
              description="Votre mot de passe a été modifié avec succès. Vous devrez utiliser votre nouveau mot de passe sécurisé pour vous connecter la prochaine fois."
              className="w-full max-w-[564px]"
            />
          </div>
        ) : null}

        <div className="mt-[30px] flex w-full flex-col items-center">
          <div className="flex w-full justify-center">
            <PasswordField
              id="current-password"
              name="current-password"
              label="Ancien mot de passe"
              placeholder="Votre mot de passe actuel"
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

          <div className="flex w-full justify-center">
            <PasswordField
              id="new-password"
              name="new-password"
              label="Nouveau mot de passe"
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
                    className="mt-3 space-y-2 rounded-[8px] bg-white px-4 py-3 text-[12px] text-[#5D6494]"
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
              messageContainerClassName="mt-[5px] min-h-[20px] text-left text-[13px] font-medium"
              autoComplete="new-password"
            />
          </div>
        </div>

        <CTAButton
          type="submit"
          className="mt-4 w-full max-w-[260px] font-semibold"
          disabled={!isFormReady || loading}
          loading={loading}
          loadingText="En cours..."
          variant={isFormReady ? "active" : "inactive"}
        >
          Modifier mon mot de passe
        </CTAButton>

        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="mt-5 mb-[30px] text-[14px] font-semibold text-[#7069FA] transition-colors hover:text-[#6660E4]"
        >
          Mot de passe oublié ?
        </button>
      </form>

      <ForgotPasswordModal open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </AccountAccordionSection>
  )
}
