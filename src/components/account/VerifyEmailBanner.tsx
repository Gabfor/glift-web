'use client'

import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useEmailVerification } from '@/components/account/hooks/useEmailVerification'
import { useUser } from '@/context/UserContext'

export default function VerifyEmailBanner() {
  const { user } = useUser()
  const { verified } = useEmailVerification()
  const [status, setStatus] = useState<
    | { type: 'idle' }
    | { type: 'loading' }
    | { type: 'success'; message: string }
    | { type: 'error'; message: string }
  >({ type: 'idle' })
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  if (!user || verified === null || verified) return null

  const handleResend = async () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = null
    }

    try {
      setStatus({ type: 'loading' })
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })

      if (!res.ok) {
        let message = "Impossible de renvoyer l'email. Merci de réessayer dans quelques instants."

        try {
          const body = (await res.json()) as { error?: unknown } | null
          if (body && typeof body.error === 'string') {
            message = body.error
          }
        } catch {
          // Ignore JSON parsing errors and fall back to the default message.
        }

        setStatus({ type: 'error', message })
        feedbackTimeoutRef.current = setTimeout(() => setStatus({ type: 'idle' }), 7000)
        return
      }

      setStatus({
        type: 'success',
        message:
          "Nous venons de renvoyer l’email de vérification. Pensez à vérifier votre dossier spam ou courrier indésirable.",
      })
      feedbackTimeoutRef.current = setTimeout(() => setStatus({ type: 'idle' }), 7000)
    } catch {
      setStatus({
        type: 'error',
        message: "Une erreur est survenue. Merci de patienter quelques instants avant de réessayer.",
      })
      feedbackTimeoutRef.current = setTimeout(() => setStatus({ type: 'idle' }), 7000)
    }
  }

  const statusLabel =
    status.type === 'loading'
      ? 'Renvoi…'
      : status.type === 'success'
        ? 'Email renvoyé !'
        : 'Renvoyer l’email'
  const buttonClassName = clsx(
    'inline-flex items-center justify-center whitespace-nowrap px-0 py-1 text-sm font-semibold transition md:ml-4 disabled:cursor-not-allowed',
    status.type === 'success'
      ? 'cursor-default text-white/80 no-underline'
      : 'text-white underline decoration-white/60 underline-offset-4 hover:decoration-white',
  )

  const feedbackMessage =
    status.type === 'success' || status.type === 'error' ? status.message : null

  return (
    <div className="bg-[#6B5BFF] text-white">
      <div
        className="mx-auto flex w-full max-w-[1152px] flex-col gap-2 px-4 py-2.5 text-sm leading-5 md:flex-row md:items-center md:justify-between"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col gap-1">
          <p className="font-medium">
            <span aria-hidden="true" className="mr-2">
              ✉️
            </span>
            Pour finaliser votre inscription, merci de confirmer votre adresse email reçue par email.
          </p>
          {feedbackMessage && (
            <p className="text-xs text-white/90 md:text-sm" role="alert">
              {feedbackMessage}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleResend}
          disabled={status.type === 'loading'}
          className={buttonClassName}
        >
          {statusLabel}
        </button>
      </div>
    </div>
  )
}
