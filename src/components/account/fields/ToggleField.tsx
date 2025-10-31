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
  variant?: 'segmented' | 'boxed'
  itemClassName?: string
  containerClassName?: string
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
  variant = 'segmented',
  itemClassName = '',
  containerClassName = 'w-[368px]',
}: Props) {
  const showSuccess = !!success && touched

  return (
    <div className={`${containerClassName} flex flex-col text-left`}>
      <label className="text-[16px] font-bold text-[#3A416F] mb-[6px]">{label}</label>

      <div
        role="radiogroup"
        className={
          variant === 'boxed'
            ? `flex items-center gap-2.5 ${className}`
            : `flex h-[45px] relative ${className}`
        }
      >
        {options.map((option, index) => {
          const isFirst = index === 0
          const isLast = index === options.length - 1
          const selected = value === option
          const hasSuccess = selected && !!success

          const baseBorder =
            hasSuccess ? 'border-[#00D591]' : 'border-[#D7D4DC] hover:border-[#C2BFC6]'

          const textColor = selected ? 'text-[#3A416F]' : 'text-[#D7D4DC]'

          if (variant === 'segmented') {
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
                  w-full h-full text-[16px] font-semibold border bg-white transition-all duration-150
                  ${index > 0 ? '-ml-px' : ''}
                  ${isFirst ? 'rounded-l-[5px]' : ''} ${isLast ? 'rounded-r-[5px]' : ''}
                  ${textColor}
                  ${baseBorder}
                  relative
                  ${hasSuccess ? 'z-10' : 'hover:z-20 z-0'}
                `}
              >
                {option}
              </button>
            )
          }

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
                ${itemClassName || 'w-[53px] h-[45px]'}
                inline-flex items-center justify-center
                rounded-[8px] border bg-white
                text-[16px] font-semibold
                ${textColor}
                ${baseBorder}
                transition-all duration-150
                focus:outline-none
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
