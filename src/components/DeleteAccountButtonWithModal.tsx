"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import clsx from 'clsx'
import Spinner from '@/components/ui/Spinner'

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
  const [hoveredClose, setHoveredClose] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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
        className="mt-[50px] mx-auto block text-[14px] font-semibold text-[#EF4F4E] transition-colors hover:text-[#BA2524]"
      >
        Supprimer mon compte
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[#2E3142]/60"
            onClick={() => !loading && setOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-[564px] max-w-[92vw] rounded-[5px] bg-white p-8 shadow-lg">
            <button
              onClick={() => !loading && setOpen(false)}
              onMouseEnter={() => setHoveredClose(true)}
              onMouseLeave={() => setHoveredClose(false)}
              className={`absolute right-4 top-4 h-6 w-6 ${loading ? 'pointer-events-none' : ''}`}
              aria-label="Fermer"
              aria-disabled={loading}
            >
              <Image
                src={hoveredClose ? '/icons/close_hover.svg' : '/icons/close.svg'}
                alt="Fermer"
                width={24}
                height={24}
                className="h-full w-full"
              />
            </button>

            <h2 className="mb-6 text-center text-[22px] font-bold text-[#3A416F]">
              Supprimer votre compte
            </h2>

            <div className="mb-6 rounded-br-[5px] rounded-tr-[5px] border-l-[3px] border-[#EF4F4E] bg-[#FFE3E3] pl-4 py-3 text-left">
              <div className="text-[12px] font-bold text-[#BA2524]">Attention</div>
              <div className="text-[12px] font-semibold text-[#EF4F4E]">
                La suppression de votre compte est définitive.
              </div>
            </div>

            <p className="mb-4 text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
              En cliquant sur <span className="text-[#3A416F]">« Confirmer »</span> votre compte ainsi que l’ensemble des données qui lui sont associées seront{' '}
              <span className="text-[#3A416F]">définitivement supprimées</span> de la plateforme.
            </p>
            <p className="mb-6 text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
              Si ce n’est pas ce que vous souhaitez faire, vous trouverez peut-être la solution à votre besoin dans la partie{' '}
              <Link href="/aide" className="underline text-[#3A416F]">
                Aide
              </Link>{' '}
              du site.
            </p>

            {error && (
              <p className="mb-4 text-left text-[14px] font-semibold text-[#BA2524]">{error}</p>
            )}

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                aria-disabled={loading}
                className={`px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F] ${loading ? 'pointer-events-none' : ''}`}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={!loading ? handleConfirm : undefined}
                aria-busy={loading}
                aria-disabled={loading}
                className={`
                  inline-flex min-w-[136px] h-[44px] items-center justify-center gap-2
                  rounded-full font-semibold text-white transition-colors
                  bg-[#EF4F4E] ${loading ? 'opacity-100 pointer-events-none cursor-wait' : 'hover:bg-[#BA2524]'}
                `}
              >
                {loading ? (
                  <>
                    <Spinner size="md" className="text-white" ariaLabel="Suppression en cours" />
                    En cours...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
