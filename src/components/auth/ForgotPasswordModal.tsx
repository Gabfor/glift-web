"use client"

import { FormEvent, KeyboardEvent, ClipboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import CTAButton from "@/components/CTAButton"
import { EmailField, isValidEmail } from "@/components/forms/EmailField"
import { createClientComponentClient } from "@/lib/supabase/client"
import Modal from "@/components/ui/Modal"
import ModalMessage from "@/components/ui/ModalMessage"

interface ForgotPasswordModalProps {
  open: boolean
  onClose: () => void
  initialEmail?: string
  resetPath?: string
}

const COOLDOWN_DURATION_MS = 60_000

export default function ForgotPasswordModal({
  open,
  onClose,
  initialEmail,
  resetPath,
}: ForgotPasswordModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ title: string; description: string } | null>(null)
  const [lastRequestAt, setLastRequestAt] = useState<number | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!open) {
      return
    }

    const sanitizedEmail = initialEmail?.trim() ?? ""
    setEmail(sanitizedEmail)
    setOtp(["", "", "", "", "", ""])
    setStep("email")
    setLoading(false)
    setError(null)
  }, [open, initialEmail])

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
  const isOtpComplete = useMemo(() => {
    const fullCode = otp.join("")
    return fullCode.length === 6 && /^\d{6}$/.test(fullCode)
  }, [otp])

  const handleClose = () => {
    if (loading) {
      return
    }
    onClose()
  }

  const handleSendEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading || !isEmailValid) {
      return
    }

    const now = Date.now()
    if (lastRequestAt && now - lastRequestAt < COOLDOWN_DURATION_MS) {
      const remaining = Math.max(0, COOLDOWN_DURATION_MS - (now - lastRequestAt))
      setCooldownRemaining(remaining)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const sanitizedEmail = email.trim()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        sanitizedEmail
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

        setError({
          title: "Une erreur est survenue",
          description: "Nous n'avons pas pu envoyer l'e-mail de réinitialisation. Veuillez réessayer dans quelques instants.",
        })
        return
      }

      setStep("otp")
      setOtp(["", "", "", "", "", ""])
      setError(null)
      const timestamp = Date.now()
      setLastRequestAt(timestamp)
      setCooldownRemaining(COOLDOWN_DURATION_MS)
    } catch (unknownError) {
      console.error("Erreur lors de l'envoi du code", unknownError)
      setError({
        title: "Une erreur est survenue",
        description: "Une erreur imprévue est survenue. Merci de réessayer ultérieurement.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (event?: FormEvent) => {
    if (event) {
      event.preventDefault()
    }
    if (loading || !isOtpComplete) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fullCode = otp.join("")
      const sanitizedEmail = email.trim()

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: sanitizedEmail,
        token: fullCode,
        type: "recovery",
      })

      if (verifyError || !data?.user) {
        setError({
          title: "Code invalide ou expiré",
          description:
            "Nous sommes désolés mais le code est invalide ou expiré. Merci de vérifier votre code ou de relancer une demande depuis « Mot de passe oublié ? ».",
        })
        return
      }

      // Code valide : s'assurer que la session est synchronisée
      if (data?.session) {
        await supabase.auth.setSession(data.session)
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("glift-reset-timestamp", Date.now().toString())
      }
      onClose()
      const targetPath = resetPath || "/reinitialiser-mot-de-passe"
      router.push(targetPath)
    } catch (unknownError) {
      console.error("Erreur lors de la vérification du code OTP", unknownError)
      setError({
        title: "Code invalide ou expiré",
        description:
          "Nous sommes désolés mais le code est invalide ou expiré. Merci de vérifier votre code ou de relancer une demande depuis « Mot de passe oublié ? ».",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    // Extraire uniquement les chiffres
    const digit = value.replace(/\D/g, "").slice(-1)

    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (error) {
      setError(null)
    }

    // Déplacer le focus vers le champ suivant s'il y a une valeur
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (error) {
        setError(null)
      }
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pastedData = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)

    if (!pastedData) {
      return
    }

    const digits = pastedData.split("")
    const newOtp = ["", "", "", "", "", ""]

    digits.forEach((d, i) => {
      if (i < 6) {
        newOtp[i] = d
      }
    })

    setOtp(newOtp)
    if (error) {
      setError(null)
    }

    const nextFocusIndex = Math.min(digits.length, 5)
    inputRefs.current[nextFocusIndex]?.focus()
  }

  return (
    <Modal
      open={open}
      title="Mot de passe oublié"
      onClose={handleClose}
      closeDisabled={loading}
      footerWrapperClassName="mt-[30px]"
      footer={
        <div className="flex justify-center gap-4">
          <CTAButton
            variant="secondary"
            type="button"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </CTAButton>
          {step === "email" ? (
            <CTAButton
              type="submit"
              form="forgot-password-form"
              variant={isEmailValid && !isCooldownActive ? "active" : "inactive"}
              disabled={!isEmailValid || isCooldownActive}
              loading={loading}
              loadingText="Envoi..."
            >
              Valider
            </CTAButton>
          ) : (
            <CTAButton
              type="button"
              onClick={() => handleVerifyOtp()}
              variant={isOtpComplete ? "active" : "inactive"}
              disabled={!isOtpComplete}
              loading={loading}
              loadingText="En cours"
              keepWidthWhileLoading={false}
              className="px-[30px]"
            >
              Valider
            </CTAButton>
          )}
        </div>
      }
    >
      {step === "email" ? (
        <form
          id="forgot-password-form"
          onSubmit={handleSendEmail}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-full max-w-[504px] space-y-4">
            <ModalMessage
              variant="info"
              title="Vous avez oublié votre mot de passe ?"
              description="Pas de problème, nous allons vous envoyer un lien pour réinitialiser votre mot de passe en toute sécurité."
            />
            {error && (
              <ModalMessage
                variant="warning"
                title={error.title}
                description={error.description}
              />
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
            }}
            hideSuccessMessage
            errorMessage=""
            containerClassName="w-full max-w-[368px]"
            messageContainerClassName="hidden"
            autoComplete="email"
          />
        </form>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-full max-w-[504px]">
            {error ? (
              <ModalMessage
                variant="warning"
                title={error.title}
                description={error.description}
              />
            ) : (
              <ModalMessage
                variant="success"
                title="Merci pour votre email"
                description="Si un compte y est associé, un email contenant un code à 6 chiffres vous a été envoyé. Ce code est valable pendant 30 minutes."
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full max-w-[338px]">
            <label className="text-[16px] font-bold text-[#3A416F] text-left w-full block">
              Code reçu par email
            </label>

            <div className="flex justify-start gap-2.5 w-full mt-1">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  placeholder="0"
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className={`w-[48px] h-[45px] rounded-[5px] border bg-white text-center text-[16px] font-semibold text-[#5D6494] placeholder-[#D7D4DC] transition-all duration-150 focus:outline-none focus:!border-transparent focus:ring-2 focus:ring-[#A1A5FD] ${
                    error ? "border-[#EF4444]" : "border-[#D7D4DC] hover:border-[#C2BFC6]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
