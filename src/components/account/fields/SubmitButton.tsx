// SubmitButton.tsx
'use client'

type Props = {
  loading: boolean
  disabled: boolean
  label?: string
  onClick?: () => void
}

export default function SubmitButton({
  loading,
  disabled,
  label = 'Enregistrer mes informations',
  onClick,
}: Props) {
  return (
    <div className="w-full flex justify-center mt-3 mb-8">
      <button
        type="submit"
        disabled={disabled}
        onClick={onClick}
        className={`w-[260px] h-[44px] rounded-[25px] text-[16px] font-bold text-center transition flex items-center justify-center
          ${!disabled
            ? 'bg-[#7069FA] text-white hover:bg-[#6660E4] cursor-pointer'
            : 'bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed'}
        `}
      >
        {loading ? 'Enregistrement...' : label}
      </button>
    </div>
  )
}
