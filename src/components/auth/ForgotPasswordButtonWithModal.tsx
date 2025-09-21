// src/components/auth/ForgotPasswordButtonWithModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createPortal } from 'react-dom'
import Spinner from '@/components/ui/Spinner';

type Props = {
  triggerLabel?: string
  prefillEmail?: string
  onSent?: (email: string) => void
  variant?: 'link' | 'button'
  triggerClassName?: string
  clearOnSuccess?: boolean
}

export default function ForgotPasswordButtonWithModal({
  triggerLabel = 'Mot de passe oublié ?',
  prefillEmail = '',
  onSent,
  variant = 'link',
  triggerClassName = '',
  clearOnSuccess = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [email, setEmail] = useState(prefillEmail)
  const [touched, setTouched] = useState(false)
  const [focused, setFocused] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])

  // Reset uniquement à l’ouverture
  useEffect(() => {
    if (!open) return
    setError(null)
    setSuccess(null)
    setTouched(false)
    setFocused(false)
    setLoading(false)
    setEmail(prefillEmail || '')
  }, [open])

  // Mettre à jour le champ si prefillEmail change pendant l’ouverture (hors succès)
  useEffect(() => {
    if (open && !success) setEmail(prefillEmail || '')
  }, [prefillEmail, open, success])

  // Préremplir avec l’email de l’utilisateur connecté si dispo
  useEffect(() => {
    if (!open || prefillEmail) return
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const authedEmail = data?.user?.email ?? ''
        if (!cancelled && authedEmail) setEmail(authedEmail)
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [open, prefillEmail])

  const isEmailValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const showEmailError = touched && !focused && email.trim() !== '' && !isEmailValidFormat
  const canSubmit = isEmailValidFormat && !success

  const handleSubmit = async () => {
    if (!canSubmit || loading) return // ⬅️ garde anti double-clic
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Une erreur est survenue.')
      }
      setSuccess(
        "Si un compte y est associé, un email contenant un lien pour mettre à jour votre mot de passe vous a été envoyé. Ce lien est valable pendant 30 minutes."
      )
      onSent?.(email)

      if (clearOnSuccess) setEmail('')
      setTouched(false)
      setFocused(false)
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const Trigger =
    variant === 'link' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-[14px] font-semibold text-[#7069FA] hover:text-[#6660E4] ${triggerClassName}`}
      >
        {triggerLabel}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`h-[44px] rounded-[25px] px-[15px] bg-[#7069FA] text-white font-bold hover:bg-[#6660E4] ${triggerClassName}`}
      >
        {triggerLabel}
      </button>
    )

  const Modal = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#2E3142]/60" onClick={() => setOpen(false)} />
      <div
        className="relative z-10 w-[564px] max-w-[92vw] rounded-[5px] bg-white p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button onClick={() => setOpen(false)} className="absolute right-4 top-4 h-6 w-6" aria-label="Fermer" type="button">
          <img src="/icons/close.svg" alt="Fermer" className="h-full w-full" />
        </button>

        <h2 className="mt-6 mb-6 text-center text-[22px] font-bold text-[#3A416F]">Mot de passe oublié</h2>

        {/* Info ↔ Succès (même emplacement) */}
        {success ? (
          <div className="mb-6" aria-live="polite">
            <div className="relative rounded-[5px] bg-[#E3F9E5] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#57AE5B]" />
              <h3 className="text-[12px] font-bold text-[#207227]">Merci pour votre email</h3>
              <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#57AE5B]">{success}</p>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="relative rounded-[5px] bg-[#F4F5FE] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#A1A5FD]" />
              <h3 className="text-[12px] font-bold text-[#7069FA]">Vous avez oublié votre mot de passe ?</h3>
              <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#A1A5FD]">
                Pas de problème, renseignez votre email et nous vous enverrons un lien
                pour réinitialiser votre mot de passe en toute sécurité.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4" aria-live="polite">
            <div className="relative rounded-[5px] bg-[#FFE3E3] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#EF4F4E]" />
              <h3 className="text-[12px] font-bold text-[#BA2524]">Attention</h3>
              <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#EF4F4E]">{error}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit()
          }}
        >
          <div className="mx-auto w-full max-w-[368px]">
            <label htmlFor="forgot-email" className="mb-[5px] block text-left text-[16px] font-bold text-[#3A416F]">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              placeholder="john.doe@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setTouched(true)
                setFocused(false)
              }}
              disabled={loading || !!success}
              className={`h-[45px] w-full rounded-[5px] bg-white px-[15px] text-[16px] font-semibold placeholder-[#D7D4DC]
              transition-all duration-150 border
              ${(loading || success) ? 'text-[#D7D4DC]' : 'text-[#5D6494]'}
              ${showEmailError ? 'border-[#EF4444]' : 'border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]'}
              disabled:text-[#D7D4DC]`}
              autoComplete="email"
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-6">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-[16px] font-semibold text-[#5D6494] hover:text-[#3A416F]">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit} // on NE désactive pas pendant loading pour garder le violet
              aria-busy={loading}
              aria-disabled={loading || undefined}
              className={`inline-flex h-[44px] items-center justify-center rounded-[25px] px-[15px] text-[16px] font-bold
                ${
                  !canSubmit
                    ? 'bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed'
                    : (loading
                        ? 'bg-[#7069FA] text-white pointer-events-none cursor-wait opacity-100'
                        : 'bg-[#7069FA] text-white hover:bg-[#6660E4]')
                }`}
            >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="md" ariaLabel="Envoi en cours" />
                En cours...
              </span>
            ) : (
              'Valider'
            )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {Trigger}
      {mounted && open ? createPortal(Modal, document.body) : null}
    </>
  )
}
