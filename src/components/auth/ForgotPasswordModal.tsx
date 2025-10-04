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

export default function ForgotPasswordModal({
  open,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  const isEmailValid = useMemo(() => isValidEmail(email), [email])

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

    setLoading(true)
    setError(null)

    try {
      const redirectTo =
        RESET_PASSWORD_REDIRECT_URL ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/connexion`
          : undefined)

      const sanitizedEmail = email.trim()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        sanitizedEmail,
        redirectTo ? { redirectTo } : undefined
      )

      if (resetError) {
        setError(
          "Nous n'avons pas pu envoyer l'e-mail de réinitialisation. Veuillez réessayer dans quelques instants."
        )
        return
      }

      setSuccess(true)
      setEmail("")
      setError(null)
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
            variant={isEmailValid ? "active" : "inactive"}
            disabled={!isEmailValid}
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
            if (error) {
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
