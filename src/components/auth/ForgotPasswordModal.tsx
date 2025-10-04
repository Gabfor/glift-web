"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"

import CTAButton from "@/components/CTAButton"
import { EmailField, isValidEmail } from "@/components/forms/EmailField"
import { createClientComponentClient } from "@/lib/supabase/client"
import Modal from "@/components/ui/Modal"
import ModalMessage from "@/components/ui/ModalMessage"

interface ForgotPasswordModalProps {
  open: boolean
  onClose: () => void
}

const RESET_PASSWORD_REDIRECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_RESET_PASSWORD_REDIRECT_URL
const COOLDOWN_DURATION_MS = 60_000

const formatCooldownMessage = (remainingMs: number) => {
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const suffix = remainingSeconds > 1 ? "s" : ""

  return `Veuillez patienter encore ${remainingSeconds} seconde${suffix} avant de demander un nouveau lien de réinitialisation.`
}

export default function ForgotPasswordModal({
  open,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [lastRequestAt, setLastRequestAt] = useState<number | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!open) {
      return
    }

    setEmail("")
    setLoading(false)
    setError(null)
    setSuccess(false)
  }, [open])

  useEffect(() => {
    if (!lastRequestAt) {
      setCooldownRemaining(0)
      return
    }

    const applyRemaining = () => {
      const elapsed = Date.now() - lastRequestAt
      const remaining = Math.max(0, COOLDOWN_DURATION_MS - elapsed)
      setCooldownRemaining(remaining)
      return remaining
    }

    if (applyRemaining() <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (applyRemaining() <= 0) {
        window.clearInterval(intervalId)
      }
    }, 500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [lastRequestAt])

  const isEmailValid = useMemo(() => isValidEmail(email), [email])
  const isCooldownActive = cooldownRemaining > 0
  const cooldownMessage = isCooldownActive
    ? formatCooldownMessage(cooldownRemaining)
    : null

  const handleClose = () => {
    if (loading) {
      return
    }

    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading || !isEmailValid) {
      return
    }

    if (success) {
      setSuccess(false)
    }

    const now = Date.now()

    if (lastRequestAt && now - lastRequestAt < COOLDOWN_DURATION_MS) {
      const remaining = Math.max(
        0,
        COOLDOWN_DURATION_MS - (now - lastRequestAt)
      )
      setCooldownRemaining(remaining)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const buildRedirectTo = () => {
        const fallbackOrigin =
          typeof window !== "undefined" ? window.location.origin : null

        const ensureResetPath = (value: string) => {
          try {
            const url = new URL(value)
            url.pathname = "/reinitialiser-mot-de-passe"
            url.search = ""
            url.hash = ""
            return url.toString()
          } catch {
            if (fallbackOrigin) {
              try {
                const url = new URL(value, fallbackOrigin)
                url.pathname = "/reinitialiser-mot-de-passe"
                url.search = ""
                url.hash = ""
                return url.toString()
              } catch {
                return `${fallbackOrigin}/reinitialiser-mot-de-passe`
              }
            }
            return null
          }
        }

        if (RESET_PASSWORD_REDIRECT_URL) {
          const sanitized = ensureResetPath(RESET_PASSWORD_REDIRECT_URL)
          if (sanitized) {
            return sanitized
          }
        }

        if (fallbackOrigin) {
          return `${fallbackOrigin}/reinitialiser-mot-de-passe`
        }

        return null
      }

      const redirectTo = buildRedirectTo() || undefined

      const sanitizedEmail = email.trim()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        sanitizedEmail,
        redirectTo ? { redirectTo } : undefined
      )

      if (resetError) {
        const status =
          typeof resetError === "object" &&
          resetError !== null &&
          "status" in resetError
            ? (resetError as { status?: number }).status
            : undefined

        if (status === 429) {
          const timestamp = Date.now()
          setLastRequestAt(timestamp)
          setCooldownRemaining(COOLDOWN_DURATION_MS)
          setError(null)
          return
        }

        setError(
          "Nous n'avons pas pu envoyer l'e-mail de réinitialisation. Veuillez réessayer dans quelques instants."
        )
        return
      }

      setSuccess(true)
      setEmail("")
      setError(null)
      const timestamp = Date.now()
      setLastRequestAt(timestamp)
      setCooldownRemaining(COOLDOWN_DURATION_MS)
    } catch (unknownError) {
      console.error("Erreur lors de la demande de réinitialisation", unknownError)
      setError(
        "Une erreur imprévue est survenue. Merci de réessayer ultérieurement."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Mot de passe oublié ?"
      onClose={handleClose}
      closeDisabled={loading}
      footerWrapperClassName="mt-[30px]"
      footer={
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            Annuler
          </button>
          <CTAButton
            type="submit"
            form="forgot-password-form"
            variant={
              isEmailValid && !isCooldownActive ? "active" : "inactive"
            }
            disabled={!isEmailValid || isCooldownActive}
            loading={loading}
            loadingText="Envoi..."
          >
            Valider
          </CTAButton>
        </div>
      }
    >
      <form
        id="forgot-password-form"
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-full max-w-[504px] space-y-4">
          {success ? (
            <ModalMessage
              variant="success"
              title="Merci pour votre email"
              description={
                <div className="space-y-2">
                  <p>
                    Si un compte y est associé, un email contenant un lien pour mettre à jour votre mot de passe vous a été envoyé. Ce lien est valable pendant 30 minutes.
                  </p>
                </div>
              }
            />
          ) : (
            <>
              <ModalMessage
                variant="info"
                title="Vous avez oublié votre mot de passe ?"
                description="Pas de problème, nous allons vous envoyer un lien pour réinitialiser votre mot de passe en toute sécurité."
              />
              {cooldownMessage && (
                <ModalMessage
                  variant="warning"
                  title="Veuillez patienter avant de réessayer"
                  description={cooldownMessage}
                />
              )}
              {error && (
                <ModalMessage
                  variant="warning"
                  title="Une erreur est survenue"
                  description={error}
                />
              )}
            </>
          )}
        </div>

        <EmailField
          id="forgot-password-email"
          label="Email"
          value={email}
          onChange={(value) => {
            setEmail(value)
            if (error && !isCooldownActive) {
              setError(null)
            }
            if (success) {
              setSuccess(false)
            }
          }}
          hideSuccessMessage
          errorMessage=""
          containerClassName="w-full max-w-[368px]"
          messageContainerClassName="hidden"
          autoComplete="email"
        />
      </form>
    </Modal>
  )
}
