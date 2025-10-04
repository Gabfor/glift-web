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

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
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
        className="flex flex-col items-center space-y-6"
      >
        {success ? (
          <div className="flex w-full max-w-[368px] gap-4 rounded-[5px] border-l-[6px] border-[#57AE5B] bg-[#E3F9E5] p-4">
            <div className="space-y-2 text-left">
              <p className="text-[16px] font-semibold text-[#207227]">Merci pour votre email</p>
              <p className="text-[14px] leading-relaxed text-[#57AE5B]">
                Si un compte y est associé, un email contenant un lien pour mettre à jour votre mot de passe vous a été envoyé. Ce lien est valable pendant 30 minutes.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[368px]">
            <ModalMessage
              variant="info"
              title="Réinitialiser votre mot de passe"
              description="Renseignez l'adresse e-mail associée à votre compte pour recevoir un lien sécurisé."
            />
          </div>
        )}

        <EmailField
          id="forgot-password-email"
          label="Adresse e-mail"
          value={email}
          onChange={(value) => {
            setEmail(value)
            if (error) {
              setError(null)
            }
          }}
          externalError={error}
          containerClassName="w-full max-w-[368px]"
          messageContainerClassName="mt-2 text-[13px] font-medium"
          autoComplete="email"
        />
      </form>
    </Modal>
  )
}
