'use client'

import Image from 'next/image'
import ModalMessage from '@/components/ui/ModalMessage'

export default function IncompleteAlert({ onScrollClick }: { onScrollClick?: () => void }) {
  return (
    <div className="w-[564px] max-w-full mt-4 mb-[30px]">
      <ModalMessage
        variant="info"
        title="Complète ton profil"
        description={
          <>
            Complète les informations manquantes indiquées par un{' '}
            <span className="inline-flex items-center justify-center align-[-7px] w-[24px] h-[24px] rounded-full">
              <Image src="/icons/missing.svg" alt="" width={24} height={24} />
            </span>{' '}
            et personnalise ton expérience avec Glift.{' '}
            <button
              type="button"
              onClick={onScrollClick}
              className="underline hover:text-[#7069FA] transition-colors"
            >
              Voir les informations manquantes.
            </button>
          </>
        }
      />
    </div>
  )
}
