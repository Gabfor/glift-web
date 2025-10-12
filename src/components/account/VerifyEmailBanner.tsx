'use client'

import clsx from 'clsx'
import { useState } from 'react'
import { useEmailVerification } from '@/components/account/hooks/useEmailVerification'
import { useUser } from '@/context/UserContext'

export default function VerifyEmailBanner() {
  const { user } = useUser()
  const { verified } = useEmailVerification()
  const [resending, setResending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!user || verified === null || verified) return null

  const handleResend = async () => {
    try {
      setResending(true)
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      setSent(res.ok)
    } catch {
      setSent(false)
    } finally {
      setResending(false)
      setTimeout(() => setSent(false), 5000)
    }
  }

  const statusLabel = resending ? 'Renvoi…' : sent ? 'Email renvoyé !' : 'Renvoyer l’email'
  const buttonClassName = clsx(
    'inline-flex items-center justify-center whitespace-nowrap px-0 py-1 text-sm font-semibold transition md:ml-4 disabled:cursor-not-allowed',
    sent
      ? 'cursor-default text-white/80 no-underline'
      : 'text-white underline decoration-white/60 underline-offset-4 hover:decoration-white',
  )

  return (
    <div className="bg-[#6B5BFF] text-white">
      <div
        className="mx-auto flex w-full max-w-[1152px] flex-col gap-2 px-4 py-2.5 text-sm leading-5 md:flex-row md:items-center md:justify-between"
        role="status"
        aria-live="polite"
      >
        <p className="font-medium">
          <span aria-hidden="true" className="mr-2">
            ✉️
          </span>
          Pour finaliser votre inscription, merci de confirmer votre adresse email reçue par email.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className={buttonClassName}
        >
          {statusLabel}
        </button>
      </div>
    </div>
  )
}
