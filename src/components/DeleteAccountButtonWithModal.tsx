"use client"

import { useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

type Props = {
  /** Action custom si vous ne voulez pas utiliser /api/delete-account */
  onConfirm?: () => Promise<void>
  /** Permet de personnaliser le bouton déclencheur */
  triggerClassName?: string
}

const triggerBaseClasses =
  'mx-auto block text-[14px] font-semibold text-[#EF4F4E] transition-colors hover:text-[#BA2524]'

export default function DeleteAccountButtonWithModal({ onConfirm, triggerClassName }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (loading) return

    setError(null)
    setLoading(true)

    try {
      if (onConfirm) {
        await onConfirm()
      } else {
        const res = await fetch('/api/delete-account', { method: 'POST' })
        if (!res.ok) {
          let details: string | undefined
          try {
            const data = await res.json()
            details = data?.details || data?.error
            console.error('[delete-account] server details:', data)
          } catch {}

          throw new Error(details || 'delete-failed')
        }
      }

      setOpen(false)
      window.location.href = '/'
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : null
      setError(message || 'Une erreur est survenue. Merci de réessayer.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx('mt-[50px]', triggerBaseClasses, triggerClassName)}
      >
        Supprimer mon compte
      </button>

      <ConfirmationModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Supprimer votre compte"
        variant="warning"
        messageTitle="Attention"
        messageDescription="La suppression de votre compte est définitive."
        confirmLabel="Confirmer"
        confirmButtonProps={{
          loading,
          loadingText: 'En cours...',
          keepWidthWhileLoading: true,
        }}
      >
        <p className="mb-4 text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
          En cliquant sur <span className="text-[#3A416F]">« Confirmer »</span> votre compte ainsi que l’ensemble des données qui lui
          sont associées seront <span className="text-[#3A416F]">définitivement supprimées</span> de la plateforme.
        </p>
        <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
          Si ce n’est pas ce que vous souhaitez faire, vous trouverez peut-être la solution à votre besoin dans la partie{' '}
          <Link href="/aide" className="underline text-[#3A416F]">
            Aide
          </Link>{' '}
          du site.
        </p>

        {error && (
          <p className="mt-6 text-left text-[14px] font-semibold text-[#BA2524]">{error}</p>
        )}
      </ConfirmationModal>
    </>
  )
}
