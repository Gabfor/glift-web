'use client'

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

  return (
    <div className="w-full flex justify-center px-4 pt-2">
      <div className="w-[1152px] max-w-full">
        <div
          className="relative rounded-lg px-5 py-4 bg-[#E3F9E5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          role="status"
          aria-live="polite"
        >
          <span className="absolute left-0 top-0 h-full w-[6px] bg-[#57AE5B] rounded-l-lg" />
          <div>
            <p className="text-[#245B2C] text-[15px] font-bold mb-1">
              Merci pour votre inscription&nbsp;!
            </p>
            <p className="text-[#245B2C] text-[14px] font-semibold leading-relaxed">
              Pour finaliser votre inscription, confirmez votre email en cliquant sur le lien reçu.
              Ce bandeau restera visible tant que votre compte n’est pas validé.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex h-[34px] items-center rounded-[18px] px-4 text-[14px] font-bold bg-[#7069FA] text-white hover:bg-[#6660E4] disabled:opacity-60"
            >
              {resending ? 'Renvoi…' : sent ? 'Email renvoyé !' : 'Renvoyer l’email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
