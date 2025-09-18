// src/components/account/sections/MotDePasseSection.tsx
'use client'

import { useState } from 'react'
import AccountAccordionSection from 'src/components/account/AccountAccordionSection'
import ForgotPasswordButtonWithModal from '@/components/auth/ForgotPasswordButtonWithModal'
import { createClientComponentClient } from '@/lib/supabase/client'
import Spinner from '@/components/ui/Spinner'

export const SECTION_ID = 'mot-de-passe' // ✅ aligne avec ?section=mot-de-passe et #mot-de-passe

export default function MotDePasseSection() {
  const supabase = createClientComponentClient()

  const [currentPassword, setCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPasswordTouched, setNewPasswordTouched] = useState(false)
  const [newPasswordFocused, setNewPasswordFocused] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const INVALID_CURRENT_MSG =
    "L’ancien mot de passe que vous avez renseigné ne correspond pas au mot de passe actuellement utilisé pour vous connecter à votre compte."

  const hasMinLength = newPassword.length >= 8
  const hasLetter = /[a-zA-Z]/.test(newPassword)
  const hasNumber = /\d/.test(newPassword)
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const isNewPasswordValidFormat = hasMinLength && hasLetter && hasNumber && hasSymbol

  const shouldShowPasswordSuccess =
    !error && newPasswordTouched && !newPasswordFocused && isNewPasswordValidFormat
  const shouldShowPasswordError =
    newPasswordTouched && !newPasswordFocused && newPassword !== '' && !isNewPasswordValidFormat

  const canSubmit = currentPassword.length > 0 && isNewPasswordValidFormat

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data?.error === 'invalid-current-password') throw new Error(INVALID_CURRENT_MSG)
        if (data?.error === 'not-authenticated') throw new Error('Vous devez être connecté.')
        if (data?.error === 'same-password') throw new Error('Votre nouveau mot de passe doit être différent de l’actuel.')
        if (data?.error === 'server-misconfigured') throw new Error('Configuration serveur incomplète.')
        throw new Error('Impossible de mettre à jour le mot de passe.')
      }

      setSuccess('ok')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordTouched(false)
      setNewPasswordFocused(false)
      setShowCurrentPassword(false)
      setShowNewPassword(false)
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue.')
      setNewPasswordTouched(false)
    } finally {
      setLoading(false)
    }
  }

  const PasswordCriteriaItem = ({ valid, text }: { valid: boolean; text: string }) => {
    const iconSrc = valid ? '/icons/check-success.svg' : '/icons/check-neutral.svg'
    const textColor = valid ? 'text-[#00D591]' : 'text-[#C2BFC6]'
    return (
      <div className="flex items-center justify-between">
        <span className={textColor}>{text}</span>
        <img src={iconSrc} alt="État" className="h-[16px] w-[16px]" />
      </div>
    )
  }

  return (
    <AccountAccordionSection value={SECTION_ID} title="Mon mot de passe">{/* ✅ */}
      <form onSubmit={onSubmit} className="p-6 flex flex-col items-center">
        {/* Bandeau ERREUR */}
        {error && (
          <div className="w-[564px] max-w-full mb-6">
            <div className="relative rounded-[5px] bg-[#FFE3E3] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#EF4F4E]" />
              <h3 className="text-[12px] font-bold text-[#BA2524]">Attention</h3>
              <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#EF4F4E]">{error}</p>
            </div>
          </div>
        )}

        {/* Bandeau SUCCÈS */}
        {success && (
          <div className="w-[564px] max-w-full mb-6">
            <div className="relative bg-[#E3F9E5] rounded-[5px] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#57AE5B]" />
              <h3 className="text-[#207227] font-bold text-[12px]">Félicitations&nbsp;!</h3>
              <p className="text-[#57AE5B] font-semibold text-[12px] leading-relaxed">
                Votre mot de passe a été modifié avec succès. Vous devrez utiliser votre
                nouveau mot de passe sécurisé pour vous connecter la prochaine fois.
              </p>
            </div>
          </div>
        )}

        {/* Ancien mot de passe */}
        <div className="w-full max-w-[368px] mb-[10px]">
          <label htmlFor="currentPassword" className="text-left text-[16px] text-[#3A416F] font-bold mb-[5px] block">
            Ancien mot de passe
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Votre mot de passe actuel"
              value={currentPassword}
              onChange={(e) => {
                const v = e.target.value
                setCurrentPassword(v)
                if (error === INVALID_CURRENT_MSG) setError(null)
                if (error === 'Vous devez être connecté.') setError(null)
              }}
              autoComplete="current-password"
              readOnly={loading}
              className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
            />
            <button
              type="button"
              onClick={() => !loading && setShowCurrentPassword(!showCurrentPassword)}
              aria-disabled={loading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${loading ? 'pointer-events-none' : ''}`}
            >
              <img
                src={showCurrentPassword ? '/icons/masque_defaut.svg' : '/icons/visible_defaut.svg'}
                alt="Afficher/Masquer"
                className="h-[25px] w-[25px]"
              />
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div className="w-full max-w-[368px] mb-[10px]">
          <label htmlFor="newPassword" className="text-left text-[16px] text-[#3A416F] font-bold mb-[5px] block">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setNewPasswordFocused(true)}
              onBlur={() => {
                setNewPasswordTouched(true)
                setTimeout(() => setNewPasswordFocused(false), 100)
              }}
              autoComplete="new-password"
              readOnly={loading}
              className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 ${
                shouldShowPasswordSuccess
                  ? 'border border-[#00D591]'
                  : shouldShowPasswordError
                  ? 'border border-[#EF4444]'
                  : 'border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]'
              }`}
            />
            <button
              type="button"
              onClick={() => !loading && setShowNewPassword(!showNewPassword)}
              aria-disabled={loading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${loading ? 'pointer-events-none' : ''}`}
            >
              <img
                src={showNewPassword ? '/icons/masque_defaut.svg' : '/icons/visible_defaut.svg'}
                alt="Afficher/Masquer"
                className="h-[25px] w-[25px]"
              />
            </button>
          </div>

          {newPasswordFocused && (
            <div
              className="mt-3 px-4 py-3 bg-white rounded-[8px] text-[12px] text-[#5D6494] space-y-2"
              style={{ boxShadow: '1px 1px 9px 1px rgba(0, 0, 0, 0.12)' }}
            >
              <PasswordCriteriaItem valid={hasMinLength} text="Au moins 8 caractères" />
              <PasswordCriteriaItem valid={hasLetter} text="Au moins 1 lettre" />
              <PasswordCriteriaItem valid={hasNumber} text="Au moins 1 chiffre" />
              <PasswordCriteriaItem valid={hasSymbol} text="Au moins 1 symbole" />
            </div>
          )}

          <div className="h-[20px] mt-[5px] text-[13px] font-medium text-left">
            {shouldShowPasswordSuccess && <p className="text-[#00D591]">Mot de passe valide</p>}
            {shouldShowPasswordError && <p className="text-[#EF4444]">Mot de passe invalide</p>}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-[10px] flex justify-center w-full">
          <button
            type="submit"
            disabled={!canSubmit && !loading}
            aria-disabled={loading || (!canSubmit && !loading)}
            onClick={(e) => {
              if (loading) e.preventDefault()
            }}
            className={`inline-flex h-[44px] items-center justify-center rounded-[25px] px-[15px] text-[16px] font-bold ${
              loading
                ? 'bg-[#7069FA] text-white cursor-wait'
                : !canSubmit
                ? 'bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed'
                : 'bg-[#7069FA] text-white hover:bg-[#6660E4]'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="md" ariaLabel="En cours" />
                En cours...
              </span>
            ) : (
              'Modifier mon mot de passe'
            )}
          </button>
        </div>

        {/* Lien pop-up "mot de passe oublié ?" */}
        <div className="mt-[20px] w-full max-w-[368px]">
          <ForgotPasswordButtonWithModal triggerLabel="Mot de passe oublié ?" variant="link" />
        </div>
      </form>
    </AccountAccordionSection>
  )
}
