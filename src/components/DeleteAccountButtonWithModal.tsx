"use client"

import { useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import { useDashboardUrl } from '@/hooks/useDashboardUrl'

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
  const { helpUrl } = useDashboardUrl()

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
        onClick={() => {
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
          }
          setOpen(true)
        }}
        className={clsx('mt-[50px]', triggerBaseClasses, triggerClassName)}
      >
        Supprimer mon compte
      </button>

      <ConfirmationModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Supprimer ton compte"
        variant="warning"
        messageTitle="Attention"
        messageDescription="La suppression de ton compte est définitive. Es-tu sûr de vouloir nous quitter ? Vraiment sûr ? Snif snif, on est tristes..."
        confirmLabel="Je confirme"
        confirmButtonProps={{
          loading,
          loadingText: 'En cours...',
          keepWidthWhileLoading: true,
        }}
      >
        <div className="space-y-4">
          <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
            En cliquant sur <span className="text-[#3A416F]">« Je confirme »</span> ton compte ainsi que l’ensemble des données qui lui sont associées seront <span className="text-[#3A416F] font-bold">définitivement supprimées</span> de Glift.
          </p>
          <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
            Si ce n’est pas ce que tu souhaites faire, tu trouveras peut-être la solution à ton besoin dans la partie{' '}
            <Link href={helpUrl} className="underline text-[#3A416F] hover:text-[#2E3271] transition-colors">
              Aide
            </Link>{' '}
            du site.
          </p>
        </div>

        {error && (
          <p className="mt-6 text-left text-[14px] font-semibold text-[#BA2524]">{error}</p>
        )}
      </ConfirmationModal>
    </>
  )
}
