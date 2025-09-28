// ToggleField.tsx
'use client'

import SuccessMsg from './SuccessMsg'

type Props = {
  label: string
  value: string
  options: string[]
  onChange: (val: string) => void
  touched: boolean
  setTouched: () => void
  success?: string
  className?: string
}

export default function ToggleField({
  label,
  value,
  options,
  onChange,
  touched,
  setTouched,
  success,
  className = '',
}: Props) {
  const showSuccess = !!success && touched

  return (
    <div className="w-[368px] flex flex-col text-left">
      <label className="text-[16px] font-bold text-[#3A416F] mb-[6px]">{label}</label>
      <div
        role="radiogroup"
        className={`flex flex-wrap gap-[10px] relative ${className}`}
      >
        {options.map((option) => {
          const selected = value === option
          const hasSuccess = selected && !!success

          const baseBorder = hasSuccess
            ? 'border-[#00D591] shadow-[0px_4px_12px_rgba(0,213,145,0.25)]'
            : 'border-[#D7D4DC] hover:border-[#B3AFC0]'

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onChange(selected ? '' : option)
                setTouched()
              }}
              className={`
                min-w-[56px] h-[45px] px-[18px] text-[16px] font-semibold border transition-all duration-150
                rounded-[8px]
                ${selected ? 'bg-[#3A416F] text-white shadow-[0px_4px_12px_rgba(58,65,111,0.2)] border-[#3A416F]' : 'bg-white text-[#6F6C8F]'}
                ${baseBorder}
                relative flex items-center justify-center
                ${hasSuccess ? 'z-10' : 'hover:z-20 z-0'}
              `}
            >
              {option}
            </button>
          )
        })}
      </div>

      <div className="h-[18px] mt-[5px] overflow-hidden">
        {showSuccess && <SuccessMsg>{success}</SuccessMsg>}
      </div>
    </div>
  )
}