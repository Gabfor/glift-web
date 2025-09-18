// src/components/account/fields/SubmitButton.tsx
'use client'

import Spinner from '@/components/ui/Spinner'
import clsx from 'clsx'

type Props = {
  loading?: boolean
  disabled?: boolean
  label?: string
  loadingLabel?: string
  onClick?: () => void
  className?: string
}

export default function SubmitButton({
  loading = false,
  disabled = false,
  label = 'Enregistrer mes informations',
  loadingLabel = 'Enregistrement...',
  onClick,
  className,
}: Props) {
  const isLoading = Boolean(loading)
  const buttonDisabled = !isLoading && disabled // pas disabled pendant le chargement

  return (
    <div className="w-full flex justify-center mt-3 mb-8">
      <button
        type="submit"
        onClick={onClick}
        disabled={buttonDisabled}
        aria-busy={isLoading}
        className={clsx(
          'rounded-[25px] text-[16px] font-bold text-center transition',
          'inline-flex items-center justify-center select-none',
          isLoading
            ? 'w-auto px-[15px] h-[44px] bg-[#7069FA] text-white opacity-100 cursor-wait pointer-events-none'
            : buttonDisabled
            ? 'w-[260px] h-[44px] bg-[#F2F1F6] text-[#D7D4DC] cursor-not-allowed' // ⬅️ seule modif: ECE9F1 -> F2F1F6
            : 'w-[260px] h-[44px] bg-[#7069FA] text-white hover:bg-[#6660E4] cursor-pointer',
          className
        )}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2 leading-none">
            <Spinner size="md" ariaLabel="Enregistrement en cours" />
            {loadingLabel}
          </span>
        ) : (
          label
        )}
      </button>
    </div>
  )
}
